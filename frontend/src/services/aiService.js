const API_URL = "http://localhost:8000/api/ai/generate";

export async function generateCode({ description, language, context }) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, language, context }),
  });
  if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`);
  return res.json();
}

export function parseCode(raw) {
  const backendMatch = raw.match(
    /\/\/ ={3,} BACKEND[\s\S]*?\n([\s\S]*?)(?=\/\/ ={3,} FRONTEND|$)/,
  );
  const frontendMatch = raw.match(/\/\/ ={3,} FRONTEND[\s\S]*?\n([\s\S]*?)$/);
  return {
    backend: backendMatch ? backendMatch[1].trim() : raw,
    frontend: frontendMatch ? frontendMatch[1].trim() : "",
  };
}
