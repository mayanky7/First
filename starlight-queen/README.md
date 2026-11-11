# Starlight Queen — Ana & the Mountain of Light

A side-scrolling story for the browser, written for grown-ups who were once children waiting
for a letter, a wardrobe, or a wizard at the door.

**Ana** waited hardest, in Kaamos, a small town at the top of Finland named for the dark, where
every child wears a reflector on the coat: a plastic snowflake that makes no light of its own.
It waits for yours, and hands it back. Nothing came for her. So, years later, she goes herself:
across the frozen gulf to the manic midsummer lands of Sweden, down through the iron deeps of
Kiruna, over the sea to a far country called America, and, through a tear in the afternoon,
to an Australia where it is already tomorrow. At the end of the road is a Hoarder King, the
Koh-i-Noor, and **Mayank**, who has walked from India on the word of a dream, carrying a lantern.

It is a walk more than a fight. There are things to find and things to simply stand and look at.

One long, continuous road. No build step, no dependencies, no asset files: every sprite,
backdrop, sound and tune is generated in code.

## Play

Open `index.html` in any modern browser, or serve the folder:

```sh
cd starlight-queen
python3 -m http.server 8000   # then visit http://localhost:8000
```

| Action | Keys |
| --- | --- |
| Walk | ← → or A D |
| Leap (hold for height) | Space, W or ↑ |
| Glide | leap again in the air and hold |
| Starlight arrow | X, F or K |
| Hold up the reflector | E, C or Shift (L on the right hand) |
| Cloak: be a stone by the road | hold ↓ or S, standing still |
| Drop through a ledge | ↓ + leap |

Esc pauses, M toggles sound, G toggles fullscreen, V opens the Vault from the title.
A gamepad works, and touch buttons appear on phones. The prologue and epilogue wait for you:
Enter or a tap turns the page, ← goes back.

## A gentle road

- **Five hearts**, refilled at every lantern, and the local food heals.
- **Falling costs nothing.** Starlight lifts Ana out of any pit, sea or lava and sets her back
  where she last stood.
- **The reflector** borrows starlight: it wakes bridges that are only there in it, opens doors
  that only show in it, undoes dust-wraiths, and opens the tear to Australia.
- **The cloak** hides her from wolves and from the Hoarder King's gaze.
- Nothing is timed, and nothing counts your mistakes.

## What there is to find

**Thirteen diamonds**, growing grander as the road goes on. Each opens a card with its carat,
cut, colour, clarity and origin, and a short lesson. Six are teaching stones invented for the
game; seven are real — Uncle Sam, the Dresden Green, the Hope, the Argyle Alpha, the Tiffany
Yellow, Cullinan I and the Koh-i-Noor — described with their real figures. The small sparkles
are *melee*, the trade's word for diamonds under a fifth of a carat.

**Seven wonders**, which give you nothing but the having seen them: the Fox Fires over Finland,
a midsummer dance in Sweden, the Under-Sky in the Kiruna mine, a whale at sea, a stone window
in the red rock, the Stone Kings, and the Southern Cross.

**Seven keepsakes**, one small true thing from each land, and each land's own food and
creatures: småtroll and mine-folk, coyotes and jackalopes, cane toads, magpies and one drop bear.

Everything found stays in the **Vault**. At the end the journey is graded like a stone on its
four Cs: **carat** (diamonds carried), **colour** (melee gathered), **clarity** (wonders seen)
and **cut** (keepsakes brought home).

## Code map

| File | Purpose |
| --- | --- |
| `js/core.js` | constants, helpers, keyboard / gamepad / touch input |
| `js/audio.js` | WebAudio sequencer, songs and sound effects |
| `js/gems.js` | the thirteen diamonds and the faceted gem renderer |
| `js/art.js` | sprites, regional creatures, foods, keepsakes, tiles |
| `js/backdrops.js` | themes, parallax backdrops, scenery, ambient particles |
| `js/levels.js` | the road, region by region, written with a small builder API |
| `js/entities.js` | Ana, creatures, pickups, diamonds, keepsakes, the boss, Mayank |
| `js/wonders.js` | the seven wonders and the tear in the afternoon |
| `js/world.js` | simulation step, camera, starlight, region blending, rendering |
| `js/scenes.js` | title, prologue, map, play, diamond cards, vault, graded ending |
| `js/main.js` | boot, fixed-timestep loop, presentation |

For testing, `index.html?at=300&alt=3` starts at a tile column and height; `&god` ignores
enemy damage, `&down` starts with the Hoarder King already fallen.
