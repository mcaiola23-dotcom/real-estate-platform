export function getPortalApiBaseUrl(): string {
  return (
    process.env.PORTAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000"
  );
}

export function joinPortalApiPath(path: string): string {
  const baseUrl = getPortalApiBaseUrl().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
