import { LlmAgent } from '@google/adk';

export const planner = new LlmAgent({
  name: 'Planner',
  model: 'gemini-3.5-flash',
  description: 'Breaks down tasks into step-by-step instructions.',
  instruction: `You are a senior software architect. 
Given a high-level task from the manager, break it down into a concrete, step-by-step implementation plan.
Do not write the actual code. Only define the steps, files to touch, and the logic required.
Be as specific and clear as possible so the implementor can follow it exactly.`,
});
