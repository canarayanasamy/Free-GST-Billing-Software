# The Entry Makers build

This is **Free GST Billing** by DiceCodes (MIT License, see `LICENSE`), rebranded as
**The Entry Makers**. The original code is followed weekly; our changes are kept
separate so their updates keep flowing in.

## What is ours

| Path | What it is |
|---|---|
| `brand/brand.json` | Name, tagline, colours, GitHub owner, contact details |
| `brand/logo.jpg` | The logo used for every icon |
| `brand/overrides/` | Files copied over the upstream ones (About page, footer, hidden donate/star prompts) |
| `scripts/rebrand.mjs` | Re-applies all branding; safe to run any number of times |
| `sync-upstream.ps1` | The weekly update |

Never hand-edit the branded lines in upstream files: change `brand/` or
`scripts/rebrand.mjs` instead, then run `node scripts/rebrand.mjs`.

Kept as upstream on purpose (changing them would break upgrades and data
paths): the install folder `%LOCALAPPDATA%\Programs\Free GST Billing`, the books
folder `C:\Users\<name>\Free GST Billing`, `Free GST Billing.exe`, the
installer ID and the Setup file name `Free-GST-Billing-Windows-Setup.exe`.

## Every week (after their Saturday release)

1. `.\sync-upstream.ps1 -Release` in PowerShell, in this folder.
2. GitHub Desktop → **Push origin**.
3. On github.com/canarayanasamy/Free-GST-Billing-Software → **Releases → Draft a new release**:
   - tag `v<version>` (same as `package.json`, e.g. `v1.10.84`), target `main`
   - attach `release-build/Free-GST-Billing-Windows-Setup.exe` (the name must stay exactly this)
   - paste their release notes if you like, then **Publish**.

Within 6 hours every installed copy shows "Update to v…" and installs **our** Setup.

## One-time setup

- Install **Inno Setup 6**: https://jrsoftware.org/isdl.php
- Fork published as `canarayanasamy/Free-GST-Billing-Software`, branch `main`.
- Contact details for the About page: fill `contactEmail`, `contactPhone`, `website`
  in `brand/brand.json`, then `node scripts/rebrand.mjs`.
