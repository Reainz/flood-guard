from __future__ import annotations

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
FORBIDDEN_LOG_TOKENS = {"farmer_name", "field_id", "lat", "lon", "phone"}
LOG_METHODS = {"debug", "info", "warning", "error", "exception", "critical"}


def _name(node: ast.AST) -> str:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return ""


def check_file(path: Path) -> list[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    violations = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        if not isinstance(node.func, ast.Attribute) or node.func.attr not in LOG_METHODS:
            continue
        for arg in [*node.args, *[keyword.value for keyword in node.keywords]]:
            token = _name(arg)
            if token in FORBIDDEN_LOG_TOKENS:
                rel = path.relative_to(ROOT)
                violations.append(f"{rel}: logs forbidden PII token {token}")
    return violations


def main() -> int:
    violations = []
    for path in BACKEND.rglob("*.py"):
        violations.extend(check_file(path))
    if violations:
        print("PII logging risks:")
        for violation in violations:
            print(f"- {violation}")
        return 1
    print("PII log check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
