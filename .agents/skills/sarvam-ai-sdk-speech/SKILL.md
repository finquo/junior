---
name: sarvam-ai-sdk-speech
description: >-
  Speech-to-text and text-to-speech with the sarvam-ai-sdk provider — the
  transcribe() Saaras models and generateSpeech() Bulbul models, language
  codes, bulbul v4-flash persona speaker IDs vs v3 short names, codecs,
  sample rates, and the REST-only 30s STT limit. Use this when an AI SDK v7
  app needs to transcribe audio or synthesize Indic speech through Sarvam.
license: Apache-2.0
metadata:
  author: sarvam-ai
  version: "1.0"
---

# Speech with sarvam-ai-sdk (Saaras STT + Bulbul TTS)

Both endpoints are exposed through their AI SDK primitives. This package is **REST-only** for speech: no batch jobs, WebSocket streaming, or diarization — use the raw `sarvamai` SDK for those.

## Speech-to-text — `transcribe`

```ts
import { sarvam } from "sarvam-ai-sdk";
import { transcribe } from "ai";
import { readFile } from "node:fs/promises";

const { text, language, segments, durationInSeconds } = await transcribe({
  model: sarvam.transcription("saaras:v4", "en-IN"),
  audio: await readFile("./audio.wav"),
});

console.log(text);
```

- `sarvam.transcription(modelId, languageCode?, settings?)` — `languageCode` defaults to `"unknown"` (auto-detect).
- `audio` accepts a `Buffer`/`Uint8Array`/`ArrayBuffer`/`Blob`. `mediaType` is inferred when not a `Blob`.
- `segments` is populated from the diarized transcript when present.

Settings (constructor 3rd arg, or `providerOptions.sarvam`):

```ts
sarvam.transcription("saaras:v4", "hi-IN", {
  mode: "transcribe",     // "transcribe" | "translate" | "verbatim" | "translit" | "codemix"
  with_timestamps: true,
  keyterms: ["Sarvam", "New Delhi"], // saaras:v4 only, up to 50 terms, 64 chars each
});
```

## Text-to-speech — `generateSpeech`

```ts
import { sarvam } from "sarvam-ai-sdk";
import { generateSpeech } from "ai";
import { writeFile } from "node:fs/promises";

const { audio } = await generateSpeech({
  model: sarvam.speech("bulbul:v4-flash", "hi-IN", {
    speaker: "aparna_hi_customer",
  }),
  text: "नमस्ते, आप कैसे हैं?",
});

await writeFile("./out.wav", Buffer.from(audio.base64, "base64"));
```

Settings (constructor 3rd arg, or `providerOptions.sarvam`): `speaker`, `pace` (0.5–2.0), `speech_sample_rate`, `output_audio_codec`, `temperature` (0.01–2), `dict_id`. The AI SDK call options `voice`, `speed`, and `outputFormat` map onto `speaker`, `pace`, and `output_audio_codec`.

## Gotchas

| Gotcha | Detail |
|--------|--------|
| **REST STT caps at ~30s** | The `transcribe` path is the `/speech-to-text` REST endpoint. Longer audio needs the Batch API from the raw `sarvamai` SDK — this provider can't do it. |
| **`keyterms` is `saaras:v4`-only** | Passing it with `saaras:v3` is a hard 400. Max 50 terms, 64 chars each. |
| **v4 speakers are persona IDs** | `bulbul:v4-flash` needs `voice_language_style` IDs (`aparna_hi_customer`, `simran_en_customer`, `shubh_enhi_ads`). v3 short names (`shubh`, `priya`, `ishita`) return 400 on v4. |
| **Speaker must match the model** | A v3 short name on a v4 model, or a v4 persona on `bulbul:v3`, both 400. Set `speaker` explicitly with the model. |
| **Set the model explicitly** | Omitting `model` (i.e. passing a bare string) selects `bulbul:v3` upstream. New integrations should set `"bulbul:v4-flash"`. |
| **Malayalam / Odia have no v4 personas** | Use `sarvam.speech("bulbul:v3", "ml-IN", { speaker: … })` for `ml-IN` and `od-IN`. |
| **Audio is base64** | `generateSpeech` returns base64 in `audio.base64`. Decode before writing to disk; writing the raw string produces an unplayable file. |
| **Codec / sample rate** | `output_audio_codec` supports `wav`, `mp3`, plus `linear16`/`mulaw`/`alaw`/`opus`/`flac`/`aac` in the schema. `speech_sample_rate` accepts `8000`, `16000`, `22050`, `24000`, `32000`, `44100`, `48000`. |
| **Use native script** | Romanized Indic text degrades TTS quality. Write Indic words in native script; keep English loanwords in Latin (`"आपका order confirm हो गया है"`). |

## Docs

- [STT overview](https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/overview)
- [TTS overview](https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/overview)
- [Bulbul voices](https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/voices)
- [AI SDK speech](https://ai-sdk.dev/docs/ai-sdk-core/speech)
