// The Entry Makers - re-applies our branding on top of the upstream code.
//
// Safe to run any number of times (idempotent). Run it after every merge from
// upstream (sync-upstream.ps1 does that for you):
//
//   node scripts/rebrand.mjs           apply the branding
//   node scripts/rebrand.mjs --check   only report what is still unbranded
//
// All settings live in brand/brand.json. Files in brand/overrides/ are copied
// over the upstream files of the same path. If upstream renames or rewrites a
// line a REQUIRED rule depends on, this script stops with an error that names
// the file, so a release never goes out half-branded.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand', 'brand.json'), 'utf8'));
const CHECK = process.argv.includes('--check');

const NAME = B.appName;
const OLD_REPO = 'IamRamgarhia/Free-GST-Billing-Software';
const NEW_REPO = `${B.githubOwner}/${B.githubRepo}`;

const problems = [];
const changed = new Set();
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
function write(f, text) {
  if (read(f) === text) return;
  changed.add(f);
  if (!CHECK) fs.writeFileSync(path.join(ROOT, f), text);
}

// ---------------------------------------------------------------- 1. overrides
function copyOverrides(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const src = path.join(dir, e.name);
    if (e.isDirectory()) { copyOverrides(src); continue; }
    const target = rel(src).replace(/^brand\/overrides\//, '');
    const abs = path.join(ROOT, target);
    if (!fs.existsSync(abs)) { problems.push(`override target no longer exists upstream: ${target}`); continue; }
    if (fs.readFileSync(abs, 'utf8') !== fs.readFileSync(src, 'utf8')) {
      changed.add(target);
      if (!CHECK) fs.copyFileSync(src, abs);
    }
  }
}
copyOverrides(path.join(ROOT, 'brand', 'overrides'));

// ---------------------------------------------------------- 2. specific edits
// [from, to]. A rule is satisfied when `from` is gone and `to` is present.
// Rules marked optional only warn when they find nothing.
const EDITS = {
  'src/App.jsx': [
    // Start-up splash inside the app window: tagline under the name.
    [`color: darkMode ? '#94a3b8' : '#64748b' }}>by DiceCodes</p>`, `color: darkMode ? '#94a3b8' : '#64748b' }}>${B.tagline}</p>`],
    // Sidebar: our name (until the user sets their own business name) and our icon.
    [`{ownBrand ? brand.businessName : 'GST Billing'}`, `{ownBrand ? brand.businessName : '${NAME}'}`],
    // Sidebar subtitle: "GST Billing" under our name; "by <us>" under a client's own name.
    ['</span>by DiceCodes</p>', `</span>{ownBrand ? 'by ${B.company}' : '${B.tagline}'}</p>`],
    [`: <FileText size={22} />}`, `: <img src="/icons/icon-192.png" alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />}`],
  ],
  'installer/host/FreeGSTBilling.cs': [
    ['"by DiceCodes"', `"${B.tagline}"`, { all: true }],
  ],
  'installer/free-gst-billing.iss': [
    ['AppPublisher=DiceCodes', `AppPublisher=${B.company}`],
    ['VersionInfoCompany=DiceCodes', `VersionInfoCompany=${B.company}`],
    // Shortcut names and texts (these lines also hold .exe paths, which stay).
    ['\\Free GST Billing"; Filename', `\\${NAME}"; Filename`, { all: true }],
    ['Comment: "Free GST Billing Software"', `Comment: "${NAME} ${B.tagline}"`, { all: true }],
    ['Description: "Open Free GST Billing now"', `Description: "Open ${NAME} now"`],
    ["IconName = 'Free GST Billing.lnk'", `IconName = '${NAME}.lnk'`],
  ],
  'src/index.html': [
    ['<meta name="author" content="DiceCodes" />', `<meta name="author" content="${B.company}" />`],
  ],
  'index.html': [
    ['made by <a href="https://dicecodes.com" target="_blank" rel="noopener">DiceCodes</a>', `based on ${B.upstream.name.replace(/ /g, '&nbsp;')} (${B.upstream.author}, MIT)`, { optional: true }],
  ],
  'vite.config.js': [
    ["short_name: 'GST Billing'", `short_name: '${B.shortName}'`],
  ],
  'scripts/generate-icons.mjs': [
    ['<rect width="64" height="64" rx="13" fill="#2563eb"/>', `<rect width="64" height="64" rx="13" fill="${B.iconColor}"/>`],
    ['font-weight="700" font-size="44" fill="#fff">B</text>', `font-weight="700" font-size="44" fill="#fff">${B.iconLetter}</text>`],
    ["background: '#1e40af'", "background: '#ffffff'"],
  ],
};

for (const [file, rules] of Object.entries(EDITS)) {
  if (!fs.existsSync(path.join(ROOT, file))) { problems.push(`${file}: file is gone upstream`); continue; }
  let text = read(file);
  for (const [from, to, opt = {}] of rules) {
    if (text.includes(from)) text = opt.all ? text.split(from).join(to) : text.replace(from, to);
    else if (!text.includes(to)) (opt.optional ? console.warn : (m) => problems.push(m))(`${file}: could not find  ${from}`);
  }
  write(file, text);
}

// ------------------------------------------------------ 3. display-name pass
// Every user-visible "Free GST Billing" in these files becomes our name. Lines
// holding paths, file or process names are left alone: changing those would
// break upgrades, data folders and the installer's checks.
const NAME_FILES = [
  'index.html', 'src/index.html', 'vite.config.js', 'server.js',
  'src/App.jsx', 'src/store.js',
  'src/components/AppLock.jsx', 'src/components/WelcomeGuide.jsx', 'src/components/SetupWizard.jsx',
  'src/components/ControlPanel.jsx', 'src/components/ClientsView.jsx', 'src/components/IncomeTax.jsx',
  'src/components/SettingsView.jsx',
  'src/utils/errorReport.js', 'src/utils/updateNotice.js',
  'installer/host/FreeGSTBilling.cs', 'installer/free-gst-billing.iss',
  'release-templates/_system-scripts/update-windows.ps1',
];
const KEEP_LINE = /\.exe|\.lnk|\.hta|\.command|AppData|localappdata|LocalApplicationData|USERPROFILE|Path\.Combine|Join-Path|-Name |-like |-match |\\Free GST Billing|Free GST Billing\\|install log|^\s*(\/\/|;|#|\/\*|\*|<!--|\{)/i;

for (const file of NAME_FILES) {
  if (!fs.existsSync(path.join(ROOT, file))) { problems.push(`${file}: file is gone upstream`); continue; }
  const out = read(file).split('\n').map((line) => {
    if (KEEP_LINE.test(line)) return line;
    return line
      .replace(/Free GST Billing Software/g, NAME)
      .replace(/Free GST Billing/g, NAME)
      .replace(/by DiceCodes/g, `by ${B.company}`);
  }).join('\n');
  write(file, out);
}

// ------------------------------------------------------- 4. update / repo URL
// The in-app updater, the Setup's download check and the links must point at
// OUR GitHub releases, or "Update Now" would install the unbranded upstream.
const REPO_FILES = [
  'server.js', 'package.json', 'install.ps1', 'index.html',
  'src/App.jsx', 'src/index.html', 'src/utils/setupDownload.js', 'src/utils/errorReport.js',
  'src/components/WhatsNew.jsx',
  'installer/free-gst-billing.iss',
  'release-templates/_system-scripts/update-windows.ps1',
  'release-templates/_system-scripts/update-unix.sh',
  'release-templates/_system-scripts/ensure-node.ps1',
  'scripts/installer-test.mjs', 'scripts/errors-test.mjs',
];
for (const file of REPO_FILES) {
  if (!fs.existsSync(path.join(ROOT, file))) { problems.push(`${file}: file is gone upstream`); continue; }
  write(file, read(file).split(OLD_REPO).join(NEW_REPO).split(`IamRamgarhia-Free-GST-Billing-Software`).join(`${B.githubOwner}-${B.githubRepo}`));
}
// The updater must not be left pointing upstream.
for (const f of ['server.js', 'src/utils/setupDownload.js']) {
  const t = CHECK ? read(f).split(OLD_REPO).join(NEW_REPO) : read(f);
  if (t.includes('IamRamgarhia')) problems.push(`${f}: still points the updater at the upstream repository`);
}

// ------------------------------------------------------------------ 5. icons
async function icons() {
  const { default: sharp } = await import('sharp');
  const logo = path.join(ROOT, B.logo);
  const trimmed = await sharp(logo).flatten({ background: '#ffffff' }).trim({ threshold: 20 }).png().toBuffer();

  // Wide logo for the About page.
  const aboutPng = await sharp(trimmed).resize({ height: 240 }).png().toBuffer();
  // Square app icon: the logo centred on a white rounded tile.
  const inner = await sharp(trimmed).resize(440, 440, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#ffffff"/>
  <image x="36" y="36" width="440" height="440" xlink:href="data:image/png;base64,${inner.toString('base64')}" href="data:image/png;base64,${inner.toString('base64')}"/>
</svg>
`;
  const targets = [['public/brand-logo.png', aboutPng], ['public/favicon.svg', Buffer.from(svg)]];
  let any = false;
  for (const [f, buf] of targets) {
    const abs = path.join(ROOT, f);
    if (!fs.existsSync(abs) || !fs.readFileSync(abs).equals(buf)) {
      any = true; changed.add(f);
      if (!CHECK) fs.writeFileSync(abs, buf);
    }
  }
  // Always regenerate (same input gives the same bytes): an upstream change to
  // the icon PNGs or the .ico must never slip through unbranded.
  if (!CHECK) {
    const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'generate-icons.mjs')], { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) problems.push('scripts/generate-icons.mjs failed');
  }
}
await icons();

// ------------------------------------------------------------------ report
console.log(`\n${CHECK ? 'Would change' : 'Changed'} ${changed.size} file(s)${changed.size ? ':' : '.'}`);
for (const f of [...changed].sort()) console.log(`  ${f}`);
if (problems.length) {
  console.error(`\nBRANDING PROBLEMS (${problems.length}) - fix brand/ or scripts/rebrand.mjs before releasing:`);
  for (const p of problems) console.error(`  x ${p}`);
  process.exit(1);
}
console.log(`\nBranding OK: ${NAME}, updates from github.com/${NEW_REPO}`);
