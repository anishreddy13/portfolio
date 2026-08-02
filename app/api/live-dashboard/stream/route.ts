import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection handshake with batch scheduler configuration metadata
      controller.enqueue(
        encoder.encode(
          `event: handshake\ndata: ${JSON.stringify({
            status: "connected",
            scheduler: "DashboardScheduler",
            batch_interval_ms: 100,
            timestamp: new Date().toISOString(),
          })}\n\n`
        )
      );

      // Interval simulating optimized DashboardScheduler batch events (coalesced every 100ms)
      const interval = setInterval(() => {
        const symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN"];
        const sym = symbols[Math.floor(Math.random() * symbols.length)];
        const basePrices: Record<string, number> = { AAPL: 182.5, MSFT: 415.2, NVDA: 875.4, TSLA: 178.1, AMZN: 175.6 };
        const delta = (Math.random() - 0.48) * 0.6;
        const newPrice = Number((basePrices[sym] + delta).toFixed(2));

        // Construct optimized DashboardBatch containing coalesced events
        const batchPayload = {
          batch_id: `batch-${Math.random().toString(36).substring(2, 9)}`,
          events: [
            {
              event_type: "watchlist_tick",
              priority: 1,
              payload: {
                symbol: sym,
                price: newPrice,
                bid: Number((newPrice - 0.05).toFixed(2)),
                ask: Number((newPrice + 0.05).toFixed(2)),
                changePct: Number((delta * 0.15).toFixed(2)),
                confidence: 0.99,
                provider: Math.random() > 0.3 ? "POLYGON" : "ALPACA",
                agreement_status: "AGREED",
                timestamp: new Date().toLocaleTimeString(),
              },
            },
            {
              event_type: "telemetry_update",
              priority: 3,
              payload: {
                messagesPerSec: Number((46 + Math.random() * 8).toFixed(1)),
                cacheHitRatio: Number((98.5 + Math.random() * 0.4).toFixed(1)),
                consensusPerSec: Number((41 + Math.random() * 5).toFixed(1)),
                streamLatencyMs: Number((7.2 + Math.random() * 1.2).toFixed(1)),
              },
            },
          ],
          created_at: new Date().toISOString(),
        };

        try {
          // Emit optimized batch frame to SSE clients
          controller.enqueue(encoder.encode(`event: dashboard_batch\ndata: ${JSON.stringify(batchPayload)}\n\n`));

          // Also emit unpacked single events for direct compatibility
          batchPayload.events.forEach((ev) => {
            controller.enqueue(encoder.encode(`event: ${ev.event_type}\ndata: ${JSON.stringify(ev.payload)}\n\n`));
          });
        } catch (e) {
          clearInterval(interval);
        }
      }, 1000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
