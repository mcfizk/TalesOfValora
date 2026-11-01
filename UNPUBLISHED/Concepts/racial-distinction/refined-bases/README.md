# Selected bases: commoner clothing and grooming refinement

Four refined bases preserve the user's selected anatomy while making dwarf and halfling clothing and grooming more distinct. This is a review pass only. Existing artwork, game code, manifests, renderers and character definitions have not been changed.

## Review sheets

- [Comparison preview](comparison-preview.png): human reference, selected dwarf, refined dwarf, selected halfling, refined halfling. Men are on the upper row and women on the lower row.
- [Comparison at native resolution](comparison-native.png)
- [Refined silhouette preview](silhouettes-preview.png): all four refinements alongside the two human references at the same world scale.
- [Silhouettes at native resolution](silhouettes-native.png)

Native sheets display exported sprite pixels at 1:1. Previews use one-quarter scale and nearest-neighbor character sampling. Figures are not independently enlarged to fill their cells. Solid silhouettes preserve the outer clothing and hair contour but remove interior detail.

## Individual sprites and changes

| File | Selected foundation | Refinement |
|---|---|---|
| [dwarf-male-base-selected.png](dwarf-male-base-selected.png) | Dwarf male A; 75% human height | Broad stocky body retained. A structured slate-blue cloth work tunic has a straight finished hem, visible seams and modest ochre edging. A square buckled leather belt defines the waist above sturdy trousers and boots. The beard is now long, neatly sectioned, and secured with small rings and a restrained geometric charm; head hair is swept back and tied. |
| [dwarf-female-base-selected.png](dwarf-female-base-selected.png) | Dwarf female C; 70% human height | Compact rugged torso, thick limbs, strong face and low stature retained. A burgundy cloth work tunic uses tidy collar, cuff and hem edging, a buckled belt, sturdy trousers and boots. The short bob has become a long arranged braid with grey streaks and a small fastening. She retains the selected dwarf build rather than adopting a slender human silhouette. |
| [halfling-male-base-selected.png](halfling-male-base-selected.png) | Halfling male A; 60% human height | Balanced small-adult proportions and broad bare feet retained. The moustache is removed, with a clean-shaven adult face and lightly tousled curls. A soft moss-green tunic has relaxed sleeves and rumpled folds, secured by a simple knotted cord rather than a leather buckle. Loose russet-brown cropped trousers leave the ankles, insteps and toes visible. |
| [halfling-female-base-selected.png](halfling-female-base-selected.png) | Halfling female A; 60% human height | Selected small-adult face, light arms and broad bare feet retained. A plain dusty-teal dress replaces the tunic and trousers, with a gathered continuous skirt, relaxed sleeves, modest neckline and cord waist tie. The practical lower-calf hem exposes both feet. Loosely gathered curls and escaping strands keep her presentation informal. |

## Race identity

Dwarves use firmer garment structure, deliberately finished seams, buckled belts, substantial boots and maintained hair. Their small crafted fastenings express care and workmanship. These are textile commoner garments: no chest armor, shoulder plates, metal-clad boots, helmets, weapons or adventuring equipment were added. The small metal pieces are limited to ordinary buckles and grooming ornaments.

Halflings use softer folds, cord fastenings, relaxed hair and comfortable clothing. The man wears loose trousers and the woman a simple dress. Both are barefoot, with visible toes and insteps. Their clothing is intact and clean despite its relaxed folds; it does not suggest neglect. Mature faces, restrained eye sizes and the selected body proportions retain the small-adult identity.

The established left-facing three-quarter idle pose, slight overhead camera, upper-left lighting, dark stepped outlines, angular shading and earthy palette are retained. Dwarf blue/burgundy and halfling moss/teal differentiate the garments without introducing a new rendering style.

## Quality review

| Check | Result |
|---|---|
| Distinct from humans and from each other | Dwarves remain broad and heavy at 70–75% human height; halflings remain lighter and smaller at 60%. The silhouettes show those differences independently of garment colors. |
| Dwarf clothing structured and professional | Finished collars, seams, cuffs and hems, firm buckled belts, and well-maintained boots are visible. |
| Dwarf male long beard | Long sectioned beard reaches down the chest; restrained rings and a charm provide grooming detail. |
| Dwarf female no short hair | A long braid extends behind the shoulder toward the waist. |
| Halfling clothing relaxed and slightly ruffled | Soft sleeves and folds, simple cord ties and loose hair replace the more formal dwarf presentation. |
| Halfling male loose pants and minimal beard | Loose cropped trousers; clean-shaven face. |
| Halfling female dress or skirt | One continuous gathered dress skirt, with no trouser legs or divided skirt. |
| All halflings barefoot | Both figures expose both complete feet, including toes and insteps. |
| No armor | No armor, weapons, shields or protective metal components appear. |
| Style continuity | Pose, lighting and pixel-art rendering closely match the selected concepts and human references. The shared export grid avoids blurred edges. |

## Scale, export and validation

All four final files are transparent **1120 × 1448 RGBA PNGs** on the same four-pixel logical grid as the selected concepts. The shared baseline is **y = 1376** as the exclusive lower edge; the lowest opaque row is 1375.

| Sprite | Visible height | Human-relative height | Change in total visible width from selected concept |
|---|---:|---:|---:|
| Dwarf male | 960 px | 75% | +12 px |
| Dwarf female | 896 px | 70% | −4 px |
| Halfling male | 768 px | 60% | +8 px |
| Halfling female | 768 px | 60% | −12 px |

Widths include clothing, hair and hands and are not skeletal measurements. The small width changes are consistent with the new garments and grooming; exact pixel-for-pixel anatomical correspondence is not claimed. Visible height includes hair and footwear, using the same convention as the selected concepts.

The comparison is 1348 × 1000 pixels in preview and 5392 × 4000 at native resolution. The silhouette sheet is 1608 × 568 in preview and 6432 × 2272 at native resolution. Both preserve one shared world scale and baseline for each row.

Validation decoded the PNGs with CRC checking and verified dimensions, nonempty bounds, canvas padding, binary transparency, four-pixel grid consistency, exact selected visible heights and common baselines. The final sprites have zero partially transparent pixels and zero grid errors. SHA-256 checks confirmed that all 63 pre-existing sprite and concept files remained unchanged. Detailed measurements are in `validation.json`.

## Remaining considerations and next steps

These four poses are ready for visual selection, not animation or game integration. The dwarf beard and long braid need consistent attachment points and overlap rules in future side/back views. The female halfling's dress will need hem clearance and leg/foot contact checks during a walk cycle. Tiny beard rings and trim may need simplification at the eventual gameplay display size; keep the long-beard and structured-clothing shapes readable even if those details disappear.

The halo-free, crisp exported grid is consistent with the previous review convention. At very small display sizes, relaxed versus structured fabric is less obvious than the silhouette and grooming difference, so the next art review should include the intended gameplay zoom after these bases are approved. No additional frames have been produced.

`generation/` retains the full-detail drawings before baseline and grid export. Use the four PNGs beside this README as the final review bases. `study-spec.json` contains the clothing/grooming briefs, and `build-review.cjs` reproduces the export and sheets using the bundled PNG/canvas libraries. Artwork was refined with the built-in image generation tool; subsequent processing is uniform nearest-neighbor scaling, alpha cleanup, padding and raster layout, with no nonuniform stretching of anatomy.
