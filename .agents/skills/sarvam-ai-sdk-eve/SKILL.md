---
name: sarvam-ai-sdk-eve
description: >-
  Build durable agents with the sarvam-ai-sdk provider and Vercel's Eve
  framework — defineAgent, wrapLanguageModel with simulateStreamingMiddleware,
  and reading context windows from the sarvam-ai-sdk/info export. Use this
  when creating an Eve agent whose model is a Sarvam LLM, or when you need
  Sarvam model limits (context window, max tokens) at build time.
license: Apache-2.0
metadata:
  author: sarvam-ai
  version: "1.0"
---

# Eve agents with sarvam-ai-sdk

Eve (`eve` package) agents take any AI SDK `LanguageModelV4`. Wrap the Sarvam chat model with `simulateStreamingMiddleware` so Eve gets a streaming-shaped model, and set `modelContextWindowTokens` from the published limits.

```ts
import { simulateStreamingMiddleware, wrapLanguageModel } from "ai";
import { defineAgent } from "eve";
import { sarvam } from "sarvam-ai-sdk";
import { SarvamChatModelInfo } from "sarvam-ai-sdk/info";

const model = wrapLanguageModel({
  model: sarvam("sarvam-105b"),
  middleware: simulateStreamingMiddleware(),
});

export default defineAgent({
  model,
  modelContextWindowTokens: SarvamChatModelInfo["sarvam-105b"].context_window,
});
```

## Reading model limits

`sarvam-ai-sdk/info` is a separate, dependency-free entry point for hardcoded model limits:

```ts
import {
  SarvamChatModelInfo,
  SarvamTranscriptionModelInfo,
  SarvamSpeechModelInfo,
  SarvamTranslationModelInfo,
  SarvamTransliterateInfo,
} from "sarvam-ai-sdk/info";

SarvamChatModelInfo["sarvam-105b"];            // { context_window: 128000, max_completions: 128, max_tokens: {…} }
SarvamChatModelInfo["sarvam-105b-conversations"].context_window; // 32000
SarvamTranscriptionModelInfo["saaras:v4"].max_audio_duration;    // 30 (seconds)
SarvamSpeechModelInfo["bulbul:v4-flash"].max_characters;         // 2500
SarvamTranslationModelInfo["mayura:v1"].max_input_length;        // 1000
```

## Gotchas

| Gotcha | Detail |
|--------|--------|
| **`modelContextWindowTokens` is required** | Eve needs the window size explicitly; don't hardcode it — read it from `SarvamChatModelInfo`. |
| **`sarvam-105b-conversations` is 32K** | If you use it, read its `context_window` (32 000) rather than reusing 128 000. |
| **`/info` is a subpath export** | Import from `sarvam-ai-sdk/info`, not the package root. It ships as its own entry point. |
| **Reasoning still applies** | The wrapped model keeps Sarvam's default reasoning. Set `reasoning_effort` on the model constructor if you need deterministic latency. |
| **`sarvam-105b-conversations` cannot use v2** | Only `sarvam-105b` can switch to `version: "v2"`. |

## Docs

- [Eve agent configuration](https://eve.dev/docs/agent-config)
- [AI SDK middleware](https://ai-sdk.dev/docs/ai-sdk-core/middleware)
