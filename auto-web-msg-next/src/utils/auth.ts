import type { MessageState } from "@/types/hooks";

interface RouterLike {
  push: (href: string) => void;
}

export function isUnauthorizedError(error: string): boolean {
  return error.includes("[401]");
}

export function redirectToSettings(
  router: RouterLike,
  setMessage: (message: MessageState) => void,
  reset?: () => void
) {
  reset?.();
  setMessage({ type: "warn", text: "Token 已失效，正在跳转到设置页..." });
  window.setTimeout(() => router.push("/settings"), 2000);
}
