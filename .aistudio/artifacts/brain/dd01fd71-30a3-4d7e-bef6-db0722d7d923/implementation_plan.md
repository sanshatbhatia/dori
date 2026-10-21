# Dori Design Studio — 2D Lehenga Atelier Customization Engine

An interactive, mobile-first 2D garment configuration platform for **Dori**, enabling customers to customize bespoke Indian lehengas on a persistent, beautifully illustrated female fashion avatar before placing tailoring orders.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your Phase 1 confirmations, the following core specifications are established:
> - **Avatar Identity**: Illustrated 2D fashion avatar with large expressive eyes, defined eyeliner, crimson lips, small blue-purple earrings, and glossy black hair swept over one shoulder.
> - **Default Garment Preset**: Muted sage-green lehenga set (`#789B87`) with cropped blouse, notched lapel neckline, flared elbow-length sleeves, pleated floor-length flared skirt, gold waistband, heavy gold latkan ornament, and sheer ivory dupatta with gold edging.
> - **Default Draping**: Single-shoulder pleated dupatta drape cascading gracefully along the side of the skirt.
> - **Component Independence**: Strict layered vector architecture so changing any component (e.g., neckline or sleeve) updates only that SVG layer without redrawing the avatar or other garment parts.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces static mannequins with an interactive, mobile-optimized 2D design atelier. Customers can customize 7 distinct garment components (Blouse style, Neckline, Sleeves, Back cut, Skirt silhouette, Skirt length, Dupatta drape) and decorative latkans, viewing instant, high-fidelity vector updates across Front, Detail, and Back views.
- **Target Audience**: Dori bespoke fashion customers, brides, and bridal party clients designing personalized ethnic ensembles.
- **Key Value**: Provides a tactile, game-inspired fashion customization experience that bridges the gap between digital design and real-world custom tailoring, producing production-ready structured garment specifications.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Initial Load**: The studio opens to the full-length female avatar wearing the signature Dori sage-green lehenga set with flared elbow sleeves, notched lapel neckline, pleated skirt, sheer ivory dupatta, and gold latkan.
2. **Category Navigation**: The customer taps the left vertical component rail (`Bl`, `Ne`, `Sl`, `Ba`, `Sk`, `Le`, `Du`) to switch customization focuses; active category is highlighted in Dori deep forest green (`#174D33`).
3. **Neckline Selection**: Selecting `Ne` highlights the 9 neckline options in the bottom cards carousel with miniature vector diagrams. Tapping "Sweetheart" instantly updates the blouse neckline geometry on the avatar while hair, face, sleeves, skirt, and dupatta stay undisturbed.
4. **View Switching**: Tapping `DETAIL` smoothly pans and zooms into the upper torso and neckline; tapping `BACK` displays the avatar's back silhouette, hair cascade, back cutout/tie dori, and skirt rear pleats; tapping `FRONT` returns to full length.
5. **Pose Toggling**: Switching between `REST` and `STRETCH` alternates arm poses with responsive sleeve articulation.
6. **Latkan & Size Controls**: Tapping `NONE`, `LIGHT`, or `HEAVY` updates the hanging gold waist ornament. Tapping the header size badge opens an interactive size selector (`XS`, `S`, `M`, `L`, `XL`, `2XL`).
7. **History & Persistence**: Customer can `Undo` or `Redo` any modification, access the `More` menu to review the tailored design summary or reset to defaults, and export the structured design JSON.

### Visual Identity & Theme
- **Dominant Neutral Field (60%)**: Warm ivory canvas (`#F7F5EF`) providing a calm, editorial studio atmosphere.
- **Structural Surfaces (30%)**: Soft cream card containers (`#FFFDF9`), hairline dividers (`rgba(41, 41, 41, 0.08)`), and dark charcoal typography (`#292929`).
- **Brand Accent (10%)**: Dori deep forest green (`#174D33`) for active selectors, selection badges, and primary controls; champagne gold (`#C7A66A`) for latkans, embroidery borders, and metallic jewelry.
- **Typography**: Editorial serif heading (`Playfair Display` or system serif) for *"Lehenga Atelier"* paired with clean, modern sans-serif (`DM Sans` / `Plus Jakarta Sans`) for controls and tabular data.
- **Thumb Ergonomics**: Mobile bottom sheet drawer, horizontal card carousel with touch targets $\ge 44\text{px}$, and sticky surface heights capped at $\le 15\%$ of mobile viewport.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Vector SVG Avatar vs. External Image Generations**
  - *Chosen Approach*: Fully procedural, layered SVG vector avatar for face, hair, body, and garments using a unified 460x780 coordinate system.
  - *Why*: Guarantees instant sub-millisecond visual updates, perfect component isolation, zero broken external URLs, consistent avatar identity across all combinations, and seamless scaling on mobile screens.
  - *Alternatives Considered*: AI image generation API on every click was rejected because it introduces 5-10 second latency, costs per interaction, and causes avatar face drift.

- **Decision 2: Layered Z-Index Hierarchy with Front and Rear Hair**
  - *Chosen Approach*: Split hair into rear hair (rendered behind the torso) and front hair (falling over one shoulder across the clavicle and blouse), with garment layers slotted cleanly in between.
  - *Why*: Accurately mirrors Reference Image 1 & 3's fashion illustration where luscious hair sweeps over one shoulder without obscuring the blouse neckline.

- **Decision 3: Structured Design State with Reversible History**
  - *Chosen Approach*: Clean, immutable `GarmentDesign` state machine with snapshot-based undo/redo stack that tracks garment attributes while keeping UI view states separate.
  - *Why*: Allows easy serialization for tailor production sheets and prevents interface tab clicks from polluting the undo history.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Dori Design Studio App                          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │   AtelierHeader: Back, "Lehenga Atelier", Size, Undo/Redo, More │   │
│   └────────────────────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │   ViewControls: [FRONT | DETAIL | BACK]  [REST | STRETCH]       │   │
│   │   LatkanSelector: [LATKAN: NONE | LIGHT | HEAVY]               │   │
│   └────────────────────────────────────────────────────────────────┘   │
│   ┌───────────────┬──────────────────────────────────┬─────────────┐   │
│   │ ComponentRail │      Central Garment Workspace   │ FabricSwatch│   │
│   │  (Bl, Ne, Sl, │   ┌──────────────────────────┐   │ (Ivory Sheer│   │
│   │   Ba, Sk, Le, │   │ Layer 0: Rear Hair       │   │  Gold Trim) │   │
│   │   Du)         │   │ Layer 1: Avatar Body/Skin│   │             │   │
│   │               │   │ Layer 2: Skirt & Pleats  │   │             │   │
│   │               │   │ Layer 3: Waistband/Latkan│   │             │   │
│   │               │   │ Layer 4: Blouse & Neck   │   │             │   │
│   │               │   │ Layer 5: Sleeves (L & R) │   │             │   │
│   │               │   │ Layer 6: Dupatta Drape   │   │             │   │
│   │               │   │ Layer 7: Face & Features │   │             │   │
│   │               │   │ Layer 8: Front Sweep Hair│   │             │   │
│   │               │   └──────────────────────────┘   │             │   │
│   └───────────────┴──────────────────────────────────┴─────────────┘   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │   Dynamic Customization Panel: Horizontally scrollable cards   │   │
│   │   with vector previews for selected component (e.g. 9 Necks)   │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State Entities

```typescript
export interface GarmentDesign {
  garmentType: 'lehenga';
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL';
  blouse: {
    topStyle: 'fitted' | 'peplum' | 'corset' | 'wrap' | 'jacket';
    neckline: 'notched' | 'sweetheart' | 'princess' | 'round' | 'square' | 'vneck' | 'boat' | 'halter' | 'high';
    sleeves: 'sleeveless' | 'cap' | 'short' | 'elbow' | 'threequarter' | 'full' | 'bell' | 'flared';
    backStyle: 'roundBack' | 'squareBack' | 'deepBack' | 'keyholeBack' | 'tieBack' | 'cutOut';
    color: string;
    fabric: string;
  };
  skirt: {
    silhouette: 'aline' | 'circular' | 'flared' | 'tiered' | 'pleated';
    length: 'tea' | 'ankle' | 'floor' | 'trail';
    color: string;
    fabric: string;
  };
  dupatta: {
    enabled: boolean;
    drapeStyle: 'pleatedShoulder' | 'wristLoop' | 'royalShawl' | 'diagonalFront' | 'doublePallu';
    color: string;
    opacity: number;
    borderStyle: 'goldZari' | 'gotapatti' | 'scalloped' | 'minimal';
  };
  latkan: {
    style: 'none' | 'light' | 'heavy';
  };
}
```

### Component Hierarchy & Implementation Mapping
1. `src/components/AvatarRenderer.tsx`: Reusable illustrated female avatar with expressive fashion-game eyes, eyeliner, crimson lips, blue-purple earrings, rear hair, front side-swept locks, and proportional arms/torso.
2. `src/components/MannequinStage.tsx`: Refactored to integrate `AvatarRenderer` with the layered SVG garment architecture (Blouse, Neckline, Sleeves, Skirt, Dupatta, Latkan).
3. `src/data/garments.ts` & `src/data/geometry.ts`: Verify and complete the 9 neckline paths, flared sleeves, pleated skirt profile, single-shoulder sheer ivory dupatta drape, and gold latkan ornaments.
4. `src/components/DesignLibrary.tsx`: Vector miniature preview cards for the 9 necklines, sleeves, skirt silhouettes, and draping options.
5. `src/components/StudioHeader.tsx`: Interactive size selector popover, undo/redo buttons, and clean editorial branding.
6. `src/App.tsx`: Manages active garment state, undo/redo history stack, view mode transitions, and export handlers.
