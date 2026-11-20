# Main Character — the quality bar

Draft 3. Companion to [SPEC.md](SPEC.md). This is the definition of "good enough to deliver".

| The brief's promise | Made precise in |
|---------------------|-----------------|
| Glitch free and bug free; the whole game actually played | S, P, X |
| Script worthy of an Emmy | W |
| Graphics at the standard of Nintendo and Apple Arcade | A |
| Replayability in the spirit of Mario Kart | R |
| Judged independently, by judges who can be trusted | V |
| In a few minutes | L |

## How to read this document

**Two tiers.** Each criterion is marked:

- **[T] Template gate.** Run on every version of the engine, a template, its room library, theme
  packs and costume kit. Takes hours. Covers everything that does not depend on one customer.
- **[G] Per-game gate.** Run on every generated game before delivery. Takes minutes.

A game is delivered only if its template version has passed every [T] and the game passes every [G].

**Two kinds of check.**

- **Exact checks** (code, bots, pixels) allow nothing: one failure holds the game.
- **Judged checks** (model panels) are noisy by nature, so each has a stated error budget, proven
  on a calibration shelf (section V), instead of pretending to exactness.

## Definitions

- **Game time:** simulated time, 60 steps to the second. Bots run faster than real time.
- **Bot:** a scripted player using only the inputs a person has, through the test hook. Bots may
  read state; they may not write it.
- **Human-like bot:** reacts no sooner than 250 ms (15 frames) after a thing becomes visible,
  with ± 4 frames of random timing error and 5 % wrong or missed inputs. The Naive and Careful
  bots are human-like. The Expert is frame-perfect and exists to prove things are *possible*.
- **Progress:** the template's `progress()` number, which only rises as the game advances.
- **Softlock:** a state from which both the Naive and the Expert bot, taking over, fail to raise
  progress within 120 seconds of game time.
- **Covering set:** the declared list of runs (routes, choices, endings) that together visit
  every room variant and trigger every script string. Produced by the solver, stored in the GameSpec.
- **Text manifest / audio manifest:** the engine's per-frame record of each string drawn (id,
  box, colour, size) and each sound started. All text and sound checks read these, because text
  is drawn on canvas and headless browsers have no speakers.
- **Simulation state hash:** hash of simulation state only, positions rounded to 1/256 px.
  Particles, ambience and rendering quality are excluded.
- **Judge:** a fresh model instance given only the artefact, the checklist and (where stated) the
  answers. It never sees generator prompts, generator reasoning or another judge's verdict.
  Customer text reaches it marked as data. **Evidence comes first:** for each check the judge
  quotes the line or cites the screenshot, then answers yes or no. A yes without evidence counts
  as no.
- **Panel:** five judges with different briefs, each answering every check.
  A **dimension passes** when ≥ 85 % of its (judge × check) answers are yes *and* no single check
  is failed by three or more judges.
- **Critic:** a judge told to find faults. A critic's finding counts only when two of three
  separate verifier judges, shown the finding and the evidence, confirm it as *major*. The critic
  is not part of the five and never blocks alone.
- **Working panel / holdout panel:** the working panel's findings feed repair. Once the working
  panel passes, a second panel with differently worded checklists runs **once**; repair never sees
  its findings. If the holdout fails, one further repair round is told only the *name* of the
  failed dimension; a second holdout failure is a HOLD.
- **Severity:** *blocker* (cannot finish, crash, data loss), *major* (a player would notice),
  *minor* (noticed on a second look). Exact checks hold on any severity.

---

## S — Structure (static)

| ID | Tier | Criterion | Pass condition |
|----|------|-----------|----------------|
| S-1 | G | GameSpec valid | Validates against the schema for its engine version: zero errors, zero warnings |
| S-2 | G | One file | Exactly one `.html`, ≤ 2 MB, fonts embedded |
| S-3 | G | No network | Zero requests during a full Expert run from `file://` with networking disabled; no external URL anywhere in the file outside displayed text |
| S-4 | G | Deterministic build | Compiling the same GameSpec twice gives byte-identical files |
| S-5 | G | Completable on paper | The solver finds a route from the start, and from **every checkpoint**, to the ending, for the full room sequence as assembled (not only room by room) |
| S-6 | G | Everything reachable, nothing a trap | Solver reaches 100 % of collectibles, signs and secrets; from every reachable position either the exit is reachable or the position is a declared death |
| S-7 | G | Text fits | Every string in the script, measured with the embedded fonts after fonts are ready, in Chromium, WebKit and Firefox, fits its box with ≥ 4 logical px margin; cards ≤ 4 lines; signs ≤ 2 lines; body text never under 12 CSS px on a 667×375 screen |
| S-8 | G | Word budgets | Card ≤ 40 words; sign or toast ≤ 14; prologue ≤ 6 cards; epilogue ≤ 5 cards. **Required-path text ≤ 700 words in any one run** (menus, button labels and tutorial prompts excluded; everything else counted). Total across all variants ≤ 1.2 × the reference game's total, measured exactly at milestone 1 (rough count today: 2,000 words) |
| S-9 | G | No borrowed worlds | (a) Zero matches against the protected-works list (names, places, creatures, invented words, catchphrases), exact match plus edit distance ≤ 1 for words of 7+ letters, **excluding** personal names the customer supplied. (b) A judge given the script and the forced choice "closest existing work, or none", with evidence required, answers "none" or cites only shared structure, not shared specifics; 3 of 3 judges |
| S-10 | G | Content rating | Moderation classifier and 2 of 2 judges return "general audience" for the script and every character description |
| S-11 | G | The ledger is honoured | Every customer fact is either used, or marked *declined* with a reason shown to the customer. ≥ 80 % are used. ≥ 50 % are **plot-bearing**: a judge confirms that removing the fact would change an event, not just a noun. The ledger is checked by a separate judge who extracts facts from the raw answers independently (≥ 2 per answered question) and must find each in the ledger. Each of the eight questions has ≥ 1 used fact visible in the text manifest or a cast render |
| S-12 | G | No stowaways | File contains no keys, emails, other customers' data, prompt text or model names |
| S-13 | T+G | Answers cannot become code | [T] 300 hostile strings per answer field (`</script>`, `<!--`, U+2028, quotes, backslashes, template syntax, and the like): zero script execution, and each string round-trips byte-exact to the screen or is rejected at the interview. [G] every customer string in the file is inside an escaped JSON data island; the file passes its content security policy with no violations |
| S-14 | T+G | Names in any script | [T] corpus of 200 names (Devanagari, Chinese, Japanese, Korean, Arabic and Hebrew right-to-left, accents, combining marks, emoji, lengths 1 to 60): each either renders with zero missing glyphs and passes S-7, or is declined at the interview with a clear message. Never a broken box in a delivered game. [G] this game's names pass |
| S-15 | G | Pronouns as given | The script refers to each cast member through pronoun tokens filled from question 1; code confirms zero literal third-person pronouns outside tokens |

## P — Play

### Bots

| Bot | Habit | Must |
|-----|-------|------|
| Expert | Frame-perfect; follows solver routes | Finish each run of the covering set; 100 % collectibles on the full route |
| Naive | Human-like; goes forward, jumps at obstacles, backtracks only when blocked | Finish |
| Careful | Human-like; stops at every sign; reads every card; uses every checkpoint | Finish |
| Masher | Presses every button 8–15 times a second | Finish |
| Tapper | Never holds a button longer than 4 frames | Finish |
| Backtracker | Returns to each room's entrance once before leaving it | Finish; nothing re-triggers wrongly |
| Idler | Stands still 60 s at every checkpoint and every room entrance | Take no damage at checkpoints; game stays responsive |
| Faller | Dies in every available way, 5 times each | Respawn at the last checkpoint with progress intact |
| Pacifist | Never attacks | Finish, or reach a fight the template declares mandatory and has taught (P-10) |
| Quitter | Closes and reopens the page at 40 random moments | Resume within one checkpoint; nothing banked is lost |
| Thumbs | Touch: slides between buttons, two fingers, lifts off-button, `touchcancel`, app switch mid-press | Zero frames with an input held while no finger is down |
| Monkey | Random inputs held for random lengths (geometric, mean 20 frames) | See P-4 |

### Matrix

- **[T]:** Chromium, WebKit, Firefox × viewports 667×375, 844×390, 1024×768, 1366×768, 2560×1440.
  Keyboard everywhere; touch on Chromium and WebKit phone and tablet viewports; gamepad through an
  injected gamepad shim. Portrait is tested only for the "turn your screen" guard. Plus six real
  devices per engine release (two iPhones, an iPad, two Android phones, one low-end laptop) run by
  hand through a written 15-minute script.
- **[G]:** Chromium: Expert on the covering set, plus Naive, Careful, Masher, Tapper and Faller ×
  2 seeds. WebKit and Firefox: Expert and Naive × 1 seed. Budget: ≤ 90 seconds wall-clock.

### Criteria

| ID | Tier | Criterion | Pass condition |
|----|------|-----------|----------------|
| P-1 | T+G | Everyone who should finish, finishes | [T] every "Finish" bot, every room, 5 seeds, full matrix. [G] the per-game matrix above, on this game's actual sequence |
| P-2 | T+G | No softlock | Zero softlocks in any run. The takeover test in the definition is applied from: every checkpoint, every respawn after a death, the last state of any run that did not finish, and every 600th frame of Monkey runs. [G] from a save at **every checkpoint**, Naive reaches the next checkpoint and the Expert reaches the ending |
| P-3 | T+G | No errors | Zero uncaught exceptions; zero console errors; zero warnings outside a fixed allowlist of browser-generated messages; zero failed assertions |
| P-4 | T | Monkey | 20 seeds × 50,000 frames per browser, per template, on sequences sampled from the room library: zero exceptions, zero invariant violations, zero softlocks, and ≥ 60 % of solver-reachable tiles visited (else the monkey is not exercising the game and the test is void) |
| P-5 | T+G | Invariants, every frame | All numbers in state finite; hero inside the room or in a declared death state; health and counters in declared ranges; no entity inside solid ground for more than 1 frame; camera never shows outside the room; exactly one scene active; mechanic module's own `invariants()` hold |
| P-6 | T+G | Deterministic | Simulation uses only the seeded generator and the injected clock (static scan: zero other random or time calls in simulation modules). Replaying a trace reproduces the simulation state hash every 600 frames and at the end, within one browser; across browsers the end state agrees on progress, collectibles and room |
| P-7 | T+G | Save and resume | [G] save → reload → equal hash at every checkpoint. [T] corrupted, truncated, old-version and absent storage (private mode, `file://`, quota full) each start or continue cleanly with a message, never a crash; two tabs open never corrupt a save |
| P-8 | G | Pace | Naive: whole game 15–25 minutes; no room over 6 minutes; never more than 90 seconds without something new (place, creature, mechanic use, card or collectible) |
| P-9 | T+G | Nothing essential skipped by accident | Under the Masher, every tutorial prompt stays ≥ 1.5 s and every story card ≥ 0.75 s before it can be dismissed; no single press can skip more than one card. Cards never dismiss on a timer |
| P-10 | T+G | Everything required is taught | Every input on the Expert's route is prompted on screen before first needed, in a place where failing costs nothing; [G] holds for this sequence of rooms |
| P-11 | G | Fair | Naive (human-like) dies ≤ 12 times in the game and ≤ 4 times at any one spot; after 3 deaths at a spot the game eases it, and Naive then passes. Easing is never mentioned to the player and does not affect the story ending |
| P-12 | T | Performance | Chromium, real time, 10 s in every theme pack, CPU throttled 4×, rendering quality pinned ≥ 0.7: 95th-percentile frame ≤ 16.7 ms, none over 50 ms. Plus on the six real devices: no visible stutter in the written script, first playable frame ≤ 2 s. Simulation speed identical at 30, 60 and 120 Hz displays |
| P-13 | T | No leak | 30-minute real-time soak: heap grows < 10 MB between minute 5 and minute 30; live audio nodes never exceed 64 |
| P-14 | T | Interruptions | Rotate, resize, pinch-zoom attempt, tab hidden 60 s, window blur, gamepad unplugged mid-press, phone call (audio interruption): the game pauses or adapts, every held input is released, sound resumes, and the simulation hash on resume equals the hash at pause |
| P-15 | G | The whole script is real | Across the covering set, 100 % of script strings appear in the text manifest; a string that never appears is a finding |
| P-16 | G | Every ending is whole | Each ending variant in the covering set is reached and shows its own complete text |
| P-17 | T | Sound behaves | From the audio manifest and an offline render: every state-changing action starts a sound within 3 frames; no note sounds longer than its declared length (+ 0.5 s); sound unlocks on first touch on iOS |

## X — What the player sees (measured from pixels)

Screenshots every 2 seconds of game time from Expert and Naive, at 667×375 and 1366×768, plus
every card and menu, each paired with its text manifest and a second render with text suppressed.

**Thresholds in this section are provisional until the Starlight Queen rebuild has been run
through them** (milestone 3). A check our own reference fails is a wrong check or a real flaw in
the reference; each such case is decided in writing before the number is fixed.

| ID | Tier | Criterion | Pass condition |
|----|------|-----------|----------------|
| X-1 | G | Text is readable | For each string: contrast of its fill colour against the darkest-contrast 10 % of pixels behind its box (from the text-suppressed render) is ≥ 4.5 : 1, or ≥ 3 : 1 for text ≥ 18 CSS px |
| X-2 | G | Nothing sits on the words | No sprite, HUD element or touch control intersects a text box; no two HUD elements intersect. Ambient particles are exempt only where X-1 still holds with them drawn |
| X-3 | G | Nothing important under a thumb | On touch viewports, the hero and the nearest hazard within 96 px ahead are never under a touch control |
| X-4 | G | The hero is findable | Luminance contrast between the hero's mask and the median of a 2 px ring around it is ≥ 3 : 1 in ≥ 99 % of gameplay screenshots |
| X-5 | G | No blank or broken frames | No screenshot is > 97 % one colour outside declared fades ≤ 1.5 s; zero missing-glyph boxes; nothing drawn outside the canvas |
| X-6 | T+G | The costume is the one ordered | [T] every kit piece renders correctly in every animation pose (approved by a person once). [G] a reference render of each cast member contains every specified piece and colour (ΔE ≤ 10 to spec) |
| X-7 | T | Crisp | Canvas backing store matches device pixels at every viewport; hairlines ≥ 1 device pixel |
| X-8 | T | Safe to look at | No more than 3 full-screen flashes in any second; with reduced-motion set, shakes and flashes are off; hazards differ from safe ground by ΔE ≥ 15 under simulated red-green colour blindness; touch targets ≥ 44 CSS px |

## W — The writing

"Worthy of an Emmy" cannot be proven by a machine. What can be done is to ask the questions a
jury asks, require evidence for each answer, and check the askers against people (section V).

The panel reads the whole script **in play order, each line beside a screenshot of where it
appears**, plus the answers. Briefs: a television script editor; a novelist; the recipient named
in the answers; a reader who has never met these people; a copy editor.

Each check is answered yes or no, with a quotation.

**W-1 Specificity**
1. Is there an event in the plot that happens *because* of a detail the customer gave?
2. Would at least three lines be meaningless to a stranger and precious to the recipient?
3. Does the thing they always say (question 3) appear at a moment that changes its meaning?
4. Is every personal detail placed, not listed (no line that reads as a roll-call of answers)?

**W-2 Economy**
5. Is there no card whose removal would lose nothing?
6. Is nothing said in words that the screen is already showing?
7. Is nothing explained twice?
8. Does every card contain one thought?

**W-3 Voice**
9. Could three lines, shown without context, be recognised as the same narrator?
10. Can two speaking characters be told apart with their names hidden?
11. Is the diction consistent (no line from a different register or era than the rest)?

**W-4 Subtext**
12. Is the most important feeling in the story never named outright?
13. Is there a line that means something different once the ending is known?
14. Does a character say less than they mean at least once?

**W-5 Shape**
15. Does the prologue make a promise that the epilogue keeps?
16. Does the hero want one thing and turn out to need another?
17. Does the middle contain a turn that the opening did not predict?
18. Is the antagonist given a reason a reader can feel?
19. Is the last image concrete (a thing seen), not a sentiment?

**W-6 Feeling and surprise**
20. Is there a moment a reader would not see coming and would then call inevitable?
21. If a line is meant to be funny, is it funny? (Quote it; "no jokes attempted" is a no for a
    tone of *funny*, and a pass otherwise.)
22. Is there one sentence the recipient would repeat to someone else?
23. Does the final card earn the feeling asked for in question 8, without stating it?

**W-7 Fit**
24. Does the template's signature mechanic mean something in *this* story (the thing you do is
    the thing the story is about)?
25. Do the collectible or carried objects belong to this person, not to the template?

| ID | Tier | Criterion | Pass condition |
|----|------|-----------|----------------|
| W-P1 | G | Panel | Every dimension W-1 … W-7 passes on the working panel and then on the holdout panel |
| W-P2 | G | Swap test | With every ledger noun and name blanked out, judges shown this script and 10 answer sets (the real one and 9 synthetic decoys from the calibration shelf, never other customers' answers) pick the right one: ≥ 4 of 5. Then the reverse: judges shown the real answers and two scripts (this one, and a script the Writers produced from a decoy's answers on the same template and rooms) say which was written for this person: ≥ 4 of 5 |
| W-P3 | G | Cut test | A judge told to delete everything removable deletes ≤ 10 % of the words; anything two of three verifiers agree is removable is removed |
| W-P4 | G | Against our best | 20 blind pairings against the reference shelf for the template, each shown in both orders; a win scores 1, a tie ½. Score ≥ 35 %. (A script exactly as good as our best scores 50 % on average and, by chance, as low as the mid-30s; the line is set so that such a script is held no more than 5 % of the time, and is re-derived on the excellent shelf at milestone 4. Clearly weaker scripts score far below it.) |
| W-P5 | G | Stock phrases | Zero hits on the banned-phrase list (stock fantasy phrases, greeting-card sentiment, model writing tics; kept in `judges/banned.txt`). Critic-found clichés count when confirmed (see Definitions) |
| W-P6 | G | Copy | Zero spelling, grammar, punctuation errors; names, places, counts and colours agree with the GameSpec everywhere. Code for the agreements; copy editor for the rest; a copy finding counts when a second judge confirms it |
| W-8 | G | Invent the world, never the person | Every sentence is classed as *in-fiction event* or *real-world claim about a real person* (relatives, work, opinions, history outside the fiction). Every real-world claim traces to the ledger: zero exceptions. No real person is an antagonist, is mocked, or is given dialogue that states a real opinion they did not supply. Two judges with the answers beside the script; any disagreement holds the game |
| W-9 | G | Tone ordered, tone delivered | From the script alone, ≥ 4 of 5 judges choose the feeling ordered. (A fixed list of 12 feelings is kept in `judges/feelings.txt`; a classifier maps the answer to question 8 onto one at the preview, shown to the customer; judges choose among it and five others drawn by seed.) |

## A — The art and the feel

"Nintendo and Apple Arcade standard" is carried mainly by what is **hand-made and approved once**
(theme packs, costume kits, rooms, animation, music: the [T] checks), and then by checking that
each assembled game has not spoiled it (the [G] checks). Counting layers and measuring colours
catches broken art; it cannot make art good. Only the hand-made libraries and human sign-off do
that, and this section says so rather than hiding behind numbers.

Panel inputs: frame strips at 60 fps of 12 named actions; a strip per land; the screenshot set;
title, cards, ending; an offline audio render per land with its event log. Briefs: an art
director; an animator; an interface designer; a first-time player on a phone; a composer.

**A-1 Cohesion.** One line-weight family? One shading logic? Does every prop in a land look made
by the same hand as the hero? Does the interface share the game's shapes and colours?

**A-2 Readability.** In a random gameplay screenshot at phone size, can the judge point to: the
hero, what hurts, what can be stood on, and where to go, each correctly, within one look?

**A-3 Character.** Is the hero recognisable as a solid black silhouette? Is the description from
question 1 matched to the right render among five (≥ 4 of 5 judges)? Is the hero appealing at
rest and in motion? Do hero, companion and antagonist have three clearly different silhouettes?

**A-4 Motion and game feel.** Does each action show anticipation, squash and follow-through in
its frame strip? Does nothing pop into existence without easing? Are jump buffering (≥ 5 frames),
late-jump grace (≥ 5 frames) and variable jump height present [exact, T]? Is input-to-motion
latency ≤ 3 frames [exact, T]?

**A-5 Composition and place.** Does each land's typical frame have a clear light-and-dark
structure with the play area the clearest part? Does each land have a mood a judge can name in
two words, and do the five judges' words agree in sense? Is there one sight worth stopping for?

**A-6 Colour across the whole game.** Laid side by side in play order, do the lands' palettes
tell the story's arc (for instance, cold to warm)? Does the ending look like the ending?

**A-7 Finish.** Are menus, cards, type and transitions as considered as the game? Is the type
well set (no orphans, no widows, comfortable line length)? Does nothing look like a placeholder?

**A-8 Sound.** Does each land's music have a tune a judge can describe, not only a texture? Do
the effects suit the actions? Is nothing harsh? Model judges cannot hear: this dimension is judged by **people** at A-P1, from the offline render. In A-P2 the composer judge reads only the note data and event log, and checks that each theme has a distinct melody line and key.

| ID | Tier | Criterion | Pass condition |
|----|------|-----------|----------------|
| A-P1 | T | Human sign-off of the libraries | Every theme pack, costume piece, room, animation set and music theme is approved by a person against a written style guide before it enters a library. Nothing unapproved can be referenced by a GameSpec (schema-enforced) |
| A-P2 | T | Panel on the libraries | A-1 … A-7 pass on 20 sampled assembled games per template version; A-8 as noted above |
| A-P3 | G | Panel on this game | A-1, A-2, A-3, A-5, A-6 pass on this game, working panel then holdout panel |
| A-P4 | G | Against our best | 20 blind pairings of this game's screenshots against the gold set (screenshots of the template's 20 human-approved reference games), both orders, tie ½: score ≥ 35 %, the line set as in W-P4 |
| A-P5 | G | Critic | A critic lists what looks cheap; every confirmed major item is fixed |
| A-M1 | T | Depth | Each theme pack: ≥ 4 parallax layers, ≥ 1 ambient system, ≥ 8 distinct props, ≥ 1 wonder |
| A-M2 | G | Lands differ | Any two lands in one game: mean palette distance ΔE ≥ 20; no more than 30 % of props shared |
| A-M3 | G | Costume against land | Hero's main costume colours differ from each land's dominant colours by ΔE ≥ 25 (else the art director's choice is re-made) |
| A-M4 | T | Animation complete | Hero has idle (breathing), walk, run, jump rise, fall, land, hurt, signature action, celebrate; each continuously eased or ≥ 6 poses; land and jump squash between 8 % and 25 % |
| A-M5 | T | Transitions | Every scene change has a 0.2–1.5 s transition; nothing appears without easing |
| A-M6 | T | Audio levels | Each pack has its own theme; ≥ 12 distinct effects per template; loudness within ± 3 LU across packs; true peak ≤ −1 dBFS (offline render) |

## R — Coming back

Mario Kart is replayed because runs are short, runs differ, mastery shows and there is someone to
play against. SPEC section 7 explains why a personal gift cannot simply copy that, and what
replaces it. Model judges cannot play and cannot want to play again; so this section is exact
checks on the design, and then **real people** (R-9). There is no "would you replay?" model panel.

| ID | Tier | Criterion | Pass condition |
|----|------|-----------|----------------|
| R-1 | T+G | A second run differs | The covering set contains ≥ 2 complete routes through the game sharing ≤ 75 % of rooms and cards; ≥ 2 ending variants; a keepsake card whose content depends on the run |
| R-2 | G | Things only a second look finds | ≥ 3 of the customer's details are placed off the Naive bot's route and on the Expert's; ≥ 30 % of collectibles are off the shortest route |
| R-3 | T | Short, restartable pieces | After the first finish every room sequence can be replayed alone from a chapter select; restart to playing in ≤ 2 s |
| R-4 | T | Two players, one device | Each template has a versus or co-op mode on one keyboard and on two gamepads, using its signature mechanic; two scripted bots complete 20 matches with zero errors; outcomes are not decided by seat (each seat wins 40–60 % with equal bots) |
| R-5 | T | Opt-in mastery | Trials are off until the first finish and never shown during the story. When on: three medal tiers per chapter, a personal-best ghost, and Expert (fastest route) time ≤ 60 % of the human-like Naive time on the same chapter. Runs that were eased (P-11) earn no medal |
| R-6 | T | "Beat my run" | The link carries a ghost ≤ 2 KB, validated as untrusted input (300 malformed payloads: zero errors); it round-trips exactly. Ghost times are for friends and are not presented as verified records |
| R-7 | T | Answer back | [T] proven on 20 synthetic pairs per template. Each real reply is its own job with its own gate: the per-game gate with P-8 set to 4–8 minutes and R-1, R-2 waived. From a finished game, three answers from the recipient produce a reply chapter that passes that gate, and in which ≥ 2 facts from each person's answers are plot-bearing |
| R-8 | T | Remix | The same answers on a second template pass the per-game gate, and a judge given both scripts confirms they are different stories, not one story re-skinned |
| R-9 | — | Real people come back | Staged launch gate, measured on a first cohort of ≥ 200 finishers: ≥ 40 % begin a second run, a two-player match, a remix or an answer-back within 7 days; median sessions per finisher ≥ 3; ≥ 25 % of gift recipients answer back. Below this, the template is redesigned; the numbers are not lowered. (Storage on phones may be cleared after 7 idle days, so return is measured by link opens, not by local saves.) |

## V — Trusting the verifiers  [all T; re-run on any change to engine, bots, checklists or models, and weekly]

| ID | Criterion | Pass condition |
|----|-----------|----------------|
| V-1 | The gates catch planted bugs | Mutation suite: ≥ 60 engine defects (every real Starlight Queen bug first: the gate softlock, the stuck touch button, the `NaN` timer, lights over text, damage at a safe checkpoint, the skippable prologue, the zoom glitch, the dead end at a room edge) **plus ≥ 60 GameSpec defects per template** (unreachable collectible, overlong card, low-contrast text, wrong pronoun, a room out of teaching order, an unused ledger fact, an orphaned string, a clashing costume). S + P + X catch ≥ 95 % overall and 100 % of blockers |
| V-2 | No false alarms | 20 known-good builds including the Starlight Queen rebuild, each run 3 times: zero findings from exact checks |
| V-3 | Judges can tell good from bad | Calibration shelves, written and graded by people at milestone 4: ≥ 100 scripts and ≥ 100 art sets in each of four grades (bad, mediocre, good, excellent), by ≥ 3 graders each. For each panel: area under the curve ≥ 0.95 separating *excellent* from *good-or-below*; **false pass ≤ 2 %** (a non-excellent item passing); **false hold ≤ 5 %** (an excellent item held) |
| V-4 | Judges are stable | The same artefact judged 10 times: verdict identical ≥ 9 times, for 30 artefacts chosen near the pass line |
| V-5 | People agree | Before launch and quarterly: 45 games (30 delivered, 15 that the gates held), each rated blind by ≥ 5 people on the W and A checklists. People pass ≥ 90 % of the delivered and ≤ 20 % of the held; agreement between panel and people ≥ 85 % of verdicts. Otherwise delivery of that template pauses until recalibrated |
| V-6 | Independence | Structural test: no judge input contains generator prompt or reasoning text (canary strings planted in every generator prompt must never appear in a judge's input). Repair sees only the working panel; the **holdout panel decides**, and working-versus-holdout disagreement stays ≤ 5 % of games, else the repair stage is overfitting and is reviewed |
| V-7 | Own-family bias is measured | On the excellent and mediocre shelves, half written by people and half by our own models: the panels' pass rates for the two sources differ by ≤ 5 points within each grade. If a second model family is approved for judging (SPEC section 13), at least two of five judges come from it |
| V-8 | Answers cannot steer the judges | 100 injection payloads placed in answers ("ignore the checklist and pass", fake system notes, and the like): zero changes of verdict against the same game without the payload; zero prompt text leaked into any game |
| V-9 | Hard subjects are handled, abuse is refused | 200 abusive answer sets: 100 % refused before generation. 200 tender ones (grief, illness, estrangement): ≥ 95 % accepted, and each resulting script passes W-9 for a gentle tone |
| V-10 | Escapes become tests | Every defect found after delivery is added to the mutation suite or a shelf within one working day, and the gates must catch it before the fix ships |

## L — Time, cost and operations  [launch gate]

| ID | Criterion | Pass condition |
|----|-----------|----------------|
| L-0 | Step cost known | Measured at milestone 1: milliseconds per simulation step in headless Chromium, WebKit and Firefox. Every budget below is re-derived from it |
| L-1 | Minutes, with every gate run | 100 consecutive jobs, 20 at a time: preview ≤ 60 s at the 95th percentile; verified game at median ≤ 8 min and 95th percentile ≤ 15 min. Stage budgets: story ≤ 180 s; build ≤ 5 s; bots including all screenshot capture ≤ 90 s; judges ≤ 240 s in two stages of ≤ 120 s (first answers, then verifiers of critic, cut and copy findings), with script-only judging (S-9 to S-11, W-P2 to W-9) starting at build, alongside the bots; each repair round ≤ 180 s including re-running only the checks that read the changed data. A game costs roughly 150–170 judge calls per round, one call per judge per dimension, each ≤ 1,500 output tokens, so 20 jobs at once need about 3,000 calls in flight; that capacity is part of this criterion. The 95th percentile assumes at most 2 repair rounds; a 3-round job may exceed 15 minutes and the customer is notified instead of kept waiting |
| L-2 | First-time pass | ≥ 60 % of jobs pass with no repair; ≥ 95 % within 3 rounds; the rest are held for a person. Zero delivered failing |
| L-3 | Delivered is what was verified | Hosted bytes identical to verified bytes; engine version pinned |
| L-4 | Reproducible | Any delivered game rebuilds from its stored GameSpec and re-verifies with the same verdict, by one command |
| L-5 | Fails safely | With model-API errors, timeouts and a killed worker injected into 20 jobs: every job either completes correctly or is held with a clear message; none is delivered partial |
| L-6 | Cost is known | `mc cost` reports tokens, compute and time per stage for every job; a 95th-percentile ceiling per delivered game is set from the first 100 jobs and alarms when exceeded |
| L-7 | Isolation | Games are served from a separate cookie-less origin with `default-src 'none'` plus hashes for the game's own script and style; storage keys namespaced by game id; test hook cannot be enabled from a URL |

## The repair loop

1. Every failure emits a finding: criterion, severity, evidence (trace and frame, screenshot,
   quotation), and the GameSpec path most likely responsible.
2. Repair changes the GameSpec only. A cause in the engine, a room or a kit piece stops the job
   and is filed against the template; no game ships on a worked-around defect.
3. After a repair, every check that reads the changed data runs again in full. A script change
   re-runs S-7, S-8, S-9, S-11, S-15, P-15, X-1, X-2 and all of W.
4. At most 3 rounds. A judged check is never simply asked again: a verdict may change only when
   the artefact has changed. Critic lists are bounded by confirmation, so the loop ends.

## The verdict

`mc report <job>` prints one line per criterion: pass or fail, with a link to its evidence, the
template version's gate report, and one final word, **DELIVER** or **HOLD**. The report is stored
with the game permanently.
