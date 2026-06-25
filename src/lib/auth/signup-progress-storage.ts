const STORAGE_KEY = "northium_signup_progress";

export type StoredSignupProgress = {
  email: string;
  challengeId?: string;
  updatedAt: string;
};

export function readSignupProgress(): StoredSignupProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSignupProgress;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSignupProgress(progress: StoredSignupProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function clearSignupProgress() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
