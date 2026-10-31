// Rebuilds spaces-glyph, picker-glyph and workspace-chrome-glyph from Herdr's own mods when the
// app's version changes, so they keep Herdr's changes plus the small edits below. An edit that no
// longer fits leaves that copy as it was and says so in a notice. `--force` rebuilds on the same
// version. Prints { notice } for start-sync.js to show.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HOME = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const STATE = HOME + '/data/space-glyphs-sync.json';
const FORCE = process.argv.includes('--force');
// Written below, or by the app.
const SKIP = new Set(['main.js', 'mod.json', 'gpui-kit.d.ts', 'jsconfig.json', 'node_modules']);

const COPIES = [
  // Mods can't import across folders, so it gets a copy of glyphs.js; the svgs stay in spaces-glyph.
  { from: 'picker', to: 'picker-glyph', extra: ['spaces-glyph/glyphs.js'], edits: [
    ['import { v_flex, h_flex, InputState, Input } from "gpui-base";', 'import { v_flex, h_flex, InputState, Input } from "gpui-base";\nimport { glyphPath } from "./glyphs.js";'],
    ['.child(h_flex().size(18).rounded(5).bg(spaceColor(t, r.w)).items_center().justify_center().text_size(10.5).font_bold().text_color("#ffffff").child([...r.w.name][0]?.toUpperCase() ?? "?"))', '.child(h_flex().size(18).flex_none().items_center().justify_center().child(svg(glyphPath(r.w.name)).size(16).text_color(spaceColor(t, r.w))))'],
  ] },
  { from: 'workspace-chrome', to: 'workspace-chrome-glyph', edits: [
    ['run("mod.open", { name: "picker" })', 'run("mod.open", { name: "picker-glyph" })'],
  ] },
  // Last: writing it reloads the mod that runs this script.
  { from: 'spaces', to: 'spaces-glyph', edits: [
    ['import { v_flex, h_flex } from "gpui-base";', 'import { v_flex, h_flex } from "gpui-base";\nimport { glyphPath } from "./glyphs.js";\nimport { startSync } from "./start-sync.js";'],
    ['  init(_props, cx) {\n', '  init(_props, cx) {\n    startSync(cx);\n'],
    ['.child(h_flex().size(18).flex_none().rounded(5).bg(fill).items_center().justify_center().text_size(10.5).font_bold().text_color("#ffffff").child([...w.name][0]?.toUpperCase() ?? "?"))', '.child(h_flex().size(18).flex_none().items_center().justify_center().child(svg(glyphPath(w.name)).size(16).text_color(fill)))'],
  ] },
];

function write(path, text) {
  if (existsSync(path) && readFileSync(path, 'utf8') === text) return false;
  writeFileSync(path + '.tmp', text);
  renameSync(path + '.tmp', path);
  return true;
}

// Built in memory first, so a copy is written whole or not at all.
function build({ from, to, edits }, version) {
  const dir = `${HOME}/mods/${from}`;
  let main = readFileSync(dir + '/main.js', 'utf8');
  for (const [before, after] of edits) {
    if (!main.includes(before)) throw new Error(`no longer has: ${before.split('\n')[0].trim().slice(0, 60)}`);
    main = main.replace(before, () => after);
  }
  main = main.replaceAll(`mods/${from}/`, `mods/${to}/`);
  const meta = { ...JSON.parse(readFileSync(dir + '/mod.json', 'utf8')), cloned_from: { name: from, version } };
  return { dir, main, meta: JSON.stringify(meta, null, 2) + '\n' };
}

function save({ to, extra = [] }, { dir, main, meta }) {
  const target = `${HOME}/mods/${to}`;
  mkdirSync(target, { recursive: true });
  for (const name of readdirSync(dir)) if (!SKIP.has(name)) cpSync(`${dir}/${name}`, `${target}/${name}`, { recursive: true });
  for (const file of extra) cpSync(`${HOME}/mods/${file}`, `${target}/${file.split('/').pop()}`);
  const metaChanged = write(target + '/mod.json', meta);
  return write(target + '/main.js', main) || metaChanged;
}

let state = {};
try { state = JSON.parse(readFileSync(STATE, 'utf8')); } catch {}
const version = execFileSync('herdr-app', ['--version'], { encoding: 'utf8', timeout: 10000 }).trim().split(/\s+/).pop();
const out = { notice: state.notice };
delete state.notice;
mkdirSync(HOME + '/data', { recursive: true });

if (FORCE || state.version !== version) {
  const failed = [], built = [];
  for (const copy of COPIES) {
    try { built.push([copy, build(copy, version)]); }
    catch (e) { failed.push(`${copy.to}: ${e.message}`); }
  }
  state.version = version;
  const notice = failed.length ? { title: `Herdr ${version}: some glyph copies stayed old`, body: failed.join('\n'), level: 'warning' } : undefined;
  const last = built.find(([copy]) => copy.to === 'spaces-glyph');
  for (const entry of built) if (entry !== last) save(...entry);
  // The state goes first: writing spaces-glyph reloads the mod and may end this script.
  if (notice && last) state.notice = notice; else if (notice) out.notice = notice;
  write(STATE, JSON.stringify(state, null, 2));
  if (last && !save(...last) && state.notice) {
    // Nothing changed, so no reload will come to show it.
    out.notice = state.notice;
    delete state.notice;
    write(STATE, JSON.stringify(state, null, 2));
  }
} else {
  write(STATE, JSON.stringify(state, null, 2));
}
console.log(JSON.stringify(out));
