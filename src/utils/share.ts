export type ShareResult = "shared" | "copied" | "failed";

export async function shareArticle(data: { title: string; text?: string; url: string }): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (err: any) {
      // User dismissed the native share sheet — not an error.
      if (err?.name === "AbortError") return "shared";
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    return "copied";
  } catch {
    return "failed";
  }
}
