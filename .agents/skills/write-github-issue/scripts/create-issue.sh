#!/usr/bin/env bash
#
# create-issue.sh — file a GitHub issue for the write-github-issue skill.
#
# Wraps `gh issue create`. The body should be a filled copy of one of the
# repo's issue templates (.github/ISSUE_TEMPLATE/*.md) so the filed issue
# matches the template shape. Prints the created issue's URL on success.
#
# Usage:
#   create-issue.sh --title "<title>" --body-file <path> [--label <l> ...]
#   create-issue.sh --title "Advance button does nothing on /play" \
#     --body-file /tmp/bug.md --label bug
#
# Flags:
#   --title <t>       Issue title (required)
#   --body-file <f>   Path to a file with the filled-in issue body (required)
#   --label <l>       Label to apply; repeat for multiple (e.g. --label bug)
#   -h, --help        Show this help
#
# Requires: the `gh` CLI, authenticated (`gh auth status`). The repo is
# inferred from the git remote. If `gh` is unavailable, see the fallback note
# in ../SKILL.md.

set -euo pipefail

title=""
body_file=""
labels=()

usage() {
  awk 'NR==1 && /^#!/ {next} /^#/ {sub(/^# ?/, ""); print; next} {exit}' "$0"
}

# require_value <flag> <candidate> — fail with usage (exit 2) when a flag's
# value is missing or is actually the next flag (starts with "-").
require_value() {
  if [[ -z "${2:-}" || "$2" == -* ]]; then
    echo "error: $1 needs a value" >&2
    usage >&2
    exit 2
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    --title)
      require_value "$1" "${2:-}"
      title="$2"
      shift 2
      ;;
    --body-file)
      require_value "$1" "${2:-}"
      body_file="$2"
      shift 2
      ;;
    --label)
      require_value "$1" "${2:-}"
      labels+=("$2")
      shift 2
      ;;
    *)
      echo "error: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$title" ]]; then
  echo "error: --title is required" >&2
  usage >&2
  exit 2
fi

if [[ -z "$body_file" ]]; then
  echo "error: --body-file is required" >&2
  usage >&2
  exit 2
fi

if [[ ! -f "$body_file" ]]; then
  echo "error: body file not found: $body_file" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "error: the 'gh' CLI is not installed." >&2
  echo "       Install it (https://cli.github.com/) or use the MCP/API fallback in ../SKILL.md." >&2
  exit 127
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: 'gh' is not authenticated. Run 'gh auth login' first." >&2
  exit 1
fi

args=(--title "$title" --body-file "$body_file")

for label in "${labels[@]:-}"; do
  [[ -n "$label" ]] && args+=(--label "$label")
done

echo "Creating issue: ${title}" >&2
gh issue create "${args[@]}"
