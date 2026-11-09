# Fox Family bundle: what was checked, what was used

The bundle arrived as **animated GIFs** (9 frames each, 150 ms, 256-colour
palettes, about 500 px wide), not the 3×3 PNG sheets `README-bundle.md`
describes: each GIF frame is one cell of a sheet. `tools/fox_extract.py`
cuts everything the book uses out of them and checks the result:

    python3 tools/fox_extract.py     # art/fox-*.webp, art/bg-fox-*.jpg, src/40-fox-poses.js

## The files

| File (as saved here) | What it really is | Used? |
| --- | --- | --- |
| `family_take_a.gif` | The family in a row: rest → twins cheer → rest | **Yes**: Mama and both twins (all their poses) |
| `family_take_b.gif` | A second take of the same | Reference (take A is a pixel or two cleaner) |
| `locked_family_design_paper.gif` | The same animation on paper | Reference only (no key to cut on) |
| `papa_sheet_5.gif` | Papa alone, 8 frames: rest, "oh!", hands out, arms wide, laugh, blink | **Yes**: every Papa in the book |
| `papa_sheet_1..4.gif` | The same Papa reaction at lower resolution | Reference (sheet 5 is the clearest) |
| `papa_reaction.gif` | Papa with loose wavy hair, no ponytail | **Rejected**: breaks the locked design |
| `family_lineup_2.gif` | Another lineup | **Rejected**: Papa's glasses are purple (hue 265°), the twins' shoes and emblems differ |
| `home_furniture_sheet.gif` | 9 furniture frames | **Yes**: table, chairs, mugs, fruit bowl, sofa, shelf, lamp, plant, rug, fireplace, window |
| `suitcase.gif` | Suitcase (rest + two tilts), moon calendar (0/1/2 lit), fox mug | **Yes**: the suitcase wobble and the calendar |
| `table_set.gif` | Table with chairs (flattened), a second suitcase, a static calendar | Table set **yes** (as one piece); the other suitcase and calendar **rejected** for consistency |
| `kitchen_background.gif` | The kitchen, letterboxed in magenta | **Yes**: pages 1 and 5 |
| `bedroom_background.gif` | Attic bedroom + packing case stages + travel items + rubber duck | **Yes**: pages 2 and 6, and all the packing |
| `cottage_exterior.gif` | Cottage (door shut / open), mailbox, robin, hydrangea, butterflies, gate | **Yes**: pages 3 and 7 |
| `table_scene_composite.gif`, `ref_*_composite.gif` | Whole scenes, flattened | Reference only, as the bundle says (and Mama has pigtails in one) |

## The ten checks

1. **Locked designs.** Papa: ponytail and square glasses. The glasses read blue in take A (222°) and sheet 5 (238°), so Papa comes from sheet 5 only, the one source with moving arms. Mama: red round glasses, ochre scarf, blue coat, bag ✓. Twins: rocket on dusty blue, dinosaur on rust, beige shorts ✓.
2. **Cell boundaries / positions.** Every frame of a take shares one canvas, and the characters' boxes move only ±2 px, so poses are anchored to the rest frame's feet (`src/40-fox-poses.js`) and swap without jumping.
3. **Magenta uniformity.** Not uniform: about 25 shades, green anywhere from 3 to 87, and soft "blooms" painted into the bedroom. The key is "red and blue both well above green", not a single colour.
4. **Fringes.** About 2,300 magenta-tinted edge pixels per family frame, plus key trapped in the hinge of Papa's glasses and inside a waving hand. Cure: drop the outer pixel ring, fill tiny enclosed holes, despill every pixel (nothing in this family is purple), despill again after scaling. The extractor fails if any visible purple remains; every page was also screenshot-scanned. Zero left.
5. **Scale and details across frames.** Consistent within each take. Mama's eyes never close in any frame, so her blink is painted on.
6. **Separate or flattened.** Papa and Mama are joined (her tail crosses his trouser leg), and the twins join hands when they cheer. Both are cut along a fixed column, the shared ink going to both. The table set and the scene composites are flattened, used whole or not at all.
7. **Layering.** Nothing ships in layers, so pages layer cut-outs themselves (twins behind the pancake table, the family inside the doorway). The bedroom quilt is part of the painting, so the twins sit up behind a drawn sheet fold.
8. **Idle ↔ action transitions.** Rest → excited → cheer → rest is smooth for the twins. Papa's sheet goes rest → "oh" → arms wide → back. Breathing, sway and blinks are added in code.
9. **One style.** The bundle's style holds across the sheets used. The drawn parts (skies, the city, the bear, pans, presents) use the same muted palette, a warm ink line and a paper grain laid over every page.
10. **Missing or defective.** `mug-dots` is clipped by its frame edge (dropped); the calendar never shows three moons lit (rebuilt from the second day's cell); the bedroom's magenta bloom is un-mixed onto paper. See the main README's list for what the book still draws in code.

The gifts on the last page are drawn in code, and the drawing has no open state.
