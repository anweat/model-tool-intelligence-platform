let state = null;
let summary = null;
let insights = null;

const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 6
});

const number = new Intl.NumberFormat("zh-CN");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "请求失败");
  if (payload.state) {
    state = payload.state;
    summary = payload.summary;
    insights = payload.insights;
    render();
  }
  return payload;
}

function formPayload(form) {
  const data = new FormData(form);
  const payload = {};
  for (const [key, value] of data.entries()) payload[key] = value;
  for (const checkbox of form.querySelectorAll('input[type="checkbox"]')) {
    payload[checkbox.name] = checkbox.checked;
  }
  return payload;
}

function providerName(id) {
  return state.providers.find((provider) => provider.id === id)?.name || "未知供应商";
}

function modelName(id) {
  return state.models.find((model) => model.id === id)?.name || "未知模型";
}

function fillSelects() {
  const providerOptions = state.providers
    .map((provider) => `<option value="${provider.id}">${escapeHtml(provider.name)}</option>`)
    .join("");
  document.querySelectorAll('select[name="providerId"]').forEach((select) => {
    const current = select.value;
    select.innerHTML = providerOptions;
    if (current) select.value = current;
  });

  const callProviderId = document.querySelector("#callForm select[name='providerId']").value || state.providers[0]?.id;
  const modelOptions = state.models
    .filter((model) => model.status !== "disabled")
    .filter((model) => !callProviderId || model.providerId === callProviderId)
    .map((model) => `<option value="${model.id}">${escapeHtml(model.name)}</option>`)
    .join("");
  document.querySelector("#callForm select[name='modelId']").innerHTML = modelOptions;

  const feasibilityModel = document.querySelector("#feasibilityForm select[name='modelId']");
  if (feasibilityModel) {
    const current = feasibilityModel.value;
    feasibilityModel.innerHTML = state.models
      .filter((model) => model.status !== "disabled")
      .map((model) => `<option value="${model.id}">${escapeHtml(providerName(model.providerId))} / ${escapeHtml(model.name)}</option>`)
      .join("");
    if (current) feasibilityModel.value = current;
  }

  const settings = state.settings || {};
  const settingsForm = document.querySelector("#settingsForm");
  settingsForm.monthlyBudget.value = settings.monthlyBudget ?? "";
  settingsForm.warningThreshold.value = settings.warningThreshold ?? "";
  settingsForm.retentionDays.value = settings.retentionDays ?? "";
}

function renderInsightHero() {
  const profile = insights?.systemProfile || {};
  const feasibility = insights?.feasibility || {};
  const recommendations = feasibility.recommendations || [];
  document.querySelector("#insightHero").innerHTML = `
    <div class="score-card ${feasibility.score >= 70 ? "good" : feasibility.score >= 55 ? "mid" : "bad"}">
      <span>可行性评分</span>
      <strong>${number.format(feasibility.score || 0)}</strong>
      <em>${escapeHtml(feasibility.level || "暂无数据")}</em>
    </div>
    <div class="insight-copy">
      <h2>系统画像：${escapeHtml(profile.mainScenario || "暂无调用")}</h2>
      <p>已识别 ${number.format(profile.toolCount || 0)} 类工具、${number.format(profile.providerCount || 0)} 个供应商、${number.format(profile.modelCount || 0)} 个模型；主供应商为 ${escapeHtml(profile.dominantProvider || "暂无")}，主模型为 ${escapeHtml(profile.dominantModel || "暂无")}。</p>
      <div class="recommendations">
        ${recommendations.slice(0, 3).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderMetrics() {
  const metrics = [
    ["调用次数", number.format(summary.calls)],
    ["缓存命中率", `${Math.round(summary.cacheHitRate * 100)}%`],
    ["调用成功率", `${Math.round((summary.successRate || 0) * 100)}%`],
    ["输入 Tokens", number.format(summary.inputTokens)],
    ["输出 Tokens", number.format(summary.outputTokens)],
    ["估算费用", money.format(summary.totalCost)],
    ["缓存节省", money.format(summary.cacheSavings)],
    ["归档调用", number.format(summary.archivedCalls || 0)]
  ];
  document.querySelector("#dashboard").innerHTML = metrics
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderBudget() {
  const settings = state.settings || {};
  const budget = Number(settings.monthlyBudget || 0);
  const used = Math.min(summary.budgetUsageRate || 0, 1);
  const statusText = summary.budgetStatus === "over" ? "已超预算" : summary.budgetStatus === "warning" ? "接近预算" : "正常";
  document.querySelector("#budgetPanel").innerHTML = `
    <div class="budget-line">
      <span>预算 ${money.format(budget)} · 已用 ${Math.round((summary.budgetUsageRate || 0) * 100)}% · ${statusText}</span>
      <span>${money.format(summary.totalCost)}</span>
    </div>
    <div class="progress"><span class="${summary.budgetStatus}" style="width:${Math.round(used * 100)}%"></span></div>
    <p class="meta">日志保留 ${number.format(settings.retentionDays || 0)} 天，告警阈值 ${Math.round((settings.warningThreshold || 0) * 100)}%。</p>
  `;
}

function renderReports() {
  const section = (title, items, formatter) => `
    <div class="report-block">
      <strong>${title}</strong>
      ${(items || [])
        .slice(0, 5)
        .map((item) => `<div class="report-row"><span>${escapeHtml(item.name)}</span><span>${formatter(item)}</span></div>`)
        .join("") || '<p class="meta">暂无数据</p>'}
    </div>
  `;
  document.querySelector("#reportLists").innerHTML =
    section("工具调用 Top", summary.toolUsageList, (item) => `${item.count} 次`) +
    section("供应商费用", summary.providerUsageList, (item) => money.format(item.cost)) +
    section("模型费用", summary.modelUsageList, (item) => money.format(item.cost)) +
    section("失败类型", summary.errorTypeList, (item) => `${item.count} 次`);
}

function renderToolInsights() {
  const rows = insights?.toolInsights || [];
  document.querySelector("#toolInsightList").innerHTML =
    rows
      .slice(0, 8)
      .map(
        (tool) => `
          <article class="tool-row">
            <div>
              <strong>${escapeHtml(tool.name)}</strong>
              <span>${number.format(tool.calls)} 次调用 · ${escapeHtml(tool.valueLevel)}</span>
            </div>
            <div>
              <span>成功率 ${Math.round(tool.successRate * 100)}%</span>
              <span>缓存 ${Math.round(tool.cacheHitRate * 100)}%</span>
              <span>${number.format(tool.avgLatencyMs)} ms</span>
              <span>${money.format(tool.cost)}</span>
            </div>
          </article>
        `
      )
      .join("") || '<p class="meta">暂无工具调用数据</p>';
}

function renderProviders() {
  document.querySelector("#providerList").innerHTML = state.providers
    .map(
      (provider) => `
        <article class="item">
          <div class="item-main">
            <strong>${escapeHtml(provider.name)}</strong>
            <div class="meta">${escapeHtml(provider.baseUrl || "未配置 Base URL")}</div>
            <div class="pill-row">
              <span class="pill">${escapeHtml(provider.status)}</span>
              <span class="pill warn">${state.models.filter((model) => model.providerId === provider.id).length} 个模型</span>
            </div>
            <div class="meta">${escapeHtml(provider.notes || "无备注")}</div>
          </div>
          <div class="item-actions">
            <button class="ghost small" data-action="toggle-provider" data-id="${provider.id}">${provider.status === "active" ? "停用" : "启用"}</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderKeys() {
  document.querySelector("#keyList").innerHTML = state.apiKeys
    .map(
      (key) => `
        <article class="item">
          <div class="item-main">
            <strong>${escapeHtml(key.label)}</strong>
            <div class="meta">${escapeHtml(providerName(key.providerId))} · ${escapeHtml(key.owner || "未设置负责人")} · ${escapeHtml(key.maskedSecret)}</div>
            <div class="pill-row"><span class="pill">${escapeHtml(key.status)}</span></div>
          </div>
          <div class="item-actions">
            <button class="ghost small" data-action="toggle-key" data-id="${key.id}">${key.status === "enabled" ? "禁用" : "启用"}</button>
            <button class="danger small" data-action="delete-key" data-id="${key.id}">删除</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderModels() {
  document.querySelector("#modelList").innerHTML = state.models
    .map(
      (model) => `
        <article class="item">
          <div class="item-main">
            <strong>${escapeHtml(model.name)}</strong>
            <div class="meta">${escapeHtml(providerName(model.providerId))} · 上下文 ${number.format(model.contextWindow || 0)}</div>
            <div class="pill-row">
              <span class="pill">输入 ${money.format(model.inputPricePer1K)}/1K</span>
              <span class="pill">输出 ${money.format(model.outputPricePer1K)}/1K</span>
              <span class="pill warn">缓存折扣 ${model.cacheDiscount}</span>
              <span class="pill">${model.toolCalling ? "支持工具" : "无工具"}</span>
              <span class="pill">${escapeHtml(model.status || "available")}</span>
            </div>
          </div>
          <div class="item-actions">
            <button class="ghost small" data-action="toggle-model" data-id="${model.id}">${model.status === "disabled" ? "启用" : "停用"}</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderCalls() {
  document.querySelector("#callList").innerHTML = summary.recentCalls
    .map(
      (call) => `
        <article class="item">
          <div class="item-main">
            <strong>${escapeHtml(call.toolName || "none")}</strong>
            <div class="meta">${escapeHtml(call.providerName)} · ${escapeHtml(call.modelName)} · 输入 ${number.format(call.inputTokens)} / 输出 ${number.format(call.outputTokens)} · ${number.format(call.latencyMs || 0)} ms</div>
            <div class="pill-row">
              <span class="pill">${money.format(call.cost)}</span>
              <span class="pill">${call.cacheHit ? "缓存命中" : "未命中"}</span>
              <span class="pill ${call.success === false ? "warn" : ""}">${call.success === false ? "失败" : "成功"}</span>
              ${call.success === false ? `<span class="pill warn">${escapeHtml(call.errorType || "unknown")}</span>` : ""}
            </div>
          </div>
          <div class="item-actions">
            <button class="ghost small" data-action="archive-call" data-id="${call.id}">归档</button>
            <button class="danger small" data-action="delete-call" data-id="${call.id}">删除</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderAuditLogs() {
  const logs = (state.auditLogs || []).slice(0, 10);
  document.querySelector("#auditList").innerHTML =
    logs
      .map(
        (log) => `
          <article class="item">
            <div class="item-main">
              <strong>${escapeHtml(log.action)} · ${escapeHtml(log.targetType)}</strong>
              <div class="meta">${escapeHtml(log.targetId)} · ${new Date(log.createdAt).toLocaleString("zh-CN")}</div>
              <div class="meta">${escapeHtml(log.detail || "无详情")}</div>
            </div>
          </article>
        `
      )
      .join("") || '<p class="meta">暂无审计记录</p>';
}

function render() {
  fillSelects();
  renderInsightHero();
  renderMetrics();
  renderBudget();
  renderReports();
  renderToolInsights();
  renderProviders();
  renderKeys();
  renderModels();
  renderCalls();
  renderAuditLogs();
}

function bindForm(id, endpoint) {
  const form = document.querySelector(id);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await api(endpoint, { method: "POST", body: formPayload(form) });
    form.reset();
  });
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === "toggle-provider") {
    const provider = state.providers.find((item) => item.id === id);
    await api(`/api/providers/${id}`, { method: "PATCH", body: { status: provider.status === "active" ? "inactive" : "active" } });
  }
  if (action === "toggle-key") {
    const key = state.apiKeys.find((item) => item.id === id);
    await api(`/api/keys/${id}`, { method: "PATCH", body: { status: key.status === "enabled" ? "disabled" : "enabled" } });
  }
  if (action === "toggle-model") {
    const model = state.models.find((item) => item.id === id);
    await api(`/api/models/${id}`, { method: "PATCH", body: { status: model.status === "disabled" ? "available" : "disabled" } });
  }
  if (action === "delete-key") {
    await api(`/api/keys/${id}`, { method: "DELETE" });
  }
  if (action === "delete-call") {
    await api(`/api/calls/${id}`, { method: "DELETE" });
  }
  if (action === "archive-call") {
    await api(`/api/calls/${id}`, { method: "PATCH", body: { archived: true } });
  }
});

document.querySelector("#callForm select[name='providerId']").addEventListener("change", fillSelects);
document.querySelector("#resetBtn").addEventListener("click", () => api("/api/reset", { method: "POST" }));
document.querySelector("#archiveBtn").addEventListener("click", () => api("/api/calls/archive-expired", { method: "POST" }));
document.querySelector("#settingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/settings", { method: "PATCH", body: formPayload(event.currentTarget) });
});
document.querySelector("#feasibilityForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = await api("/api/feasibility", { method: "POST", body: formPayload(event.currentTarget) });
  document.querySelector("#feasibilityResult").innerHTML = `
    <strong>${escapeHtml(payload.modelName)} 月度测算</strong>
    <div class="report-row"><span>预计调用</span><span>${number.format(payload.monthlyCalls)} 次</span></div>
    <div class="report-row"><span>预计费用</span><span>${money.format(payload.estimatedCost)}</span></div>
    <div class="report-row"><span>预算占用</span><span>${Math.round((payload.budgetUsageRate || 0) * 100)}%</span></div>
    <p class="meta">${escapeHtml(payload.advice)}</p>
  `;
});
document.querySelector("#exportBtn").addEventListener("click", async () => {
  const payload = await api("/api/export");
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `model-ledger-report-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

bindForm("#providerForm", "/api/providers");
bindForm("#keyForm", "/api/keys");
bindForm("#modelForm", "/api/models");
bindForm("#callForm", "/api/calls");

api("/api/state").catch((error) => {
  document.body.innerHTML = `<main><h1>启动失败</h1><p>${escapeHtml(error.message)}</p></main>`;
});
