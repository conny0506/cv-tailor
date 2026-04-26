import Anthropic from "@anthropic-ai/sdk";
import { z, ZodSchema } from "zod";

export const MODEL = "claude-sonnet-4-6";

let _client: Anthropic | null = null;
export function client(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set in environment");
  _client = new Anthropic({ apiKey });
  return _client;
}

type ContentBlock =
  | { type: "text"; text: string; cache_control?: { type: "ephemeral" } }
  | { type: "tool_result"; tool_use_id: string; content: string };

interface ToolCallOptions<T> {
  system: string | ContentBlock[];
  user: string | ContentBlock[];
  toolName: string;
  toolDescription: string;
  schema: ZodSchema<T>;
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
}

/**
 * Forces Claude to call a single named tool whose input arguments validate
 * against a Zod schema. Returns the parsed structured output.
 *
 * Why a "fake" tool: Anthropic's tool-use forcing yields more reliable JSON
 * than asking the model to print JSON in free text, and it composes with
 * prompt caching when `cache_control` is set on system blocks.
 */
export async function structuredCall<T>(opts: ToolCallOptions<T>): Promise<T> {
  const c = client();

  const systemBlocks: ContentBlock[] =
    typeof opts.system === "string"
      ? [{ type: "text", text: opts.system }]
      : opts.system;

  const userContent: ContentBlock[] =
    typeof opts.user === "string" ? [{ type: "text", text: opts.user }] : opts.user;

  const res = await c.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    // SDK accepts the cache_control field on text blocks; types may lag.
    system: systemBlocks as unknown as Anthropic.TextBlockParam[],
    messages: [{ role: "user", content: userContent as unknown as Anthropic.ContentBlockParam[] }],
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription,
        input_schema: {
          type: "object",
          ...(opts.inputSchema as object),
        } as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: opts.toolName },
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`Claude did not call ${opts.toolName}`);
  }
  return opts.schema.parse(toolUse.input);
}

export const z_ = z;
