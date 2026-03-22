const API_BASE = '/api';

export async function fetchConfig() {
  const res = await fetch(`${API_BASE}/config`);
  const json = await res.json();
  if (json.code === 0) return json.data;
  throw new Error(json.message);
}

export async function saveConfig(config) {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  const json = await res.json();
  if (json.code === 0) return json.data;
  throw new Error(json.message);
}

export async function listSessions() {
  const res = await fetch(`${API_BASE}/sessions`);
  const json = await res.json();
  if (json.code === 0) return json.data;
  throw new Error(json.message);
}

export async function getSession(id) {
  const res = await fetch(`${API_BASE}/sessions/${id}`);
  const json = await res.json();
  if (json.code === 0) return json.data;
  throw new Error(json.message);
}

export async function saveSession(id, data) {
  const res = await fetch(`${API_BASE}/sessions/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (json.code === 0) return json.data;
  throw new Error(json.message);
}

export async function deleteSession(id) {
  const res = await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (json.code === 0) return json.data;
  throw new Error(json.message);
}

export async function clearAllSessions() {
  const res = await fetch(`${API_BASE}/sessions`, { method: 'DELETE' });
  const json = await res.json();
  if (json.code === 0) return true;
  throw new Error(json.message);
}
