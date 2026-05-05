import { isDevMode } from "./env";

export function guardedFetch(url, options) {
  if (isDevMode) {
    throw new Error(
      `[DEV MODE] API call blocked: ${options?.method || "GET"} ${url}`
    );
  }

  return fetch(url, options);
}