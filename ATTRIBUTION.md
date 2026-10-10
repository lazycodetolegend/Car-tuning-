# Attribution and Licensing

This project contains two distinct kinds of material, and they are licensed differently.

## 1. Application code — original work

Everything under `backend/`, `js/`, `css/`, and all HTML pages are original work created for
this project. This includes the API, the authentication system, the database models, the
frontend interface, and the 3D rendering and configuration logic. This code is released under
the MIT Licence.

## 2. 3D assets — third party

**The 3D car and wheel models are not original work.** They were obtained from external
sources and integrated into this application. The contribution of this project is the
configurator that loads, displays, and modifies these models — not the creation of the geometry
itself.

### Car models — `models/`

| File | Vehicle | Source | Licence |
|---|---|---|---|
| `1987_ferrari_f40.glb` | Ferrari F40 (1987) | _to be confirmed_ | _to be confirmed_ |
| `1997_nissan_skyline_gt-r_v-spec_r33.glb` | Nissan Skyline GT-R R33 V-Spec (1997) | _to be confirmed_ | _to be confirmed_ |
| `2020_audi_rs6_avant.glb` | Audi RS6 Avant (2020) | _to be confirmed_ | _to be confirmed_ |
| `2025_ferrari_12cilindri.glb` | Ferrari 12Cilindri (2025) | _to be confirmed_ | _to be confirmed_ |
| `996.glb` | Porsche 911 (996) | _to be confirmed_ | _to be confirmed_ |
| `car_modular.glb` | Modular base body | _to be confirmed_ | _to be confirmed_ |
| `f82.glb` | BMW M4 (F82) | _to be confirmed_ | _to be confirmed_ |
| `gallardomain.glb` | Lamborghini Gallardo | _to be confirmed_ | _to be confirmed_ |
| `lamborghini_huracan.glb` | Lamborghini Huracán | _to be confirmed_ | _to be confirmed_ |
| `lamborghini_revuelto.glb` | Lamborghini Revuelto | _to be confirmed_ | _to be confirmed_ |
| `m8.glb` | BMW M8 | _to be confirmed_ | _to be confirmed_ |
| `mk5.glb` | Volkswagen Golf Mk5 | _to be confirmed_ | _to be confirmed_ |
| `nissan_skyline_r32_gt-r.glb` | Nissan Skyline GT-R R32 | _to be confirmed_ | _to be confirmed_ |
| `r34.glb` | Nissan Skyline GT-R R34 | _to be confirmed_ | _to be confirmed_ |
| `r8.glb` | Audi R8 | _to be confirmed_ | _to be confirmed_ |
| `s14.glb` | Nissan Silvia S14 | _to be confirmed_ | _to be confirmed_ |
| `s15main.glb` | Nissan Silvia S15 | _to be confirmed_ | _to be confirmed_ |
| `supra.glb` | Toyota Supra | _to be confirmed_ | _to be confirmed_ |

### Wheel models — `rims/`

| File | Source | Licence |
|---|---|---|
| `equip 5.glb` | _to be confirmed_ | _to be confirmed_ |
| `lm.glb` | _to be confirmed_ | _to be confirmed_ |
| `meister.glb` | _to be confirmed_ | _to be confirmed_ |
| `nt03.glb` | _to be confirmed_ | _to be confirmed_ |
| `tire.glb` | _to be confirmed_ | _to be confirmed_ |
| `vs-xx.glb` | _to be confirmed_ | _to be confirmed_ |

---

## Note to the maintainer

The **Source** and **Licence** columns above are intentionally blank. Do not fill them in from
assumption — list the actual page each asset was downloaded from, and the licence stated on that
page.

To complete this file:

1. For each row, record the URL or site the model came from and the author's name if given
2. Record the licence exactly as stated — for example CC BY 4.0, CC0, editorial use only, or
   non-commercial use only
3. If an asset came from a source that does not permit redistribution or commercial use,
   remove it from the repository rather than listing it here
4. Any asset whose origin cannot be traced should be removed

One asset previously in this repository carried the download site in its own filename
(`ferrari_laferrari__www.vecarz.com.glb`), which identifies its source. That pattern is worth
checking for elsewhere.

## Trademarks

The vehicle and wheel names above are trademarks of their respective manufacturers. The models
are used here for demonstration purposes only. This project is not affiliated with, endorsed by,
or sponsored by any vehicle manufacturer, and it must not be presented as official or
manufacturer-approved software.

## If you fork or reuse this project

- The application code is MIT licensed — use it freely
- The 3D assets are **not** covered by that licence and carry their own terms
- Verify the licensing of every file in `models/` and `rims/` before deploying publicly,
  particularly for any commercial use
- Replace the assets with your own if you cannot establish their licence