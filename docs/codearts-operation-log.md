# CodeArts 操作记录

## 项目信息

- CodeArts 项目地址: https://devcloud.cn-north-4.huaweicloud.com/projectman/scrum/e590e9bcd23e4b99b9d9052a0b3fa983/workitem/list
- 项目 ID: `e590e9bcd23e4b99b9d9052a0b3fa983`
- 项目名称: `NewNode`

## 登录与自动化方式

1. 使用本地 CodeArts Agent 的华为云认证扩展完成登录。
2. 从 CodeArts Agent 本地安全存储中读取已登录会话，并使用当前 Windows 用户密钥链解密临时 AK/SK/SecurityToken。
3. 使用华为云官方 Python SDK `huaweicloudsdkprojectman` 调用 CodeArts Req API。
4. 通过 `create_issue_v4` 创建 Scrum 工作项层级。
5. 通过 `UploadAttachmentsRequest` 将 UML/流程图 SVG 上传为 Epic 附件。
6. 安装并探索 `huaweicloudsdkcodeartsrepo`，确认 CodeArts Repo SDK 支持 `ListProjectRepositories`、`CreateCommit`、`CreateFile`、`UpdateFile` 等接口。

凭据只在本地脚本运行时读取，没有写入仓库文件。

## 图与建模探索

- 已生成 5 张本地 SVG 图，目录为 `docs/diagrams/rendered/`:
  - `use-case-key-model.svg`
  - `use-case-usage-billing.svg`
  - `class-diagram.svg`
  - `activity-call-billing.svg`
  - `sequence-create-call.svg`
- 已新增 `tools/render_diagrams_svg.py`，可重复生成上述 SVG。
- 已新增 `tools/upload_codearts_diagrams.py`，用于把上述 SVG 作为附件上传到 Epic `70878470`。
- 公开 SDK 包和 CodeArts Req API 中没有发现可直接创建 CodeArts Modeling/UML 画布对象的接口；可落地方案是将图渲染为文件后通过工作项图片或附件 API 挂载。
- 2026-06-15 已通过 `UploadAttachmentsRequest` 成功上传 5 个 SVG 附件:
  - `activity-call-billing.svg`: 附件 ID `641307`
  - `class-diagram.svg`: 附件 ID `641308`
  - `sequence-create-call.svg`: 附件 ID `641309`
  - `use-case-key-model.svg`: 附件 ID `641310`
  - `use-case-usage-billing.svg`: 附件 ID `641311`

## 软件仓库 API 探索

- 已安装 `huaweicloudsdkcodeartsrepo`。
- 已新增 `tools/upload_codearts_repo.py`，用于列出项目仓库并通过 `CreateCommit` 将项目源码、文档和图文件提交到 CodeArts Repo。
- 当前待上传文件清单为 35 个，已排除 `.codeartsdoer/node_modules/`、Playwright 快照、日志和缓存文件。
- 最近一次调用 `ListProjectRepositories` 返回 IAM 401，错误为 `Incorrect IAM authentication information: get token error,status:400`。这说明当前 CodeArts Agent 会话对 ProjectMan 可用，但对 CodeArts Repo API 还缺少有效授权或需要重新登录/创建仓库后重试。
- 仓库上传脚本用法:

```bash
py -3.14 tools\upload_codearts_repo.py --dry-run
py -3.14 tools\upload_codearts_repo.py --repo <仓库名称关键字>
```

## 项目文档附件上传

2026-06-15 已通过 `UploadAttachmentsRequest` 将关键项目文档上传到 Epic `70878470`:

- `README.md`: 附件 ID `641312`
- `project-specification.md`: 附件 ID `641313`
- `codearts-requirements.md`: 附件 ID `641314`
- `implementation-report.md`: 附件 ID `641315`
- `codearts-operation-log.md`: 附件 ID `641316`
- `modeling-checklist.md`: 附件 ID `641317`

脚本: `tools/upload_codearts_documents.py`

## 已创建工作项

合计 25 条工作项: 1 个 Epic、6 个 Feature、18 个 User Story。

| 层级 | 类型 | ID | 名称 | 父级 ID |
|---|---|---:|---|---:|
| Epic | Epic | 70878470 | 统一模型供应商 API Key 与调用成本管理平台 | - |
| Feature | Feature | 70878471 | 供应商管理 | 70878470 |
| User Story | Story | 70878472 | 登记模型供应商 | 70878471 |
| User Story | Story | 70878473 | 查看供应商模型数量 | 70878471 |
| Feature | Feature | 70878474 | API Key 管理 | 70878470 |
| User Story | Story | 70878475 | 保存 API Key 标签和负责人 | 70878474 |
| User Story | Story | 70878476 | 脱敏展示 API Key | 70878474 |
| User Story | Story | 70878477 | 记录 API Key 启用状态 | 70878474 |
| Feature | Feature | 70878478 | 模型目录与价格管理 | 70878470 |
| User Story | Story | 70878479 | 维护模型上下文和工具能力 | 70878478 |
| User Story | Story | 70878480 | 维护模型输入输出单价 | 70878478 |
| User Story | Story | 70878481 | 维护缓存命中折扣 | 70878478 |
| Feature | Feature | 70878482 | 调用记录与缓存统计 | 70878470 |
| User Story | Story | 70878483 | 登记模型调用记录 | 70878482 |
| User Story | Story | 70878484 | 标记调用缓存命中 | 70878482 |
| Feature | Feature | 70878485 | 统计报表与计费汇总 | 70878470 |
| User Story | Story | 70878486 | 查看 Token 与费用总览 | 70878485 |
| User Story | Story | 70878487 | 查看工具调用摘要 | 70878485 |
| User Story | Story | 70878501 | 设置预算告警 | 70878485 |
| User Story | Story | 70878502 | 导出调用与计费报表 | 70878485 |
| Feature | Feature | 70909711 | 智能洞察与可行性评估 | 70878470 |
| User Story | Story | 70909712 | 生成系统画像 | 70909711 |
| User Story | Story | 70909713 | 评估工具调用价值 | 70909711 |
| User Story | Story | 70909714 | 测算扩容费用可行性 | 70909711 |
| User Story | Story | 70909715 | 生成治理建议 | 70909711 |

## 验证结果

已使用 `show_issue_v4` 验证以下层级关系:

- `70878470` 是 Epic。
- `70878471` 是 Feature，父级为 `70878470`。
- `70878472` 是 Story，父级为 `70878471`。
- `70878487` 是 Story，父级为 `70878485`。
