# Starlight Queen — A Tale of the Seven Stars

A classic side-scrolling 2D platformer for the browser, in an original high-fantasy world.
You are **Aelara, Queen of the Silverwood**. The Ashen King has torn the seven stars from the
sky and bound them in a crown of cinders. Travel east across Aurelin, rekindle the beacons,
and break the Cinder Crown.

No build step, no dependencies, no asset files: every sprite, backdrop, sound and tune is
generated in code.

## Play

Open `index.html` in any modern browser, or serve the folder:

```sh
cd starlight-queen
python3 -m http.server 8000   # then visit http://localhost:8000
```

| Action | Keyboard | Gamepad | Touch |
| --- | --- | --- | --- |
| Walk | ← → or A D | stick / d-pad | ◀ ▶ |
| Leap (hold for height) | Space, ↑, W or Z | A / B | ▲ |
| Glide | press Leap again in the air and hold | same | same |
| Starlight arrow | X, J, K or Shift | X / Y | ✦ |
| Drop through a ledge | ↓ + Leap | | |
| Pause | Esc or P | Start | II |
| Sound on/off, fullscreen | M, F | | |

## The road

1. **The Greenmeads** — rolling hills, goblins and wolves
2. **The Silverwood** — great boughs and the spiders that haunt them
3. **The Sunken Halls** — torch-lit dwarven deeps, lava and a bridge troll
4. **The Mourning Fens** — do not follow the lights
5. **Mount Gloam** — the Cinder Throne and the Ashen King

Leap on foes or loose arrows (the quiver of three refills over time). Rune blocks hold
starshards (100 = an extra life), honeycakes (heal), starblooms (brief radiance) and silver
leaves (extra life). Lanterns are checkpoints. Progress is saved per chapter in the browser.

## Code map

| File | Purpose |
| --- | --- |
| `js/core.js` | constants, helpers, keyboard / gamepad / touch input |
| `js/audio.js` | WebAudio sequencer, songs and sound effects |
| `js/art.js` | sprites, tiles, glow, HUD digits |
| `js/backdrops.js` | themes, parallax backdrops, scenery, ambient particles |
| `js/levels.js` | the five levels, written with a small builder API |
| `js/entities.js` | the Queen, foes, pickups, the boss |
| `js/world.js` | simulation step, camera, lighting, rendering |
| `js/scenes.js` | title, prologue, map, play, game over, ending |
| `js/main.js` | boot, fixed-timestep loop, presentation |

For testing, `index.html?level=3` starts at a chapter; adding `&god` ignores enemy damage.
