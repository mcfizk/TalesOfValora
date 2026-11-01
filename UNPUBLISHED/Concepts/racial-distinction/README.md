# Racial distinction: dwarf and halfling anatomy studies

Twelve exploratory character samples for visual selection. These are new anatomy studies, not replacements for approved assets, animation sheets, or playable characters. All work is contained in this directory.

## Open the comparisons

- [Color comparison, preview](comparison-preview.png)
- [Silhouette comparison, preview](silhouettes-preview.png)
- [Color comparison, native resolution](comparison-native.png)
- [Silhouette comparison, native resolution](silhouettes-native.png)

Each sheet shows the male human reference and six male studies on the first row, then the female human reference and six female studies on the second row. Columns are human, dwarf A/B/C, then halfling A/B/C. Every character within a row stands on the same baseline. Characters are **not independently fitted to equal-height cells**.

The native sheets are 7472 × 4000 pixels and display the final character pixels at 1:1. The 1868 × 1000 previews use one-quarter scale with nearest-neighbor character sampling. Open the native sheets at 100% to inspect individual pixel clusters. The silhouette sheets preserve the exact alpha contours and remove all internal colors, facial details, and clothing seams; they do not invent unclothed anatomy underneath the garments.

## Rendering decisions

The human male and female bases were the primary visual references. The existing dwarf and halfling bases were inspected as earlier concepts, not treated as final proportions.

Preserved features include the left-facing three-quarter idle pose, slight overhead perspective, dark stepped outlines, olive/brown/cream palette, angular highlights and shadows, and upper-left lighting. Relaxed open hands and visible gaps around the arms and legs keep the pose useful for judging anatomy. Tunics, belts and trousers deliberately use similar colors across the set, so the differences are primarily skeletal proportions and body mass. Dwarves wear substantial boots; halflings A/C explore bare feet and B explores soft footwear. No weapons, armor or decorative equipment obscure the bodies.

All characters are adults. Dwarf women share the broad ribcage, substantial hands, thick arms and short powerful legs of dwarf men. Halflings have lighter limbs, narrower torsos, softer faces and larger feet relative to their bodies, without infantile eyes or chibi heads.

## The twelve samples

Height is measured from the highest visible hair pixel to the lowest sole pixel against a 1280-pixel human reference. It therefore includes hair and footwear, rather than pretending to be an exact skeletal measurement. Small deviations from the round percentages are four-pixel grid rounding.

| Sample | Height | Anatomical exploration | Visual assessment |
|---|---:|---|---|
| [Dwarf male A](dwarf-male-a.png) | 75% / 960 px | Traditional stocky: deep chest, rounded waist, thick forearms and short legs; short full beard leaves the torso visible. | A restrained everyday dwarf. The beard helps recognition, but the broad torso and substantial hands remain visible in silhouette. |
| [Dwarf male B](dwarf-male-b.png) | 78.13% / 1000 px | Broad and muscular: widest shoulder girdle, deep upper chest, tapered but solid waist, thick arms and broad boots; clean-shaven square jaw. | Strongest male racial silhouette without depending on a beard. More physically imposing than the other two. |
| [Dwarf male C](dwarf-male-c.png) | 70% / 896 px | Compact and rugged: shortest, more rectangular torso, short robust legs, heavy hands and weathered face. | Strong low center of gravity; suitable for an older or especially compact character. His shorter silhouette distinguishes him from B. |
| [Dwarf female A](dwarf-female-a.png) | 75% / 960 px | Traditional stocky: round barrel torso, fuller waist and pelvis, broad shoulders, substantial hands and strong short legs. | The roundest female option, with considerably less waist pinching than the human reference. Good ordinary-villager anatomy. |
| [Dwarf female B](dwarf-female-b.png) | 78.13% / 1000 px | Broad and athletic: expanded shoulder girdle, deep chest, firmer waist taper, thick forearms and powerful legs. | Strongest athletic female candidate. Shares the male dwarf construction while retaining a distinct adult female face. |
| [Dwarf female C](dwarf-female-c.png) | 70% / 896 px | Compact and rugged: short rectangular body, wide waist and pelvis, short sturdy legs and mature facial structure. | Most compact female silhouette. Useful if a lower, heavier racial baseline is preferred over B's athletic mass. |
| [Halfling male A](halfling-male-a.png) | 60% / 768 px | Balanced: modest shoulders, small torso, short light limbs and broad bare feet; moustache and sideburns reinforce adult age. | Strongest all-purpose male halfling. The foot-to-body proportion is readable without making the head childlike. |
| [Halfling male B](halfling-male-b.png) | 64.06% / 820 px | Slender and agile: narrow torso and waist, light limbs, relatively longer legs and soft shoes. | Useful traveler/scout direction. In silhouette alone it can approach a small human or elf; the weakest default racial identifier of the three. |
| [Halfling male C](halfling-male-c.png) | 54.06% / 692 px | Compact and sturdy: shorter round torso and legs, fuller waist, broad bare feet, mature goatee. | Smallest and roundest male option. Remains far lighter through chest, arms and hands than a dwarf. |
| [Halfling female A](halfling-female-a.png) | 60% / 768 px | Balanced: compact torso, moderate adult hips, narrow shoulders, light limbs and broad bare feet. | Strongest general female counterpart to male A. Adult facial structure and restrained head size avoid a childlike reading. |
| [Halfling female B](halfling-female-b.png) | 64.06% / 820 px | Slender and agile: narrow ribcage and waist, lighter arms, relatively longer legs and soft footwear. | Distinct agile alternative. Like male B, loses some unmistakable halfling identity when facial and foot details are hidden. |
| [Halfling female C](halfling-female-c.png) | 54.06% / 692 px | Compact and sturdy: fuller shorter torso and hips, short light limbs, broad bare feet. | A smaller, sturdier alternative. The anatomy remains lighter than the dwarf women rather than becoming a miniature dwarf. |

## Recommendations

**Dwarf B is the strongest starting direction for both sexes** when immediate racial recognition and physical power matter most. Male B's clean-shaven face makes it particularly useful for confirming that the identity comes from anatomy. Female B shares the broad upper body and sturdy limbs. Treat B as the athletic end of the population rather than requiring every dwarf to be muscular. A provides a rounder everyday body and C provides the shorter rugged end.

**Halfling A is the strongest general racial baseline for both sexes.** It balances mature facial proportions, compact stature, light limbs and distinctive feet. C is a good compact population variant. B is worth keeping as an agile character type, but its shoes and longer limbs weaken identification in a solid silhouette; it should not define the entire race.

The dwarf female B silhouette is less exaggerated than male B, and female A carries more round central mass. Those are visible design choices in this pass, not a claim that male and female proportions are identical. If a stricter shared skeletal template is selected later, shoulder/head and pelvis measurements should be locked before producing turnarounds.

## Quality review

| Question | Finding |
|---|---|
| Is the race recognizable without a label? | Dwarves read through torso and limb mass at short stature; halflings A/C read through smaller lighter bodies and feet. B halflings are intentionally the less distinctive boundary case. |
| Do dwarves look naturally powerful rather than compressed? | Short limbs, deep ribcages, substantial hands and broad necks were redrawn. No nonuniform image stretching was used. B emphasizes shoulder mass; C emphasizes a low center of gravity. |
| Do halflings look adult rather than childlike? | Normal adult eye sizes, developed noses/jaws and adult torso proportions are retained. Male facial hair helps but is not the sole cue; the female studies use the same adult proportion logic. |
| Are the two races distinguishable? | Yes at the intended shared scale. Dwarves are both taller and substantially heavier; even sturdy halfling C has light forearms and a much smaller ribcage. |
| Do the sexes share racial anatomy? | Both dwarf sexes have broad torsos and thick short limbs; both halfling sexes have narrower torsos and comparatively large feet. The same three proportion categories are present in each sex. |
| Does the art match the humans? | Palette, perspective, outlining, lighting and detailed cloth shading are closely matched. The revised B dwarves use larger uninterrupted shading areas to describe their broader muscle volumes. |
| Are scale and pixel density consistent? | The final exports share one four-pixel logical grid, binary alpha, a common baseline and explicit height ratios. The human references receive the same review sampling only inside the sheets; their source files are unchanged. |
| Could the designs support eight-direction animation? | The separated limbs, visible feet, short tunics and neutral stance provide a usable starting structure. This is a design assessment only: side/back views, joint consistency, foot contacts and actual walk cycles have not been generated or tested. Broad dwarf hands and halfling feet will need clearance checks during those later stages. |

## Technical export and validation

- Final individual samples: **12 RGBA PNGs, each 1120 × 1448**.
- Common foot baseline: **y = 1376**, expressed as the exclusive bottom edge; the last opaque row is y = 1375.
- Human comparison height: **1280 pixels**. Dwarves use 896–1000 pixels and halflings 692–820 pixels, with transparent padding occupying the rest of the common canvas.
- A four-pixel logical grid is used for the final samples. This keeps density consistent across races rather than giving smaller characters the same quantity of pixels as humans.
- Each newly drawn source is fitted uniformly as a complete character. Its width follows its original aspect ratio, rounded to the logical grid; limbs and torsos are never stretched independently. Nearest-neighbor sampling introduces no blended colors. Alpha is thresholded at 128 to remove translucent edge fringes.
- Existing source artwork contains fine edge pixels and varies slightly in canvas dimensions. The review export makes the grid explicit rather than claiming those source files were already perfectly grid-aligned.
- PNG decoding with CRC checks, dimensions, nonempty transparency bounds, binary alpha, four-pixel block consistency, canvas margins, foot baseline, and target heights are checked by `build-review.cjs`.
- Both sheets use one shared scale per sheet. Placement and height measurements are recorded in `validation.json`.
- SHA-256 comparisons confirmed all 27 pre-existing files under `assets/sprites/` remained unchanged. No game code, renderer, animation system, existing manifest or character definition was edited.

## Supporting files

`generation/` retains the full-detail generated drawings before review scaling. `generation/earlier/` holds the three superseded dwarf studies, excluded from the final sheets. These files are not baseline-aligned final exports; use the twelve clearly named PNGs beside this README for selection.

`study-spec.json` records the anatomical design brief. `build-review.cjs` creates the raster exports and sheets with the bundled Node PNG/canvas libraries; it is a review utility, not game code. `validation.json` records the final measurements and checks, and `existing-assets.sha256.json` is the local preservation check. The actual artwork was created with the built-in image generation tool; the utility only performs the requested pixel-grid export, alignment and comparison layout.

The prompt set held camera, lighting, palette, clothing and rendering style constant while varying the specified anatomy: stocky / muscular or athletic / rugged dwarves, and balanced / slender / sturdy halflings. Three dwarf studies received an additional anatomy pass to make shoulder mass and barrel torso differences clearer. No animation or game integration has been performed.
