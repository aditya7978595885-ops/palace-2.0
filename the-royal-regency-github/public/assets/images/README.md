# Replaceable Images (`public/assets/images/`)

Place optional local image files here to customize backdrops or crests:
- `palace-exterior.jpg` — Optional palace exterior sky/backdrop override
- `garden-backdrop.jpg` — Optional sunset garden panorama override
- `royal-crest.png` — Optional custom monogram/crest emblem
- `

After adding a file, set its path in `public/assets/manifest.json` (e.g. `"/assets/images/royal-crest.png"`), or upload gallery photographs directly inside the app's Portrait Gallery or Customization Dashboard (saved permanently in IndexedDB).

If no file is configured, the palace gracefully uses high-detail procedural graphics.
