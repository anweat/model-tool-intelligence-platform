from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "xmi"
OUT_FILE = OUT_DIR / "model-tool-intelligence.xmi"


def attr(name: str, value: str) -> str:
    return f'{name}="{escape(value)}"'


def owned_class(class_id: str, name: str, attributes: list[str], operations: list[str]) -> str:
    attrs = "\n".join(
        f'      <ownedAttribute xmi:type="uml:Property" xmi:id="{class_id}-attr-{i}" name="{escape(item)}"/>'
        for i, item in enumerate(attributes, 1)
    )
    ops = "\n".join(
        f'      <ownedOperation xmi:type="uml:Operation" xmi:id="{class_id}-op-{i}" name="{escape(item)}"/>'
        for i, item in enumerate(operations, 1)
    )
    return f'''    <packagedElement xmi:type="uml:Class" xmi:id="{class_id}" name="{escape(name)}">
{attrs}
{ops}
    </packagedElement>'''


def use_case(case_id: str, name: str) -> str:
    return f'    <packagedElement xmi:type="uml:UseCase" xmi:id="{case_id}" name="{escape(name)}"/>'


def actor(actor_id: str, name: str) -> str:
    return f'    <packagedElement xmi:type="uml:Actor" xmi:id="{actor_id}" name="{escape(name)}"/>'


def dependency(dep_id: str, name: str, client: str, supplier: str) -> str:
    return (
        f'    <packagedElement xmi:type="uml:Dependency" xmi:id="{dep_id}" '
        f'{attr("name", name)} client="{client}" supplier="{supplier}"/>'
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    classes = [
        owned_class(
            "class-provider",
            "Provider",
            ["id", "name", "baseUrl", "status", "notes"],
            ["enable()", "disable()"],
        ),
        owned_class(
            "class-api-key",
            "ApiKey",
            ["id", "providerId", "label", "maskedSecret", "owner", "status"],
            ["maskSecret()", "enable()", "disable()"],
        ),
        owned_class(
            "class-model",
            "Model",
            ["id", "providerId", "name", "contextWindow", "inputPricePer1K", "outputPricePer1K", "cacheDiscount", "toolCalling", "status"],
            ["estimateInputCost()", "estimateOutputCost()"],
        ),
        owned_class(
            "class-call-record",
            "CallRecord",
            ["id", "providerId", "modelId", "toolName", "inputTokens", "outputTokens", "cacheHit", "latencyMs", "success", "errorType", "archived"],
            ["calculateCost()", "calculateCacheSavings()"],
        ),
        owned_class(
            "class-insight-engine",
            "InsightEngine",
            ["successRate", "cacheHitRate", "budgetUsageRate", "providerConcentration"],
            ["computeSystemProfile()", "computeToolInsights()", "computeFeasibilityScore()", "generateRecommendations()"],
        ),
        owned_class(
            "class-feasibility-service",
            "FeasibilityService",
            ["monthlyCalls", "inputTokens", "outputTokens", "targetCacheHitRate"],
            ["estimateMonthlyCost()", "evaluateBudget()"],
        ),
        owned_class(
            "class-audit-log",
            "AuditLog",
            ["id", "action", "targetType", "targetId", "detail", "createdAt"],
            ["record()"],
        ),
    ]

    use_cases = [
        use_case("uc-manage-provider", "维护供应商"),
        use_case("uc-manage-key", "管理 API Key"),
        use_case("uc-manage-model", "维护模型目录与价格"),
        use_case("uc-record-call", "登记工具调用记录"),
        use_case("uc-view-dashboard", "查看统计仪表盘"),
        use_case("uc-generate-profile", "生成系统画像"),
        use_case("uc-evaluate-tool", "评估工具调用价值"),
        use_case("uc-run-feasibility", "测算扩容费用可行性"),
        use_case("uc-export-report", "导出审计报表"),
    ]

    actors = [
        actor("actor-admin", "系统管理员"),
        actor("actor-developer", "开发人员"),
        actor("actor-lead", "项目负责人"),
        actor("actor-finance", "财务统计人员"),
        actor("actor-security", "安全负责人"),
    ]

    dependencies = [
        dependency("dep-key-provider", "Key belongs to Provider", "class-api-key", "class-provider"),
        dependency("dep-model-provider", "Model belongs to Provider", "class-model", "class-provider"),
        dependency("dep-call-model", "CallRecord uses Model", "class-call-record", "class-model"),
        dependency("dep-insight-call", "InsightEngine analyzes CallRecord", "class-insight-engine", "class-call-record"),
        dependency("dep-feasibility-model", "FeasibilityService estimates Model", "class-feasibility-service", "class-model"),
        dependency("dep-audit-call", "AuditLog records operations", "class-audit-log", "class-call-record"),
    ]

    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmlns:xmi="http://www.omg.org/spec/XMI/20131001"
         xmlns:uml="http://www.omg.org/spec/UML/20131001"
         xmi:version="2.5.1">
  <uml:Model xmi:id="model-tool-intelligence" name="模型工具调用智能分析平台">
    <packagedElement xmi:type="uml:Package" xmi:id="pkg-domain" name="领域模型">
{chr(10).join(classes)}
{chr(10).join(dependencies)}
    </packagedElement>
    <packagedElement xmi:type="uml:Package" xmi:id="pkg-use-cases" name="用例模型">
{chr(10).join(actors)}
{chr(10).join(use_cases)}
    </packagedElement>
  </uml:Model>
</xmi:XMI>
'''
    OUT_FILE.write_text(xml, encoding="utf-8")
    print(f"generated {OUT_FILE}")


if __name__ == "__main__":
    main()
