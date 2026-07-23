import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

describe("Sites worker", () => {
  it("builds browser assets into the Sites client directory", async () => {
    const viteConfig = await readFile(`${process.cwd()}/vite.config.ts`, "utf8");
    expect(viteConfig).toContain('outDir: "dist/client"');
  });

  it("serves assets, applies security headers, and falls back to the SPA shell", async () => {
    const workerPath = pathToFileURL(`${process.cwd()}/sites/worker.js`).href;
    const { default: worker } = await import(workerPath);
    const index = await readFile(`${process.cwd()}/index.html`, "utf8");
    const env = {
      ASSETS: {
        fetch: async (request: Request) => {
          const pathname = new URL(request.url).pathname;
          return pathname === "/index.html" || pathname === "/"
            ? new Response(index, { headers: { "content-type": "text/html; charset=utf-8" } })
            : new Response("Not found", { status: 404 });
        },
      },
    };

    const response = await worker.fetch(
      new Request("https://galia.example/deep-link", { headers: { accept: "text/html" } }),
      env,
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Guardians of Galia");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });

  it("returns a controlled error when the asset binding is unavailable", async () => {
    const workerPath = pathToFileURL(`${process.cwd()}/sites/worker.js`).href;
    const { default: worker } = await import(workerPath);
    const response = await worker.fetch(new Request("https://galia.example/"), {});
    expect(response.status).toBe(503);
  });

  it("accepts only bounded anonymous playtest events", async () => {
    const workerPath = pathToFileURL(`${process.cwd()}/sites/worker.js`).href;
    const { default: worker } = await import(workerPath);
    const run = async () => ({ success: true });
    const bind = (...values: unknown[]) => {
      expect(values[1]).toBe("feedback");
      expect(values[2]).toBe("story");
      expect(values[3]).toBe(4);
      return { run };
    };
    const env = {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      DB: { prepare: () => ({ bind }) },
    };

    const response = await worker.fetch(new Request("https://galia.example/api/playtest-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType: "feedback", mode: "story", fun: 4, difficulty: "right", note: "Clear" }),
    }), env);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ saved: true });

    const rejected = await worker.fetch(new Request("https://galia.example/api/playtest-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType: "feedback", mode: "unknown" }),
    }), env);
    expect(rejected.status).toBe(400);
  });
});
