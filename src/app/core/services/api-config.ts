export const API_ORIGIN = "http://localhost:5135";
export const API_BASE_URL = `${API_ORIGIN}/api`;

export function resolveApiUrl(url: string): string {
  if (!url) return "";
  if (
    /^https?:\/\//i.test(url) ||
    url.startsWith("assets/") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  if (url.startsWith("/uploads/")) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}
