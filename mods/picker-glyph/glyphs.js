// Picks a space's glyph from its name alone. The first rule with a word from the name wins, so
// keep specific words above generic ones: AtlasClimateWidget is climate, not widget.
// Names no rule knows get a glyph from the pool by hash, so it stays the same between starts.
const IGNORED = new Set(["atlas"]);

const RULES = [
  ["plug", "api sdk proxy"],
  ["thermometer", "climate weather hvac temperature"],
  ["file-video", "codec video ffmpeg"],
  ["music", "media music audio player"],
  ["rocket", "launcher launch"],
  ["terminal", "terminal shell cli console tty"],
  ["app-window", "window windows"],
  ["layout-grid", "widget widgets"],
  ["sun-dim", "dim brightness display screen"],
  ["server", "server homeserver host vps"],
  ["bot", "agent agents bot ai llm claude codex"],
  ["message-circle", "chat message messages messenger"],
  ["globe", "web site website browser"],
  ["database", "db database sql"],
  ["smartphone", "android ios mobile phone"],
  ["book-open", "docs doc notes wiki book"],
  ["settings", "config settings dotfiles"],
  ["shield", "auth security vpn"],
  ["cloud", "cloud"],
  ["key", "key keys token"],
  ["image", "image images photo photos"],
  ["camera", "camera"],
  ["map", "map maps nav navigation"],
  ["mail", "mail email"],
  ["calendar", "calendar"],
  ["chart-column", "stats analytics metrics dashboard"],
  ["git-branch", "git"],
  ["gamepad-2", "game games"],
  ["house", "home"],
  ["download", "download downloads"],
  ["search", "search"],
  ["bell", "notify notifications"],
  ["mic", "mic voice"],
  ["wifi", "wifi network"],
  ["wrench", "util utils tool tools fix"],
  ["code", "dev code ide editor"],
].map(([glyph, words]) => [glyph, new Set(words.split(" "))]);

const POOL = ["box", "hexagon", "shapes", "component", "package", "layers", "triangle", "diamond",
  "circle-dot", "square-dashed", "star", "leaf", "zap", "anchor", "compass", "flame"];

function words(name) {
  return name.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2").toLowerCase()
    .split(/[^\p{L}\p{N}]+/u).filter((w) => w && !IGNORED.has(w));
}

function hash(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.codePointAt(0), 16777619);
  return h >>> 0;
}

export function glyphName(name) {
  if (name === "~") return "house";
  const found = words(name);
  for (const [glyph, known] of RULES) if (found.some((w) => known.has(w))) return glyph;
  return POOL[hash(name) % POOL.length];
}

export const glyphPath = (name) => `mods/spaces-glyph/glyphs/${glyphName(name)}.svg`;
