import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path


MERMAID_FENCE = re.compile(r"^```mermaid\s*\r?\n(.*?)^```\s*$", re.MULTILINE | re.DOTALL)
CLI_PACKAGE = "@mermaid-js/mermaid-cli@11.4.2"


def main(arguments: list[str]) -> int:
    if not arguments:
        print("Usage: python tools/validate_mermaid.py <markdown-file> [...]", file=sys.stderr)
        return 2

    blocks: list[tuple[Path, int, str]] = []
    for argument in arguments:
        markdown = Path(argument)
        if not markdown.is_file():
            print(f"Markdown file not found: {markdown}", file=sys.stderr)
            return 2
        text = markdown.read_text(encoding="utf-8")
        blocks.extend(
            (markdown, index, match.group(1))
            for index, match in enumerate(MERMAID_FENCE.finditer(text), start=1)
        )

    if not blocks:
        print("No Mermaid diagrams found.", file=sys.stderr)
        return 1

    with tempfile.TemporaryDirectory(prefix="aylzz-mermaid-") as directory:
        temp = Path(directory)
        for index, (markdown, diagram_number, source_text) in enumerate(blocks, start=1):
            source = temp / f"diagram-{index}.mmd"
            output = temp / f"diagram-{index}.svg"
            source.write_text(source_text, encoding="utf-8")
            command = [
                "npm",
                "exec",
                "--yes",
                f"--package={CLI_PACKAGE}",
                "--",
                "mmdc",
                "-p",
                ".github/puppeteer-config.json",
                "-i",
                str(source),
                "-o",
                str(output),
            ]
            if os.name == "nt":
                command = [
                    os.environ.get("COMSPEC", "cmd.exe"),
                    "/d",
                    "/s",
                    "/c",
                    subprocess.list2cmdline(command),
                ]
            try:
                result = subprocess.run(
                    command,
                    check=False,
                    capture_output=True,
                    text=True,
                )
            except OSError as error:
                print(f"Could not start Mermaid CLI: {error}", file=sys.stderr)
                return 1
            if result.returncode != 0 or not output.is_file() or output.stat().st_size == 0:
                print(
                    f"Mermaid rendering failed for {markdown} diagram {diagram_number}:\n"
                    f"{result.stderr.strip()}",
                    file=sys.stderr,
                )
                return 1
            print(f"Validated {markdown} diagram {diagram_number}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
