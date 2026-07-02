#!/usr/bin/env bash
#
# find-similar-issues.sh — duplicate check for the write-github-issue skill.
#
# Searches the current repo's issues for a query string and prints matching
# number / title / state / URL, so you can add to an existing issue instead of
# filing a duplicate. Run this BEFORE writing a new issue.
#
# Usage:
#   find-similar-issues.sh "<query>"
#   find-similar-issues.sh --state all "advancement button"
#   find-similar-issues.sh --limit 30 "<query>"
#
# Flags:
#   --state <open|closed|all>   Which issues to search (default: open)
#   --limit <n>                 Max results (default: 20)
#   -h, --help                  Show this help
#
# Requires: the `gh` CLI, authenticated (`gh auth status`). If `gh` is
# unavailable, see the fallback note in ../SKILL.md.

set -euo pipefail

state="open"
limit="20"
query=""

usage() {
  awk 'NR==1 && /^#!/ {next} /^#/ {sub(/^# ?/, ""); print; next} {exit}' "$0"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    --state)
      state="${2:?--state needs a value}"
      shift 2
      ;;
    --limit)
      limit="${2:?--limit needs a value}"
      shift 2
      ;;
    --)
      shift
      query="${*:-}"
      break
      ;;
    -*)
      echo "error: unknown flag: $1" >&2
      exit 2
      ;;
    *)
      query="$1"
      shift
      ;;
  esac
done

if [[ -z "$query" ]]; then
  echo "error: a search query is required" >&2
  echo >&2
  usage >&2
  exit 2
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

echo "Searching ${state} issues for: ${query}" >&2

gh issue list \
  --search "$query" \
  --state "$state" \
  --limit "$limit" \
  --json number,title,state,url \
  --template '{{range .}}#{{.number}}  [{{.state}}]  {{.title}}
    {{.url}}
{{end}}'
