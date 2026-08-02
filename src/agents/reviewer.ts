import { LlmAgent } from '@google/adk';

export const reviewer = new LlmAgent({
  name: 'Reviewer',
  model: 'gemini-3.5-flash',
  description: 'Reviews implemented code against the plan.',
  instruction: `You are a strict code reviewer. 
You will review the implemented code to ensure it meets the requirements of the original plan.
If the implementation is correct and complete, reply EXACTLY with "APPROVED".
If it is incomplete or contains errors, reply with the string "REJECTED" followed by a list of fixes required.`,
});
