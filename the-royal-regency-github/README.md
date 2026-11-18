# The Royal Regency — A Personalized 3D Romantic Palace

An immersive, interactive 3D fairytale romantic palace built with **React**, **TypeScript**, **Vite**, **Three.js**, **React Three Fiber**, **Drei**, **GSAP**, **Tailwind CSS**, and **Lucide React**. Everything works 100% locally in your browser with zero external API keys, paid services, or remote storage dependencies.

---

## Features

### Five Interactive 3D Chapters
1. **Chapter I — The Royal Arrival (`src/scenes/PalaceArrival.tsx`)**
   - Full-screen twilight European Baroque palace exterior, starry sky, crescent moon, glowing candlelit windows, marble entrance staircase, and courtyard lanterns.
   - Animated double royal entrance doors and GSAP fly-through camera transition upon clicking **Enter The Palace** (or clicking the doors).
   - Built-in Web Audio API generative romantic classical waltz with mute/volume controls (or drop your own local `.mp3` audio).
2. **Chapter II — The Grand Foyer (`src/scenes/GrandFoyer.tsx`)**
   - Real-time reflective veined marble floor, fluted Corinthian marble & gold pillars, sweeping velvet-carpeted royal staircase, dual swaying crystal chandeliers, falling rose petals, and two pairs of interactive GSAP-animated swinging wing doors.
3. **Chapter III — The Portrait Gallery (`src/scenes/PortraitGallery.tsx`)**
   - Multi-layered 3D gilded portrait frames with brass nameplates.
   - Upload your own local photographs (**JPG, JPEG, PNG, WEBP**) from desktop or mobile, replace photos, edit captions & dates, adjust frame count (4–12), switch gallery arrangements (**Corridor / Semicircle / Rotunda**), rotate individual frames, and click any frame for GSAP zoom + enlarged lightbox inspection.
4. **Chapter IV — The Royal Ballroom (`src/scenes/RoyalBallroom.tsx`)**
   - Reflective marble dance floor with inlaid champagne-gold compass medallion, three crystal chandeliers, draped velvet French windows, and a raised velvet dais holding a **live-editable 3D gilded royal dedication plaque** (Main Title, Dedication, Recipient's Name, Romantic Message, Special Date, Additional Text).
5. **Chapter V — The Sunset Rose Garden (`src/scenes/RoseGarden.tsx`)**
   - Golden-hour sunset sky shader, hundreds of instanced 3D roses, animated water-jet royal fountain, limestone pathways, flapping 3D butterflies, falling rose petals, and a romantic marble garden gazebo.
   - **Virtual 3D Royal Crown Try-On Mirror (`src/components/RoyalCrown.tsx`)**: Requests webcam access only when activated, runs 100% locally with optional client-side face tracking, lets you adjust crown position, scale, tilt, yaw, and style (plus local `.glb` model replacement), includes a Camera Off toggle, and lets you save a local PNG keepsake portrait.

### Complete Customization Dashboard (`src/components/CustomizationPanel.tsx`)
- Upload, replace, delete, reorder, rotate, and caption gallery photographs.
- Edit every welcome text, romantic message, ballroom plaque field, garden dedication, and custom memories timeline.
- Switch palace color themes, custom accent/background colors, typography styles, decorative effects, music toggle & volume.
- All changes auto-save locally to **IndexedDB** (with `localStorage` fallback), plus **Export/Import JSON** backup and **Reset to Default**.

---

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run typecheck
npm run build
npm run preview
```

---

## Replacing Local Assets

You can replace assets in two ways:
1. **Inside the App:** Open **Customize → Visuals & Assets** to upload custom marble textures, damask wallpaper, rose petal sprites, a custom `.glb`/`.gltf` 3D crown model, or a custom `.mp3`/`.wav` soundtrack directly into browser storage.
2. **In `public/assets/`:** Drop files into `public/assets/images/`, `public/assets/textures/`, `public/assets/models/`, or `public/assets/audio/` and reference them in `public/assets/manifest.json`. Missing assets gracefully fall back to high-detail procedural Three.js materials and models.
