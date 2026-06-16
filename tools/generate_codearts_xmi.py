from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "xmi"


def write(name: str, body: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / name
    path.write_text(body, encoding="utf-8")
    print(f"generated {path}")


def cls(class_id: str, name: str, attrs: list[str], ops: list[str]) -> str:
    attributes = "\n".join(
        f'      <ownedAttribute xmi:id="{class_id}_attr_{i}" name="{escape(attr)}" visibility="private"/>'
        for i, attr in enumerate(attrs, 1)
    )
    operations = "\n".join(
        f'      <ownedOperation xmi:id="{class_id}_op_{i}" name="{escape(op)}" visibility="public"/>'
        for i, op in enumerate(ops, 1)
    )
    return f'''    <packagedElement xmi:type="uml:Class" xmi:id="{class_id}" name="{escape(name)}">
{attributes}
{operations}
    </packagedElement>'''


def association(assoc_id: str, name: str, end1: str, end2: str) -> str:
    return f'''    <packagedElement xmi:type="uml:Association" xmi:id="{assoc_id}" name="{escape(name)}">
      <memberEnd xmi:idref="{assoc_id}_end1"/>
      <memberEnd xmi:idref="{assoc_id}_end2"/>
      <ownedEnd xmi:id="{assoc_id}_end1" type="{end1}" association="{assoc_id}"/>
      <ownedEnd xmi:id="{assoc_id}_end2" type="{end2}" association="{assoc_id}"/>
    </packagedElement>'''


def actor(actor_id: str, name: str) -> str:
    return f'    <packagedElement xmi:type="uml:Actor" xmi:id="{actor_id}" name="{escape(name)}"/>'


def use_case(uc_id: str, name: str) -> str:
    return f'    <packagedElement xmi:type="uml:UseCase" xmi:id="{uc_id}" name="{escape(name)}"/>'


def usage(usage_id: str, actor_id: str, uc_id: str) -> str:
    return f'    <packagedElement xmi:type="uml:Usage" xmi:id="{usage_id}" client="{actor_id}" supplier="{uc_id}"/>'


def wrap(model_id: str, model_name: str, elements: list[str]) -> str:
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.1"
  xmlns:xmi="http://schema.omg.org/spec/XMI/2.1"
  xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML">
  <uml:Model xmi:id="{model_id}" name="{escape(model_name)}">
{chr(10).join(elements)}
  </uml:Model>
</xmi:XMI>
'''


def main() -> None:
    class_elements = [
        cls("Provider", "Provider", ["id", "name", "baseUrl", "status", "notes"], ["enable", "disable"]),
        cls("ApiKey", "ApiKey", ["id", "providerId", "label", "maskedSecret", "owner", "status"], ["maskSecret", "enable", "disable"]),
        cls("Model", "Model", ["id", "providerId", "name", "contextWindow", "inputPricePer1K", "outputPricePer1K", "cacheDiscount"], ["estimateCost"]),
        cls("CallRecord", "CallRecord", ["id", "providerId", "modelId", "toolName", "inputTokens", "outputTokens", "cacheHit", "latencyMs", "success", "errorType"], ["calculateCost"]),
        cls("InsightEngine", "InsightEngine", ["successRate", "cacheHitRate", "budgetUsageRate"], ["computeSystemProfile", "computeToolInsights", "computeFeasibilityScore"]),
        cls("FeasibilityService", "FeasibilityService", ["monthlyCalls", "targetCacheHitRate"], ["estimateMonthlyCost", "evaluateBudget"]),
        cls("AuditLog", "AuditLog", ["id", "action", "targetType", "targetId", "createdAt"], ["record"]),
        association("AssocApiKeyProvider", "ApiKeyProvider", "ApiKey", "Provider"),
        association("AssocModelProvider", "ModelProvider", "Model", "Provider"),
        association("AssocCallModel", "CallModel", "CallRecord", "Model"),
        association("AssocInsightCall", "InsightCall", "InsightEngine", "CallRecord"),
        association("AssocFeasibilityModel", "FeasibilityModel", "FeasibilityService", "Model"),
    ]
    write("class-diagram-codearts.xmi", wrap("ClassDiagramModel", "ModelToolIntelligenceClassModel", class_elements))

    use_case_elements = [
        actor("SystemAdmin", "SystemAdmin"),
        actor("Developer", "Developer"),
        actor("ProjectLead", "ProjectLead"),
        actor("FinanceUser", "FinanceUser"),
        actor("SecurityUser", "SecurityUser"),
        use_case("ManageProvider", "ManageProvider"),
        use_case("ManageApiKey", "ManageApiKey"),
        use_case("ManageModelCatalog", "ManageModelCatalog"),
        use_case("RecordToolCall", "RecordToolCall"),
        use_case("ViewDashboard", "ViewDashboard"),
        use_case("GenerateSystemProfile", "GenerateSystemProfile"),
        use_case("EvaluateToolValue", "EvaluateToolValue"),
        use_case("EstimateFeasibility", "EstimateFeasibility"),
        use_case("ExportReport", "ExportReport"),
        usage("UsageAdminProvider", "SystemAdmin", "ManageProvider"),
        usage("UsageAdminModel", "SystemAdmin", "ManageModelCatalog"),
        usage("UsageSecurityKey", "SecurityUser", "ManageApiKey"),
        usage("UsageDevCall", "Developer", "RecordToolCall"),
        usage("UsageLeadDashboard", "ProjectLead", "ViewDashboard"),
        usage("UsageLeadProfile", "ProjectLead", "GenerateSystemProfile"),
        usage("UsageLeadTool", "ProjectLead", "EvaluateToolValue"),
        usage("UsageFinanceFeasibility", "FinanceUser", "EstimateFeasibility"),
        usage("UsageLeadExport", "ProjectLead", "ExportReport"),
    ]
    write("use-case-codearts.xmi", wrap("UseCaseModel", "ModelToolIntelligenceUseCaseModel", use_case_elements))


if __name__ == "__main__":
    main()
