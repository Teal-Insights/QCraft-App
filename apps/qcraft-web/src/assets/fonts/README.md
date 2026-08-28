# Fonts vendored for chart images

Three subset Inter faces and their licence. They exist for one purpose: an
exported chart PNG has to carry the same letterforms on every machine.

## Why they are here at all

A chart PNG is produced by loading the chart's SVG through an `Image` and
drawing it into a canvas. An SVG loaded that way is an isolated document: it
does not inherit the page's stylesheets and it does not fetch external
subresources, so a webfont referenced by URL is never requested and the app's
own font stack never applies. The face has to travel inside the SVG as a data
URI or the text silently falls back to whatever the viewing machine happens to
have. Measured: with no embedded face, the raster is bit-identical to one asking
for a family that does not exist.

## Why Inter and not the brand faces

The dual-skin rule from the sprint's binding notes. Söhne and Tiempos are Klim
faces, licensed per user, and their files never touch a repository. The open
skin is IBM Plex and Inter, bundled with their licences and reproducible
offline. The rasterizer replaces the SVG's `font-family` outright with a
private family name, so no Klim name reaches the PNG path.

Inter is SIL OFL 1.1 with **no Reserved Font Name**, so a subset may keep the
name. IBM Plex carries the Reserved Font Name "Plex" and a subset of it would
have to be renamed; that only matters if the report's serif is ever rasterized,
which it is not today.

## Provenance and how to regenerate

Sources: `lane4-course/docs/companion-guide/fonts/open/inter/`, Inter v4.1,
carried in with `OFL.txt` unmodified.

Bold is not decoration: `chartSvg.ts` sets the WEO boundary label to weight 700,
and with only 400 and 600 present the browser silently renders SemiBold rather
than synthesising a bold.

```bash
for F in Regular SemiBold Bold; do
  uvx --from "fonttools[woff]" pyftsubset Inter-$F.woff2 \
    --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2015,U+2018-201D,U+2022,U+2026,U+2032-2033,U+2039-203A,U+2044,U+2212,U+00D7,U+00B1,U+00B5" \
    --layout-features='kern' --no-hinting --desubroutinize --name-IDs='*' \
    --flavor=woff2 --output-file=Inter-$F.qcraft.woff2
done
```

The Latin-1 range is the subset, not bare ASCII. A tighter subset falls back per
glyph in the middle of a string, silently: `°` survives it but `ö`, `µ`, `×` and
a curly apostrophe do not, and the chart labels carry all four. `--name-IDs='*'`
keeps name IDs 13 and 14, which are the licence text and its URL.

The three subsets are about 35 KB together, against 341 KB for the full faces.
