// utils/errorStore.ts
let lastError: string | null = null;

export function setLastError(err: unknown) {
  if (__DEV__) {
    lastError = String(err);
  }
}

export function getLastError() {
  return lastError;
}

export function clearLastError() {
  lastError = null;
}