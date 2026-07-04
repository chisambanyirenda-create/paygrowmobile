---
name: MobiTrack Anthropic AI route
description: SSE streaming setup, direct API key usage, and Orval queryKey typing quirk for the AI Advisor feature
---

## Anthropic client
- Use `ANTHROPIC_API_KEY` directly (user declined Replit integration upgrade)
- Instantiate: `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })` — do NOT set baseURL
- Package: `@anthropic-ai/sdk` must be added to `@workspace/api-server` directly (not just the integrations lib)

## SSE streaming pattern (Express)
```ts
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");
// Cancel on client disconnect:
req.on("close", () => { cancelled = true; });
// Send chunks:
res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
// End:
res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
res.end();
```

## SSE client-side buffering (React)
- SSE frames can split across TCP chunks — must buffer across reads
- Pattern: accumulate into a `sseBufferRef`, split on `\n`, keep last incomplete line in buffer

## Orval `useGetAnthropicConversation` typing quirk
- Passing `{ query: { enabled: false } }` fails TS because `queryKey` is required in the options type
- Fix: import `getGetAnthropicConversationQueryKey` and pass it explicitly:
  ```tsx
  { query: { enabled: activeConvId !== null, queryKey: getGetAnthropicConversationQueryKey(activeConvId ?? 0) } }
  ```

## AbortController cleanup
- Always abort on unmount: `useEffect(() => () => { abortRef.current?.abort(); }, [])`

**Why:** These are non-obvious runtime/type issues that took multiple iterations to resolve.
