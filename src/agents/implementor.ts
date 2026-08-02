import { LlmAgent } from '@google/adk';

export const implementor = new LlmAgent({
  name: 'Implementor',
  model: 'gemini-3.5-flash',
  description: 'Writes code or simulated actions based on a plan.',
  instruction: `You are an expert software engineer.
You will receive a step-by-step implementation plan. Your job is to generate the exact code or simulate the exact actions required to fulfill it.
Output the code blocks cleanly and explain any non-obvious choices.`,
});
