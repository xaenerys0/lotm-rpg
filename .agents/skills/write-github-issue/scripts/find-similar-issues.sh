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

# require_value <flag> <candidate> — fail with usage (exit 2) when a flag's
# value is missing or is actually the next flag (starts with "-").
require_value() {
  if [[ -z "${2:-}" || "$2" == -* ]]; then
    echo "error: $1 needs a value" >&2
    usage >&2
    exit 2
  fi
}

# Accumulate bare (positional) words into the query, joined with spaces, so
# `find-similar-issues.sh advancement button` searches "advancement button"
# rather than silently keeping only the last word.
add_word() {
  query="${query:+$query }$1"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    --state)
      require_value "$1" "${2:-}"
      state="$2"
      shift 2
      ;;
    --limit)
      require_value "$1" "${2:-}"
      limit="$2"
      shift 2
      ;;
    --)
      shift
      while [[ $# -gt 0 ]]; do
        add_word "$1"
        shift
      done
      break
      ;;
    -*)
      echo "error: unknown flag: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      add_word "$1"
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
