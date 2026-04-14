#!/usr/bin/env python3
"""Lightweight multi-agent planning helper for this repo.

Usage:
    python tools/multi_agent_codex.py "collaborative sketch extrude"
    python tools/multi_agent_codex.py "undo for transform drag" --format json
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
AGENT_DIR = ROOT / "agents"


@dataclass(frozen=True)
class AgentDefinition:
    slug: str
    title: str
    path: Path
    keywords: tuple[str, ...]
    default_questions: tuple[str, ...]

    def load_markdown(self) -> str:
        return self.path.read_text(encoding="utf-8")


AGENTS = (
    AgentDefinition(
        slug="product-manager",
        title="Product Manager Agent",
        path=AGENT_DIR / "product-manager.md",
        keywords=("scope", "workflow", "persona", "designer", "review", "toolbar"),
        default_questions=(
            "Is this feature clearly in V1 scope?",
            "Does it help industrial designers move faster in early concept work?",
        ),
    ),
    AgentDefinition(
        slug="architect",
        title="Architect Agent",
        path=AGENT_DIR / "architect.md",
        keywords=("architecture", "package", "server", "frontend", "backend", "schema"),
        default_questions=(
            "Which package should own this change?",
            "Does this preserve canonical document state outside the renderer?",
        ),
    ),
    AgentDefinition(
        slug="3d-engine",
        title="3D Engine Agent",
        path=AGENT_DIR / "3d-engine.md",
        keywords=("primitive", "sketch", "extrude", "mesh", "geometry", "selection"),
        default_questions=(
            "What canonical entities or parameters change?",
            "What derived display mesh or picking output is needed?",
        ),
    ),
    AgentDefinition(
        slug="realtime-collab",
        title="Realtime Collaboration Agent",
        path=AGENT_DIR / "realtime-collab.md",
        keywords=("sync", "presence", "room", "websocket", "reconnect", "conflict"),
        default_questions=(
            "What is the submit, accept, and broadcast flow?",
            "What is persisted versus ephemeral?",
        ),
    ),
    AgentDefinition(
        slug="undo-redo",
        title="Undo/Redo Agent",
        path=AGENT_DIR / "undo-redo.md",
        keywords=("undo", "redo", "history", "inverse", "group", "drag"),
        default_questions=(
            "What command bundle and inverse operations are required?",
            "How do remote operations affect local redo safety?",
        ),
    ),
)


def score_agent(agent: AgentDefinition, feature_text: str) -> int:
    lowered = feature_text.lower()
    return sum(1 for keyword in agent.keywords if keyword in lowered)


def select_agents(feature_text: str) -> list[AgentDefinition]:
    scored = sorted(
        ((score_agent(agent, feature_text), agent) for agent in AGENTS),
        key=lambda item: item[0],
        reverse=True,
    )

    selected = [agent for score, agent in scored if score > 0]
    if not selected:
        return [AGENTS[0], AGENTS[1]]

    if AGENTS[1] not in selected:
        selected.append(AGENTS[1])

    return selected


def build_plan(feature_text: str) -> dict:
    selected = select_agents(feature_text)

    return {
        "feature": feature_text,
        "agents": [
            {
                "title": agent.title,
                "file": str(agent.path.relative_to(ROOT)),
                "questions": list(agent.default_questions),
            }
            for agent in selected
        ],
        "checklist": [
            "Confirm the work is still inside V1 scope.",
            "Keep canonical document state separate from render state.",
            "Ensure multiplayer behavior is explicit and testable.",
            "Ensure undo remains per-user and grouped interactions stay grouped.",
            "Add tests for the most failure-prone behavior.",
        ],
        "execution_order": [agent.title for agent in selected],
    }


def render_markdown(plan: dict) -> str:
    lines = [f"# Feature Plan: {plan['feature']}", "", "## Involved Agents"]

    for agent in plan["agents"]:
        lines.append(f"- {agent['title']} (`{agent['file']}`)")
        for question in agent["questions"]:
            lines.append(f"  - {question}")

    lines.extend(["", "## Checklist"])
    for item in plan["checklist"]:
        lines.append(f"- {item}")

    lines.extend(["", "## Execution Order"])
    for index, title in enumerate(plan["execution_order"], start=1):
        lines.append(f"{index}. {title}")

    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("feature", help="Feature or task description to plan")
    parser.add_argument(
        "--format",
        choices=("markdown", "json"),
        default="markdown",
        help="Output format",
    )
    parser.add_argument(
        "--show-agent-docs",
        action="store_true",
        help="Append the selected agent markdown content after the plan",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    plan = build_plan(args.feature)

    if args.format == "json":
        print(json.dumps(plan, indent=2))
    else:
        print(render_markdown(plan))

    if args.show_agent_docs:
        selected = select_agents(args.feature)
        for agent in selected:
            print("\n" + "=" * 80)
            print(f"# {agent.title} Source")
            print("=" * 80)
            print(agent.load_markdown())


if __name__ == "__main__":
    main()
