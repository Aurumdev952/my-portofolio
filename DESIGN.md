# THE FORGE · design system

## Brief

- **Subject:** Ishimwe Mugisha Benjamin, software engineer in Kigali. Backends, distributed
  data, DevOps, and AI (RAG, fine tuned small models). 3+ years, many teams at once.
- **Audience:** engineering leads, CTOs, recruiters, agencies looking for a backend or AI
  engineer.
- **Job of the site:** prove he builds systems that hold under load, and that he is moving
  deeper into AI. Get a message in the inbox.
- **Assets:** studio portrait (cut out + depth map by `scripts/prepare-portrait.mjs`), CV,
  live sites of Tujyane, UWERA, Uzabox (screenshots by `scripts/shoot-sites.mjs`), older
  project images.
- **Constraints:** government projects (RTB, national regulation platform, VMS) cannot show
  real screens. They get honest abstract system art. No phone numbers, no references.

## Concepts considered

| # | Concept | Territory | Orig | Fit | Feasible | Portability (low = good) |
|---|---|---|---|---|---|---|
| A | **The Forge**: a dark hangar where robot arms weld his silhouette into the real person, chapter by chapter | profession's material (systems are built, welded, load tested) + his "built to scale" line | 4 | 5 | 4 | 2 |
| B | Load test: the page is a traffic graph, scrolling raises requests per second and the UI must hold | metaphor for how he works | 4 | 4 | 4 | 3 |
| C | Thousand hills: Rwanda's terrain as a topographic data landscape | place | 3 | 3 | 4 | 3 |

**Pick: A.** It is the only one that carries both his story (he was made by these years) and
his craft (systems welded together, then put under load), and it is what the owner asked for.

## Concept card

```
Idea:        An engineer is forged in a hangar: robots weld a dark silhouette, and scrolling
             cools it into the real Benjamin, then walks him through the systems he built.
Metaphor:    an industrial hangar at night: welding arms, sparks, steel plates, blast doors.
Signature:   the figure's forging: silhouette → contour blueprint → spark cloud → cooling
             metal → full colour portrait, driven by one scroll variable (uForge).
Emotion:     first 3 seconds: heat, noise, something being made right now.
Motion verb: forge. Things assemble from sparks and cool from orange to steel.
Screenshot:  the black silhouette, rim lit, four welding arms, sparks bouncing on the floor.
```

## Art direction

**Palette** (from the hangar: soot, steel, weld light, arc light)

| Role | Hex | Use |
|---|---|---|
| ground | `#0B0C0E` | hangar soot, page background |
| ink | `#ECEAE4` | text, steel highlights |
| muted | `#9A9DA3` | secondary text (7.4:1 on ground) |
| line | `rgba(236,234,228,.13)` | rules, plate edges |
| accent / heat | `#FF7A1A` | weld, hot states, focus. Used rarely |
| arc | `#BFD9FF` | arc light, AI chapter, blueprint contour lines |
| curtain | `#141518` | blast doors |

Near black with one hot accent is on the "AI tells" list. Kept on purpose: the colour is not
decoration, it is the literal temperature of the concept (heat = something being made, steel =
done), and a second cold light (arc blue) carries the AI chapter.

**Type**
- Archivo variable (wdth 62 to 125, wght 100 to 900). Display set condensed and heavy
  (wdth 70, wght 800), tracking -0.03em, leading 0.88. Kinetic: width expands from 62 to
  the rest value as text "cools".
- JetBrains Mono 400 for data only: dates, coordinates, metrics, chapter counters.
- Body 17px / 1.55. UI 13px.

**Grid:** 12 columns, 24px gutter desktop, 4 columns / 16px gutter mobile. Text panels sit
on columns 1 to 5 or 8 to 12, never centred over the figure.

**Shape:** zero radius on plates and frames (cut steel); 999px radius only on round status
dots. Plates have a 1px line border with a chamfered corner (clip-path).

**Motion language**
- eases: `forge` = `expo.out` for reveals, `expo.inOut` for doors, `power3.out` for hovers.
- text reveal: lines rise 0.9s, stagger 0.07s, colour runs heat → ink over 1.2s.
- hover (primary): heat. A molten bar fills from the left under the label and the label
  shifts 4px. Under reduced motion, only the fill.
- page transition: blast doors close from both sides, the seam glows, doors open on the new
  page. 0.8s each way.
- loader: weld bead runs along a line with real progress; doors open into the hero.
- idle: torches keep welding, dust drifts, figure breathes slightly with pointer and time.

## Composition plan

```
HERO (sticky stage 180svh)
┌──────────────────────────────────────────────┐
│ IMB          story  work  contact             │
│                                               │
│          [arm]   ▓ silhouette ▓   [arm]       │
│ ISHIMWE         ▓▓▓▓▓▓▓▓▓▓▓▓▓▓                │
│ MUGISHA     sparks ░ ░ floor ░ ░              │
│ BENJAMIN                                      │
│ line + scroll cue        01/06 hangar  Kigali │
└──────────────────────────────────────────────┘

FORGE (pinned chapters, text left, figure right, alternating)
│ 2022 · year ticker │ heading │ 2 lines │ facts in mono │

STACK (conveyor: full-bleed plates moving right to left, manifest list under)

FIELD (station per project: figure left third, holo screen right, panel bottom left)

CONTACT (form left 5 cols, links right)

GATE (doors fill the frame, one link: Enter the gallery)
```

## Genericness test

- A generic build would do a centred hero with the photo in a circle and a skills tag cloud.
  Here the photo becomes the 3D object of the concept and the skills are steel plates on a
  line.
- Generic dark portfolio = purple glow. Changed to a two-temperature light model.
- Generic project list = cards. Changed to stations where the figure stands inside the work.

## Idle

The hangar never stops: torches weld on the shared clock, sparks bounce, dust drifts. Paused
when the tab is hidden; frozen under reduced motion.
