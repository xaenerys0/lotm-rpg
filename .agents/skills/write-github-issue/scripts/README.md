# write-github-issue scripts

GitHub interaction for the [`write-github-issue`](../SKILL.md) skill lives here. Both scripts
wrap the [`gh` CLI](https://cli.github.com/) and infer the repo from the git remote.

## Prerequisites

- `gh` installed and authenticated: `gh auth status` (run `gh auth login` if not).
- Run from within the repo working tree.

If `gh` is not available but another form of GitHub access is (for example, an agent session
with GitHub MCP tools), file the same filled template body through that access instead — see
the **fallback** note in [`../SKILL.md`](../SKILL.md).

## Scripts

### `find-similar-issues.sh` — check for duplicates first

```bash
./find-similar-issues.sh "advancement button"
./find-similar-issues.sh --state all --limit 30 "<query>"
```

Prints matching `#number  [state]  title` + URL. Run before filing a new issue.

### `create-issue.sh` — file the issue

```bash
./create-issue.sh --title "<title>" --body-file <path> --label bug
```

The `--body-file` should be a filled copy of one of the repo's issue templates
(`.github/ISSUE_TEMPLATE/bug_report.md` or `feature_request.md`) so the filed issue matches
the template shape. Repeat `--label` for multiple labels. Prints the created issue URL.

Run either script with `--help` for full flag documentation.
