from pathlib import Path
from hashlib import md5
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "xmi" / "codearts-export-compatible"


def xid(seed: str) -> str:
    return md5(seed.encode("utf-8")).hexdigest()


def element(kind: str, item_id: str, name: str) -> str:
    return (
        f'<packagedElement name="{escape(name)}" '
        f'xmlns:xmi="http://www.omg.org/spec/XMI/20131001" '
        f'xmi:id="{xid(item_id)}" xmi:type="uml:{kind}"/>'
    )


def package(package_id: str, name: str, children: list[str]) -> str:
    return (
        f'<packagedElement name="{escape(name)}" '
        f'xmlns:xmi="http://www.omg.org/spec/XMI/20131001" '
        f'xmi:id="{xid(package_id)}" xmi:type="uml:Package">'
        + "".join(children)
        + "</packagedElement>"
    )


def wrap(packages: list[str]) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<xmi:XMI xmlns:xmi="http://www.omg.org/spec/XMI/20131001" '
        'xmlns:uml="http://www.omg.org/spec/UML/20131001">'
        '<xmi:Documentation exporter="Modeling" exporterVersion="1.0"/>'
        '<uml:Model xmi:type="uml:Model" name="CM_Model">'
        + "".join(packages)
        + "</uml:Model></xmi:XMI>\n"
    )


def write(name: str, content: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(content, encoding="utf-8")
    print(path)


def main() -> None:
    key_model_children = [
        element("Actor", "actor-system-admin", "系统管理员"),
        element("Actor", "actor-security-admin", "安全负责人"),
        element("UseCase", "uc-manage-provider", "维护供应商"),
        element("UseCase", "uc-manage-api-key", "管理 API Key"),
        element("UseCase", "uc-mask-api-key", "脱敏展示 API Key"),
        element("UseCase", "uc-manage-model-catalog", "维护模型目录"),
        element("UseCase", "uc-maintain-price", "维护价格与缓存折扣"),
    ]
    usage_billing_children = [
        element("Actor", "actor-developer", "开发人员"),
        element("Actor", "actor-project-lead", "项目负责人"),
        element("Actor", "actor-finance-user", "财务统计人员"),
        element("Actor", "actor-ops-user", "系统运维人员"),
        element("UseCase", "uc-record-tool-call", "登记工具调用记录"),
        element("UseCase", "uc-mark-cache-hit", "标记缓存命中"),
        element("UseCase", "uc-view-dashboard", "查看统计仪表盘"),
        element("UseCase", "uc-generate-system-profile", "生成系统画像"),
        element("UseCase", "uc-evaluate-tool-value", "评估工具调用价值"),
        element("UseCase", "uc-estimate-feasibility", "测算扩容费用可行性"),
        element("UseCase", "uc-generate-governance-advice", "生成治理建议"),
        element("UseCase", "uc-export-report", "导出调用与计费报表"),
    ]
    class_children = [
        element("Class", "class-provider", "Provider"),
        element("Class", "class-api-key", "ApiKey"),
        element("Class", "class-model", "Model"),
        element("Class", "class-call-record", "CallRecord"),
        element("Class", "class-insight-engine", "InsightEngine"),
        element("Class", "class-feasibility-service", "FeasibilityService"),
        element("Class", "class-audit-log", "AuditLog"),
    ]

    write(
        "use-case-key-model-codearts-export.xmi",
        wrap([package("pkg-use-case-key-model", "API Key 与模型目录管理", key_model_children)]),
    )
    write(
        "use-case-usage-billing-codearts-export.xmi",
        wrap([package("pkg-use-case-usage-billing", "调用统计与智能分析", usage_billing_children)]),
    )
    write(
        "class-model-codearts-export.xmi",
        wrap([package("pkg-class-model", "核心领域模型", class_children)]),
    )
    write(
        "project-model-codearts-export.xmi",
        wrap(
            [
                package("pkg-use-case-key-model", "API Key 与模型目录管理", key_model_children),
                package("pkg-use-case-usage-billing", "调用统计与智能分析", usage_billing_children),
                package("pkg-class-model", "核心领域模型", class_children),
            ]
        ),
    )


if __name__ == "__main__":
    main()
