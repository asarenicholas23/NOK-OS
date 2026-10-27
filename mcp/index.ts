import type express from "express";
import type { Firestore } from "firebase-admin/firestore";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { requireMcpKey, mcpConfigured } from "./auth";
import { registerReadTools, type CallContext } from "./readTools";
import { registerWriteTools } from "./writeTools";
import { logToolCall } from "./audit";

const INSTRUCTIONS =
  "NOK OS is a social media agency's workspace. Data is scoped by brand: call list_brands first and pass brandId. " +
  "All figures come from imported analytics; when a field is null or dataNotes say the data can't support a claim, " +
  "say so instead of estimating. Records created by demo/seed code are hidden (see hiddenDemoRecords). " +
  "Write tools only create drafts for staff review: they can't approve, publish, schedule, send or delete anything.";

// A fresh server per request (stateless mode): nothing is kept between calls,
// so Render restarts and cold starts never break a session.
function buildServer(db: Firestore, ctx: CallContext) {
  const server = new McpServer({ name: "nok-os", version: "1.0.0" }, { instructions: INSTRUCTIONS });
  registerReadTools(server, db, ctx);
  registerWriteTools(server, db, ctx);
  return server;
}

export function mountMcp(app: express.Express, db: Firestore) {
  if (!mcpConfigured()) {
    console.warn("[mcp] MCP_API_KEY not set (or shorter than 32 chars): /mcp will answer 503.");
  }

  app.post("/mcp", requireMcpKey, async (req, res) => {
    const ctx: CallContext = { logged: false };
    const server = buildServer(db, ctx);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    const started = Date.now();
    res.on("finish", () => {
      // Tool calls rejected before reaching a handler (bad arguments, unknown
      // tool) still get an audit entry.
      const body = req.body;
      if (!ctx.logged && body && !Array.isArray(body) && body.method === "tools/call") {
        const args = body.params?.arguments;
        logToolCall(db, {
          tool: String(body.params?.name || "unknown"),
          brandId: typeof args?.brandId === "string" ? args.brandId : undefined,
          ok: false,
          ms: Date.now() - started,
          error: "Rejected before running (invalid arguments or unknown tool).",
        });
      }
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("[mcp] request failed:", err);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
      }
    }
  });

  // Stateless server: no SSE stream to open and no session to end.
  const notAllowed = (_req: express.Request, res: express.Response) =>
    res.status(405).set("Allow", "POST").json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
  app.get("/mcp", notAllowed);
  app.delete("/mcp", notAllowed);
}
