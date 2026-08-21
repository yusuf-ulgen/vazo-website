# Storefront Visual Specification & Design Contract

This document formalizes the visual language, layout rhythms, typography hierarchy, and component aesthetics derived from the five approved original design reference mockups for the **Vazo E-Commerce Platform**.

---

## 1. Visual DNA & Aesthetic Guidelines

| Dimension | Specification | Implementation Rule |
| :--- | :--- | :--- |
| **Color Palette** | Pure White (`#FFFFFF`), Warm Off-White / Ivory (`#FAF9F6`, `#F8F6F0`), Soft Stone (`#F3EFEA`, `#DFD9CB`), Sand (`#E4D9C0`), Taupe (`#CFC9C5`), Charcoal Text (`#141311`), Inverse Off-White (`#FAF9F6`). | Zero saturated primary colors. Never hardcode arbitrary hex colors; use Tailwind semantic tokens (`bg-canvas-warm`, `text-text-primary`, `border-border-subtle`). |
| **Typography** | Display: `Cormorant Garamond` (high-contrast editorial serif).<br/>UI / Navigation / Body: `Inter` (clean neutral sans-serif). | Display titles use `font-display`, light-to-normal weight (`font-light`, `font-normal`). Overlines use `text-xs uppercase tracking-editorial font-semibold`. |
| **Borders & Radii** | Hairline borders (`1px solid var(--color-border-subtle)` / `var(--color-border-default)`). Sharp corners (`rounded-none` or `rounded-[2px]`). | Prohibit large bubbly border-radii (`rounded-2xl`, `rounded-3xl`) and heavy card outlines. |
| **Shadows & Elevation** | Flat or ultra-subtle (`0 1px 2px rgba(20,19,17,0.04)`). Dropdown mega menus use refined floating shadow (`--shadow-dropdown`). | No harsh dropshadows or glowing neon accents. |
| **Motion & Interaction** | Subtle fade-in, dropdown slide (150ms), image zoom on hover (1.03–1.05 scale, duration 700ms ease-out). Respect `prefers-reduced-motion`. | No jarring page transitions or bouncy physics. |

---

## 2. Reference Mockup Breakdown & Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│ Reference A: Global Header, Thin Announcement, Mega Menu & Hero Rail   │
├────────────────────────────────────────────────────────────────────────┤
│ Reference B: Alternating Editorial Craftsmanship Storytelling (L/R)    │
├────────────────────────────────────────────────────────────────────────┤
│ Reference C: Dual Retail (Living) vs Wholesale (Architectural) Split   │
├────────────────────────────────────────────────────────────────────────┤
│ Reference D: Flagship PDP Layout, Thumbnail Rail & Live B2B Tier Table │
├────────────────────────────────────────────────────────────────────────┤
│ Reference E: Category Image Tiles, Wholesale Benefits & Navigation CMS │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Reference 01 — Mega Menu & Hero Presentation (`reference-01-mega-menu.png`)
- **Announcement Strip**: Warm stone tone (`#FAF8F5`), centered concise message (`"Perakende ve toptan satışlarımız mevcuttur"`), clean dismiss action.
- **Header**: Left brand logo (`LUNA FORMS` / `VAZO STUDIO`), centered links (`Yeni`, `Perakende ▾`, `Toptan ▾`, `Koleksiyonlar ▾`, `Hakkımızda`, `İletişim`), right utility icons (`Search`, `User`, `Wishlist` with badge pill, `Cart` with badge pill).
- **Mega Menu Structure**:
  - *Perakende Dropdown*: 3 sub-columns (`Alışveriş`, `Koleksiyonlar`, `Kategoriler`) + 1 Promo Card (`Perakende Alışverişe Git →`).
  - *Toptan Dropdown*: 3 sub-columns (`Hakkımızda`, `Ürünler`, `Destek`) + 1 B2B Promo Card (`Toptan Satışa Başvur →`).
- **Hero Section**: Large editorial vase imagery, left-aligned typography (`"Modern Formlar. Zamansız Dokunuşlar."`), dual CTA buttons (`PERAKENDE ALIŞVERİŞE GİT` solid charcoal, `TOPTAN SATIŞA BAŞVUR` outline).
- **Product Rail**: `"Çok Satanlar"` header with `"Tüm Ürünleri Gör →"` link, 6-card horizontal grid with wishlisting heart icons, clean titles and Turkish Lira pricing (`2.450 TL`).

### 2.2 Reference 02 — Alternating Editorial Craftsmanship (`reference-02-editorial.png`)
- **Block 1 (Image-Left / Text-Right)**:
  - Left: Warm stone photography of stoneware vase on marble console with art book.
  - Right: Eyebrow `"YENİ KOLEKSİYON"`, Display Serif Title `"Formun sadeliği, mekâna anlam katar."`, Body description, Solid Sand/Taupe CTA Button `"KEŞFET"`.
- **Block 2 (Text-Left / Image-Right)**:
  - Left: Eyebrow `"EL YAPIMI SERAMİK"`, Title `"Doğadan ilham alan özgün tasarımlar."`, Body description, Outline CTA Button `"KOLEKSİYONU İNCELE"`.
  - Right: Texturized sculptural vase photography on rustic reclaimed wood surface.
- **Toptan Avantajlar Bar**: 4-column trust strip with circular icon badges (`Özel Fiyat Avantajı`, `Geniş Ürün Yelpazesi`, `Hızlı ve Güvenli Teslimat`, `Özel Destek`).

### 2.3 Reference 03 — Dual Retail & Wholesale Split Presentation (`reference-03-retail-wholesale.png`)
- **50/50 Dual Journey Portal**:
  - *Left (Bireysel Alışveriş / Perakende)*: Warm interior styling, `"Perakende"`, `"Evinize estetik dokunuşlar katacak vazo koleksiyonlarımızı keşfedin."`, `"ALIŞVERİŞE BAŞLA →"` solid button.
  - *Right (Profesyonel Alışveriş / Toptan)*: High-ceiling architectural / meeting room setting, `"Toptan"`, `"Projeleriniz için özel fiyatlar, geniş ürün seçeneği ve profesyonel destek alın."`, `"TOPTAN ALIŞVERİŞE GEÇ →"` outline button.
- **Carousel Product Rail**: `"En Çok Tercih Edilenler / Çok Satan Vazo Modelleri"` with circular navigation arrows (`<`, `>`).
- **Ticari Avantajlarımız (B2B Trust)**: 5-column benefit cards with thin line icons (`Özel Toptan Fiyatlar`, `Geniş Ürün Yelpazesi`, `Kaliteli & Dayanıklı Ürünler`, `Hızlı & Güvenli Teslimat`, `Profesyonel Destek`).

### 2.4 Reference 04 — Flagship Product Detail Page (PDP) (`reference-04-product-detail.png`)
- **Desktop Two-Column Grid**:
  - *Left Gallery*: Vertical thumbnail column (5 thumbnails) + Main high-resolution zoomable viewer with pagination arrows and full-screen zoom icon.
  - *Right Sticky Information Panel*:
    - Brand overline (`LUNA FORMS` / `VAZO STUDIO`)
    - Title: High-contrast serif (`LUNA FORM NO.07`)
    - Subtitle: `El Yapımı Seramik Vazo`
    - Price: `2.950 TL` with `Vergi dahil` (KDV Dahil) label
    - Color swatches: Interactive circular color swatches (Cream, Beige, Charcoal, Anthracite)
    - Specifications: Material (`%100 El Yapımı Seramik`), Dimensions (`Yükseklik: 28 cm • Genişlik: 18 cm • Ağız Çapı: 6 cm`)
    - Quantity Stepper: `- 1 +` with `Stokta var` indicator
    - Actions: Full-width charcoal `SEPETE EKLE` button + Wishlist heart toggle button
    - Trust Badges: `Ücretsiz Kargo (1.000 TL üzeri)`, `Güvenli Ödeme 256-bit SSL`, `Kolay İade (14 gün içinde)`
  - *Live Wholesale Volume Module (B2B Tiers Table)*:
    - Title: `TOPTAN ALIM / WHOLESALE (Toplu alımlarda özel fiyat avantajları)`
    - Structured Tier Table:
      - `6 - 11 adet` | `2.360 TL` | `%20 indirim`
      - `12 - 23 adet` | `2.213 TL` | `%25 indirim`
      - `24 - 49 adet` | `2.065 TL` | `%30 indirim`
      - `50+ adet` | `Özel fiyat` | `Teklif alınız`
    - Actions: `TOPTAN FİYAT AL` button + `B2B GİRİŞ YAP` link
  - *Bottom Story Accordions & Lifestyle Inspiration*:
    - 3 Key Highlights: `Ürün Hikayesi`, `El Yapımı`, `Zamansız Tasarım`.
    - 4-column lifestyle photo gallery (`KULLANIM İLHAMI`).
    - Accordion toggles: `Teknik Detaylar`, `Kargo & Teslimat`, `Sıkça Sorulan Sorular`.

### 2.5 Reference 05 — Hybrid Homepage, Category Tiles & Navigation (`reference-05-hybrid-home.png`)
- **Interactive Dual Mode Switcher**: Pill toggle on hero (`Perakende` active dark / `Toptan` outline).
- **Category Image Grid**: 5-column square image cards (`Seramik Vazolar`, `Stoneware Vazolar`, `Cam Vazolar`, `Setler`, `Dekoratif Obje`) with subtitle labels.
- **B2B Trust Module Card**: Bordered card with list of benefits + `TOPTAN BAŞVURU YAP →` CTA.
- **Editorial Spotlight Card**: `"İlham / Formun sadeliğinde anlamı bulduk"` with text and lifestyle vase imagery.
