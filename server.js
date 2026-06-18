const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const DEFAULT_STORE = {
  providers: [
    {
      id: "prov-openai",
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      status: "active",
      notes: "General purpose text and tool calling models."
    },
    {
      id: "prov-deepseek",
      name: "DeepSeek",
      baseUrl: "https://api.deepseek.com",
      status: "active",
      notes: "Cost-effective coding and reasoning models."
    }
  ],
  apiKeys: [
    {
      id: "key-demo-openai",
      providerId: "prov-openai",
      label: "Course demo key",
      secret: "sk-demo-not-a-real-key",
      owner: "student",
      status: "enabled",
      createdAt: new Date().toISOString()
    }
  ],
  models: [
    {
      id: "model-gpt-4o-mini",
      providerId: "prov-openai",
      name: "gpt-4o-mini",
      contextWindow: 128000,
      inputPricePer1K: 0.00015,
      outputPricePer1K: 0.0006,
      cacheDiscount: 0.5,
      toolCalling: true
    },
    {
      id: "model-deepseek-chat",
      providerId: "prov-deepseek",
      name: "deepseek-chat",
      contextWindow: 64000,
      inputPricePer1K: 0.00014,
      outputPricePer1K: 0.00028,
      cacheDiscount: 0.4,
      toolCalling: true
    }
  ],
  calls: [
    {
      id: "call-seed-1",
      providerId: "prov-openai",
      modelId: "model-gpt-4o-mini",
      toolName: "summarize_invoice",
      inputTokens: 1850,
      outputTokens: 420,
      cacheHit: true,
      latencyMs: 920,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "call-seed-2",
      providerId: "prov-deepseek",
      modelId: "model-deepseek-chat",
      toolName: "code_review",
      inputTokens: 3240,
      outputTokens: 870,
      cacheHit: false,
      latencyMs: 1340,
      createdAt: new Date().toISOString()
    },
    {
      id: "call-seed-3",
      providerId: "prov-openai",
      modelId: "model-gpt-4o-mini",
      toolName: "search_docs",
      inputTokens: 920,
      outputTokens: 260,
      cacheHit: true,
      latencyMs: 610,
      success: true,
      errorType: "",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: "call-seed-4",
      providerId: "prov-deepseek",
      modelId: "model-deepseek-chat",
      toolName: "generate_sql",
      inputTokens: 2100,
      outputTokens: 640,
      cacheHit: false,
      latencyMs: 1680,
      success: false,
      errorType: "timeout",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: "call-seed-5",
      providerId: "prov-openai",
      modelId: "model-gpt-4o-mini",
      toolName: "summarize_invoice",
      inputTokens: 1720,
      outputTokens: 390,
      cacheHit: true,
      latencyMs: 880,
      success: true,
      errorType: "",
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: "call-seed-6",
      providerId: "prov-openai",
      modelId: "model-gpt-4o-mini",
      toolName: "search_docs",
      inputTokens: 1040,
      outputTokens: 310,
      cacheHit: false,
      latencyMs: 740,
      success: true,
      errorType: "",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ],
  auditLogs: [],
  settings: {
    currency: "USD",
    monthlyBudget: 0.01,
    warningThreshold: 0.8,
    retentionDays: 90
  }
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function json(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(body);
}

function id(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function maskSecret(secret) {
  if (!secret) return "";
  if (secret.length <= 8) return "****";
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2));
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  const store = JSON.parse(raw);
  return migrateStore(store);
}

async function writeStore(store) {
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

function migrateStore(store) {
  store.settings = {
    ...DEFAULT_STORE.settings,
    ...(store.settings || {})
  };
  store.models = (store.models || []).map((model) => ({
    status: "available",
    ...model
  }));
  store.providers = store.providers || [];
  store.apiKeys = store.apiKeys || [];
  store.auditLogs = store.auditLogs || [];
  store.calls = (store.calls || []).map((call) => ({
    success: true,
    errorType: "",
    archived: false,
    ...call
  }));
  return store;
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function publicStore(store) {
  return {
    ...store,
    apiKeys: store.apiKeys.map((key) => ({
      ...key,
      secret: undefined,
      maskedSecret: maskSecret(key.secret)
    }))
  };
}

function enrichCall(store, call) {
  const provider = store.providers.find((item) => item.id === call.providerId);
  const model = store.models.find((item) => item.id === call.modelId);
  const inputRate = model?.inputPricePer1K || 0;
  const outputRate = model?.outputPricePer1K || 0;
  const inputChargeTokens = call.cacheHit ? call.inputTokens * (model?.cacheDiscount ?? 1) : call.inputTokens;
  const fullInputCost = (call.inputTokens / 1000) * inputRate;
  const cost = (inputChargeTokens / 1000) * inputRate + (call.outputTokens / 1000) * outputRate;
  const cacheSavings = call.cacheHit ? fullInputCost - (inputChargeTokens / 1000) * inputRate : 0;
  return {
    ...call,
    providerName: provider?.name || "Unknown",
    modelName: model?.name || "Unknown",
    cost: Number(cost.toFixed(6)),
    cacheSavings: Number(cacheSavings.toFixed(6))
  };
}

function computeSummary(store) {
  const activeCalls = store.calls.filter((call) => !call.archived);
  const calls = activeCalls.map((call) => enrichCall(store, call));
  const totals = calls.reduce(
    (acc, call) => {
      acc.calls += 1;
      acc.inputTokens += Number(call.inputTokens || 0);
      acc.outputTokens += Number(call.outputTokens || 0);
      acc.cacheHits += call.cacheHit ? 1 : 0;
      acc.success += call.success === false ? 0 : 1;
      acc.failure += call.success === false ? 1 : 0;
      acc.totalCost += call.cost;
      acc.cacheSavings += call.cacheSavings;
      acc.latencyMs += Number(call.latencyMs || 0);
      acc.toolUsage[call.toolName || "none"] = (acc.toolUsage[call.toolName || "none"] || 0) + 1;
      acc.providerUsage[call.providerName] = (acc.providerUsage[call.providerName] || 0) + call.cost;
      acc.modelUsage[call.modelName] = (acc.modelUsage[call.modelName] || 0) + call.cost;
      if (call.success === false) {
        const errorType = call.errorType || "unknown";
        acc.errorTypes[errorType] = (acc.errorTypes[errorType] || 0) + 1;
      }
      return acc;
    },
    {
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheHits: 0,
      success: 0,
      failure: 0,
      totalCost: 0,
      cacheSavings: 0,
      latencyMs: 0,
      toolUsage: {},
      providerUsage: {},
      modelUsage: {},
      errorTypes: {}
    }
  );
  const monthlyBudget = Number(store.settings?.monthlyBudget || 0);
  const budgetUsageRate = monthlyBudget ? totals.totalCost / monthlyBudget : 0;
  const warningThreshold = Number(store.settings?.warningThreshold ?? 0.8);
  return {
    ...totals,
    cacheHitRate: totals.calls ? Number((totals.cacheHits / totals.calls).toFixed(4)) : 0,
    successRate: totals.calls ? Number((totals.success / totals.calls).toFixed(4)) : 0,
    averageLatencyMs: totals.calls ? Math.round(totals.latencyMs / totals.calls) : 0,
    totalCost: Number(totals.totalCost.toFixed(6)),
    cacheSavings: Number(totals.cacheSavings.toFixed(6)),
    budgetUsageRate: Number(budgetUsageRate.toFixed(4)),
    budgetStatus: monthlyBudget && budgetUsageRate >= 1 ? "over" : monthlyBudget && budgetUsageRate >= warningThreshold ? "warning" : "normal",
    toolUsageList: Object.entries(totals.toolUsage).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    providerUsageList: Object.entries(totals.providerUsage).map(([name, cost]) => ({ name, cost: Number(cost.toFixed(6)) })).sort((a, b) => b.cost - a.cost),
    modelUsageList: Object.entries(totals.modelUsage).map(([name, cost]) => ({ name, cost: Number(cost.toFixed(6)) })).sort((a, b) => b.cost - a.cost),
    errorTypeList: Object.entries(totals.errorTypes).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    archivedCalls: store.calls.length - activeCalls.length,
    recentCalls: calls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8)
  };
}

function ratio(part, total) {
  return total ? Number((part / total).toFixed(4)) : 0;
}

function scoreBand(score) {
  if (score >= 85) return "适合上线";
  if (score >= 70) return "可以试点";
  if (score >= 55) return "需要优化";
  return "暂不建议上线";
}

function computeInsights(store) {
  const calls = store.calls.filter((call) => !call.archived).map((call) => enrichCall(store, call));
  const summary = computeSummary(store);
  const byTool = new Map();
  const providerCost = new Map();
  const modelCost = new Map();

  for (const call of calls) {
    const toolName = call.toolName || "none";
    if (!byTool.has(toolName)) {
      byTool.set(toolName, {
        name: toolName,
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheHits: 0,
        success: 0,
        failure: 0,
        cost: 0,
        latencyMs: 0
      });
    }
    const tool = byTool.get(toolName);
    tool.calls += 1;
    tool.inputTokens += Number(call.inputTokens || 0);
    tool.outputTokens += Number(call.outputTokens || 0);
    tool.cacheHits += call.cacheHit ? 1 : 0;
    tool.success += call.success === false ? 0 : 1;
    tool.failure += call.success === false ? 1 : 0;
    tool.cost += Number(call.cost || 0);
    tool.latencyMs += Number(call.latencyMs || 0);
    providerCost.set(call.providerName, (providerCost.get(call.providerName) || 0) + Number(call.cost || 0));
    modelCost.set(call.modelName, (modelCost.get(call.modelName) || 0) + Number(call.cost || 0));
  }

  const toolInsights = [...byTool.values()]
    .map((tool) => ({
      ...tool,
      avgLatencyMs: tool.calls ? Math.round(tool.latencyMs / tool.calls) : 0,
      cacheHitRate: ratio(tool.cacheHits, tool.calls),
      successRate: ratio(tool.success, tool.calls),
      avgCost: tool.calls ? Number((tool.cost / tool.calls).toFixed(6)) : 0,
      cost: Number(tool.cost.toFixed(6)),
      valueLevel: tool.success / Math.max(tool.calls, 1) >= 0.9 && tool.cacheHits / Math.max(tool.calls, 1) >= 0.5 ? "高价值" : tool.failure / Math.max(tool.calls, 1) >= 0.2 ? "需治理" : "观察"
    }))
    .sort((a, b) => b.calls - a.calls);

  const dominantProvider = [...providerCost.entries()].sort((a, b) => b[1] - a[1])[0] || ["暂无", 0];
  const dominantModel = [...modelCost.entries()].sort((a, b) => b[1] - a[1])[0] || ["暂无", 0];
  const providerConcentration = summary.totalCost ? dominantProvider[1] / summary.totalCost : 0;
  const avgLatency = summary.averageLatencyMs || 0;
  const successRate = summary.successRate || 0;
  const cacheHitRate = summary.cacheHitRate || 0;
  const monthlyBudget = Number(store.settings?.monthlyBudget || 0);
  const budgetUsage = summary.budgetUsageRate || 0;

  let feasibilityScore = 100;
  if (successRate < 0.95) feasibilityScore -= Math.round((0.95 - successRate) * 140);
  if (successRate < 0.9) feasibilityScore -= 10;
  if (cacheHitRate < 0.35) feasibilityScore -= Math.round((0.35 - cacheHitRate) * 45);
  if (avgLatency > 1500) feasibilityScore -= Math.min(18, Math.round((avgLatency - 1500) / 180));
  if (budgetUsage > 0.8) feasibilityScore -= Math.min(25, Math.round((budgetUsage - 0.8) * 60));
  if (providerConcentration > 0.75 && store.providers.length > 1) feasibilityScore -= 8;
  feasibilityScore = Math.max(0, Math.min(100, feasibilityScore));

  const recommendations = [];
  if (cacheHitRate < 0.35) recommendations.push("缓存命中率偏低，优先为高频工具增加请求指纹、Prompt 模板归一化和结果缓存。");
  if (successRate < 0.95) recommendations.push("调用成功率不足，建议按失败类型增加重试、限流退避和供应商降级策略。");
  if (avgLatency > 1500) recommendations.push("平均耗时偏高，建议把长上下文任务拆分，并为低风险工具切换到更低延迟模型。");
  if (budgetUsage > 0.8) recommendations.push("预算使用接近或超过阈值，需要限制高成本模型或提高缓存复用比例。");
  if (providerConcentration > 0.75 && store.providers.length > 1) recommendations.push("费用集中在单一供应商，建议配置备用模型以降低供应商风险。");
  if (!recommendations.length) recommendations.push("当前调用数据表现稳定，可进入小规模试点并继续采集样本。");

  return {
    generatedAt: new Date().toISOString(),
    systemProfile: {
      toolCount: toolInsights.length,
      providerCount: store.providers.length,
      modelCount: store.models.length,
      dominantProvider: dominantProvider[0],
      dominantModel: dominantModel[0],
      avgTokensPerCall: summary.calls ? Math.round((summary.inputTokens + summary.outputTokens) / summary.calls) : 0,
      avgCostPerCall: summary.calls ? Number((summary.totalCost / summary.calls).toFixed(6)) : 0,
      mainScenario: toolInsights[0]?.name || "暂无调用"
    },
    feasibility: {
      score: feasibilityScore,
      level: scoreBand(feasibilityScore),
      successRate,
      cacheHitRate,
      avgLatencyMs: avgLatency,
      budgetUsageRate: budgetUsage,
      providerConcentration: Number(providerConcentration.toFixed(4)),
      recommendations
    },
    toolInsights
  };
}

function required(value, name) {
  if (value === undefined || value === null || value === "") {
    const error = new Error(`${name} is required`);
    error.statusCode = 400;
    throw error;
  }
}

function numberInRange(value, name, { min = 0, max = Number.POSITIVE_INFINITY, fallback = 0 } = {}) {
  const numberValue = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
    const error = new Error(`${name} must be a number between ${min} and ${max}`);
    error.statusCode = 400;
    throw error;
  }
  return numberValue;
}

function mergeById(items, idValue, patch, allowedFields) {
  const index = items.findIndex((item) => item.id === idValue);
  if (index === -1) {
    const error = new Error("Resource not found");
    error.statusCode = 404;
    throw error;
  }
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      items[index][field] = patch[field];
    }
  }
  items[index].updatedAt = new Date().toISOString();
  return items[index];
}

function removeById(items, idValue) {
  const index = items.findIndex((item) => item.id === idValue);
  if (index === -1) {
    const error = new Error("Resource not found");
    error.statusCode = 404;
    throw error;
  }
  items.splice(index, 1);
}

function audit(store, action, targetType, targetId, detail = "") {
  store.auditLogs.unshift({
    id: id("audit"),
    action,
    targetType,
    targetId,
    detail,
    createdAt: new Date().toISOString()
  });
  store.auditLogs = store.auditLogs.slice(0, 120);
}

function validateRef(store, collection, idValue, name) {
  if (!store[collection].some((item) => item.id === idValue)) {
    const error = new Error(`${name} does not exist`);
    error.statusCode = 400;
    throw error;
  }
}

function validateModelBelongsToProvider(store, providerId, modelId) {
  const model = store.models.find((item) => item.id === modelId);
  if (!model || model.providerId !== providerId) {
    const error = new Error("modelId does not belong to providerId");
    error.statusCode = 400;
    throw error;
  }
}

function statePayload(store) {
  return { state: publicStore(store), summary: computeSummary(store), insights: computeInsights(store) };
}

async function handleApi(req, res, url) {
  const store = await readStore();
  if (req.method === "GET" && url.pathname === "/api/health") {
    return json(res, 200, {
      status: "ok",
      service: "model-key-ledger",
      version: "0.2.0",
      checkedAt: new Date().toISOString()
    });
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    return json(res, 200, statePayload(store));
  }

  if (req.method === "GET" && url.pathname === "/api/export") {
    return json(res, 200, {
      exportedAt: new Date().toISOString(),
      state: publicStore(store),
      summary: computeSummary(store),
      insights: computeInsights(store),
      auditLogs: store.auditLogs || []
    });
  }

  if (req.method === "GET" && url.pathname === "/api/insights") {
    return json(res, 200, { insights: computeInsights(store) });
  }

  if (req.method === "POST" && url.pathname === "/api/feasibility") {
    const body = await parseBody(req);
    required(body.modelId, "modelId");
    validateRef(store, "models", body.modelId, "modelId");
    const model = store.models.find((item) => item.id === body.modelId);
    const monthlyCalls = numberInRange(body.monthlyCalls, "monthlyCalls");
    const inputTokens = numberInRange(body.inputTokens, "inputTokens");
    const outputTokens = numberInRange(body.outputTokens, "outputTokens");
    const targetCacheHitRate = numberInRange(body.targetCacheHitRate, "targetCacheHitRate", { min: 0, max: 1 });
    const inputPrice = Number(model.inputPricePer1K || 0);
    const outputPrice = Number(model.outputPricePer1K || 0);
    const cacheDiscount = Number(model.cacheDiscount ?? 1);
    const inputCost = monthlyCalls * ((inputTokens * (1 - targetCacheHitRate) + inputTokens * targetCacheHitRate * cacheDiscount) / 1000) * inputPrice;
    const outputCost = monthlyCalls * (outputTokens / 1000) * outputPrice;
    const estimatedCost = Number((inputCost + outputCost).toFixed(6));
    const budget = Number(store.settings?.monthlyBudget || 0);
    return json(res, 200, {
      modelId: model.id,
      modelName: model.name,
      monthlyCalls,
      estimatedCost,
      budget,
      budgetUsageRate: budget ? Number((estimatedCost / budget).toFixed(4)) : 0,
      feasible: budget ? estimatedCost <= budget : true,
      advice: budget && estimatedCost > budget ? "预计费用超过预算，建议提高缓存命中率或降低高成本模型调用比例。" : "预计费用在预算范围内，可继续评估稳定性和延迟。"
    });
  }

  if (req.method === "POST" && url.pathname === "/api/providers") {
    const body = await parseBody(req);
    required(body.name, "name");
    store.providers.push({
      id: id("prov"),
      name: body.name,
      baseUrl: body.baseUrl || "",
      status: body.status || "active",
      notes: body.notes || ""
    });
    audit(store, "create", "provider", store.providers.at(-1).id, body.name);
    await writeStore(store);
    return json(res, 201, statePayload(store));
  }

  if (req.method === "POST" && url.pathname === "/api/keys") {
    const body = await parseBody(req);
    required(body.providerId, "providerId");
    required(body.label, "label");
    required(body.secret, "secret");
    validateRef(store, "providers", body.providerId, "providerId");
    store.apiKeys.push({
      id: id("key"),
      providerId: body.providerId,
      label: body.label,
      secret: body.secret,
      owner: body.owner || "",
      status: body.status || "enabled",
      createdAt: new Date().toISOString()
    });
    audit(store, "create", "apiKey", store.apiKeys.at(-1).id, body.label);
    await writeStore(store);
    return json(res, 201, statePayload(store));
  }

  if (req.method === "POST" && url.pathname === "/api/models") {
    const body = await parseBody(req);
    required(body.providerId, "providerId");
    required(body.name, "name");
    validateRef(store, "providers", body.providerId, "providerId");
    store.models.push({
      id: id("model"),
      providerId: body.providerId,
      name: body.name,
      contextWindow: numberInRange(body.contextWindow, "contextWindow"),
      inputPricePer1K: numberInRange(body.inputPricePer1K, "inputPricePer1K"),
      outputPricePer1K: numberInRange(body.outputPricePer1K, "outputPricePer1K"),
      cacheDiscount: numberInRange(body.cacheDiscount, "cacheDiscount", { min: 0, max: 1, fallback: 1 }),
      toolCalling: Boolean(body.toolCalling),
      status: body.status || "available"
    });
    audit(store, "create", "model", store.models.at(-1).id, body.name);
    await writeStore(store);
    return json(res, 201, statePayload(store));
  }

  if (req.method === "POST" && url.pathname === "/api/calls") {
    const body = await parseBody(req);
    required(body.providerId, "providerId");
    required(body.modelId, "modelId");
    validateRef(store, "providers", body.providerId, "providerId");
    validateRef(store, "models", body.modelId, "modelId");
    validateModelBelongsToProvider(store, body.providerId, body.modelId);
    store.calls.push({
      id: id("call"),
      providerId: body.providerId,
      modelId: body.modelId,
      toolName: body.toolName || "none",
      inputTokens: numberInRange(body.inputTokens, "inputTokens"),
      outputTokens: numberInRange(body.outputTokens, "outputTokens"),
      cacheHit: Boolean(body.cacheHit),
      latencyMs: numberInRange(body.latencyMs, "latencyMs"),
      success: body.success === undefined ? true : Boolean(body.success),
      errorType: body.errorType || "",
      archived: false,
      createdAt: new Date().toISOString()
    });
    audit(store, "create", "call", store.calls.at(-1).id, body.toolName || "none");
    await writeStore(store);
    return json(res, 201, statePayload(store));
  }

  const patchMatch = url.pathname.match(/^\/api\/(providers|keys|models|calls)\/([^/]+)$/);
  if (req.method === "PATCH" && patchMatch) {
    const [, collection, resourceId] = patchMatch;
    const body = await parseBody(req);
    if (collection === "providers") {
      mergeById(store.providers, resourceId, body, ["name", "baseUrl", "status", "notes"]);
    } else if (collection === "keys") {
      mergeById(store.apiKeys, resourceId, body, ["label", "owner", "status", "secret"]);
    } else if (collection === "models") {
      const patch = { ...body };
      for (const field of ["contextWindow", "inputPricePer1K", "outputPricePer1K", "cacheDiscount"]) {
        if (patch[field] !== undefined) {
          const limits = field === "cacheDiscount" ? { min: 0, max: 1 } : {};
          patch[field] = numberInRange(patch[field], field, limits);
        }
      }
      if (patch.toolCalling !== undefined) patch.toolCalling = Boolean(patch.toolCalling);
      if (patch.providerId !== undefined) validateRef(store, "providers", patch.providerId, "providerId");
      mergeById(store.models, resourceId, patch, [
        "name",
        "providerId",
        "contextWindow",
        "inputPricePer1K",
        "outputPricePer1K",
        "cacheDiscount",
        "toolCalling",
        "status"
      ]);
    } else {
      const patch = { ...body };
      for (const field of ["inputTokens", "outputTokens", "latencyMs"]) {
        if (patch[field] !== undefined) patch[field] = numberInRange(patch[field], field);
      }
      if (patch.cacheHit !== undefined) patch.cacheHit = Boolean(patch.cacheHit);
      if (patch.success !== undefined) patch.success = Boolean(patch.success);
      const existing = store.calls.find((item) => item.id === resourceId);
      const providerId = patch.providerId || existing?.providerId;
      const modelId = patch.modelId || existing?.modelId;
      if (patch.providerId !== undefined) validateRef(store, "providers", patch.providerId, "providerId");
      if (patch.modelId !== undefined) validateRef(store, "models", patch.modelId, "modelId");
      validateModelBelongsToProvider(store, providerId, modelId);
      mergeById(store.calls, resourceId, patch, [
        "providerId",
        "modelId",
        "toolName",
        "inputTokens",
        "outputTokens",
        "cacheHit",
        "latencyMs",
        "success",
        "errorType",
        "archived"
      ]);
    }
    audit(store, "update", collection, resourceId);
    await writeStore(store);
    return json(res, 200, statePayload(store));
  }

  if (req.method === "DELETE" && patchMatch) {
    const [, collection, resourceId] = patchMatch;
    if (collection === "providers") {
      removeById(store.providers, resourceId);
      store.apiKeys = store.apiKeys.filter((item) => item.providerId !== resourceId);
      store.models = store.models.filter((item) => item.providerId !== resourceId);
      store.calls = store.calls.filter((item) => item.providerId !== resourceId);
    } else if (collection === "keys") {
      removeById(store.apiKeys, resourceId);
    } else if (collection === "models") {
      removeById(store.models, resourceId);
      store.calls = store.calls.filter((item) => item.modelId !== resourceId);
    } else {
      removeById(store.calls, resourceId);
    }
    audit(store, "delete", collection, resourceId);
    await writeStore(store);
    return json(res, 200, statePayload(store));
  }

  if (req.method === "POST" && url.pathname === "/api/calls/archive-expired") {
    const retentionDays = Number(store.settings?.retentionDays || 90);
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    let changed = 0;
    for (const call of store.calls) {
      if (!call.archived && new Date(call.createdAt).getTime() < cutoff) {
        call.archived = true;
        changed += 1;
      }
    }
    audit(store, "archive", "calls", "expired", `${changed} calls archived`);
    await writeStore(store);
    return json(res, 200, { archived: changed, ...statePayload(store) });
  }

  if (req.method === "PATCH" && url.pathname === "/api/settings") {
    const body = await parseBody(req);
    store.settings = {
      ...(store.settings || {}),
      currency: body.currency || store.settings?.currency || "USD",
      monthlyBudget: numberInRange(body.monthlyBudget, "monthlyBudget", { fallback: store.settings?.monthlyBudget ?? 0 }),
      warningThreshold: numberInRange(body.warningThreshold, "warningThreshold", { min: 0, max: 1, fallback: store.settings?.warningThreshold ?? 0.8 }),
      retentionDays: numberInRange(body.retentionDays, "retentionDays", { min: 1, fallback: store.settings?.retentionDays ?? 90 })
    };
    audit(store, "update", "settings", "global");
    await writeStore(store);
    return json(res, 200, statePayload(store));
  }

  if (req.method === "POST" && url.pathname === "/api/reset") {
    await writeStore(DEFAULT_STORE);
    const fresh = await readStore();
    return json(res, 200, statePayload(fresh));
  }

  return json(res, 404, { error: "Not found" });
}

async function serveStatic(req, res, url) {
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, { "content-type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    json(res, error.statusCode || 500, { error: error.message || "Internal server error" });
  }
});

server.listen(PORT, async () => {
  await ensureStore();
  console.log(`Model Key Ledger running at http://localhost:${PORT}`);
});
