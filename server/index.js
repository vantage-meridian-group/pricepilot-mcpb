import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createProxy } from "./proxy.js";

const { server } = createProxy();
const transport = new StdioServerTransport();
await server.connect(transport);
