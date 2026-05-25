const DEFAULT_ML_API_URL = "https://portfolio-pkdj.onrender.com";
const DEFAULT_SKIN_API_URL = "https://anishreddy13-skin-cancer-api.hf.space";

const mlApiUrl = process.env.NEXT_PUBLIC_ML_API_URL || DEFAULT_ML_API_URL;
const skinApiUrl = process.env.NEXT_PUBLIC_SKIN_API_URL || DEFAULT_SKIN_API_URL;

function buildUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data.detail || data.message || fallback;
  } catch {
    return fallback;
  }
}

async function postJson<T>(
  baseUrl: string,
  path: string,
  body: Record<string, unknown>,
  fallbackError = "Request failed"
): Promise<T> {
  const response = await fetch(buildUrl(baseUrl, path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, fallbackError));
  }

  return response.json();
}

export function fetchMlJson<T>(path: string, body: Record<string, unknown>) {
  return postJson<T>(mlApiUrl, path, body);
}

export function fetchSkinJson<T>(path: string, body: Record<string, unknown>) {
  return postJson<T>(skinApiUrl, path, body, "Prediction failed");
}

export function fetchMlHealth() {
  return fetch(buildUrl(mlApiUrl, "/health"));
}
