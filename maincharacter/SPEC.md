# Main Character — product specification

Working title. Status: draft 3, revised after three independent reviews (section 14).
Companion document: [QUALITY-BAR.md](QUALITY-BAR.md), which defines exactly how every claim in
this document is verified.

> **The pitch:** Now anyone can build a game where they're the main character.

A person answers a few questions on the home page. A few minutes later they receive a link to a
complete game about *them*, or about someone they love: the name, the town, the person waiting at
the end, the thing they always say. It is one HTML file, hosted on the site, playable on a phone
or a laptop, and downloadable to keep.

The first game of this kind already exists: **Starlight Queen** (`../starlight-queen/`). This
product is the machine that makes the next ten thousand.

---

## 1. What the customer experiences

1. **Home page.** One sentence of pitch, one playable example, one button: *Make mine*.
2. **The interview.** A few questions, about three minutes (section 3).
3. **The preview** (within about a minute). The premise in two sentences, the hero in costume, the
   template chosen. The customer approves, or changes an answer, before the long work starts.
4. **The wait.** A "making of" screen showing real progress. Target times are in section 9.
5. **The reveal.** A private link opening straight onto the title screen. A gold *Download the
   game* button saves the same single file for offline play.
6. **Play.** 15–25 minutes for a first run; built to be returned to (section 7).
7. **Answer back.** Whoever receives the game can reply to it, which makes the next chapter.

What "autonomous" means here: games are generated, played, judged and repaired with no person in
the loop. The one exception is stated plainly: if a failure turns out to be in the engine itself
rather than in one game's content, that job stops and a person fixes the engine (section 5.5).

## 2. What is *not* in version 1

- **No photo upload or face likeness.** Costumes come from described traits. This narrows
  "personalised costumes" from the brief and is listed as an owner decision in section 13.
- No free-form game design by the customer. They shape the story; the templates own the mechanics.
- No online multiplayer and no global leaderboards. There is same-device versus play (section 7).
- No account needed to play. An account is needed only to create and manage one's games.
- **No generated code per game.** Each game is *data* run by a verified engine (section 5). This
  is the most important decision in the document: it is what makes "bug free, in minutes" possible.
- English only at launch. Names in any script are supported (QUALITY-BAR S-14).

## 3. The interview

The first screen asks one thing: **is this game for you, or for someone else?** Everything after
is worded accordingly. Then eight questions, each written to draw out scenes, objects and speech
rather than adjectives. Every question must change something visible in the game.

| # | Question (gift wording) | What it drives |
|---|-------------------------|----------------|
| 1 | Their name, how to refer to them (she / he / they), and how you'd spot them across a room. | Name, pronouns, costume, silhouette |
| 2 | Where does their story start? A real place or one you make up. | First land: chosen from our theme packs, named and dressed for this place |
| 3 | What is something they always say? | A recurring line; the voice of the script |
| 4 | What one object would they save from a fire? | The carried item or the collectible |
| 5 | Describe one afternoon with them you would live again. | The image the story turns on |
| 6 | What are they quietly proud of? What gets in their way? (A habit, a fear, a long winter. Not a person.) | The hero's strength; the antagonist, who is never a real person |
| 7 | Who is beside them, or waiting at the end? | Companion or reunion |
| 8 | When the last screen fades, what should they feel? Is there something you have never quite said? | Tone, ending, the final card |

- **One follow-up per thin answer.** "You said *kind*. Tell me one time." At most three follow-ups.
- **Invent the world, never the person.** The game necessarily invents an adventure. It may not
  make real-world claims about a real person (relatives, jobs, opinions, past events outside the
  fiction) that the answers did not supply (QUALITY-BAR W-8). Real people are never antagonists.
- **Template choice is automatic**, shown at the preview ("This sounds like a long road home"),
  and can be switched there.
- Answers that name a protected work ("she loves a certain boy wizard") are honoured in spirit and
  shown to the customer as *declined: someone else's world* rather than silently dropped.
- Answers are moderated before any generation (section 10).

## 4. The ten templates

Each template is an **original** work built on a story structure older than any one book. The
famous works in the brief are reference points *for structure only*. No template and no generated
game may use a name, place, creature, phrase, design or distinctive plot device from a protected
work (QUALITY-BAR S-9). The Odyssey and the monomyth are public domain; everything else is
treated as off limits beyond its shape.

Every template owns: a story spine, one **signature mechanic** no other template has, a library
of hand-built rooms, theme packs, a costume family, an antagonist pattern, and a replay hook.
All mechanics live in the same side-view 2D engine; none needs a second physics model.

| # | Template | Structure | Signature mechanic | What changes on a return visit |
|---|----------|-----------|--------------------|--------------------------------|
| 1 | **The Light Gatherer** | Restore the world; reunion at the end (Starlight Queen, the reference) | Carry a light that opens doors and bridges; the weather mends with every stone | Stones hidden deeper; a night version of each land; what you say at the reunion |
| 2 | **The Call** | The hero's journey | A mentor walks with you and does the hard things; then the mentor is gone, and each thing they did becomes yours to learn alone | Which lesson you learn first reshapes the route |
| 3 | **The Long Road Home** | The Odyssey | A side-view boat on wind and swell between islands; every island offers a reason to stay, and leaving costs something you gathered | Which islands you land on; what you still have when you arrive |
| 4 | **The Burden** | The long walk to let go of something | You carry a thing that grows heavier and changes how you move; companions each take a turn carrying *you* | Who walks with you; who is there at the end |
| 5 | **The Hidden School** | An ordinary child, a secret place of learning, one year | Three verbs learned in three lessons; authored rooms that ask for them in combination | Optional harder rooms; a different speciality |
| 6 | **The Family** | The rise, and what it costs | One street. Every favour visibly moves someone to or from your table; the last scene is that table | Three endings, decided by who is still sitting there |
| 7 | **The Crew** | The job, the plan, the twist | One hero; crew members are abilities you call in, each once per room; the twist takes one away | Graded plans; opt-in time attack |
| 8 | **The Question** | The mystery | Carry an object to a person and catch their story against it; contradiction opens the next scene | The culprit is fixed; deeper truths are optional and only found on later runs |
| 9 | **The Contest** | The underdog and the ladder | Short skill trials against rivals with habits you can learn | Medals, rival rematches, opt-in time attack |
| 10 | **The Descent** | Going down into the dark to bring someone back | Go down through a layered underworld; on the climb out they follow behind, heard but not seen, and you must never turn around | The no-turning climb, harder each time; what you say at the surface |

Rules across templates:

- **General audience.** No gore, no sexual content, no slurs; menace by implication.
- **The Family is not offered when the recipient is a child**, and its "family" is always invented.
- Templates are built one at a time in the order of section 12.

## 5. Architecture

```
 answers ─► Story Room ─► GameSpec (JSON) ─► Compiler ─► one .html
              (writers)       ▲    │                        │
                              │    ▼                        ▼
                          Repair ◄── Per-game gate ◄── bots play it; judges read it
                                          │ pass
                                          ▼
                                       Publish ─► separate game origin /g/<id>

 Engine + template + room library ─► Template gate (heavy; once per version, not per game)
```

### 5.1 The engine (hand-built, verified once per version)

Extracted from Starlight Queen:

- Plain JavaScript, 2D canvas, logical 384×216, fixed 60 Hz `step()` apart from `frame()`.
- **Strict split between simulation and decoration.** Simulation uses only a seeded random
  generator and an injected clock; particles, ambience and adaptive rendering quality use their
  own and never touch simulation state. (Starlight Queen today has about 45 unseeded random calls
  and wall-clock quality scaling; separating these is milestone 1 work.)
- `Paint.*` vector painter, procedural audio, embedded fonts. No external files of any kind.
- Input: keyboard (by physical key), touch (finger-position sync), gamepad.
- Save state namespaced by game id; checkpoints; title, pause and ending scenes; offline build.
- **Text and audio manifests.** Every frame the engine can report each string drawn (id, box,
  colour, size) and each sound started. Text is canvas-drawn, so this is the only reliable way to
  check fit, overlap, contrast and coverage.
- **Test hook.** State, `step`, input injection, state hash. It activates only when the harness
  injects a flag before page load; it cannot be switched on from a URL. Debug URL parameters from
  Starlight Queen (`?at`, `&god`) are removed from shipped games.
- **Mechanic modules**, one per template, with a fixed interface: `init`, `step`, `draw`,
  `serialize`, `invariants`, `progress`, and a **solver** that can find routes through any room.
  Written and verified by us. Never generated per customer. The solver is a significant piece of
  work for the puzzle-led templates (5, 7, 8) and is scoped per template in section 12.

### 5.2 What is hand-made, and what is generated

The reference game is hand-placed, tile by tile: every joke, wonder and teaching beat sits where a
person put it. A formula does not produce that. So:

| Hand-made by us, once, and individually verified | Generated per customer |
|--------------------------------------------------|------------------------|
| Engine and mechanic modules | Story bible and every word of script |
| **Room library:** 40–80 rooms per template, each tagged by story beat, difficulty and what it teaches, each with marked slots for signs, props and personal objects | Which rooms, in what order, for this story's beats |
| **Theme packs:** 8–10 painted lands per template (palette, sky, weather, parallax, props, music) | Which packs, their names, signs and dressing |
| **Costume kit:** per costume family at least 30 hair shapes, 40 outfit pieces and 60 accessories, each approved in every animation pose | Which pieces and colours, from the description |
| Wonders, creatures, antagonist patterns | Their names, lines and placement in slots |

The **GameSpec** is the JSON document recording those choices: `meta` (ids, engine version, seed),
`cast` with costume specs, `lands`, `rooms` in sequence, `script`, `ledger` (every customer fact
and where it is used, or why it was declined), and `replay` settings. It is validated against a
schema. Because a game is data, most bugs become invalid data that is rejected before play.

An honest limit: an invented home town can only be a renamed, re-dressed theme pack. The answer
for a place we have no pack for is a new pack, added to the library, not improvisation.

### 5.3 The Story Room

Separate model calls with separate jobs, so that no call marks its own homework:

1. **Reader:** answers → fact ledger and premise. Flags unsafe or thin answers; asks follow-ups.
2. **Showrunner:** picks the template; writes the bible: theme, the central image, what the hero
   wants, what they need instead, what they believe at the start and at the end.
3. *(Preview shown to the customer here.)*
4. **Writers:** three complete drafts in parallel, within the word budgets.
5. **Editor:** picks, merges, cuts. Standing instruction, learned the hard way: there is always
   too much text.
6. **Art director:** costume pieces and theme packs; harmony and contrast checked by code.
7. **Level designer:** sequences rooms to the story's beats; fills slots.
8. **Assembler:** emits the GameSpec.

Answers are treated as untrusted text everywhere: quoted as data to every model, never as
instructions (QUALITY-BAR V-8), and escaped on the way into the file (S-13).

Models are named in configuration. Default: the most capable Claude model for writing and
judging; a fast one for classification and moderation.

### 5.4 Compiler

Deterministic: GameSpec + engine version → one HTML file, byte-identical every time, running from
`file://` with no network.

### 5.5 Verification and repair

Defined in QUALITY-BAR. Two tiers, because playing everything on every browser for every game
cannot fit in minutes:

- **Template gate** (hours; per engine or template version): the full browser and device matrix,
  monkey testing, soak, performance, touch, every room, every costume piece, every theme pack.
- **Per-game gate** (minutes; every job): this game's rooms in this order with this script are
  actually played start to finish by bots; the script, look and replay are judged.

Repair edits the GameSpec only. If the cause is in the engine or a room, the job stops, the
defect is filed against the engine, and the customer is told their game needs longer. A person
handles those; target is a fix or an honest message within one working day.

### 5.6 Site, hosting and security

Proposed, confirmed at milestone 7:

- Cloudflare: Pages (site), Workers (API), R2 (game files), D1 (jobs, ledgers), Queues (pipeline).
- Generation and verification run in container workers with headless browsers.
- **Games are served from a separate, cookie-less origin** with a strict content security policy,
  so a game file can never reach an account. Storage keys are namespaced per game.
- Secrets only in the host's secret store. Never in a repository.
- Every delivered game pins its engine version; engine updates never change a delivered game.

## 6. The command line, and logging

Everything the site does, the CLI does; the site is a thin skin over it.

```
mc new --answers answers.json            # whole pipeline; prints the job id
mc story <job>                           # story room only → GameSpec
mc build <gamespec.json> -o game.html    # compile
mc verify game.html [--gate P] [--json]  # per-game gate; exit 0 only if all pass
mc verify-template <template>            # template gate
mc play game.html --bot naive --seed 7   # one bot run, with trace and screenshots
mc judge game.html --panel script        # one judge panel
mc repair <job>                          # apply findings, re-verify
mc mutate <template>                     # seed known bugs; check the gates catch them
mc report <job>                          # verdict with evidence
mc replay <trace>                        # re-run a recorded trace frame by frame
mc cost <job>                            # tokens, compute and time per stage
```

Logging is on by default:

- **Pipeline:** one structured line per stage per job (input and output hashes, model, duration,
  tokens, verdict). Every prompt and response is stored against the job.
- **Verification:** each bot run stores its input trace, periodic state hashes, screenshots, the
  text and audio manifests, console output and the first failing frame. Any failure replays.
- **In the shipped game:** a ring buffer of the last 2,000 events, shown by a hidden key
  combination and attachable to a "something went wrong" report. Nothing leaves the device unless
  the player sends it.

## 7. Why anyone plays it twice

The brief asks for Mario Kart. That game is replayed because runs are short, runs differ, mastery
shows, and there is another person on the sofa. A gentle gift for someone's mother must not put a
stopwatch on her (the reference promises "nothing is timed, and nothing counts your mistakes").
So replay is built from what a personal game uniquely has, with competition strictly opt-in:

1. **Answer back.** The recipient finishes, answers three questions of their own, and a reply
   chapter is generated in which the two stories meet. This is the loop no shop-bought game has.
2. **Choices that change the ending and the keepsake.** The last scene and a saveable keepsake
   card differ by what was done on the road.
3. **Hidden personal details.** Some of the customer's details are placed where only a second,
   slower run finds them.
4. **Remix.** The same answers told through a different template.
5. **Two players, one device.** Every template has a short versus or co-op mode on a shared
   keyboard or two gamepads, using its signature mechanic. This is the true Mario Kart analogue.
6. **Opt-in trials.** Time attack, medals, ghosts and "beat my run" links, off by default,
   offered after the first finish, and central only in The Crew and The Contest.

## 8. The process, learned from Starlight Queen

Captured as a skill in `.claude/skills/build-story-game/SKILL.md`.

| What happened on Starlight Queen | What the product does about it |
|----------------------------------|--------------------------------|
| The first art style was rejected | Art comes from hand-built, approved kits and packs, not from per-game invention |
| "Too much text everywhere" | Hard word budgets; an editor whose only job is to cut |
| A player was stuck at a gate | Softlock is defined precisely and hunted from every checkpoint |
| Touch buttons stuck on | Multi-finger, slide, cancel and app-switch scripts, plus real devices |
| A `NaN` from an undefined timer | Every number in state is checked finite on every frame |
| Lights were drawn over the ending text | Text manifest: overlap and contrast checked against real pixels |
| Idle player hurt at a "safe" lantern | Idle bot at every checkpoint |
| Zoom and portrait glitches | Rotation, resize, zoom and sleep scripts |
| Each review found what the last missed | Many narrow bots and checks, not one general review |
| Fixes declared done before proven | Nothing is done without a recorded passing run |

## 9. Time

The brief says "a few minutes". An independent estimate of the work per game, even after moving
the heavy testing to the template gate: about 2–3 minutes of writing, 1–2 of bot play, 2 of
judging, and 2–4 for each repair round.

- **Preview** (premise, costume, template): target under 60 seconds.
- **Finished, fully verified game:** target median **8 minutes**, 95th percentile **15 minutes**.
- These are targets, not measurements. Milestone 1 measures the cost of one simulation step,
  which decides them. If a job passes 5 minutes the customer is offered a notification.
- A game is never shown before it passes. Speed is bought with parallel hardware, never by
  skipping a gate.

## 10. Safety and privacy

- Answers are moderated before generation: no sexual content, hate, harassment of a named person,
  or anything sexualising or endangering a child. Tender subjects (grief, illness, distance) are
  welcome and handled with the gentlest tone; refusing them would fail the people this is for.
- Third-party private details (addresses, phone numbers, health details) are detected and kept
  out of the game unless they are plainly the point of the story and the customer confirms.
- Answers and games are private by default, deletable, and never used as examples or training
  material without explicit opt-in.
- Abuse limits: per-account generation limits; a report link on every hosted game.
- The downloaded file contains only the game: no trackers, no network calls.

## 11. Cost

Tokens are not the constraint, but they are measured. `mc cost` records tokens, compute and time
per stage for every job. A ceiling per delivered game is set after milestone 5 from real numbers,
and pricing follows from it. Neither is guessed here.

## 12. Milestones

Each ends with a gate and an independent review. None starts before the last passes.

| # | Milestone | Done when |
|---|-----------|-----------|
| 0 | Spec and quality bar, independently reviewed | Owner signs off sections 13 and 14 |
| 1 | Engine extracted; simulation/decoration split; text and audio manifests; GameSpec; **Starlight Queen rebuilt from a GameSpec**; step cost measured | Rebuilt game passes every existing Starlight Queen bot and is deterministic (P-6) |
| 2 | **Vertical slice of one unlike mechanic** (The Question: no jumping, all talk and objects), rough art, to prove the mechanic interface and solver before anything is built on them | One playable room sequence passes S and P |
| 3 | Verification harness: gates S, P, X; mutation suite | V-1 (engine defects) and V-2 (the rebuild, 20 seeds) pass; the per-template parts of V-1 and V-2 pass at milestones 5, 6 and 8. Thresholds for X are set only after running the Starlight Queen rebuild through them |
| 4 | Judges: checklists, calibration shelves (written and human-graded here), holdout panel | V-3, V-4, V-6, V-7, V-8, V-9 pass |
| 5 | Template 1 complete: room library, theme packs, costume kit, Story Room; cost model | 10 of 10 varied customers' games pass with no human edits; **5 real people receive a game and are watched playing it** |
| 6 | Template 8 (The Question) complete, including two-player mode | Same bar as milestone 5 |
| 7 | Site, hosting, accounts, privacy, preview, wait screen, answer-back | L-1 to L-7 pass |
| 8 | Templates 2, 3, 4, 5, 6, 7, 9, 10: one row each in the plan, one at a time, each with its solver, 40–80 rooms, packs and kit | Each at the milestone 5 bar, including the 5-person playtest |
| 9 | Human calibration round; staged launch to a first cohort | V-5 passes; V-10 in force from here on; R-9 measured on at least 200 finishers |

Milestone 8 is most of the work. Each template is a small hand-made game plus its library; no
effort estimate is given until milestones 5 and 6 show what one costs.

## 13. Decisions for the owner

1. **Photos.** Draft says no photo upload in version 1. Allowing it would make costumes more
   personal and raises consent and privacy questions.
2. **Time.** Draft says a verified game in a median of 8 minutes rather than "a few". The
   alternative, showing a game before it is verified, contradicts "glitch free".
3. **Mario Kart.** Draft redefines this as section 7: answer-back, endings, two-player on one
   device, and competition as opt-in. Online play is excluded from version 1.
4. **A second model family for judging.** Judges from the same model family as the writers tend
   to like their own family's work. Using a second provider for part of the panel fixes that but
   sends customers' stories to another company. Draft says: not without the owner's approval;
   until then, human calibration carries more weight.
5. **Hand-made libraries.** "Nintendo standard" from rooms, lands and costumes we build by hand
   and the machine arranges. This is slower to build than pure generation and is the only route
   to that standard we believe in.
6. **Pricing and limits.** Not set here; depends on section 11.
7. **What "Emmy" and "Nintendo" mean in practice.** No outside jury sits on each game. Quality is
   measured against our own signed-off best work, by model panels that are themselves checked
   against people every quarter, and for art by human approval of everything in the libraries.
8. **What "no glitches" means in practice.** Exact checks allow nothing through that they can
   see. Their reach is proven by planting bugs: they must catch at least 95 % of them and every
   blocker. Judged checks may wrongly pass at most 2 % of weaker work. Nobody can honestly
   promise zero; this is the measured version of it.
9. **How autonomous.** Up to 5 % of jobs, and every engine defect, go to a person.
10. **How much play per game.** Each game is played start to finish by six kinds of bot. The
    other six kinds, and the full browser and device matrix, run once per template version.
11. **English only, general audience only,** at launch.

## 14. Review record

Draft 1 was reviewed independently from two directions: test methodology, and game design,
writing and architecture. Changes made in response:

- Levels are assembled from hand-built rooms, not generated by formula.
- Verification split into a template gate and a per-game gate so the time target is not fiction;
  the time target itself was moved from 5 to 8 minutes.
- Judge scoring replaced: evidence first, yes/no checks tied to quotes, a holdout panel,
  confirmed-critic findings only.
- Replay redesigned around the personal game; timers made opt-in; two-player added.
- Interview rewritten to pull scenes and speech; preview and follow-ups added; pronouns asked.
- Six templates' mechanics reworked; lifts from protected works removed from their descriptions.
- Word budget corrected against the reference game (about 2,000 words on screen, not 900).
- Added: script-injection and origin security, prompt-injection testing, names in any script,
  accessibility, audio, storage, abuse, cost and load criteria.
- Determinism, softlock, text measurement and bot behaviour redefined to be implementable on
  this engine.

A third review of the revised draft found twelve further issues (pass lines that would have held
half of our best work, an impossible judging time budget, an undefined holdout failure, a swap
test using other customers' answers, model judges asked to listen to music). All twelve are fixed.

Not adopted: effort estimates per template (deferred until one template has been built), and a
"playable now, verified later" tier (it contradicts the brief).
