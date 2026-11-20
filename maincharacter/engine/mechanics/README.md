# Mechanic modules and templates

A **template** is a story shape with one signature mechanic no other template has. It is made of:

| File | What it is |
|------|------------|
| `engine/mechanics/<id>.js` | The mechanic: engine code, hand-built and verified once. Shipped inside every game of this template. |
| `engine/mechanics/<id>.bot.js` | Optional. Advice for the test bots on how a person would use the mechanic. Never shipped. |
| `templates/<id>/base.json` | A complete, playable GameSpec: every land, every sign, a whole default story with a placeholder cast. A customer's game is this file with its words, names and costumes rewritten. |
| `templates/<id>/template.json` | What the Story Room needs to know: the story spine beat by beat, the cast roles, what each piece of text is for. |

The engine proper (`engine/js/*`) is shared by every template and is **not edited per template**.

## The mechanic file

Plain script, `'use strict'`, loaded after `scenes.js` and before `main.js`, so every engine global exists
(`World`, `Game`, `Scenes`, `ENT`, `Paint`, `Sound`, `Input`, `UI`, `SPEC`, `tx`, `T`, `W`, `H`, `rand`, `RNG`, …).

```js
'use strict';
/* @ops raft isle */                      // every level op this file adds, so the compiler can check specs
mechanic({
  id: 'boat',
  ops(ctx) { return { raft(x, a, w) { ctx.out.ents.push({ t: 'raft', x: ctx.px(x), y: ctx.py(a), w: w * T }); } }; },
  init(w, L, cp) { w.mech.boat = { wind: 0 }; },   // called at the end of World.load; cp is the checkpoint, if any
  step(w) { },                                     // once per simulation step, before the creatures move
  back(c, w, ox, oy) { }, draw(c, w, ox, oy) { }, over(c, w, ox, oy) { },   // behind the land / with the hero / on top
  invariants(w) { return []; },                    // strings describing anything impossible; checked every step by the gate
  progress(w) { return 0; },                       // added to the solver's score: must only rise as the game advances
  cellKey(w) { return ''; },                       // what else makes two moments different, for the solver
  info(w) { return {}; }                           // shown to bots and in reports
});
ENT.raft = { init(e) { }, update(w, e) { }, draw(c, w, e, ox, oy) { } };   // new things in the world
```

- `ctx` in `ops`: `out` (the world being built: `ents`, `marks`, `doors`, …), `set(x, a, ch)`, `px(x)`, `py(a)`,
  `X(x)`, `row(a)`, `reg` (the region), `ri` (its index), `shard(x, y)`.
- A mechanic may **wrap an engine function** when a hook is not enough (for example to change how the hero moves):
  `const _up = updatePlayer; updatePlayer = function (w, p) { …; _up(w, p); … };`. Keep the wrap small and say why.
- Words shown to the player go through `tx('mech.<id>.<key>')` and live in the spec's `text` table, so they can be
  rewritten per customer. Words with a place in the level (a sign, a line someone says) are level-op arguments.
- A mechanic that must remember something across a save adds it to `Game` **and** to what `Game.save` / `Game.load`
  keep (wrap them), and proves it with the save-and-return checks.

### Rules the gate enforces

1. **Simulation and drawing are separate.** `step`/`update` may use only `rand()` / `RNG` for chance and `w.t` for time:
   no `Math.random`, no `Date`, no `performance.now`, no timers. `draw` functions never write simulation state
   (a draw-time cache goes in a `WeakMap` or a module variable that does not affect `step`).
   `mc verify` replays the same buttons with and without drawing and compares state hashes.
2. **State is plain data** in `w.mech.<id>`, on entities, or on `Game`. No closures holding simulation state, or
   the solver cannot keep and return to a moment.
3. **Nothing can strand the player.** Every situation has a way forward or a way back to the last lantern.
   Falling, dying and reloading at any checkpoint must leave the mechanic in a state it can continue from.
4. **Touch works.** The game has six actions (left, right, down, jump, fire, light) plus menus. A mechanic may give
   them new meanings; it may not need a seventh.
5. **No text baked into art**, no network, no new fonts, nothing outside the one file.

## The base GameSpec

Copy the shape of `games/starlight-queen.json`. The skeleton every template shares, because the engine's scenes
are built on it: a title; a prologue of up to 6 cards; a road of lands (`regions`) with lanterns (`cp`), signs,
beacons, collectibles (`gems`), keepsakes (`keeps`), wonders; one companion (`npc`); one climax (`arena`); one final
beacon; an epilogue of up to 5 cards. What changes per template is the mechanic, the lands and what the story
makes of that skeleton. Set `"template": "<id>"` and `"mechanics": ["<id>"]`.

## Commands

```
node bin/mc.js validate templates/<id>/base.json
node bin/mc.js build    templates/<id>/base.json -o out/<id>.html         # open it and play it yourself
node bin/mc.js play     templates/<id>/base.json --bot naive --seed 7 --shot out/shots/<id>   # watch a bot; screenshots
node bin/mc.js solve    templates/<id>/base.json --minutes 20             # can it be finished at all?
node bin/mc.js verify   templates/<id>/base.json                          # the whole gate; exit 0 only if all pass
MC_LOG=debug node bin/mc.js …                                             # everything, in out/logs
```

A template is done when `mc verify` passes on its base game and an independent reviewer who has looked at the
screenshots and read the script agrees that the mechanic is the heart of the game and not an ornament.

## template.json

```json
{
  "id": "long-road-home",
  "name": "The Long Road Home",
  "structure": "the story shape, in a sentence",
  "pitch": "one sentence shown to the customer at the preview: “This sounds like a long road home.”",
  "fits": "what kind of person or answers this template suits; when not to choose it",
  "notForChildren": false,
  "mechanic": { "id": "boat", "what": "what the player does", "meaning": "what it means in the story" },
  "cast": {
    "hero":       { "placeholder": "Wren",  "pronouns": "she" },
    "companion":  { "placeholder": "Tam",   "pronouns": "he", "role": "who is beside them or waiting at the end" },
    "guide":      { "placeholder": "the Ferryman", "role": "who sends them off; may be a creature or a thing" },
    "antagonist": { "placeholder": "the Calm", "role": "never a real person: a habit, a fear, a long winter" }
  },
  "spine": [ { "beat": "The call", "where": "prologue cards 1–2", "job": "what this beat must do" } ],
  "storyText": [ "world.the-snow-thins-a" ],
  "notes": { "regions.0.ops.14": "teaches hiding: must tell the player to hold [↓]" },
  "replay": "what is different on a return visit, and why anyone would come back",
  "voice": "notes for the writers: register, what the narrator never does"
}
```

- `cast.*.placeholder` is the name used throughout `base.json`; the Story Room replaces it and rewrites every line.
- `storyText` lists the keys of the spec's `text` table that carry story and are rewritten per customer. Every
  other key is interface (menus, button hints) and is left alone.
- `notes` pins what a particular line must still do after it is rewritten. Paths are into `base.json`.
  Any `[KEY]` token in a line is kept automatically.
