import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock MCP SDK modules before importing proxy
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => {
  const tools = {};
  return {
    McpServer: vi.fn().mockImplementation(() => ({
      registerTool: vi.fn((name, config, handler) => {
        tools[name] = { config, handler };
      }),
      _tools: tools,
    })),
  };
});

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: vi.fn(),
}));

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createProxy } from "../server/proxy.js";

describe("createProxy", () => {
  let mockCallTool;
  let mockConnect;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCallTool = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: '{"position":"Premium","cta":"visit"}' }],
    });
    mockConnect = vi.fn().mockResolvedValue(undefined);
    Client.mockImplementation(() => ({
      connect: mockConnect,
      callTool: mockCallTool,
    }));
  });

  it("registers all 6 tools", () => {
    const { server } = createProxy({ apiUrl: "http://localhost:9999" });
    expect(server.registerTool).toHaveBeenCalledTimes(6);

    const names = server.registerTool.mock.calls.map((c) => c[0]);
    expect(names).toContain("get_price_position");
    expect(names).toContain("get_category_trend");
    expect(names).toContain("get_category_overview");
    expect(names).toContain("compare_products");
    expect(names).toContain("list_categories");
    expect(names).toContain("server_status");
  });

  it("all tools have readOnlyHint annotation", () => {
    const { server } = createProxy({ apiUrl: "http://localhost:9999" });
    for (const call of server.registerTool.mock.calls) {
      const config = call[1];
      expect(config.annotations.readOnlyHint).toBe(true);
    }
  });

  it("all tools have a title annotation", () => {
    const { server } = createProxy({ apiUrl: "http://localhost:9999" });
    for (const call of server.registerTool.mock.calls) {
      const config = call[1];
      expect(config.annotations.title).toBeDefined();
      expect(typeof config.annotations.title).toBe("string");
    }
  });

  it("forwards tool calls to remote server", async () => {
    const { callRemoteTool } = createProxy({ apiUrl: "http://localhost:9999" });
    const result = await callRemoteTool("get_price_position", {
      price: 4.99,
      category: "Grocery",
    });

    expect(mockCallTool).toHaveBeenCalledWith({
      name: "get_price_position",
      arguments: { price: 4.99, category: "Grocery" },
    });
    expect(result.content[0].text).toContain("Premium");
  });

  it("returns rate limit error without calling remote", async () => {
    const alwaysLimited = () => "Rate limit reached (60 requests/minute).";
    const { callRemoteTool } = createProxy({
      apiUrl: "http://localhost:9999",
      checkRateLimit: alwaysLimited,
    });

    const result = await callRemoteTool("list_categories", {});
    expect(result.content[0].text).toMatch(/Rate limit/);
    expect(mockCallTool).not.toHaveBeenCalled();
  });

  it("handles network errors gracefully", async () => {
    Client.mockImplementation(() => ({
      connect: vi.fn().mockRejectedValue(new Error("fetch failed")),
    }));

    const { callRemoteTool } = createProxy({ apiUrl: "http://localhost:9999" });
    const result = await callRemoteTool("server_status", {});
    expect(result.content[0].text).toMatch(/unavailable|Error/i);
  });

  it("reconnects after a failed call", async () => {
    let connectCount = 0;
    Client.mockImplementation(() => {
      connectCount++;
      if (connectCount === 1) {
        return {
          connect: vi.fn().mockResolvedValue(undefined),
          callTool: vi.fn().mockRejectedValue(new Error("connection lost")),
        };
      }
      return {
        connect: vi.fn().mockResolvedValue(undefined),
        callTool: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: "ok" }],
        }),
      };
    });

    const { callRemoteTool } = createProxy({ apiUrl: "http://localhost:9999" });

    // First call fails
    const r1 = await callRemoteTool("server_status", {});
    expect(r1.content[0].text).toMatch(/Error/i);

    // Second call should reconnect and succeed
    const r2 = await callRemoteTool("server_status", {});
    expect(r2.content[0].text).toBe("ok");
  });
});
