#!/usr/bin/env python3
"""Generate Supabase product import SQL from the Cing House Excel menu.

No third-party Python packages are required; this reads the XLSX zip/XML directly.
"""
from __future__ import annotations

import argparse
import collections
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
VALID_TYPES = {"Món ăn", "Combo", "Đồ uống đóng chai", "Đồ uống pha chế", "Mặt hàng khác"}

# Service sugar-level suffixes to collapse across all products. Examples:
#   - 70% ĐƯỜNG, -70%ĐƯỜNG, - 70 ĐƯỜNG, - KHÔNG ĐƯỜNG, - 0% đường
# Real product names that merely contain these words are preserved unless the words are a trailing suffix.
SUGAR_SUFFIX = re.compile(
    r"\s*[-–—]?\s*(?:"
    r"KH[ÔO]NG\s+ĐƯ[ỜƠO]NG|"
    r"0\s*%?\s*ĐƯ[ỜƠO]NG|"
    r"[1-9]\d?\s*%?\s*ĐƯ[ỜƠO]NG|"
    r"100\s*%?\s*ĐƯ[ỜƠO]NG|"
    r"0\s*%|"
    r"[1-9]\d?\s*%|"
    r"100\s*%"
    r")\s*$",
    re.IGNORECASE,
)


def col_to_idx(col: str) -> int:
    idx = 0
    for ch in col:
        idx = idx * 26 + ord(ch) - 64
    return idx - 1


def cell_text(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value = cell.find("a:v", NS)
    inline_string = cell.find("a:is", NS)

    if cell_type == "s" and value is not None:
        return shared_strings[int(value.text or "0")]
    if cell_type == "inlineStr" and inline_string is not None:
        return "".join(text.text or "" for text in inline_string.findall(".//a:t", NS))
    if value is not None:
        return value.text or ""
    return ""


def read_rows(xlsx_path: Path):
    with zipfile.ZipFile(xlsx_path) as archive:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for shared_item in root.findall("a:si", NS):
                shared_strings.append("".join(text.text or "" for text in shared_item.findall(".//a:t", NS)))

        # This workbook has one menu sheet.
        root = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        for row in root.findall(".//a:sheetData/a:row", NS):
            cells: dict[int, str] = {}
            for cell in row.findall("a:c", NS):
                match = re.match(r"([A-Z]+)", cell.attrib.get("r", ""))
                if not match:
                    continue
                cells[col_to_idx(match.group(1))] = cell_text(cell, shared_strings).strip()
            yield cells


def normalize_name(name: str) -> str:
    normalized = " ".join(name.strip().split())
    before = None
    while before != normalized:
        before = normalized
        normalized = SUGAR_SUFFIX.sub("", normalized).strip()
    return re.sub(r"\s*[-–—]\s*$", "", normalized).strip()


def category_for(item_type: str) -> str:
    return "drinks" if item_type.startswith("Đồ uống") else "food"


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def build_products(xlsx_path: Path):
    raw_items = []
    for row in read_rows(xlsx_path):
        item_type = row.get(0, "")
        sku = row.get(1, "")
        name = row.get(3, "")
        price_text = row.get(6, "")
        menu_group = row.get(14, "")

        try:
            price = int(float(price_text))
        except ValueError:
            price = 0

        if item_type in VALID_TYPES and sku and name and price > 0:
            raw_items.append(
                {
                    "id": sku,
                    "sku": sku,
                    "name": name,
                    "normalized_name": normalize_name(name),
                    "category": category_for(item_type),
                    "category_name": menu_group or item_type,
                    "price": price,
                    "currency": "VND",
                    "status": "active",
                    "image": "",
                    "item_type": item_type,
                }
            )

    # Collapse variants with the same normalized display name, price, menu type, and category group.
    # Keep size only when Excel wrote it in the name; never infer size from SKU/code.
    groups: collections.OrderedDict[tuple[str, int, str, str], list[dict[str, object]]] = collections.OrderedDict()
    for item in raw_items:
        key = (str(item["normalized_name"]), int(item["price"]), str(item["item_type"]), str(item["category_name"]))
        groups.setdefault(key, []).append(item)

    products = []
    collapsed_rows = 0
    for rows in groups.values():
        canonical = sorted(
            rows,
            key=lambda item: 0 if " ".join(str(item["name"]).strip().split()) == item["normalized_name"] else 1,
        )[0].copy()
        canonical["name"] = canonical["normalized_name"]
        products.append(canonical)
        collapsed_rows += len(rows) - 1

    seen_ids: set[str] = set()
    for product in products:
        original_id = str(product["id"])
        if original_id not in seen_ids:
            seen_ids.add(original_id)
            continue
        suffix = 2
        while f"{original_id}-{suffix}" in seen_ids:
            suffix += 1
        product["id"] = f"{original_id}-{suffix}"
        product["sku"] = f"{product['sku']}-{suffix}"
        seen_ids.add(str(product["id"]))

    return raw_items, products, collapsed_rows


def write_sql(xlsx_path: Path, output_path: Path) -> None:
    raw_items, products, collapsed_rows = build_products(xlsx_path)

    lines = [
        f"-- Product import generated from {xlsx_path.as_posix()}.",
        "-- Replaces the entire Supabase product catalog with the Excel product list.",
        "-- Images are intentionally blank.",
        "-- Sugar/no-sugar variants are collapsed across every product.",
        "-- Size text is preserved only when the Excel product name explicitly includes it; size is never inferred from SKU.",
        f"-- Source sellable rows: {len(raw_items)}; imported products after normalization: {len(products)}; collapsed variant rows: {collapsed_rows}.",
        "",
        "truncate table cinghouse.products;",
        "",
        "insert into cinghouse.products (id, sku, name, category, category_name, price, currency, status, image)",
        "values",
    ]

    value_lines = []
    for product in products:
        values = [
            sql_quote(str(product["id"])),
            sql_quote(str(product["sku"])),
            sql_quote(str(product["name"])),
            sql_quote(str(product["category"])),
            sql_quote(str(product["category_name"])),
            str(product["price"]),
            sql_quote(str(product["currency"])),
            sql_quote(str(product["status"])),
            sql_quote(str(product["image"])),
        ]
        value_lines.append("  (" + ", ".join(values) + ")")

    lines.append(",\n".join(value_lines) + ";")
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {output_path} with {len(products)} products from {len(raw_items)} rows; collapsed {collapsed_rows} rows.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Supabase product import SQL from Excel menu")
    parser.add_argument("--input", default="docs/DANHMUCTHUCDON-33fae4cf-5106-4a49-bf80-03633a12e196.xlsx")
    parser.add_argument("--output", default="supabase/import-products.sql")
    args = parser.parse_args()
    write_sql(Path(args.input), Path(args.output))


if __name__ == "__main__":
    main()
