// CRITICAL: Delete this environment variable to prevent ADK from incorrectly routing to Vertex AI 
// and throwing 404s for standard Gemini model names, forcing it to use GEMINI_API_KEY instead.
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

import { runManagerWorkflow } from '../src/agents/manager';

async function main() {
  const task = "Write a Python script to scrape a website that extracts all headings and saves them to a JSON file. Use BeautifulSoup4.";
  
  console.log("Starting ADK Multi-Agent Workflow...");
  console.log("--------------------------------------");
  
  try {
    const finalResult = await runManagerWorkflow(task);
    console.log("\n[SUCCESS] Final Approved Result:");
    console.log("--------------------------------------");
    console.log(finalResult);
  } catch (error) {
    console.error("\n[ERROR] Workflow failed:", error);
  }
}

main();
