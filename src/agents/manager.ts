import { LlmAgent, InMemoryRunner, toStructuredEvents } from '@google/adk';
import { planner } from './planner';
import { implementor } from './implementor';
import { reviewer } from './reviewer';

export const manager = new LlmAgent({
  name: 'Manager',
  model: 'gemini-3.5-flash',
  description: 'Orchestrates the Planner, Implementor, and Reviewer workflow.',
  instruction: `You are an Engineering Manager orchestrating a multi-agent workflow. 
You coordinate between the Planner, Implementor, and Reviewer.`,
});

// Utility to run an agent via ADK's InMemoryRunner and extract its text output.
async function runAgent(agent: LlmAgent, input: string): Promise<string> {
  const runner = new InMemoryRunner({ agent });
  let output = '';
  
  // runEphemeral provides a generator of Events
  const stream = runner.runEphemeral({
    userId: 'system',
    newMessage: { parts: [{ text: input }] }
  });

  for await (const event of stream) {
    if ((event as any).errorCode) {
      const code = ((event as any).errorCode);
      const msg = ((event as any).errorMessage);
      output += `\n[API ERROR ${code}]: ${msg}`;
    }

    const structuredEvents = toStructuredEvents(event);
    for (const se of structuredEvents) {
      if (se.type === 'content') {
        output += se.content;
      } else if (se.type === 'error') {
        output += `\n[SDK ERROR]: ${(se.error as Error).message || 'Unknown error'}`;
      }
    }
  }
  return output || 'No response generated.';
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function runManagerWorkflow(task: string) {
  console.log(`\n[Manager] Received Task: ${task}`);
  
  // 1. Planner
  console.log(`[Manager] Delegating to Planner (waiting 3s)...`);
  await delay(3000);
  const plan = await runAgent(planner, task);
  console.log(`\n=== Planner Output ===\n${plan}\n======================\n`);

  // 2. Loop between Implementor and Reviewer
  let approved = false;
  let iterations = 0;
  const maxIterations = 3;
  let currentImplementorInput = `Plan to implement:\n${plan}`;
  let finalImplementation = '';

  while (!approved && iterations < maxIterations) {
    iterations++;
    console.log(`[Manager] Loop ${iterations}: Delegating to Implementor (waiting 3s)...`);
    await delay(3000);
    const implementation = await runAgent(implementor, currentImplementorInput);
    console.log(`\n=== Implementor Output ===\n${implementation}\n==========================\n`);

    console.log(`[Manager] Delegating to Reviewer (waiting 3s)...`);
    await delay(3000);
    const reviewerInput = `Plan:\n${plan}\n\nImplementation:\n${implementation}`;
    const review = await runAgent(reviewer, reviewerInput);
    
    console.log(`\n=== Reviewer Output ===\n${review}\n=======================\n`);

    if (review.includes('APPROVED')) {
      approved = true;
      finalImplementation = implementation;
      console.log(`[Manager] Workflow complete. Implementation approved!`);
      break;
    } else {
      console.log(`[Manager] Implementation rejected. Routing feedback back to Implementor...`);
      currentImplementorInput = `The reviewer rejected the previous implementation. Here is their feedback. Please fix the code.\n\nFeedback:\n${review}\n\nPrevious Implementation:\n${implementation}`;
    }
  }

  if (!approved) {
    console.log(`[Manager] Max iterations reached without approval.`);
  }

  return finalImplementation;
}
