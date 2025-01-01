const SESSION_KEY = "hfj_session_id";

let cachedId: string | null = null;

export function getSessionId(): string {
  if (cachedId) return cachedId;
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  cachedId = id;
  return id;
}
