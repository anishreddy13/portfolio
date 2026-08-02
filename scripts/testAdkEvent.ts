import { InMemoryRunner, LlmAgent } from '@google/adk';

async function test() {
  const planner = new LlmAgent({
    name: 'Test',
    model: 'antigravity-preview-05-2026',
    description: 'test'
  });
  const runner = new InMemoryRunner({ agent: planner });
  const stream = runner.runEphemeral({
    userId: 'test',
    newMessage: { parts: [{ text: "Hello" }] }
  });

  for await (const event of stream) {
    console.log("=== RAW EVENT ===");
    console.log(JSON.stringify(event, null, 2));
  }
}

test().catch(console.error);
