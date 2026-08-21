# Storefront Architecture & UX Specifications

This document defines the user experience, layout hierarchy, and component contracts for the **Public Storefront** (`src/site/`).

---

## 1. Visual & Editorial Direction

The visual identity is Scandinavian-inspired, editorial, and architectural:
- **Palette**: Dominantly clean white/off-white canvas (`#FFFFFF`, `#FAF9F6`, `#F5F3EF`), with warm stone, sand, and taupe accents, anchored by deep charcoal/black typography (`#141311`).
- **Typography**: Refined serif editorial display font (`Cormorant Garamond`) paired with a modern, legible geometric sans-serif (`Inter`) for body and interface text.
- **Rhythm**: Generous whitespace, asymmetric grid layouts, alternating image-left/text-right storytelling, and uncluttered product presentations.
- **Brand Neutrality**: All brand elements are placeholder tokens (`Vazo Studio`), ensuring straightforward re-branding without hardcoded domain dependencies.

---

## 2. Global Header & Navigation Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ Announcement Bar: "Perakende ve toptan satışlarımız mevcuttur."       │
├────────────────────────────────────────────────────────────────────────┤
│ [Logo]  Yeni  |  Perakende (Mega)  |  Toptan (Mega)  |  Koleksiyonlar  │
│         Hakkımızda  |  İletişim          [🔍 Ara] [👤 Hesap] [🛒 Sepet] │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Announcement Bar
- Dynamic announcement banner (managed via admin CMS).
- Clear bilingual or Turkish retail/wholesale indicator.
- Dismissible or rotating promotional notice capability.

### 2.2 Navigation Bar
- **Sticky / Glassmorphism**: High-contrast white background with subtle border and backdrop blur.
- **Brand Mark**: Clean typographical logo placeholder.
- **Primary Links**:
  - `Yeni` (New arrivals)
  - `Perakende` (Retail catalog with dedicated mega menu)
  - `Toptan` (Wholesale B2B with dedicated mega menu)
  - `Koleksiyonlar` (Curated collections)
  - `Hakkımızda` (Brand philosophy and studio story)
  - `İletişim` (Contact & studio location)
- **Utility Actions**: Search trigger, Account/Login modal, Wishlist indicator, Cart slide-over trigger with badge count.

---

## 3. Mega-Menu Specifications

Both **Perakende** and **Toptan** have dedicated, full-width desktop mega menus containing grouped links and editorial promotional cards.

### 3.1 Perakende (Retail) Mega Menu
- **Kategoriler**: Tüm Ürünler, Yeni Gelenler, Çok Satanlar, Masa Üstü Vazolar, Zemin Vazoları, Heykelsi Formlar, Seramik Setler.
- **Materyaller & Bitişler**: Mat Seramik, Ham Toprak, Sırlı Porselen, Taş Doku.
- **Koleksiyonlar**: Nordik Minimalizm, Organik Kıvrımlar, Monokrom Seri.
- **Promotional Card**: Featured new release with imagery, title, and "Keşfet" call to action.

### 3.2 Toptan (Wholesale / B2B) Mega Menu
- **B2B Programı**: Toptan Satış Koşulları, Kademe İndirimleri, Minimum Sipariş (MOQ), Numune Talebi.
- **Sektörel Çözümler**: İç Mimarlar & Projeler, Otel & Restoran, Butik Mağazalar, Kurumsal Hediyeler.
- **Süreç & Başvuru**: Bayilik & Trade Başvuru Formu, Sipariş ve Üretim Takvimi, Lojistik & Palet Teslimat, B2B Müşteri Temsilcisi.
- **Promotional Card**: "Projeleriniz İçin Özel Üretim & Toptan Fiyatlandırma" banner with instant trade application CTA.

### 3.3 Mobile Navigation Counterpart
- Full-screen slide-out mobile drawer.
- Collapsible accordion sections for `Perakende` and `Toptan` link hierarchies.
- Direct quick links for Account, Trade Application, and Language/Currency.

---

## 4. Homepage Editorial Sections

The homepage avoids generic cookie-cutter e-commerce layouts by using editorial storytelling:

1. **Hero Section**: Full-width or split editorial hero with high-impact product photography, elegant typography, and dual CTAs ("Perakende Koleksiyonu Keşfet" & "Toptan / Kurumsal Teklif Al").
2. **Curated Categories / Form Exploration**: Visual cards highlighting vase shapes (Amforik, Silindirik, Asimetrik, Minimal).
3. **Alternating Storytelling Block (Left/Right)**: Craftsmanship narrative with large image on left, artisanal copy on right.
4. **Bestseller & New Arrivals Grid**: Clean product cards with hover states, material tags, retail pricing, and wholesale MOQ flags.
5. **Wholesale / Trade Advantages Section**: Highlighting low MOQ, custom production for architects, volume discounts, and express logistics.
6. **Editorial Lookbook / Collection Banner**: Immersive lifestyle styling showing vases in minimalist Scandinavian interiors.
7. **Footer**: Brand statement, newsletter signup, quick links, wholesale portal link, legal policies, and copyright.
