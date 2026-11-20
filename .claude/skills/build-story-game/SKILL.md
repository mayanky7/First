---
name: build-story-game
description: How to build a personalised, story-led browser game to the Starlight Queen standard. Use when creating or extending a game for the Main Character product, a new template, or a one-off game about a real person.
---

# Building a story game

Learned building Starlight Queen (`starlight-queen/`). The product spec is `maincharacter/SPEC.md`;
the release bar is `maincharacter/QUALITY-BAR.md`. Read both before starting.

## Order of work

1. **Story before anything.** One paragraph: who the hero is, what was lost, who waits at the end,
   and the one image the story turns on (for Starlight Queen: the light shut inside the diamonds).
   Every mechanic and every land must serve that image. If a mechanic has no story reason, cut it
   or change the story until it has one.
2. **Fact ledger.** List exactly what the person told you about real people. Invent the world
   freely; invent nothing about them or their families.
3. **Engine shape.** Plain JS, 2D canvas at logical 384×216, fixed 60 Hz `step()` apart from
   `frame()`, one test hook on `window` exposing state, `step`, `frame` and input. Add URL
   parameters to start anywhere. Without these you cannot test, so they come first.
4. **One land, finished.** Paint one land to final quality, with its weather, props, one wonder
   and its music, before making a second. Get the look approved here.
5. **The road.** Levels, checkpoints, collectibles, the antagonist.
6. **Words last, and few.** Write, then cut by half, then cut again.
7. **Build to one file**, host it, and verify the hosted bytes match the build.

## What goes wrong, every time

- **Art:** the first style is rarely right. Calm, painted vector art was accepted; pixel art was
  not. Show one finished screen early rather than ten rough ones.
- **Text:** there is always too much. ≤ 40 words a card, ≤ 6 prologue cards, ≤ 5 epilogue cards.
  Put captions where a thumb will not cover them.
- **Softlocks:** any gate, door or one-way drop can trap a player. Test from every checkpoint
  with a bot that only holds forward and jumps.
- **Touch:** read button state from finger positions on every touch event; never rely on
  per-button pointer capture. Release everything on blur, hide and cancel. Emulation does not
  prove it; a real phone does.
- **Numbers:** `Math.max(undefined, n)` is `NaN`. Default every timer.
- **Safe places must be safe:** a player idling at a checkpoint must never be hurt.
- **Overlaps:** effects drawn late land on top of text. Check every card with its backdrop.
- **Stress:** the audience asked for wonder, not difficulty. After repeated deaths, ease the spot.

## Verification habits

- Keep a roster of bots with different habits (expert, naive, masher, tapper, idler, thumbs).
  One general playthrough finds little; narrow bots find a lot.
- Every bug a person finds becomes a bot or a check before it is fixed.
- After each major feature, get an independent review from someone with no stake in the work,
  from several directions at once (story, art, play, bugs). Address every finding or say why not.
- Nothing is done until a recorded run shows it working on the hosted build.

## Shipping

- Never commit a passcode or secret. Gate secrets live in the host's settings.
- The hosted game is a build product: rebuild it, do not hand-edit it.
- A downloaded copy does not update itself; say so.
