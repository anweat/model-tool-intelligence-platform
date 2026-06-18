const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

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

async function requestError(path, options = {}, expectedStatus = 400) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "content-type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  assert.equal(response.status, expectedStatus, `${path} should fail with ${expectedStatus}`);
  assert.ok(payload.error, "error response should include message");
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
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "model-ledger-test-"));
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir },
    stdio: "ignore"
  });

  try {
    await waitForServer(child);
    await request("/api/reset", { method: "POST" });
    const statePayload = await request("/api/state");
    assert.ok(statePayload.summary.calls >= 5, "demo calls should be available");
    assert.ok(statePayload.insights.feasibility.score > 0, "feasibility score should be computed");
    assert.ok(statePayload.insights.toolInsights.length > 0, "tool insights should be computed");
    assert.equal(statePayload.state.apiKeys[0].secret, undefined, "api key secret must not be exposed");
    assert.ok(statePayload.state.apiKeys[0].maskedSecret, "masked key should be exposed for display");

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

    await requestError("/api/feasibility", {
      method: "POST",
      body: {
        modelId,
        monthlyCalls: -1,
        inputTokens: 2000,
        outputTokens: 500,
        targetCacheHitRate: 0.4
      }
    });

    const providerPayload = await request("/api/providers", {
      method: "POST",
      body: { name: "Moonshot", baseUrl: "https://api.moonshot.cn", notes: "backup provider" }
    });
    const providerId = providerPayload.state.providers.find((provider) => provider.name === "Moonshot").id;

    await request("/api/keys", {
      method: "POST",
      body: { providerId, label: "Backup key", owner: "tester", secret: "sk-test-secret-value" }
    });

    const modelPayload = await request("/api/models", {
      method: "POST",
      body: {
        providerId,
        name: "moonshot-demo",
        contextWindow: 32000,
        inputPricePer1K: 0.001,
        outputPricePer1K: 0.002,
        cacheDiscount: 0.6,
        toolCalling: true
      }
    });
    const newModelId = modelPayload.state.models.find((model) => model.name === "moonshot-demo").id;

    await requestError("/api/calls", {
      method: "POST",
      body: {
        providerId,
        modelId,
        toolName: "bad_pair",
        inputTokens: 100,
        outputTokens: 20
      }
    });

    await request("/api/calls", {
      method: "POST",
      body: {
        providerId,
        modelId: newModelId,
        toolName: "semantic_search",
        inputTokens: 1200,
        outputTokens: 300,
        cacheHit: true,
        latencyMs: 750,
        success: true
      }
    });

    const settingsPayload = await request("/api/settings", {
      method: "PATCH",
      body: { monthlyBudget: 10, warningThreshold: 0.7, retentionDays: 30 }
    });
    assert.equal(settingsPayload.state.settings.retentionDays, 30);

    const exported = await request("/api/export");
    assert.ok(exported.insights.systemProfile.toolCount >= 1);
    assert.equal(exported.state.apiKeys.some((key) => key.secret), false, "export must not contain raw api keys");
    console.log("smoke test passed");
  } finally {
    child.kill();
    await fs.rm(dataDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
