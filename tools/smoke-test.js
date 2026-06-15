const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");

const PORT = 4199;
const BASE = `http://127.0.0.1:${PORT}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "content-type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  assert.equal(response.ok, true, `${path} failed: ${JSON.stringify(payload)}`);
  return payload;
}

async function waitForServer(child) {
  for (let i = 0; i < 30; i += 1) {
    if (child.exitCode !== null) throw new Error("server exited before readiness check");
    try {
      const health = await request("/api/health");
      if (health.status === "ok") return;
    } catch {
      await wait(300);
    }
  }
  throw new Error("server did not become ready");
}

async function main() {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
    stdio: "ignore"
  });

  try {
    await waitForServer(child);
    await request("/api/reset", { method: "POST" });
    const statePayload = await request("/api/state");
    assert.ok(statePayload.summary.calls >= 5, "demo calls should be available");
    assert.ok(statePayload.insights.feasibility.score > 0, "feasibility score should be computed");
    assert.ok(statePayload.insights.toolInsights.length > 0, "tool insights should be computed");

    const modelId = statePayload.state.models[0].id;
    const feasibility = await request("/api/feasibility", {
      method: "POST",
      body: {
        modelId,
        monthlyCalls: 1000,
        inputTokens: 2000,
        outputTokens: 500,
        targetCacheHitRate: 0.4
      }
    });
    assert.equal(feasibility.modelId, modelId);
    assert.ok(feasibility.estimatedCost >= 0);

    const exported = await request("/api/export");
    assert.ok(exported.insights.systemProfile.toolCount >= 1);
    console.log("smoke test passed");
  } finally {
    child.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
