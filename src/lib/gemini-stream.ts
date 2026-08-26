import { NextResponse } from 'next/server';

export interface StreamOptions {
  models: string[];
  apiKey: string;
  systemPrompt: string;
  contents: { role: string; parts: { text: string }[] }[];
  generationConfig?: Record<string, unknown>;
}

/**
 * Creates a streaming response from Gemini's streamGenerateContent API.
 * Tries each model in order until one works. Returns a ReadableStream
 * that emits plain text chunks as the AI generates them.
 */
export async function createGeminiStream(options: StreamOptions): Promise<ReadableStream<Uint8Array>> {
  const { models, apiKey, systemPrompt, contents, generationConfig } = options;

  for (const model of models) {
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: generationConfig || { temperature: 0.8, maxOutputTokens: 4096, topP: 0.9 },
          }),
        }
      );
    } catch (err) {
      console.error(`[Gemini Stream] ${model} network error:`, err);
      continue;
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[Gemini Stream] ${model} HTTP ${res.status}:`, errText.slice(0, 200));
      continue;
    }

    if (!res.body) {
      console.error(`[Gemini Stream] ${model}: no response body`);
      continue;
    }

    // Create a transform stream: Gemini SSE → plain text chunks
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();

    (async () => {
      const reader = res.body!.getReader();
      const writer = writable.getWriter();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';
      let totalChars = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                await writer.write(encoder.encode(text));
                totalChars += text.length;
              }
            } catch {
              // Ignore parse errors for partial chunks
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim().startsWith('data: ')) {
          const data = buffer.trim().slice(6);
          if (data !== '[DONE]') {
            try {
              const json = JSON.parse(data);
              const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                await writer.write(encoder.encode(text));
                totalChars += text.length;
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error('[Gemini Stream] Processing error:', err);
      } finally {
        console.log(`[Gemini Stream] ${model}: done, ${totalChars} chars streamed`);
        await writer.close();
      }
    })();

    return readable;
  }

  // All models failed — return a graceful error message as a stream
  const errorText = 'Sorry, I\'m having a little trouble right now. Please try again in a moment!';
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(errorText));
      controller.close();
    },
  });
}

/**
 * Helper to create a streaming Next.js response with proper headers.
 */
export function createStreamResponse(stream: ReadableStream<Uint8Array>, extraHeaders?: Record<string, string>): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering (for Vercel/proxy)
      ...extraHeaders,
    },
  });
}

/**
 * Reads a Gemini streaming response and collects the full text.
 * Fallback for when you need the complete text (e.g., for metadata).
 */
export async function collectStreamText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text;
}
