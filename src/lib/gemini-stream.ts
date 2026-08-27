export interface StreamOptions {
  models: string[];
  apiKey: string;
  systemPrompt: string;
  contents: { role: string; parts: { text: string }[] }[];
  generationConfig?: Record<string, unknown>;
}

/**
 * Extracts text from a single SSE line like "data: {json}"
 */
function extractTextFromSSELine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data: ')) return null;
  const data = trimmed.slice(6).trim();
  if (!data || data === '[DONE]') return null;
  try {
    const json = JSON.parse(data);
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('') || null;
    return text || null;
  } catch {
    return null;
  }
}

/**
 * Tries streaming from a single Gemini model using TransformStream.
 * Returns the readable side if the connection succeeds (even if no text yet),
 * or null if the HTTP request itself fails.
 */
async function tryStreamModel(
  model: string,
  url: string,
  body: string
): Promise<ReadableStream<Uint8Array> | null> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch (err) {
    console.error(`[Gemini] ${model} network error:`, err);
    return null;
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`[Gemini] ${model} HTTP ${res.status}:`, errText.slice(0, 500));
    return null;
  }

  if (!res.body) {
    console.error(`[Gemini] ${model}: no response body`);
    return null;
  }

  // Use TransformStream — the standard, reliable way to transform streams.
  // A background async function reads SSE from Gemini and writes plain text
  // chunks to the transform. The caller gets the readable side immediately.
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const upstreamReader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  let totalChars = 0;

  // Fire-and-forget background pump (the stream keeps the response alive)
  (async () => {
    try {
      while (true) {
        const { done, value } = await upstreamReader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const text = extractTextFromSSELine(line);
          if (text) {
            await writer.write(encoder.encode(text));
            totalChars += text.length;
          }
        }
      }
      // Process any remaining buffer after stream ends
      if (buffer.trim()) {
        const text = extractTextFromSSELine(buffer);
        if (text) {
          await writer.write(encoder.encode(text));
          totalChars += text.length;
        }
      }
      console.log(`[Gemini Stream] ${model}: done, ${totalChars} chars`);
    } catch (err) {
      console.error(`[Gemini Stream] ${model} pump error:`, err);
    } finally {
      await writer.close();
    }
  })();

  return readable;
}

/**
 * Calls a single Gemini model non-streaming. Returns text or null.
 */
async function tryNonStreamModel(
  model: string,
  apiKey: string,
  systemPrompt: string,
  contents: { role: string; parts: { text: string }[] }[],
  generationConfig: Record<string, unknown>
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[Gemini NonStream] ${model} HTTP ${res.status}:`, errText.slice(0, 500));
      return null;
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('') || null;
    console.log(`[Gemini NonStream] ${model}: ${text ? text.length + ' chars' : 'empty'}`);
    return text;
  } catch (err) {
    console.error(`[Gemini NonStream] ${model} error:`, err);
    return null;
  }
}

/**
 * Creates a streaming response from Gemini. Tries streaming first,
 * falls back to non-streaming (converted to a single-chunk stream).
 */
export async function createGeminiStream(options: StreamOptions): Promise<ReadableStream<Uint8Array>> {
  const { models, apiKey, systemPrompt, contents, generationConfig } = options;
  const genConfig = generationConfig || { temperature: 0.8, maxOutputTokens: 4096, topP: 0.9 };
  const reqBody = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: genConfig,
  });

  // Phase 1: Try streaming for each model
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const stream = await tryStreamModel(model, url, reqBody);
    if (stream) return stream;
  }

  // Phase 2: All streaming failed — fall back to non-streaming
  console.warn('[Gemini] All streaming attempts failed, falling back to non-streaming');
  for (const model of models) {
    const text = await tryNonStreamModel(model, apiKey, systemPrompt, contents, genConfig);
    if (text) {
      const encoder = new TextEncoder();
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(text));
          controller.close();
        },
      });
    }
  }

  // All models completely failed
  console.error('[Gemini] ALL models failed (both streaming and non-streaming)');
  const errorText = 'Sorry, I\'m having a little trouble right now. Please try again in a moment!';
  return new ReadableStream<Uint8Array>({
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
      'X-Accel-Buffering': 'no',
      ...extraHeaders,
    },
  });
}
