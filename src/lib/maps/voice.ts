import { createServerFn } from "@tanstack/react-start";

const clips = new Map<string, string>();

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const size = 0x8000;
  for (let index = 0; index < bytes.length; index += size) {
    binary += String.fromCharCode(...bytes.subarray(index, index + size));
  }
  return btoa(binary);
}

export const speakDirection = createServerFn({ method: "POST" })
  .validator((input: { text: string }) => {
    const text = input.text.replace(/\s+/g, " ").trim().slice(0, 220);
    if (text.length < 2) throw new Error("Rien à dire.");
    return { text };
  })
  .handler(async ({ data }) => {
    const cached = clips.get(data.text);
    if (cached) return { ok: true as const, audio: cached };
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Voix indisponible." };
    const response = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: data.text,
        voice_id: "eve",
        language: "fr",
        output_format: { codec: "mp3", sample_rate: 24000, bit_rate: 64000 },
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return { ok: false as const, error: "La voix n'a pas répondu." };
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength < 80 || bytes.byteLength > 500_000) {
      return { ok: false as const, error: "Audio inutilisable." };
    }
    const audio = toBase64(bytes);
    if (clips.size > 48) clips.clear();
    clips.set(data.text, audio);
    return { ok: true as const, audio };
  });
