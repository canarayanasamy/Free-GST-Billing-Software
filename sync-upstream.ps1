# The Entry Makers - weekly update from the original project (DiceCodes).
#
# Run in PowerShell from this folder:   .\sync-upstream.ps1
#   -Release   also build the Windows Setup (needs Inno Setup 6 or 7)
#
# What it does:
#   1. fetches the original project's latest code (remote "upstream")
#   2. merges it; any clash is settled in favour of THEIR code
#   3. re-applies our branding (scripts/rebrand.mjs) - stops if something moved
#   4. installs packages, lints, runs the unit tests, builds
#   5. commits the result (you push it with GitHub Desktop)
param([switch]$Release)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) {
  $git = (Get-ChildItem "$env:LOCALAPPDATA\GitHubDesktop\app-*\resources\app\git\cmd\git.exe" -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending | Select-Object -First 1).FullName
}
if (-not $git) { throw 'Git not found. Install GitHub Desktop or Git for Windows.' }
function Git { & $git @args; if ($LASTEXITCODE -ne 0) { throw "git $args failed" } }
function Step($t) { Write-Host "`n== $t" -ForegroundColor Cyan }

if (& $git status --porcelain) { throw 'You have uncommitted changes. Commit or discard them in GitHub Desktop first.' }

Step 'Fetching the original project'
Git fetch upstream --tags
$before = (Get-Content package.json -Raw | ConvertFrom-Json).version

Step 'Merging (their code wins any clash; our branding is re-applied next)'
& $git merge upstream/main -X theirs --no-edit -m 'Merge upstream (DiceCodes) changes'
if ($LASTEXITCODE -ne 0) {
  # Clashes -X theirs cannot settle (file deleted on one side, etc.): take theirs.
  $conflicted = & $git diff --name-only --diff-filter=U
  foreach ($f in $conflicted) {
    & $git checkout --theirs -- "$f" 2>$null
    if ($LASTEXITCODE -ne 0) { & $git rm -q -- "$f" } else { & $git add -- "$f" }
  }
  Git commit --no-edit
}
$after = (Get-Content package.json -Raw | ConvertFrom-Json).version

Step 'Re-applying The Entry Makers branding'
node scripts/rebrand.mjs
if ($LASTEXITCODE -ne 0) { throw 'Branding could not be fully applied - see BRANDING PROBLEMS above. Nothing was committed after the merge.' }

Step 'Installing packages, lint, unit tests, build'
npm install --no-audit --no-fund; if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
npx eslint . --quiet;             if ($LASTEXITCODE -ne 0) { throw 'Lint failed' }
npm run test:unit;                if ($LASTEXITCODE -ne 0) { throw 'Unit tests failed' }
npm run build;                    if ($LASTEXITCODE -ne 0) { throw 'Build failed' }

Step 'Committing'
Git add -A
if (& $git status --porcelain) { Git commit -m "Re-apply The Entry Makers branding (v$after)" }

if ($Release) {
  Step 'Building the Windows Setup'
  # Upstream's build script only looks for "Inno Setup 6"; point it at 7 (or 6) ourselves.
  if (-not $env:ISCC) {
    $env:ISCC = @("$env:ProgramFiles\Inno Setup 7\ISCC.exe", "${env:ProgramFiles(x86)}\Inno Setup 7\ISCC.exe",
      "$env:LOCALAPPDATA\Programs\Inno Setup 7\ISCC.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
  }
  npm run release:exe; if ($LASTEXITCODE -ne 0) { throw 'Setup build failed' }
}

Write-Host "`nDone: v$before -> v$after." -ForegroundColor Green
Write-Host 'Next: push with GitHub Desktop, then publish a GitHub Release (see BRANDING.md).'
