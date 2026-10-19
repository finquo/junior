---
name: sarvam-ai-sdk-text
description: >-
  Translation, transliteration, and language identification with the
  sarvam-ai-sdk provider — sarvam.translation (mayura:v1 / sarvam-translate:v1),
  sarvam.transliterate, sarvam.languageIdentification, all via generateText.
  Covers the "only user text is used" behavior, the no-streaming limitation,
  and the from/to validation rules. Use this for Indic text transforms in an
  AI SDK v7 app.
license: Apache-2.0
metadata:
  author: sarvam-ai
  version: "1.0"
---

# Translation, transliteration & language ID with sarvam-ai-sdk

These three are text-to-text Sarvam APIs exposed as `LanguageModelV4`, so you call them with **`generateText`**. They are **not chat models**.

> [!IMPORTANT]
> Unlike chat, these models only read the text content of **`role: "user"` messages**. `instructions`/`system` and `assistant` messages are ignored. Put the text to transform in `prompt`.

## Translation

```ts
import { sarvam } from "sarvam-ai-sdk";
import { generateText } from "ai";

const { text } = await generateText({
  model: sarvam.translation("mayura:v1", { from: "ml-IN", to: "en-IN" }),
  prompt: "ഇതൊക്കെ ശ്രദ്ധിക്കണ്ടേ അംബാനെ?",
});
```

`from` is optional for `mayura:v1` and defaults to `"auto"` (auto-detect). `sarvam-translate:v1` covers all 22 scheduled languages but **requires an explicit `from`** and supports **only `mode: "formal"`**.

```ts
sarvam.translation("sarvam-translate:v1", {
  from: "hi-IN",
  to: "ta-IN",
  numerals_format: "native",       // "native" | "international"
  speaker_gender: "Female",        // code-mixed models
  mode: "formal",
  enable_preprocessing: true,
  output_script: "fully-native",   // "roman" | "fully-native" | "spoken-form-in-native"
});
```

## Transliteration

```ts
const { text } = await generateText({
  model: sarvam.transliterate({ to: "ml-IN", from: "en-IN" }),
  prompt: "eda mone, happy alle?",
}); // എടാ മോനെ, ഹാപ്പി അല്ലേ?
```

`from` defaults to `"auto"`. Settings: `numerals_format`, `spoken_form`, `spoken_form_numerals_language` (`"english" | "native"`, only when `spoken_form: true`).

## Language identification

```ts
const { text } = await generateText({
  model: sarvam.languageIdentification(),
  prompt: "ബുദ്ധിയാണ് സാറേ ഇവൻ്റെ മെയിൻ",
}); // "ml-IN"
```

Returns the detected BCP-47 language code as plain text.

## Gotchas

| Gotcha | Detail |
|--------|--------|
| **No streaming** | `doStream()` throws for all three (`"… doesn't support streaming yet"`). Use `generateText`, never `streamText`. Wrap in a script/route that returns the final text. |
| **Only `user` text is transformed** | `system`/`instructions` and `assistant` messages are filtered out. Send the target text as `prompt`. |
| **`from` and `to` must differ** | Translation throws `"Source and target languages code must be different."` when they match. |
| **`sarvam-translate:v1` constraints** | Requires `from` (no `"auto"`) and only accepts `mode: "formal"`; anything else throws. `mayura:v1` allows `"auto"`, colloquial modes, and `output_script`. |
| **No Indic→Indic transliteration** | `transliterate` throws `"Sarvam doesn't support Indic-Indic Transliteration yet"` unless one side is `en-IN` (or `from` is `"auto"`). |
| **`output_script` is a translation option** | It's only meaningful on models that support it (e.g. `mayura:v1`). Don't assume every translation model honors it. |
| **Usage is empty** | These endpoints don't report token usage; don't rely on `result.usage` for billing/telemetry. |

## Docs

- [Translation overview](https://docs.sarvam.ai/api/api-guides-tutorials/translation/overview)
- [Transliteration](https://docs.sarvam.ai/api/api-guides-tutorials/transliteration/overview)
- [Language identification](https://docs.sarvam.ai/api/api-guides-tutorials/language-identification/overview)
