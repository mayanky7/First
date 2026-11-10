# Starlight Queen — Ana & the Mountain of Light

A classic side-scrolling 2D platformer for the browser. **Ana** loves adventure more than
anything, and she is stuck in Kaamos, a small town at the top of Finland where nothing has ever
happened. Then word comes that a Hoarder King is gathering the world's great diamonds for
himself. Somebody small will have to fetch them back. Walk out past the last gate, cross the
frozen gulf to the manic midsummer lands of Sweden, sail to a faraway world called America,
meet Sam, and win back the Koh-i-Noor — and come home a queen of starlight.

One long, continuous road. No build step, no dependencies, no asset files: every sprite,
backdrop, sound and tune is generated in code.

## Play

Open `index.html` in any modern browser, or serve the folder:

```sh
cd starlight-queen
python3 -m http.server 8000   # then visit http://localhost:8000
```

| Action | One player | Two players: Ana | Two players: Sam |
| --- | --- | --- | --- |
| Walk | ← → or A D | A D | ← → |
| Leap (hold for height) | Space, W or ↑ | W or Space | ↑ |
| Glide | leap again in the air and hold | same | same |
| Arrow / sling | X, F or K | X or F | K or / |
| Drop through a ledge | ↓ + leap | S + leap | ↓ + leap |

Esc pauses, M toggles sound, G toggles fullscreen, V opens the Vault from the title.
Gamepads work (first pad is Ana, second is Sam), and touch buttons appear on phones.

**Co-op:** once Ana meets Sam in America, a second player presses **2** to join or leave.

## The diamonds

Twelve diamonds lie along the road, growing grander as it goes, each in a spot that takes
some finding. Collecting one opens a card with its carat, cut, colour, clarity and origin, and
a short lesson. The first six are teaching stones invented for the game (carat, cut, clarity,
colour, fancy colour, where diamonds come from). The last six are real: Uncle Sam (buried — bump
the right block), the Dresden
Green, the Hope, the Tiffany Yellow, Cullinan I and the Koh-i-Noor, described with their real
figures. The small sparkles are *melee* — the trade's word for diamonds under a fifth of a carat.

Every diamond you have ever found stays in the **Vault**. At the end, the journey itself is
graded on the four Cs: **carat** (diamonds found), **colour** (melee gathered), **clarity**
(hits taken) and **cut** (time). Your finest grade is kept on the title screen.

## The road

Finland (Kaamos, the frozen Gulf of Bothnia) → Sweden (the midsummer lands, the iron deeps of
Kiruna) → the western sea → the United States (red rock country, the Hoarder King's mesa).
Lanterns and beacons are checkpoints; there are no lives, only flaws on your final grade.

## Code map

| File | Purpose |
| --- | --- |
| `js/core.js` | constants, helpers, keyboard / gamepad / touch input |
| `js/audio.js` | WebAudio sequencer, songs and sound effects |
| `js/gems.js` | the twelve diamonds and the faceted gem renderer |
| `js/art.js` | sprites, tiles, glow, HUD digits |
| `js/backdrops.js` | themes, parallax backdrops, scenery, ambient particles |
| `js/levels.js` | the road, region by region, written with a small builder API |
| `js/entities.js` | Ana, Sam, foes, pickups, diamonds, the boss |
| `js/world.js` | simulation step, camera, region blending, lighting, rendering |
| `js/scenes.js` | title, prologue, map, play, diamond cards, vault, graded ending |
| `js/main.js` | boot, fixed-timestep loop, presentation |

For testing, `index.html?at=300&alt=3` starts at a tile column and height; `&god` ignores
enemy damage, `&coop` starts with both players.
