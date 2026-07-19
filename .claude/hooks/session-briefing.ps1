# session-briefing.ps1 — the "look at the real sky before trusting the star map".
#
# READ-ONLY. This script never mutates git, gh, or any file. It only observes and
# prints the true current state so a fresh session can reconcile its memory against
# reality instead of trusting stale notes ("issue closed", "account is X"). If any
# observation fails (offline, gh not authed), it says so rather than guessing.
#
# Wired as a SessionStart hook; stdout is injected into the new session's context.

$ErrorActionPreference = 'SilentlyContinue'
# Emit UTF-8 so em-dashes in milestone/commit titles survive into the session
# context instead of turning into '??'.
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
$repo = 'C:\Projects\pale-blue-code'
Set-Location $repo

function Line($s) { Write-Output $s }

Line "===== REAL SKY (session-start observation, read-only) ====="
Line ("observed: {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm'))
Line ""

# --- gh active account (constitution: must be 2daKaizen-gun) ---
$acct = (& gh api user --jq '.login' 2>$null)
if ([string]::IsNullOrWhiteSpace($acct)) {
    Line "GH ACCOUNT : (could not read — gh offline or unauthenticated)"
} elseif ($acct -ne '2daKaizen-gun') {
    Line "GH ACCOUNT : $acct   <<< WARN: expected 2daKaizen-gun. Run: gh auth switch --user 2daKaizen-gun"
} else {
    Line "GH ACCOUNT : $acct   (ok)"
}
Line ""

# --- git: branch, sync, working tree, recent commits ---
Line "GIT:"
$branch = (& git status -sb 2>$null | Select-Object -First 1)
Line ("  $branch")
$dirty = (& git status --porcelain 2>$null)
if ([string]::IsNullOrWhiteSpace($dirty)) {
    Line "  working tree: clean"
} else {
    Line "  working tree: DIRTY (uncommitted changes present) --"
    ($dirty -split "`n") | Select-Object -First 10 | ForEach-Object { Line ("    " + $_) }
}
Line "  recent commits:"
(& git log --oneline -5 2>$null) | ForEach-Object { Line ("    " + $_) }
Line ""

# --- github: open issues + milestone progress ---
Line "GITHUB ISSUES (open):"
$issues = (& gh issue list --state open --limit 30 2>$null)
if ($LASTEXITCODE -ne 0) {
    Line "  (could not read — gh offline, or active account lacks repo access)"
} elseif ([string]::IsNullOrWhiteSpace($issues)) {
    Line "  (none open)"
} else {
    ($issues -split "`n") | ForEach-Object { Line ("  " + $_) }
}
Line "MILESTONES:"
# Parse JSON in-process: PowerShell 5.1 mangles double-quotes when passing a --jq
# template to a native exe, so we let gh emit raw JSON and read it here instead.
$msRaw = (& gh api 'repos/:owner/:repo/milestones' 2>$null)  # open milestones = current work
if ([string]::IsNullOrWhiteSpace($msRaw)) {
    Line "  (none, or unreadable)"
} else {
    try {
        $msObj = $msRaw | ConvertFrom-Json
        if ($null -eq $msObj -or $msObj.Count -eq 0) {
            Line "  (none)"
        } else {
            foreach ($m in $msObj) {
                Line ("  #{0} {1}: open={2} closed={3} [{4}]" -f $m.number, $m.title, $m.open_issues, $m.closed_issues, $m.state)
            }
        }
    } catch {
        Line "  (unreadable — malformed response)"
    }
}
Line ""

# --- latest Check docs (PCTC trail) ---
Line "LATEST CHECK DOCS:"
$checks = Get-ChildItem -Path (Join-Path $repo 'docs\checks') -Recurse -Filter '*.md' -ErrorAction SilentlyContinue |
          Sort-Object LastWriteTime -Descending | Select-Object -First 3
if ($null -eq $checks) {
    Line "  (none found)"
} else {
    foreach ($c in $checks) {
        $rel = $c.FullName.Substring($repo.Length + 1)
        $verdict = (Select-String -Path $c.FullName -Pattern '^\*\*Verdict:\*\*' -ErrorAction SilentlyContinue | Select-Object -First 1).Line
        if ([string]::IsNullOrWhiteSpace($verdict)) { $verdict = '(no verdict line)' }
        Line ("  $rel  --  $verdict")
    }
}
Line ""

Line "RECONCILE: trust the lines above over any memory note. If memory and this sky"
Line "disagree (a 'closed' issue still open, wrong account, dirty tree), fix the note"
Line "or the world before building. Never report a state you have not just observed."
Line "==========================================================="
