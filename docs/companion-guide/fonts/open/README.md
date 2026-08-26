# Bundled open fonts

The course renders completely with the files in this directory. Nothing here is
fetched at build time or at read time, so the book sets correctly on a machine
with no network access and inside a ministry network that blocks font CDNs.

Every face is licensed under the SIL Open Font License 1.1. The full licence
text ships beside the files it covers, as the OFL requires.

| Family | Role | Files | Source |
|---|---|---|---|
| Inter | Body and interface sans | `inter/` | [rsms/inter](https://github.com/rsms/inter) release `v4.1`, asset `Inter-4.1.zip`, `web/` directory |
| IBM Plex Serif | Display serif, h1 and h2 | `ibm-plex-serif/` | [IBM/plex](https://github.com/IBM/plex) release `@ibm/plex-serif@2.0.0`, asset `ibm-plex-serif.zip`, `fonts/complete/woff2/` |
| IBM Plex Mono | Code | `ibm-plex-mono/` | [IBM/plex](https://github.com/IBM/plex) release `@ibm/plex-mono@2.5.0`, asset `ibm-plex-mono.zip`, `fonts/complete/woff2/` |

## Checksums

Recorded on download, 2026-08-26. Verify with `shasum -a 256 -c` against this list.

```
fa888127b6da015b65569f0351f3b5c391ad928904951f1c20e9f8462a8d95ea  inter/Inter-Bold.woff2
2d078cb3bc8f934740d53b39dd23b0678f2f97477e49ec785dd9d8acd8b96bfc  inter/Inter-Italic.woff2
e06f6b1bc553aaea4e4668023ed0ab0a147129c3107f511bc7d03d361b0ae085  inter/Inter-Regular.woff2
5cb7103e4e605989afebc03d989c79201e54b21b5183db33981f70db9178a301  inter/Inter-SemiBold.woff2
3b9eb99793dd9fed419aaf1af03559ea28bac17b7cb6146e7f8fc3db813621fe  ibm-plex-serif/IBMPlexSerif-Bold.woff2
024ebce13cec984b46e350dd85fa7c01105c777e116bfe95f097ad7fa93f39f2  ibm-plex-serif/IBMPlexSerif-Regular.woff2
030d808e82f99ebe5c21d50745bd06e5ce16ad9e94b360f5adcc19362beb5344  ibm-plex-serif/IBMPlexSerif-SemiBold.woff2
ea576f38d05cc44cca48c45314984beb8cc1d2b886f58e1dce99f15dc344eb1d  ibm-plex-mono/IBMPlexMono-Bold.woff2
2024bf2b08027dcd6d09091385756e327744bbe26b782c411381dffc40ffc622  ibm-plex-mono/IBMPlexMono-Italic.woff2
ba204497f16b6d334cee9d1e963a831b73e3a56e1d6300a8489d18df7214b350  ibm-plex-mono/IBMPlexMono-Regular.woff2
```

## The other skin

`_custom.css` names the licensed Klim faces first in every stack and these open
faces second. The Klim files are not in this repository and never will be. They
load only under the `brand` Quarto profile, from `/fonts/klim/`, on a host
covered by the licence. See the Colophon in the preface.
