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
 * Returns the readable side if the HTTP connection succeeds (200 OK),
 * or null if the HTTP request fails (non-200, network error, no body).
 */
async function tryStreamModel(
  model: string,
  apiKey: string,
  reqBody: string
): Promise<ReadableStream<Uint8Array> | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: reqBody,
    });
  } catch (err) {
    console.error(`[Gemini Stream] ${model} network error:`, err);
    return null;
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`[Gemini Stream] ${model} HTTP ${res.status}:`, errText.slice(0, 300));
    return null;
  }

  if (!res.body) {
    console.error(`[Gemini Stream] ${model}: no response body`);
    return null;
  }

  // Use TransformStream — the standard, reliable way to transform streams.
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const upstreamReader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  let totalChars = 0;

  // Background pump: reads SSE from Gemini, writes plain text to the transform
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
      // Process remaining buffer
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
  reqBody: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: reqBody,
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[Gemini NonStream] ${model} HTTP ${res.status}:`, errText.slice(0, 300));
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
 * Wraps a string as a single-chunk ReadableStream (no real streaming, but compatible interface).
 */
function textToStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

/**
 * Creates a streaming response from Gemini.
 *
 * Strategy (designed for reliability over speed):
 * 1. For each model, try NON-STREAMING first (proven reliable).
 *    If it works, wrap in a stream and return immediately.
 * 2. Only if ALL non-streaming calls fail, try streaming as last resort.
 * 3. If everything fails, return an error message stream.
 *
 * Why non-streaming first: the original code used non-streaming and it worked.
 * Streaming adds complexity (SSE parsing, TransformStream, background pump)
 * and if the model rejects the streaming endpoint, we waste time + rate limit quota.
 */
export async function createGeminiStream(options: StreamOptions): Promise<ReadableStream<Uint8Array>> {
  const { models, apiKey, systemPrompt, contents, generationConfig } = options;
  const genConfig = generationConfig || { temperature: 0.8, maxOutputTokens: 4096, topP: 0.9 };
  const reqBody = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: genConfig,
  });

  // Phase 1: Try NON-STREAMING for each model (fast, reliable, no SSE parsing)
  for (const model of models) {
    const text = await tryNonStreamModel(model, apiKey, reqBody);
    if (text) {
      return textToStream(text);
    }
  }

  // Phase 2: All non-streaming failed — try streaming as last resort
  console.warn('[Gemini] All non-streaming failed, trying streaming as last resort');
  for (const model of models) {
    const stream = await tryStreamModel(model, apiKey, reqBody);
    if (stream) return stream;
  }

  // All models completely failed
  console.error('[Gemini] ALL models failed (non-streaming + streaming)');
  const errorText = 'Sorry, I\'m having a little trouble right now. Please try again in a moment!';
  return textToStream(errorText);
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
