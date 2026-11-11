# Starlight Queen — Ana & the Mountain of Light

A side-scrolling story for the browser, written for grown-ups who were once children waiting
for a letter, a wardrobe, or a wizard at the door.

**Ana** grew up at the last fence of Kaamos, a small town at the top of Finland whose name means
the long dark, looking at the place where the road stops being Kaamos and becomes everywhere
else. The old people say the north belonged to the elves once. Then comes the winter that does
not end: a king in the west has shut the world's light inside its great diamonds, and the sun
rises thin as a coin and warms nothing. The summer is in those stones, and each one she takes up
eases the weather a little: the snow thins, the cloud opens. Ana holds out her hand, and
starlight comes down into it. So she goes to fetch every one: across the frozen
gulf to the manic lands of Sweden, dancing so the last midsummer cannot leave; down through the
iron deeps of Kiruna; over the sea to a far country called America; and, through a tear in the
afternoon, to an Australia where it is already tomorrow. At the end of the road is the Hoarder
King, the Koh-i-Noor, and **Mayank**, who has walked from India on the word of a dream, carrying
a lantern. He knows the shore where the sun goes last of all. They carry the diamonds west to
Kauaʻi, and there Ana opens her hands and lets the summer out: the end of the quest, and
"the beginning of a new adventure."

It is a walk more than a fight: calm, painted, and short on words. There are things to find and
things to simply stand and look at.

One long, continuous road. No build step, no dependencies, no asset files: every picture,
sound and tune is made in code, and painted at your screen's own resolution.

## Play

Open `index.html` in any modern browser, or serve the folder:

```sh
cd starlight-queen
python3 -m http.server 8000   # then visit http://localhost:8000
```

**As an app that caches itself:** when the folder is served from a web address (any static host),
the game keeps a copy of itself on the device after the first visit (`sw.js`,
`manifest.webmanifest`) and plays offline from then on. On an iPhone or iPad: open the address
in Safari, Share, Add to Home Screen.

**Download button:** when the one-file build is served from a web address (`build-offline.py --site`),
the title screen shows a gold **Download the game** button that saves that same file.

**Playing with no internet:** `offline/Starlight Queen.html` is the whole game in one file,
typefaces included. Copy it to any laptop and double-click it. Rebuild it with
`python3 build-offline.py` after changing the game.

| Action | Keys |
| --- | --- |
| Walk | ← → or A D |
| Leap (hold for height) | Space, W or ↑ |
| Glide | leap again in the air and hold |
| Starlight arrow | X, F or K |
| Raise her starlight | E, C or Shift (L on the right hand) |
| Cloak: be a stone by the road | hold ↓ or S, standing still |
| Drop through a ledge | ↓ + leap |

Esc pauses, M toggles sound, G toggles fullscreen, V opens the Windowsill from the title.

**A hidden way in:** on the title screen press **T** (or tap the little stone above the name
three times) to begin from any land: Sweden, Kiruna, the sea, America, Australia, the mesa, the
Hoarder King's door, or past him. Whatever the current journey has found comes along.
A gamepad works, and touch buttons appear on phones. The prologue and epilogue wait for you:
Enter or a tap turns the page, ← goes back.

## A gentle road

- **Five hearts**, refilled when a lantern is first kindled, and the local food heals.
- **Falling costs nothing.** Starlight lifts Ana out of any pit, sea or lava and sets her back
  where she last stood.
- **Starlight**, raised in her hand, wakes sleeping runestones and bridges that are only there
  in it, opens doors that only show in it, makes creatures shy away, undoes dust-wraiths, and
  opens the tear to Australia. A key appears over her head wherever it is wanted.
- **The cloak** hides her from wolves and from the Hoarder King's gaze.
- **Beside a lantern nothing can harm her**: no creature, and not his gaze.
- **A tap is enough.** One tap of the light opens a door; the shortest leap clears a two-tile step.
- **Nobody is kept at the Hoarder King.** Each fall wears him down, and after the fourth his fire
  goes out by itself.
- While there is a wonder to look at, everything else on the road stops to look too.
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

Everything found stays on the **Windowsill**. At the end the journey is graded like a stone on its
four Cs: **carat** (diamonds carried), **colour** (melee gathered), **clarity** (wonders seen)
and **cut** (keepsakes brought home).

## Code map

| File | Purpose |
| --- | --- |
| `js/core.js` | constants, helpers, keyboard / gamepad / touch input |
| `js/audio.js` | WebAudio sequencer, songs and sound effects |
| `js/gems.js` | the thirteen diamonds and the faceted gem renderer |
| `js/backdrops.js` | the lands: their colours, music, food, scenery lists; the aurora |
| `js/paint.js` | the painted look: skies, misty ridgelines, the ground, water, figures |
| `js/paint-props.js` | trees, houses, small scenery, flames, weather |
| `js/paint-life.js` | the creatures of each land, the Hoarder King, items, keepsakes |
| `js/levels.js` | the road, region by region, written with a small builder API |
| `js/entities.js` | Ana, creatures, pickups, diamonds, keepsakes, the boss, Mayank |
| `js/wonders.js` | the seven wonders and the tear in the afternoon |
| `js/world.js` | simulation step, camera, starlight, region blending, rendering |
| `js/scenes.js` | title, prologue, map, play, diamond cards, the Windowsill, graded ending |
| `js/main.js` | boot, fixed-timestep loop, presentation |

For testing, `index.html?at=300&alt=3` starts at a tile column and height; `&god` ignores
enemy damage, `&down` starts with the Hoarder King already fallen.
