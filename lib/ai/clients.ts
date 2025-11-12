import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// DeepSeek: OpenAI-compatible
export const deepseek = createOpenAI({
  baseURL: `${process.env.DEEPSEEK_ENDPOINT_URL}/v1`,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// Qwen3: uses Bearer token (as verified via Postman)
export const qwen = createOpenAI({
  baseURL: `${process.env.QWEN_ENDPOINT_URL}/v1`,
  apiKey: process.env.QWEN_3_API_KEY,
});

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function callQwen3(prompt: string) {
  const { text } = await generateText({
    model: qwen('qwen3-32b'), // or qwen3-32b-instruct if that’s the ID you have
    prompt,
  });
  return text;
}

export async function callDeepSeek(prompt: string) {
  const { text } = await generateText({
    model: deepseek('deepseek-v3.1'),
    prompt,
  });
  return text;
}