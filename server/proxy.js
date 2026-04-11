import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";
import { createRateLimiter } from "./rate-limiter.js";

const DEFAULT_API_URL = "https://pricepilot-mcp.onrender.com";
const CTA =
  "For a full per-SKU pricing report with actionable recommendations, " +
  "visit pricepilot.vantagemeridiangroup.com";

export function createProxy({
  apiUrl = process.env.PRICEPILOT_API_URL || DEFAULT_API_URL,
  checkRateLimit,
} = {}) {
  checkRateLimit = checkRateLimit || createRateLimiter();

  let remoteClient = null;

  async function getRemoteClient() {
    if (remoteClient) return remoteClient;
    const client = new Client({ name: "pricepilot-proxy", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(
      new URL(`${apiUrl}/mcp`)
    );
    await client.connect(transport);
    remoteClient = client;
    return client;
  }

  async function callRemoteTool(name, args) {
    const rateLimitErr = checkRateLimit();
    if (rateLimitErr) {
      return { content: [{ type: "text", text: rateLimitErr }] };
    }

    try {
      const client = await getRemoteClient();
      return await client.callTool({ name, arguments: args });
    } catch (err) {
      remoteClient = null; // force reconnect on next call

      const isNetworkError =
        err.code === "ECONNREFUSED" ||
        err.code === "ENOTFOUND" ||
        err.message?.includes("fetch failed");

      if (isNetworkError) {
        return {
          content: [
            {
              type: "text",
              text:
                "PricePilot server is temporarily unavailable. " +
                "It may be warming up — try again in 30 seconds. " +
                CTA,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Error connecting to PricePilot: ${err.message}. Try again shortly. ${CTA}`,
          },
        ],
      };
    }
  }

  const server = new McpServer({
    name: "pricepilot",
    version: "1.0.0",
  });

  server.registerTool("get_price_position", {
    description:
      "Check where a CPG product price sits vs Amazon competitors. " +
      "Use when a brand manager or DTC founder asks: am I priced too high? " +
      "How does my price compare to the market? What's competitive pricing " +
      "for my category? Returns percentile rank, Price Index, and market " +
      "position (Value/Parity/Premium) based on 100+ tracked products. " +
      "Free alternative to NielsenIQ/SPINS competitive pricing data.",
    inputSchema: z.object({
      price: z.number().describe("Product price in dollars (e.g., 4.99)"),
      category: z
        .string()
        .describe(
          "Category name — Grocery, Health & Beauty, Household, or Pet Supplies"
        ),
    }),
    annotations: { readOnlyHint: true, title: "Get Price Position" },
  }, async ({ price, category }) =>
    callRemoteTool("get_price_position", { price, category })
  );

  server.registerTool("get_category_trend", {
    description:
      "Check whether Amazon prices in a CPG category are rising, stable, " +
      "or falling. Use when a brand manager asks: are prices going up in " +
      "my category? Should I raise my price? Is there a price war? " +
      "Based on 30-day price trend analysis across 100+ tracked products.",
    inputSchema: z.object({
      category: z
        .string()
        .describe(
          "Category name — Grocery, Health & Beauty, Household, or Pet Supplies"
        ),
    }),
    annotations: { readOnlyHint: true, title: "Get Category Trend" },
  }, async ({ category }) =>
    callRemoteTool("get_category_trend", { category })
  );

  server.registerTool("get_category_overview", {
    description:
      "Get a pricing landscape overview for an Amazon CPG category. " +
      "Use when a brand manager asks: what does pricing look like in my " +
      "category? What's the price range? Where's the budget vs premium " +
      "tier? Returns price tier breakdowns, product count, median price, " +
      "and category trend.",
    inputSchema: z.object({
      category: z
        .string()
        .describe(
          "Category name — Grocery, Health & Beauty, Household, or Pet Supplies"
        ),
    }),
    annotations: { readOnlyHint: true, title: "Get Category Overview" },
  }, async ({ category }) =>
    callRemoteTool("get_category_overview", { category })
  );

  server.registerTool("compare_products", {
    description:
      "Compare multiple CPG product prices against Amazon category " +
      "benchmarks. Use when a brand manager asks: how do my products " +
      "compare to competitors? Which of my SKUs is overpriced? Returns " +
      "percentile rank, market position, and distance from category " +
      "median for each product.",
    inputSchema: z.object({
      products: z
        .array(
          z.object({
            name: z.string().describe("Product name"),
            price: z.number().describe("Product price in dollars"),
          })
        )
        .describe("List of products to compare"),
      category: z
        .string()
        .describe(
          "Category name — Grocery, Health & Beauty, Household, or Pet Supplies"
        ),
    }),
    annotations: { readOnlyHint: true, title: "Compare Products" },
  }, async ({ products, category }) =>
    callRemoteTool("compare_products", { products, category })
  );

  server.registerTool("list_categories", {
    description:
      "List available CPG product categories with pricing stats and trends. " +
      "Use to see which Amazon categories have pricing data available. " +
      "Currently covers Grocery, Health & Beauty, Household, and Pet " +
      "Supplies with 100+ products tracked per category, refreshed weekly.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, title: "List Categories" },
  }, async () => callRemoteTool("list_categories", {}));

  server.registerTool("server_status", {
    description:
      "Check PricePilot pricing intelligence server health and data freshness.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, title: "Server Status" },
  }, async () => callRemoteTool("server_status", {}));

  return { server, callRemoteTool };
}
