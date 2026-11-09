# Mama Comes Home

A living picture book for the web in fifteen pages. Mama says goodbye to the
twins, Léo and Louis, and takes the dino train to her office at the top of a
tall tower, where the robots are very silly. Papa rollerblades the twins to
daycare in a trolley (helmet on, wheels glowing red) and picks them up at
sunset. At dinner Mama's chair is empty, the twins want Mama, and her train
is late in the rain, until the office robots fly her home to tuck them in.

Everything on each page moves a little, and the sound (a "Coming Home"
lullaby arranged differently for every page, the background sounds of each
place, and the noises) is all synthesised with WebAudio.

| Key | What it does |
| --- | --- |
| ← → | Turn the page (with a page-curl) |
| Space (pink button) | The place: the train, the office, the street... |
| Enter (blue button) | The others on the page: the twins, the robots, the station |
| Ctrl (green button) | Whoever the page is about: Mama, Papa, or the twins |

Each press plays the next trick in that key's list, and the colour buttons
under the book always say which trick comes next. Tapping works too: the
page edges turn pages, the middle cycles through the three buttons.

## The second book: Three Sleeps (the Fox Family)

Open `index.html#fox`, or pick it from the shelf in the page menu. Mama Fox goes
away for work for three sleeps, while Papa and the twins (dusty blue and rust
jumpers) make pancakes and count the nights on the moon calendar; then she comes
home with two wrapped presents that stay wrapped. There are eight pages, and on
each, three things to tap in the picture (they glint until found). They are also
the three colour buttons.

The family and most of the furniture are painted cut-outs from the supplied
bundle (`art/src/fox/`, cut by `tools/fox_extract.py`; what was checked, used
and rejected is in `art/src/fox/ASSETS.md`). Drawn in code to match: the
skies and hills, the whole city with the train, the window animals and the
bear, the car, the pan, pancakes and bowl, the curtains and night sky, the
living-room walls, and the presents. `BOOK=fox tools/thumbs.sh` remakes its
button pictures.

`index.html` is built from `head.html`, `body.html` and `src/*.js` by
`./build.sh` and is a single self-contained file. `legacy/` holds the pages
of the earlier "Little Dino Comes Home" version, which are not built.

## Button pictures

`tools/thumbs.sh` rebuilds the picture on every button from the book itself:
it presses each button in a headless browser, keeps the frame where the
trick shows most, crops around where the book reports the action (new
hearts, moving characters), and saves `art/btn-<page>-<trick>.webp`. Run it
after changing tricks; `tools/thumbs.sh morning dinner` redoes only those
pages.
