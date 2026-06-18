import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import * as z from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

const responseSchema = z.object({
  message: z.string().describe("Summary of file changes"),
  files: z.array(
    z.object({
      path: z.string().describe("Path of the file"),
      content: z.string().describe("Content of the file"),
    }),
  ),
});

const responseSchemaJson = zodToJsonSchema(responseSchema);

export async function generateWithGemini(prompt: string): Promise<string> {
  if (!apiKey) {
    return "Mock mode: GEMINI_API_KEY is not configured, so no files were changed.";
  }

  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseJsonSchema: responseSchemaJson,
    },
  });

  return result.text ?? "";
}
