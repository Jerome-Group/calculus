import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { chatGPTSignInPath } from "./chatgpt-auth-paths";
export { chatGPTSignInPath, chatGPTSignOutPath } from "./chatgpt-auth-paths";

export type ChatGPTUser = {
  id: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

const USER_EMAIL_HEADER = "oai-authenticated-user-email";
const USER_ID_HEADER = "oai-authenticated-user-id";
const USER_FULL_NAME_HEADER = "oai-authenticated-user-full-name";
const USER_FULL_NAME_ENCODING_HEADER =
  "oai-authenticated-user-full-name-encoding";
const PERCENT_ENCODED_UTF8 = "percent-encoded-utf-8";

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  return chatGPTUserFromHeaders(requestHeaders);
}

export function chatGPTUserFromHeaders(
  requestHeaders: Pick<Headers, "get">,
): ChatGPTUser | null {
  const id = requestHeaders.get(USER_ID_HEADER)?.trim();
  if (!id || id.length > 512) return null;
  const email = requestHeaders.get(USER_EMAIL_HEADER) || "";

  const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER);
  const fullName =
    encodedFullName &&
    requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8
      ? safeDecodeURIComponent(encodedFullName)
      : null;

  return {
    id,
    displayName: fullName ?? (email || "ChatGPT account"),
    email,
    fullName,
  };
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;

  redirect(chatGPTSignInPath(returnTo));
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
