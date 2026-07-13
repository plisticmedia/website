# Assets to add before launch (for Ross)

These are the last pieces the site is waiting on. I can't pull them from Google
Drive directly (the network policy blocks Drive downloads and the files are too
big to route through the assistant), so please add them to the repo at the exact
paths below. Then tell Claude **"the assets are in"** and it will wire every one
into the right place in a single pass (including the showreel autoplay).

**Export web-sized, not raw.** Originals are 3–70 MB — that would make pages very
slow. Aim for: photos long-edge ~2000px JPG/WebP under ~500 KB; showreel a
compressed MP4 (1080p, H.264) ideally under ~25 MB.

## 1. Site photos → save in `public/assets/photos/site/`

| Drive file        | Save as               | Used on                                    |
| ----------------- | --------------------- | ------------------------------------------ |
| Ross Anderson 1   | `ross-anderson.jpg`   | Home — Podcasting                          |
| Kokura Luck 1     | `kokura-luck.jpg`     | Home — Video Production                    |
| AccelerateHER 1   | `accelerateher.jpg`   | Home — Event Filming · **About** main      |
| Documentary 1     | `documentary-1.jpg`   | Home — Documentary · Services — Documentary|
| Inspire 1         | `inspire-1.jpg`       | Home — Strathclyde Inspire                 |
| Tiny Changes 2    | `tiny-changes-2.jpg`  | Home — Tiny Changes                        |
| Connect-Ed 1      | `connect-ed-1.jpg`    | Home — Connect-Ed                          |
| Documentary 2     | `documentary-2.jpg`   | Home — Unfiltered                          |
| AccelerateHER 3   | `accelerateher-3.jpg` | Services — Podcasting                      |
| Scarlet Prism 1   | `scarlet-prism.jpg`   | Services — Video Production                |
| News Room 1       | `news-room.jpg`       | Services — Event Filming                   |
| Inspire 2         | `inspire-2.jpg`       | Our Work — Strathclyde Inspire             |
| Tiny Changes 1    | `tiny-changes-1.jpg`  | Our Work — Tiny Changes                    |
| Connect-Ed 2      | `connect-ed-2.jpg`    | Our Work — Connect-Ed                      |
| Documentary 3     | `documentary-3.jpg`   | Our Work — Unfiltered                      |

## 2. Barclays Eagle Labs logo → save in `public/assets/logos/`

Save a **clean, transparent-background** Eagle Labs logo (like the other
trusted-by logos — not the 1200×630 banner) as:
`public/assets/logos/eagle-labs-logo.png`

## 3. New showreel → save in `public/assets/video/`

Export the final showreel as a compressed MP4 and save as:
`public/assets/video/showreel.mp4`
(Once it's here, Claude will swap out the Drive embed for this file and make it
autoplay muted when it scrolls into view.)

---
Delete this file once everything's added.
