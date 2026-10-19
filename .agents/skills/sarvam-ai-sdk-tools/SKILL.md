---
name: sarvam-ai-sdk-tools
description: >-
  Add tool calling and structured output to Sarvam chat models via the
  sarvam-ai-sdk provider — AI SDK tool() definitions, tool_choice, multi-step
  tool loops, Output.object with Zod schemas, and the experimental_json_mode
  gotcha (structured output is non-streaming). Use this when you need a Sarvam
  LLM to call functions, extract typed data, or return validated JSON in an
  AI SDK v7 app.
license: Apache-2.0
metadata:
  author: sarvam-ai
  version: "1.0"
---

# Tools & structured output with sarvam-ai-sdk

Sarvam chat models support AI SDK tool calling and schema-validated outputs. Both go through `generateText`.

## Tool calling

```ts
import { z } from "zod";
import { generateText, tool } from "ai";
import { sarvam } from "sarvam-ai-sdk";

const result = await generateText({
  model: sarvam("sarvam-105b"),
  tools: {
    weather: tool({
      description: "Get the weather in a location",
      inputSchema: z.object({ location: z.string() }),
      execute: async ({ location }) => ({ location, temperature: 27 }),
    }),
  },
  instructions: "You are a helpful AI",
  prompt: "കൊച്ചിയിലെ കാലാവസ്ഥ എന്താണ്?",
});

console.log(result.toolResults);
```

With `execute` provided, the SDK runs the tool loop for you. Omit `execute` if you want to handle tool calls yourself (`result.toolCalls`), then continue the conversation by passing the tool results back.

## Structured output

```ts
import { z } from "zod";
import { generateText, Output } from "ai";
import { sarvam } from "sarvam-ai-sdk";

const { output } = await generateText({
  model: sarvam("sarvam-105b", {
    experimental_json_mode: true, // send response_format directly
    reasoning_effort: "none",     // faster, and avoids budget surprises
  }),
  output: Output.object({
    name: "Recipe",
    description: "A recipe with a name, ingredients and steps",
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(z.string()),
        steps: z.array(z.string()),
      }),
    }),
  }),
  prompt: "Generate a South Indian recipe, in Malayalam",
});

console.log(output);
```

## Gotchas

| Gotcha | Detail |
|--------|--------|
| **Structured output is non-streaming only** | The provider only enables JSON handling for `doGenerate`. Do not use `streamText` + `Output.object`. |
| **`experimental_json_mode` chooses the mechanism** | `true` → sends `response_format: json_schema` (native JSON mode, early/experimental, Sarvam models may underperform). `false` (default) → the schema is sent as a **forced tool call** and the arguments are read back as text. Both work; native mode is faster when it works. |
| **You may need `reasoning_effort: "none"`** | With reasoning on, JSON extraction can consume the budget before the structured answer. Disable reasoning or raise `maxOutputTokens`. |
| **Only `function` tools are supported** | Provider-defined tools produce an `unsupported` warning and are skipped. |
| **`tool_choice` maps cleanly** | `"auto"`, `"none"`, `"required"`, and `{ type: "tool", toolName }` are all translated to the Sarvam `tool_choice` shape. |
| **Schemas must be JSON-serializable** | `inputSchema` / `Output.object` schemas are forwarded as JSON Schema; keep them plain Zod objects (no transforms/refinements that don't serialize). |

## Docs

- [AI SDK tool calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [AI SDK structured output](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
