---
name: sarvam-ai-sdk-chat
description: >-
  Generate text and stream responses with Sarvam chat models through the
  sarvam-ai-sdk provider and Vercel AI SDK v7 — sarvam-105b and
  sarvam-105b-conversations, generateText, streamText, agents,
  reasoning_effort, v1 vs v2, and the reasoning-eats-the-budget gotcha. Use
  this when building chatbots, Q&A, summarization, translation-style text, or
  agents that use a Sarvam LLM as the LanguageModelV4 in an AI SDK app.
license: Apache-2.0
metadata:
  author: sarvam-ai
  version: "1.0"
---

# Chat / text generation with sarvam-ai-sdk

Use the `sarvam` provider as a `LanguageModelV4` behind the standard AI SDK `generateText` / `streamText` primitives.

```ts
import { sarvam } from "sarvam-ai-sdk";
import { generateText } from "ai";

const { text } = await generateText({
  model: sarvam("sarvam-105b"),
  prompt: "Translate this to malayalam: 'Keep cooking, guys'",
});

console.log(text); // പാചകം തുടരൂ, സുഹൃത്തുക്കളേ
```

## Models

| Model | Context | Best for |
|-------|---------|----------|
| `sarvam-105b` | 128K | Reasoning, coding, agentic workflows |
| `sarvam-105b-conversations` | 32K | Real-time chat, voice agents, conversational apps |

`sarvam-105b-conversations` is **v1-only**. `sarvam-105b` accepts `version: "v1" | "v2"`; use `v2` only to reach the beta open-weight models (`glm5.3`, `gemma4`, `deepseekv4-flash`), which are not part of the typed model IDs. `sarvam-30b` is retired.

## Streaming

```ts
import { streamText } from "ai";

const result = streamText({
  model: sarvam("sarvam-105b", { reasoning_effort: "low" }),
  prompt: "Write a haiku about monsoon in Kerala, in Malayalam",
});

for await (const part of result.textStream) process.stdout.write(part);
```

Streaming works for chat only. Reasoning tokens arrive as `reasoning` parts before the answer text; text deltas are grouped under a single `text-0` id.

## Settings

```ts
sarvam("sarvam-105b", {
  version: "v1",              // "v1" (default) | "v2"
  reasoning_effort: "none",  // "none" | "low" | "medium" | "high"
  wiki_grounding: true,      // wiki-grounded responses
  n: 1,                      // number of completions (billed per token, keep at 1)
  extra_body: {},            // v2 only
  experimental_json_mode: false, // structured output; see sarvam-ai-sdk-tools
});
```

The same keys are accepted per call in `providerOptions.sarvam`, but constructor settings win over `providerOptions`. Standard AI SDK options pass through: `temperature`, `topP`, `frequencyPenalty`, `presencePenalty`, `stopSequences`, `seed`, `maxOutputTokens`.

## Gotchas

| Gotcha | Detail |
|--------|--------|
| **Reasoning can leave `text` empty** | Sarvam models think by default. If `maxOutputTokens` is too small, reasoning consumes the budget and `finish_reason` is `"length"` with no visible text. Omit `maxOutputTokens`, set it generously (500+), or disable reasoning with `reasoning_effort: "none"`. Always tolerate an empty `text` and inspect reasoning/usage. |
| **`reasoning_effort: "none"` disables thinking** | The SDK maps `"none"` to `null` on the wire. Other values are `"low"`, `"medium"`, `"high"`. Not `thinking: true`. |
| **`reasoning` is not a model option** | Thinking is controlled by `reasoning_effort` (constructor) or `reasoning` on the AI SDK call options — don't pass arbitrary `thinking` keys. |
| **`topK` is unsupported** | Passing `topK` produces an `unsupported` warning and is dropped. |
| **`sarvam-105b-conversations` + `version: "v2"`** | Rejected — that model is fixed to v1. |
| **Don't use `streamText` with translation/transliteration/LID** | Those models throw on `doStream()`. See `sarvam-ai-sdk-text`. |
| **`ai@7` expected** | `sarvam-ai-sdk` 0.4.x pairs with `ai@7`. Mixing majors breaks `LanguageModelV4`. |

## Agents

Because the provider returns a regular `LanguageModelV4`, it works anywhere the AI SDK expects a model — including `ToolLoopAgent` and Eve agents. For a hand-rolled agent, combine `generateText` with tools (see `sarvam-ai-sdk-tools`). For durable Eve agents, see `sarvam-ai-sdk-eve`.

## Docs

- [Sarvam chat completions](https://docs.sarvam.ai/api/api-guides-tutorials/chat-completion/overview)
- [AI SDK generating text](https://ai-sdk.dev/docs/ai-sdk-core/generating-text)
