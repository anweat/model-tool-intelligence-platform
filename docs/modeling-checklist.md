# CodeArts 软件建模清单

## 需要在 CodeArts 中完成的图

1. 用例图: API Key 与模型目录管理
   - 参考文件: `docs/diagrams/use-case-key-model.mmd`
   - 涉及 Feature: 供应商管理、API Key 管理、模型目录与价格管理
   - 参与者: 系统管理员、安全负责人

2. 用例图: 调用登记与成本查看
   - 参考文件: `docs/diagrams/use-case-usage-billing.mmd`
   - 涉及 Feature: 调用记录与缓存统计、统计报表与计费汇总、智能洞察与可行性评估
   - 参与者: 开发人员、项目负责人、财务统计人员

3. 活动图: 模型调用登记与计费
   - 参考文件: `docs/diagrams/activity-call-billing.mmd`
   - 来源 User Story: 登记模型调用记录、标记调用缓存命中、查看 Token 与费用总览、设置预算告警

4. 类图: 核心领域模型
   - 参考文件: `docs/diagrams/class-diagram.mmd`
   - 核心类: Provider、ApiKey、Model、ModelCall、BillingPolicy、SummaryService、StoreRepository

5. 顺序图: 新增调用记录
   - 参考文件: `docs/diagrams/sequence-create-call.mmd`
   - 来源用例: 登记模型调用

## 截图建议

- 需求管理截图: 展示 Epic -> Feature -> Story 的树形结构。
- 软件建模截图: 分别截取两个用例图、一个活动图、一个类图、一个顺序图。
- MVP 截图: 截取本地 `http://localhost:4173` 的总览、预算告警、供应商/Key/模型列表和调用记录区域。

## XMI 文件

- 路径: `docs/xmi/model-tool-intelligence.xmi`
- 生成脚本: `tools/generate_xmi.py`
- 内容: UML 2.5.1 XMI，包含“领域模型”和“用例模型”两个 Package。
- 注意: XMI 主要保存模型元素和关系，不保证在所有工具中自动恢复图形布局；如果 CodeArts 页面导入的是“模型工程 zip”，需要优先使用平台导出的工程 zip 格式。

## 当前 CodeArts 工作项数量

- Epic: 1
- Feature: 6
- User Story: 18
- 合计: 25
