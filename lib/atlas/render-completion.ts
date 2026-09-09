export type PendingGraphRender = {
  fingerprint: string;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
};
export function settleGraphRender(
  pending: PendingGraphRender | null,
  fingerprint: string | undefined,
  message: string,
) {
  if (!pending || pending.fingerprint !== fingerprint) return false;
  if (message.startsWith("Error:")) pending.reject(new Error(message));
  else pending.resolve({ status: "rendered", detail: message });
  return true;
}
