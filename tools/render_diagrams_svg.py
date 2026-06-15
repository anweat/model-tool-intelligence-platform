from pathlib import Path


OUT = Path(__file__).resolve().parents[1] / "docs" / "diagrams" / "rendered"
OUT.mkdir(parents=True, exist_ok=True)


CSS = """
<style>
  .bg{fill:#f8fafc}.panel{fill:#ffffff;stroke:#cbd5e1;stroke-width:1.2}
  .title{font:700 22px Arial,'Microsoft YaHei',sans-serif;fill:#0f172a}
  .label{font:600 13px Arial,'Microsoft YaHei',sans-serif;fill:#0f172a}
  .small{font:12px Arial,'Microsoft YaHei',sans-serif;fill:#475569}
  .muted{font:11px Arial,'Microsoft YaHei',sans-serif;fill:#64748b}
  .actor{stroke:#0f172a;stroke-width:1.6;fill:none}
  .usecase{fill:#eff6ff;stroke:#2563eb;stroke-width:1.4}
  .flow{fill:#ecfdf5;stroke:#059669;stroke-width:1.4}
  .warn{fill:#fff7ed;stroke:#ea580c;stroke-width:1.4}
  .classHead{fill:#e0f2fe;stroke:#0284c7;stroke-width:1.3}
  .classBody{fill:#ffffff;stroke:#0284c7;stroke-width:1.3}
  .line{stroke:#334155;stroke-width:1.3;fill:none;marker-end:url(#arrow)}
  .dash{stroke:#64748b;stroke-width:1.2;fill:none;stroke-dasharray:5 4;marker-end:url(#arrow)}
</style>
"""


def svg(name, width, height, body):
    (OUT / name).write_text(
        f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
<defs><marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8 Z" fill="#334155"/></marker></defs>
{CSS}
<rect class="bg" width="{width}" height="{height}"/>
{body}
</svg>
""",
        encoding="utf-8",
    )


def t(x, y, text, cls="label", anchor="middle"):
    return f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{text}</text>'


def rect(x, y, w, h, text, cls="panel"):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" class="{cls}"/>{t(x+w/2,y+h/2+5,text)}'


def actor(x, y, name):
    return f"""
<circle cx="{x}" cy="{y}" r="12" class="actor"/>
<path d="M{x},{y+12} V{y+54} M{x-24},{y+28} H{x+24} M{x},{y+54} L{x-22},{y+88} M{x},{y+54} L{x+22},{y+88}" class="actor"/>
{t(x, y+112, name)}
"""


def line(x1, y1, x2, y2, cls="line"):
    return f'<path d="M{x1},{y1} L{x2},{y2}" class="{cls}"/>'


svg(
    "use-case-key-model.svg",
    980,
    560,
    f"""
{t(490,45,"用例图：供应商、API Key 与模型目录", "title")}
<rect x="210" y="82" width="610" height="400" rx="14" class="panel"/>
{t(515,112,"统一模型管理平台")}
{actor(95,190,"管理员")}
{actor(900,210,"模型供应商")}
{rect(300,150,180,56,"维护供应商","usecase")}
{rect(550,150,180,56,"登记 API Key","usecase")}
{rect(300,250,180,56,"脱敏展示 Key","usecase")}
{rect(550,250,180,56,"维护模型能力","usecase")}
{rect(425,350,180,56,"维护价格与折扣","usecase")}
{line(145,205,300,178)}{line(145,245,300,278)}{line(145,285,425,378)}
{line(820,210,730,178)}{line(820,235,730,278)}{line(820,260,605,378)}
""",
)

svg(
    "use-case-usage-billing.svg",
    980,
    560,
    f"""
{t(490,45,"用例图：调用统计、缓存命中与计费", "title")}
<rect x="210" y="82" width="610" height="400" rx="14" class="panel"/>
{t(515,112,"统一模型管理平台")}
{actor(95,205,"业务系统")}
{actor(900,205,"财务/运营")}
{rect(280,145,190,56,"登记调用记录","usecase")}
{rect(560,145,190,56,"计算 Token 用量","usecase")}
{rect(280,255,190,56,"判断缓存命中","usecase")}
{rect(560,255,190,56,"汇总模型费用","usecase")}
{rect(420,365,190,56,"导出计费报表","usecase")}
{line(145,220,280,173)}{line(145,250,280,283)}{line(470,173,560,173)}
{line(470,283,560,283)}{line(750,283,850,220)}{line(610,393,850,250)}
""",
)

classes = [
    (60, 100, 210, 120, "Provider", ["id, name, baseUrl", "status, owner"]),
    (340, 100, 210, 120, "ApiKey", ["id, providerId", "label, maskedKey, status"]),
    (620, 100, 260, 145, "Model", ["id, providerId, name", "contextWindow, tools", "inputPrice, outputPrice"]),
    (200, 330, 260, 145, "CallRecord", ["id, modelId, apiKeyId", "inputTokens, outputTokens", "cacheHit, latencyMs"]),
    (560, 345, 240, 110, "BillingService", ["calculateCost()", "summarizeUsage()"]),
]
body = [t(490, 45, "类图：模型密钥与调用账本核心对象", "title")]
for x, y, w, h, name, fields in classes:
    body.append(f'<rect x="{x}" y="{y}" width="{w}" height="36" rx="8" class="classHead"/>')
    body.append(t(x + w / 2, y + 23, name))
    body.append(f'<rect x="{x}" y="{y+36}" width="{w}" height="{h-36}" rx="0" class="classBody"/>')
    for i, field in enumerate(fields):
        body.append(t(x + 14, y + 62 + i * 24, field, "small", "start"))
body.extend([line(270, 160, 340, 160), line(550, 160, 620, 160), line(750, 245, 460, 350), line(460, 400, 560, 400)])
svg("class-diagram.svg", 980, 560, "\n".join(body))

steps = [
    (70, 130, "接收调用记录"),
    (260, 130, "读取模型价格"),
    (450, 130, "统计输入/输出 Token"),
    (640, 130, "判断缓存命中"),
    (640, 300, "应用折扣并计费"),
    (450, 300, "聚合工具调用"),
    (260, 300, "更新仪表盘"),
    (70, 300, "导出报表"),
]
body = [t(490, 45, "活动图：调用记录与计费统计流程", "title")]
for x, y, label in steps:
    body.append(rect(x, y, 150, 58, label, "flow" if y == 130 else "warn"))
for (x1, y1), (x2, y2) in zip([(220,159),(410,159),(600,159),(715,188),(640,329),(450,329),(260,329)], [(260,159),(450,159),(640,159),(715,300),(600,329),(410,329),(220,329)]):
    body.append(line(x1, y1, x2, y2))
svg("activity-call-billing.svg", 900, 470, "\n".join(body))

body = [t(490, 45, "时序图：登记调用并更新统计", "title")]
actors = [("前端",120),("API 服务",320),("账本存储",520),("统计服务",720),("仪表盘",880)]
for name, x in actors:
    body.append(t(x, 90, name))
    body.append(f'<path d="M{x},105 V470" class="dash" marker-end="none"/>')
msgs = [(120,150,320,"提交调用记录"),(320,200,520,"保存 CallRecord"),(520,245,320,"返回记录 ID"),(320,290,720,"重新计算汇总"),(720,335,320,"返回指标"),(320,385,880,"刷新状态"),(880,430,120,"展示费用/缓存命中")]
for x1, y, x2, label in msgs:
    body.append(line(x1, y, x2, y))
    body.append(t((x1+x2)/2, y-8, label, "small"))
svg("sequence-create-call.svg", 980, 520, "\n".join(body))

print(f"rendered {len(list(OUT.glob('*.svg')))} svg files to {OUT}")
