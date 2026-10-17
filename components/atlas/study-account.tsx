"use client";
import { useSyncExternalStore } from "react";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
} from "@/app/chatgpt-auth-paths";
import { useStudyAccount } from "./study-records";

const subscribeLocation = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
};
export function StudyAccount() {
  const account = useStudyAccount();
  const returnTo = useSyncExternalStore(
    subscribeLocation,
    () =>
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    () => "/",
  );
  const failed = account.importResults.filter(
    ({ outcome }) => outcome === "failed",
  ).length;
  return (
    <section className="study-account" aria-label="Your account">
      <div className="study-account-heading">
        <span>
          {account.user
            ? `Signed in as ${account.user.displayName}`
            : account.phase === "loading"
              ? "Checking account…"
              : "Read freely. Sign in to save your study."}
        </span>
        <a
          hidden={!account.user}
          href={chatGPTSignOutPath(returnTo)}
          target="_top"
          onClick={account.leave}
        >
          Sign out
        </a>
        <a
          hidden={!!account.user}
          href={chatGPTSignInPath(returnTo)}
          target="_top"
          onClick={account.leave}
        >
          Sign in with ChatGPT
        </a>
      </div>
      {account.notice && <p role="status">{account.notice}</p>}
      {account.notice && account.phase === "loading" && (
        <button type="button" onClick={() => void account.refresh()}>
          Check current account
        </button>
      )}
      {account.user?.email &&
        account.user.email !== account.user.displayName && (
          <p>{account.user.email}</p>
        )}
      {account.hasUnsaved && (
        <p role="status">
          Some work is not saved. Keep this tab open and retry. Sign-in and
          sign-out reload the page. Copy unsaved work before continuing.
        </p>
      )}
      {account.phase === "unavailable" && (
        <p role="status">
          Account service unavailable. New work stays in this tab.{" "}
          <button type="button" onClick={() => void account.refresh()}>
            Retry account connection
          </button>
        </p>
      )}
      {account.user && (
        <details>
          <summary>Import old study from this device</summary>
          <p>
            Preview known old records before importing into{" "}
            {account.user.displayName}. Existing account records are retained.
            The original device data stays untouched.
          </p>
          <button
            type="button"
            disabled={account.importing}
            onClick={() => void account.previewLegacy()}
          >
            Preview device records
          </button>
          {account.preview && (
            <div>
              <p>
                {account.preview.items.length} valid records from{" "}
                {account.preview.sources} device sources.{" "}
                {account.preview.rejected.length} rejected entries. Destination:{" "}
                {account.user.displayName}
                {account.user.email ? ` (${account.user.email})` : ""}.
              </p>
              {account.preview.items.length > 0 && (
                <details>
                  <summary>Records to import</summary>
                  <ul>
                    {account.preview.items.slice(0, 50).map((item, index) => (
                      <li key={index}>
                        {item.kind === "attempt"
                          ? `${item.value.lessonId} · ${item.value.taskId} · historical choice ${item.value.at}`
                          : JSON.stringify(item.key)}
                      </li>
                    ))}
                  </ul>
                  {account.preview.items.length > 50 && (
                    <p>
                      The first 50 records are listed. All{" "}
                      {account.preview.items.length} valid records are included.
                    </p>
                  )}
                </details>
              )}
              {account.preview.rejected.length > 0 && (
                <details>
                  <summary>Rejected entries</summary>
                  <ul>
                    {account.preview.rejected.map((message, index) => (
                      <li key={index}>{message}</li>
                    ))}
                  </ul>
                </details>
              )}
              <button
                type="button"
                disabled={account.importing || !account.preview.items.length}
                onClick={() => void account.importLegacy()}
              >
                Confirm import into this account
              </button>
            </div>
          )}
          {account.importing && <p role="status">Importing device records…</p>}
          {account.importResults.length > 0 && (
            <p role="status">
              {
                account.importResults.filter(
                  ({ outcome }) => outcome === "imported",
                ).length
              }{" "}
              imported.{" "}
              {
                account.importResults.filter(
                  ({ outcome }) => outcome === "retained-existing",
                ).length
              }{" "}
              existing records retained.{" "}
              {
                account.importResults.filter(
                  ({ outcome }) => outcome === "rejected",
                ).length
              }{" "}
              rejected. {failed} failed or not attempted.
            </p>
          )}
          {account.importError && <p role="status">{account.importError}</p>}
          {failed > 0 && (
            <button
              type="button"
              disabled={account.importing}
              onClick={() => void account.importLegacy(true)}
            >
              Retry failed import items
            </button>
          )}
        </details>
      )}
    </section>
  );
}
