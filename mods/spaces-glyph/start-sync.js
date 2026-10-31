// After a Herdr update, rebuilds the three copies (sync.mjs). Rewriting this mod reloads it, so
// a notice waits in sync.mjs's state and the next run (this one or the reloaded one) shows it.
import { exec, appHome, notify } from "herdr";

export function startSync(cx) {
  cx.spawn(async () => {
    try {
      const r = await exec("node", [appHome() + "/mods/spaces-glyph/sync.mjs"]);
      const notice = r.code === 0 ? JSON.parse(r.stdout).notice : { title: "Space glyphs", body: r.stderr.slice(0, 200), level: "error" };
      if (notice) notify(notice);
    } catch {}
  });
}
