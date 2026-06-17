# 模型工具调用智能分析平台

用于 CodeArts 课程作业的完整项目。系统统一管理模型供应商、API Key、模型目录和调用日志，并基于工具调用数据生成系统画像、工具价值分析、缓存收益、成本风险、预算告警和上线可行性评估。

核心创新点: 不只统计调用次数和费用，而是把模型工具调用日志转化为可决策的系统信息，包括主业务场景、主模型、工具价值等级、失败风险、缓存优化空间和扩容成本预测。

## 快速运行

```bash
npm start
```

打开:

```text
http://localhost:4173
```

## 测试

```bash
npm test
```

测试会启动临时服务并验证健康检查、状态摘要、智能洞察、可行性测算和报表导出。

## 目录

- `server.js`: Node.js 内置 HTTP 服务、REST API、统计计算和文件持久化。
- `public/`: 前端页面、样式和交互逻辑。
- `data/store.json`: 首次启动自动生成的演示数据。
- `docs/project-specification.md`: 完整项目说明、创新点、接口和验收标准。
- `docs/codearts-requirements.md`: 可录入 CodeArts Req 的 Epic/Feature/User Story。
- `docs/codearts-operation-log.md`: 已创建 CodeArts 工作项 ID 与自动化操作记录。
- `docs/modeling.md`: 用例图、活动图、类图、顺序图 Mermaid 草稿。
- `docs/modeling-checklist.md`: CodeArts 软件建模与截图清单。
- `docs/diagrams/`: 可单独导入或截图的 Mermaid 建模文件。
- `docs/xmi/model-tool-intelligence.xmi`: 标准 UML XMI 2.5.1 文件，可用于支持 XMI 的建模工具导入。
- `docs/xmi/codearts-export-compatible/`: 参考 CodeArts 导出样例生成的轻量 XMI 文件，按用例模型和类模型拆分。
- `docs/codearts-import/model_tool_intelligence_master.zip`: 参考 CodeArts 模型工程导出包生成的模型工程导入包。
- `docs/implementation-report.md`: 编码实现报告草稿。
- `tools/smoke-test.js`: 项目冒烟测试。
- `tools/generate_xmi.py`: 生成 UML XMI 文件。
- `tools/generate_codearts_export_xmi.py`: 生成 CodeArts 导出风格的 XMI 文件。
- `tools/generate_codearts_model_project.py`: 基于 CodeArts 导出的模型工程包模板生成可导入的模型工程 zip。

## 作业对应关系

- Feature >= 4: 已拆分 6 个 Feature。
- User Story >= 10: 已拆分 18 个 User Story，每条包含优先级、重要程度和验收标准。
- 软件建模: 已提供两个用例图、一个活动图、一个类图和一个顺序图。
- XMI/模型工程: 已生成标准 UML XMI、CodeArts 导出风格 XMI，以及 CodeArts 模型工程 zip。
- 代码实现: 已实现关键业务流程、本地文件持久化、智能统计、可行性测算和报表导出。

## 主要接口

- `GET /api/state`: 获取页面状态、统计摘要和智能洞察。
- `GET /api/insights`: 获取系统画像、可行性评分、工具调用洞察。
- `POST /api/feasibility`: 根据预计调用量和模型单价测算月费用。
- `GET /api/export`: 导出完整 JSON 报表。
- `POST /api/calls/archive-expired`: 按保留天数归档过期调用。

## 软件仓库建议上传内容

上传 `NewNode` 目录下源码和文档即可。建议排除:

- `.codeartsdoer/node_modules/`
- `server.out.log`
- `server.err.log`
- `tools/__pycache__/`
