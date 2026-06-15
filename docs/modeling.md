# 软件建模

本目录下 `docs/diagrams/` 已拆分出可独立导入或截图的 Mermaid 建模文件:

- `use-case-key-model.mmd`: API Key 与模型目录管理用例图
- `use-case-usage-billing.mmd`: 调用登记与成本查看用例图
- `class-diagram.mmd`: 核心类图
- `activity-call-billing.mmd`: 调用登记与计费活动图
- `sequence-create-call.mmd`: 新增调用记录顺序图

## 用例图: API Key 与模型目录管理

```mermaid
flowchart LR
  Admin["系统管理员"] --> UC1["登记供应商"]
  Admin --> UC2["保存 API Key"]
  Admin --> UC3["维护模型目录"]
  Security["安全负责人"] --> UC4["查看脱敏 Key"]
  UC1 --> System["模型密钥账本系统"]
  UC2 --> System
  UC3 --> System
  UC4 --> System
```

## 用例图: 调用登记与成本查看

```mermaid
flowchart LR
  Developer["开发人员"] --> UC5["登记模型调用"]
  Developer --> UC6["标记缓存命中"]
  Manager["项目负责人"] --> UC7["查看 Token 统计"]
  Manager --> UC8["查看估算费用"]
  UC5 --> System["模型密钥账本系统"]
  UC6 --> System
  UC7 --> System
  UC8 --> System
```

## 活动图: 模型调用登记与计费

```mermaid
flowchart TD
  A["选择供应商"] --> B["选择模型"]
  B --> C["填写工具名称与 Token"]
  C --> D{"是否缓存命中"}
  D -->|"是"| E["按缓存折扣计算输入 Token 费用"]
  D -->|"否"| F["按完整输入 Token 计算费用"]
  E --> G["计算输出 Token 费用"]
  F --> G
  G --> H["保存调用记录"]
  H --> I["刷新命中率、Token 与费用总览"]
```

## 类图

```mermaid
classDiagram
  class Provider {
    +string id
    +string name
    +string baseUrl
    +string status
    +string notes
  }
  class ApiKey {
    +string id
    +string providerId
    +string label
    -string secret
    +string owner
    +string status
    +maskSecret() string
  }
  class Model {
    +string id
    +string providerId
    +string name
    +number contextWindow
    +number inputPricePer1K
    +number outputPricePer1K
    +number cacheDiscount
    +boolean toolCalling
  }
  class ModelCall {
    +string id
    +string providerId
    +string modelId
    +string toolName
    +number inputTokens
    +number outputTokens
    +boolean cacheHit
    +number latencyMs
    +calculateCost() number
  }
  class SummaryService {
    +computeSummary() object
    +enrichCall() object
  }
  Provider "1" --> "*" ApiKey
  Provider "1" --> "*" Model
  Provider "1" --> "*" ModelCall
  Model "1" --> "*" ModelCall
  SummaryService --> ModelCall
```

## 顺序图: 新增调用记录

```mermaid
sequenceDiagram
  actor User as 开发人员
  participant UI as 前端页面
  participant API as Node HTTP API
  participant Store as JSON 持久化文件
  participant Summary as 统计服务
  User->>UI: 填写调用信息并提交
  UI->>API: POST /api/calls
  API->>Store: 读取 store.json
  API->>API: 校验 providerId 和 modelId
  API->>Store: 写入调用记录
  API->>Summary: computeSummary()
  Summary-->>API: 返回命中率、Token、费用与最近调用
  API-->>UI: 返回 state 和 summary
  UI-->>User: 刷新总览与调用列表
```
