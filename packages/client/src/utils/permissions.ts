// Utilities to decode JWT and work with permissions payload

type FlatPermissions = Record<string, boolean>;

const base64UrlDecode = (str: string): string => {
  try {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return json;
  } catch {
    return "";
  }
};

const decodeJWTPayload = (token?: string) => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payloadJson = base64UrlDecode(parts[1]);
  try {
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
};

// JWT permissions come as an array of single-key objects: [{ permA: true }, { permB: true }]
const flattenPermissions = (permissions: any): FlatPermissions => {
  const flat: FlatPermissions = {};
  if (Array.isArray(permissions)) {
    for (const item of permissions) {
      if (item && typeof item === "object") {
        for (const [k, v] of Object.entries(item)) {
          if (v) flat[k] = true;
        }
      }
    }
  }
  return flat;
};

const getPermissionsFromToken = (token?: string): FlatPermissions => {
  const payload = decodeJWTPayload(token);
  if (!payload) return {};
  return flattenPermissions((payload as any).permissions);
};

export { decodeJWTPayload, flattenPermissions, getPermissionsFromToken };
