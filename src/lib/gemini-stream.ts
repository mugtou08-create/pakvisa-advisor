export interface StreamOptions {
  models: string[];
  apiKey: string;
  systemPrompt: string;
  contents: { role: string; parts: { text: string }[] }[];
  generationConfig?: Record<string, unknown>;
}

/**
 * Calls a single Gemini model with streaming. Returns the stream or null.
 */
async function tryStreamModel(
  model: string,
  url: string,
  body: string
): Promise<{ stream: ReadableStream<Uint8Array>; res: Response } | null> {
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
    console.error(`[Gemini] ${model} HTTP ${res.status}:`, errText.slice(0, 300));
    return null;
  }

  if (!res.body) {
    console.error(`[Gemini] ${model}: no response body`);
    return null;
  }

  // Build a ReadableStream that parses Gemini SSE events
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  let totalChars = 0;

  return {
    res,
    stream: new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          // Keep reading until we have text to emit
          while (totalChars === 0) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const text = extractTextFromSSELine(line);
              if (text) {
                controller.enqueue(encoder.encode(text));
                totalChars += text.length;
              }
            }
          }

          // First chunk sent — now read the rest
          // Process any leftover buffer lines first
          const leftoverLines = buffer.split('\n');
          buffer = leftoverLines.pop() || '';
          for (const line of leftoverLines) {
            const text = extractTextFromSSELine(line);
            if (text) {
              controller.enqueue(encoder.encode(text));
              totalChars += text.length;
            }
          }

          // Read more chunks from upstream
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const moreLines = buffer.split('\n');
            buffer = moreLines.pop() || '';
            for (const line of moreLines) {
              const text = extractTextFromSSELine(line);
              if (text) {
                controller.enqueue(encoder.encode(text));
                totalChars += text.length;
              }
            }
          }

          // Process final buffer
          if (buffer.trim()) {
            const text = extractTextFromSSELine(buffer);
            if (text) {
              controller.enqueue(encoder.encode(text));
              totalChars += text.length;
            }
          }

          console.log(`[Gemini Stream] ${model}: done, ${totalChars} chars`);
          controller.close();
        } catch (err) {
          console.error(`[Gemini Stream] ${model} read error:`, err);
          controller.close();
        }
      },
      cancel() {
        reader.cancel().catch(() => {});
      },
    }),
  };
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
    // Handle both streaming chunks and non-streaming responses
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('') || null;
    return text || null;
  } catch {
    return null;
  }
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
      console.error(`[Gemini NonStream] ${model} HTTP ${res.status}:`, errText.slice(0, 300));
      return null;
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('') || null;
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
    const result = await tryStreamModel(model, url, reqBody);
    if (result) return result.stream;
  }

  // Phase 2: All streaming failed — fall back to non-streaming
  console.warn('[Gemini] All streaming attempts failed, falling back to non-streaming');
  for (const model of models) {
    const text = await tryNonStreamModel(model, apiKey, systemPrompt, contents, genConfig);
    if (text) {
      // Return as a single-chunk stream (no streaming effect, but response works)
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
