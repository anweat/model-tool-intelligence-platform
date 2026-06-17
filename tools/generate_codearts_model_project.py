import argparse
import hashlib
import json
import shutil
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path
from uuid import uuid4
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TEMPLATE = ROOT.parent / "model_master_20260617220830.zip"
OUT_DIR = ROOT / "docs" / "codearts-import"

USER_ID = "3119a741108d4db0a42c718e8e1c54d8"
SPACE_ID = "428ce3157f86480f81ed4f9a1cab8b67"
NOW = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

DIAGRAM_TYPES = {
    "class": "ff1ee47e-ac06-11e8-9e12-0242ac117104",
    "usecase": "ff1ee4d6-ac06-11e8-9e12-0242ac117104",
    "sequence": "ff1ee534-ac06-11e8-9e12-0242ac117104",
    "activity": "ff1ee59d-ac06-11e8-9e12-0242ac117104",
}
MAIN_TYPE = "ff1ee18c-ac06-11e8-9e12-0242ac117104"


def uid() -> str:
    return uuid4().hex


def sha512(path: Path) -> str:
    h = hashlib.sha512()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def xattr(value) -> str:
    return escape(str(value), {'"': "&quot;"})


def mx_object(cell_id: str, kind: str, name: str, x: int, y: int, w: int, h: int, style: str) -> str:
    label = xattr(f'<div id="CELL_NAME" style="max-width: {w}px; word-wrap: break-word;margin:0 auto;">{name}</div>')
    return (
        f'<object showMemberProperty="true" id="{xattr(cell_id)}" type="{xattr(kind)}" stereotype="{xattr(kind)}" '
        f'cellDefineName="{xattr(name)}" label="{label}" pureName="{xattr(name)}">'
        f'<mxCell style="{xattr(style)}" vertex="1" parent="1">'
        f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell></object>'
    )


def mx_edge(edge_id: str, source: str, target: str, points: list[tuple[int, int]], kind: str = "Use") -> str:
    label = xattr(f'<div id="CELL_TYPE">&lt;&lt;{kind}&gt;&gt;</div><div id="CELL_NAME" style="max-width: initial; word-wrap: break-word;margin:0 auto;"></div>')
    style = "edgeStyle=orthogonalEdgeStyle;shape=connector;rounded=1;html=1;strokeColor=#000000;endArrow=open;startArrow=none;endSize=6;endFill=0;dashed=1;jettySize=24;orthogonalLoop=1;"
    point_xml = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in points)
    return (
        f'<object showMemberProperty="true" id="{xattr(edge_id)}" type="{xattr(kind)}" stereotype="{xattr(kind)}" label="{label}" pureName="">'
        f'<mxCell style="{xattr(style)}" edge="1" parent="1" source="{xattr(source)}" target="{xattr(target)}">'
        f'<mxGeometry relative="1" as="geometry"><Array as="points">{point_xml}</Array></mxGeometry></mxCell></object>'
    )


def graph(objects: list[str]) -> str:
    return (
        '<mxGraphModel dx="1426" dy="887" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" '
        'arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" background="#ffffff" version="v2">'
        '<root><mxCell id="0"/><mxCell id="1" parent="0"/>'
        + "".join(objects)
        + "</root></mxGraphModel>"
    )


def package_row(package_id: str, name: str, seq: int) -> dict:
    return {
        "create_user": USER_ID,
        "create_time": NOW,
        "is_delete": "",
        "name": name,
        "parent_packageuuid": "",
        "update_time": NOW,
        "update_user": USER_ID,
        "uuid": package_id,
        "version": "",
        "path": "",
        "sequence": seq,
        "visible": "",
    }


def package_element_row(package_id: str, name: str, seq: int) -> dict:
    row = base_element_row(package_id, package_id, "none", "Package", name, None, None, None, None, "")
    row.update({"parentuuid": "", "packageuuid": "", "sequence": seq, "path": ""})
    return row


def base_element_row(element_id: str, package_id: str, diagram_id: str, kind: str, name: str, x, y, w, h, element_data: str) -> dict:
    path = json.dumps({"type": "Package", "uuid": package_id}, ensure_ascii=False)
    return {
        "as_element": "geometry",
        "create_user": USER_ID,
        "create_time": NOW,
        "diagram_uuid": diagram_id,
        "element_data": element_data,
        "element_id": element_id,
        "height": None if h is None else str(h),
        "parent_element": "1",
        "stereotype": kind,
        "style": "",
        "type": kind,
        "update_time": NOW,
        "update_user": USER_ID,
        "value": "",
        "vertex": "1",
        "width": None if w is None else str(w),
        "x": None if x is None else str(x),
        "y": None if y is None else str(y),
        "uuid": element_id,
        "is_instance": "instance",
        "is_substantive": "",
        "parentuuid": package_id,
        "is_delete": "",
        "name": name,
        "path": path,
        "is_set3rd": "",
        "item_id": "",
        "line_type": "",
        "repo_uuid": "",
        "repo_parent_uuid": "",
        "from_other_space": "",
        "other_space_version_uuid": "",
        "from_other_space_name": None,
        "other_space_version_name": None,
        "local_path": "",
        "instance_from": "",
        "is_set_gray": False,
        "link_from": "",
        "system_type": "",
        "versionuuid": "",
        "line_define_main_type": "",
        "line_define_secondary_type": "",
        "divider_cell_type": "",
        "instance_from_name": "",
        "interface_from": "",
        "is_cell_from_tree": "",
        "is_edge_reset": "",
        "is_edit_ban": "",
        "is_limit_drop_add": "",
        "line_direct_index": "",
        "line_multiplicity_type": "",
        "link_from_name": "",
        "need_resize": "",
        "origin_cell_id": element_id,
        "relate_partition": "",
        "reset_state_type": "",
        "packageuuid": package_id,
        "repo_url_valid": "",
        "has_bind_diagram": "false",
        "has_child_diagram": "false",
        "is_key_resilience": None,
        "origin_cell_version_uuid": "",
        "from_id": "",
        "sequence": 0,
        "setting": None,
        "ex": {"is_delete": False, "sub_type": kind},
        "attr": None,
        "attr_ex": None,
    }


def diagram_row(diagram_id: str, package_id: str, name: str, stereotype: str, seq: int) -> dict:
    return {
        "create_user": USER_ID,
        "create_time": NOW,
        "description": "",
        "is_delete": "",
        "name": name,
        "update_time": NOW,
        "update_user": USER_ID,
        "uuid": diagram_id,
        "packageuuid": package_id,
        "template_name": "",
        "main_typeuuid": MAIN_TYPE,
        "stereotypeuuid": stereotype,
        "parentuuid": "",
        "path": json.dumps({"type": "Package", "uuid": package_id}, ensure_ascii=False),
        "show_stereotype": "",
        "show_from_tag": "",
        "tag": "",
        "auto_resize": "",
        "is_static_diagram": "",
        "watermark": False,
        "is_overview_diagram": "",
        "sequence": seq,
        "show_from_package": "",
        "setting": None,
    }


def center(node: tuple[str, str, int, int, int, int]) -> tuple[int, int]:
    _, _, x, y, w, h = node
    return x + w // 2, y + h // 2


def route_edge(
    nodes: list[tuple[str, str, int, int, int, int]],
    source_idx: int,
    target_idx: int,
    edge_no: int,
    fanout_index: int,
    fanin_index: int,
) -> list[tuple[int, int]]:
    _, _, sx, sy, sw, sh = nodes[source_idx]
    _, _, tx, ty, tw, th = nodes[target_idx]
    scx, scy = center(nodes[source_idx])
    tcx, tcy = center(nodes[target_idx])
    lane = 28 + (edge_no % 4) * 18
    fanout = (fanout_index - 1) * 42
    fanin = (fanin_index - 1) * 34

    if sx + sw <= tx:
        start_x = sx + sw + lane
        end_x = tx - lane
        mid_x = (start_x + end_x) // 2 + fanout - fanin
        return [(start_x, scy + fanout), (mid_x, scy + fanout), (mid_x, tcy + fanin), (end_x, tcy + fanin)]
    if tx + tw <= sx:
        start_x = sx - lane
        end_x = tx + tw + lane
        mid_x = (start_x + end_x) // 2 - fanout + fanin
        return [(start_x, scy + fanout), (mid_x, scy + fanout), (mid_x, tcy + fanin), (end_x, tcy + fanin)]
    if sy + sh <= ty:
        start_y = sy + sh + lane
        end_y = ty - lane
        mid_y = (start_y + end_y) // 2 + fanout - fanin
        return [(scx + fanout, start_y), (scx + fanout, mid_y), (tcx + fanin, mid_y), (tcx + fanin, end_y)]
    if ty + th <= sy:
        start_y = sy - lane
        end_y = ty + th + lane
        mid_y = (start_y + end_y) // 2 - fanout + fanin
        return [(scx + fanout, start_y), (scx + fanout, mid_y), (tcx + fanin, mid_y), (tcx + fanin, end_y)]

    detour_x = max(sx + sw, tx + tw) + 60 + lane
    return [(detour_x, scy + fanout), (detour_x, tcy + fanin)]


def route_sequence_edge(
    nodes: list[tuple[str, str, int, int, int, int]],
    source_idx: int,
    target_idx: int,
    edge_no: int,
) -> list[tuple[int, int]]:
    scx, _ = center(nodes[source_idx])
    tcx, _ = center(nodes[target_idx])
    base_y = max(y + h for _, _, _, y, _, h in nodes) + 70
    message_y = base_y + (edge_no - 1) * 70
    return [(scx, message_y), (tcx, message_y)]


def axis_segments(points: list[tuple[int, int]]) -> list[tuple[str, int, int, int]]:
    segments = []
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        if x1 == x2:
            segments.append(("v", x1, min(y1, y2), max(y1, y2)))
        elif y1 == y2:
            segments.append(("h", y1, min(x1, x2), max(x1, x2)))
    return segments


def overlap_len(a1: int, a2: int, b1: int, b2: int) -> int:
    return max(0, min(a2, b2) - max(a1, b1))


def validate_route_spacing(diagram_name: str, routes: list[list[tuple[int, int]]]) -> None:
    segments = []
    for route_index, route in enumerate(routes, 1):
        for segment in axis_segments(route):
            segments.append((route_index, *segment))

    problems = []
    for i, (route_a, orientation_a, fixed_a, start_a, end_a) in enumerate(segments):
        for route_b, orientation_b, fixed_b, start_b, end_b in segments[i + 1:]:
            if route_a == route_b or orientation_a != orientation_b:
                continue
            overlap = overlap_len(start_a, end_a, start_b, end_b)
            if overlap < 40:
                continue
            distance = abs(fixed_a - fixed_b)
            if distance == 0 or distance < 18:
                problems.append((route_a, route_b, orientation_a, distance, overlap))

    if problems:
        detail = "; ".join(
            f"edge {a} / edge {b} {orientation} distance={distance} overlap={overlap}"
            for a, b, orientation, distance, overlap in problems[:5]
        )
        raise ValueError(f"{diagram_name} has crowded or overlapping routes: {detail}")


def build_diagram(package_id: str, diagram_id: str, diagram_type: str, nodes: list[tuple[str, str, int, int, int, int]], edges: list[tuple[int, int]]):
    style_map = {
        "Actor": "container=1;html=1;strokeColor=#808080;fillColor=#FFE6CC;shape=umlActor;verticalLabelPosition=bottom;",
        "UseCase": "container=1;html=1;strokeColor=#808080;fillColor=#A9C4EB;shape=ellipse;",
        "Class": "container=1;html=1;strokeColor=#808080;fillColor=#DAE8FC;rounded=1;whiteSpace=wrap;",
        "Activity": "container=1;html=1;strokeColor=#0f766e;fillColor=#E9F5F3;rounded=1;whiteSpace=wrap;",
        "Lifeline": "container=1;html=1;strokeColor=#808080;fillColor=#F5F5F5;rounded=1;whiteSpace=wrap;",
    }
    objects = []
    element_rows = []
    node_ids = []
    for index, (kind, name, x, y, w, h) in enumerate(nodes, 1):
        element_id = uid()
        node_ids.append(element_id)
        obj = mx_object(element_id, kind, name, x, y, w, h, style_map.get(kind, style_map["Class"]))
        objects.append(obj)
        row = base_element_row(element_id, package_id, diagram_id, kind, name, x, y, w, h, obj)
        row["sequence"] = index
        element_rows.append(row)
    line_rows = []
    route_paths = []
    source_counts = {}
    target_counts = {}
    for edge_no, (source_idx, target_idx) in enumerate(edges, 1):
        source_counts[source_idx] = source_counts.get(source_idx, 0) + 1
        target_counts[target_idx] = target_counts.get(target_idx, 0) + 1
        edge_id = uid()
        if diagram_type == "sequence":
            points = route_sequence_edge(nodes, source_idx, target_idx, edge_no)
        else:
            points = route_edge(nodes, source_idx, target_idx, edge_no, source_counts[source_idx], target_counts[target_idx])
        route_paths.append(points)
        obj = mx_edge(edge_id, node_ids[source_idx], node_ids[target_idx], points)
        objects.append(obj)
        line_rows.append(
            {
                "line_data": obj,
                "as_link": "geometry",
                "create_user": USER_ID,
                "create_time": NOW,
                "diagram_uuid": diagram_id,
                "edge_link": "1",
                "parent_link": "1",
                "relative_link": "1",
                "source": node_ids[source_idx],
                "stereotype": "Use",
                "style": "",
                "target": node_ids[target_idx],
                "type": "Use",
                "update_time": NOW,
                "update_user": USER_ID,
                "value": "",
                "width": None,
                "uuid": edge_id,
                "update_time_str": "",
                "is_delete": None,
                "is_edge_reset": "",
                "reset_state_type": "",
                "line_define_main_type": "",
                "origin_cell_id": edge_id,
                "line_direct_index": "",
                "line_multiplicity_type": "",
                "name": "",
                "description": "",
                "ex": {"is_delete": False, "subtype": "Use"},
                "interface_message_list": None,
                "associate_element_list": None,
            }
        )
    validate_route_spacing(diagram_type, route_paths)
    return graph(objects), element_rows, line_rows


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def zip_dir(source_dir: Path, target_zip: Path) -> None:
    with zipfile.ZipFile(target_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(source_dir.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(source_dir.parent).as_posix())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--template", default=str(DEFAULT_TEMPLATE))
    parser.add_argument("--output", default=str(OUT_DIR / "model_tool_intelligence_master.zip"))
    args = parser.parse_args()

    template = Path(args.template)
    if not template.exists():
        raise FileNotFoundError(template)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        temp = Path(td)
        if template.is_dir():
            root = template
        else:
            expanded = temp / "expanded"
            shutil.unpack_archive(str(template), str(expanded))
            root = next(expanded.iterdir())
        meta_zip = root / "1_meta.zip"
        out_root = temp / "model_tool_intelligence_master"
        out_root.mkdir()
        shutil.copy2(meta_zip, out_root / "1_meta.zip")

        data_root = temp / "2_data"
        packages = []
        package_elements = []
        diagrams = []
        elements = []
        lines = []

        specs = [
            ("usecase", "API Key 与模型目录管理", "用例图-密钥与模型", [
                ("Actor", "系统管理员", 70, 130, 70, 80),
                ("Actor", "安全负责人", 70, 390, 70, 80),
                ("UseCase", "维护供应商", 320, 70, 170, 70),
                ("UseCase", "管理 API Key", 320, 210, 170, 70),
                ("UseCase", "脱敏展示 API Key", 690, 210, 190, 70),
                ("UseCase", "维护模型目录", 320, 350, 170, 70),
                ("UseCase", "维护价格与缓存折扣", 690, 350, 220, 70),
            ], [(0, 2), (0, 3), (1, 4), (0, 5), (0, 6)]),
            ("usecase", "调用统计与智能分析", "用例图-统计与分析", [
                ("Actor", "开发人员", 70, 90, 70, 80),
                ("Actor", "项目负责人", 70, 300, 70, 80),
                ("Actor", "财务统计人员", 70, 520, 70, 80),
                ("UseCase", "登记工具调用记录", 310, 70, 200, 70),
                ("UseCase", "查看统计仪表盘", 310, 250, 200, 70),
                ("UseCase", "生成系统画像", 720, 170, 190, 70),
                ("UseCase", "评估工具调用价值", 720, 300, 210, 70),
                ("UseCase", "测算扩容费用可行性", 720, 500, 230, 70),
                ("UseCase", "导出报表", 310, 500, 180, 70),
            ], [(0, 3), (1, 4), (1, 5), (1, 6), (2, 7), (1, 8)]),
            ("class", "核心领域模型", "类图-核心领域模型", [
                ("Class", "Provider", 90, 80, 170, 80),
                ("Class", "ApiKey", 380, 80, 170, 80),
                ("Class", "Model", 690, 80, 170, 80),
                ("Class", "CallRecord", 380, 270, 190, 90),
                ("Class", "InsightEngine", 710, 300, 220, 90),
                ("Class", "FeasibilityService", 710, 500, 230, 90),
                ("Class", "AuditLog", 120, 500, 170, 80),
            ], [(1, 0), (2, 0), (3, 2), (4, 3), (5, 2), (6, 3)]),
            ("activity", "调用登记与计费流程", "活动图-调用登记与计费", [
                ("Activity", "接收调用记录", 90, 90, 170, 60),
                ("Activity", "读取模型价格", 370, 90, 170, 60),
                ("Activity", "统计 Token", 650, 90, 170, 60),
                ("Activity", "判断缓存命中", 650, 310, 180, 60),
                ("Activity", "计算费用与节省", 370, 310, 190, 60),
                ("Activity", "更新系统画像", 90, 310, 180, 60),
            ], [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5)]),
            ("sequence", "新增调用记录时序", "顺序图-新增调用记录", [
                ("Lifeline", "前端页面", 80, 90, 130, 60),
                ("Lifeline", "API 服务", 320, 90, 130, 60),
                ("Lifeline", "JSON 存储", 560, 90, 130, 60),
                ("Lifeline", "InsightEngine", 800, 90, 160, 60),
            ], [(0, 1), (1, 2), (1, 3), (3, 0)]),
        ]

        for seq, (kind, package_name, diagram_name, nodes, edges) in enumerate(specs):
            package_id = uid()
            diagram_id = uid()
            packages.append(package_row(package_id, package_name, seq))
            package_elements.append(package_element_row(package_id, package_name, seq))
            diagrams.append(diagram_row(diagram_id, package_id, diagram_name, DIAGRAM_TYPES[kind], seq))
            xml, element_rows, line_rows = build_diagram(package_id, diagram_id, kind, nodes, edges)
            elements.extend(element_rows)
            lines.extend(line_rows)
            diagram_path = data_root / "2_data" / "4_diagram" / "0" / f"{diagram_id}.xml"
            diagram_path.parent.mkdir(parents=True, exist_ok=True)
            diagram_path.write_text(xml, encoding="utf-8")

        write_json(data_root / "2_data" / "1_package" / "0" / "package.json", packages)
        write_json(data_root / "2_data" / "2_element" / "0" / "element.json", package_elements + elements)
        write_json(data_root / "2_data" / "4_diagram" / "0" / "diagrams.json", diagrams)
        write_json(data_root / "2_data" / "5_line" / "0" / "t_line.json", lines)

        data_zip = out_root / "2_data.zip"
        zip_dir(data_root / "2_data", data_zip)

        define = {
            "format_version": 1.0,
            "source_project_space_iuid": SPACE_ID,
            "source_project_branch_uuid": "",
            "source_env": "codeArts",
            "meta_data_file": "1_meta.zip",
            "meta_data_file_hex": sha512(out_root / "1_meta.zip"),
            "data_file": "2_data.zip",
            "data_file_hex": sha512(data_zip),
            "create_time": NOW,
            "create_user": USER_ID,
        }
        write_json(out_root / "define.json", define)

        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for path in sorted(out_root.rglob("*")):
                if path.is_file():
                    zf.write(path, path.relative_to(out_root.parent).as_posix())
        print(output)


if __name__ == "__main__":
    main()
