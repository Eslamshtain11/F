// services/aiService.ts
// بدون أي import لـ @google/genai — نستخدم REST عبر /api/generate
export async function askGemini(prompt: string): Promise<string> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Gemini API failed: ${res.status} ${msg}`);
  }

  const data = await res.json();
  return (data?.text ?? '').toString();
}

// aliases عشان لو فيه كود قديم بينادي بأسماء مختلفة
export const generate = askGemini;
export const getAIResponse = askGemini;
export default { askGemini, generate: askGemini, getAIResponse: askGemini };
