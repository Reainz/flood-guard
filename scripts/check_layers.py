from __future__ import annotations

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"

LAYER_BY_NAME = {
    "models": 0,
    "irri_tables": 1,
    "crop_calendar": 1,
    "compensation": 1,
    "engine": 2,
    "predictor": 2,
    "reporter": 2,
    "pdf_generator": 2,
    "storage": 2,
    "main": 3,
    "dispatcher": 3,
    "sources": 3,
}


def module_layer(path: Path) -> int | None:
    if path.name == "__init__.py":
        return None
    return LAYER_BY_NAME.get(path.stem)


def imported_layer(module_name: str) -> int | None:
    parts = module_name.split(".")
    if len(parts) < 3 or parts[0] != "backend":
        return None
    return LAYER_BY_NAME.get(parts[-1])


def check_file(path: Path) -> list[str]:
    layer = module_layer(path)
    if layer is None:
        return []
    tree = ast.parse(path.read_text(encoding="utf-8"))
    violations = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module:
            target_layer = imported_layer(node.module)
            if target_layer is not None and target_layer > layer:
                rel = path.relative_to(ROOT)
                violations.append(f"{rel}: imports higher layer {node.module}")
        elif isinstance(node, ast.Import):
            for alias in node.names:
                target_layer = imported_layer(alias.name)
                if target_layer is not None and target_layer > layer:
                    rel = path.relative_to(ROOT)
                    violations.append(f"{rel}: imports higher layer {alias.name}")
    return violations


def main() -> int:
    violations = []
    for path in BACKEND.rglob("*.py"):
        violations.extend(check_file(path))
    if violations:
        print("Layer violations:")
        for violation in violations:
            print(f"- {violation}")
        return 1
    print("Layer check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
