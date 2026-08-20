import { Client } from "@gradio/client";

const SPACE_ID = "Anishreddy13/ai-financial-analyst";
const SPACE_URL = "https://anishreddy13-ai-financial-analyst.hf.space";

type FinancialAnalystClient = Awaited<ReturnType<typeof Client.connect>>;

let clientPromise: Promise<FinancialAnalystClient> | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectOnce() {
  try {
    return await Client.connect(SPACE_ID);
  } catch {
    return Client.connect(SPACE_URL);
  }
}

export async function getFinancialAnalystClient() {
  if (!clientPromise) {
    clientPromise = connectOnce();
  }

  try {
    return await clientPromise;
  } catch (error) {
    clientPromise = null;
    throw error;
  }
}

export async function predictFinancialAnalyst<TArgs extends unknown[]>(
  endpoint: string,
  args: TArgs,
  retries = 2,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const app = await getFinancialAnalystClient();
      return await app.predict(endpoint, args);
    } catch (error) {
      lastError = error;
      clientPromise = null;
      if (attempt < retries) {
        await sleep(900 + attempt * 1400);
      }
    }
  }

  throw lastError;
}

export function getFinancialAnalystServiceMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || "");
  if (raw.toLowerCase().includes("resolve app config") || raw.includes("503")) {
    return "AI analyst service is waking up or rebuilding. Please retry in a moment.";
  }
  return raw || "AI analyst service is temporarily unavailable.";
}
