# Landing Page Design

Date: 2025-06-15
Status: Approved

## Overview

Build a full marketing landing page at `/` (currently redirects to `/dashboard`) with hero animation, feature showcases, and final polish pass. Public page, no auth required, standalone layout without dashboard sidebar/topbar.

## Sections

### 1. Hero
- Full-bleed section with `gradient-glow` ambient background
- Glass panel with animated pipeline visualization using GSAP: `Spec → Response → Validation → Mock`
- Headline: "Validate API Responses. Generate Perfect Mocks. Ship With Confidence."
- Supporting paragraph
- Primary CTA: "Start Validating APIs" → `/register`
- Secondary CTA: "View Demo" → scrolls to dashboard preview
- GSAP timeline-entrance for pipeline boxes and connecting rays

### 2. Trust Bar
- Placeholder logos row: "Trusted by teams at..." with 4-5 muted logo placeholders

### 3. Core Features Grid
- 3-column card grid (responsive: 1-col mobile, 2-col tablet, 3-col desktop)
- Schema Validation, Automated Mock Generation, Difference Detection
- Each card: lucide icon, title, description, "Learn more" anchor link

### 4. Feature Deep Dives
- 5 alternating sections (image|text, text|image layout)
- Each: visual mock (simplified component) + text + CTA
- Sections: Schema Validation, Mock Generation, Diff Detection, API Testing Workspace, Reporting

### 5. Dashboard Preview
- Large `.glass-panel` containing a simplified dashboard mock
- Mock stat cards, chart area, and recent runs table

### 6. Advanced Features Strip
- 4-column row with icon + short text
- Contract Drift Detection, Breaking Change Alerts, Version Comparison, Team Collaboration

### 7. Final CTA
- Gradient background panel using `gradient-hero`
- Headline + primary CTA button

### 8. Footer
- 4-column grid: Product links, Docs (placeholder), Legal, Social icons
- Bottom bar with copyright

## Components

### New files

| File | Description |
|---|---|
| `src/routes/index.tsx` | Replace redirect with full landing page |
| `src/components/landing/HeroSection.tsx` | Hero + animated pipeline |
| `src/components/landing/HeroPipeline.tsx` | GSAP-animated pipeline visualization |
| `src/components/landing/TrustBar.tsx` | Logo placeholder row |
| `src/components/landing/FeaturesGrid.tsx` | 3-column feature cards |
| `src/components/landing/FeatureDeepDive.tsx` | Reusable alternating section (used ×5) |
| `src/components/landing/DashboardPreview.tsx` | Glass panel dashboard mock |
| `src/components/landing/AdvancedFeatures.tsx` | 4-column features strip |
| `src/components/landing/CtaSection.tsx` | Gradient CTA panel |
| `src/components/landing/Footer.tsx` | Full footer with links |

### Dependencies

- `gsap` + `@gsap/react` — hero pipeline animation

### Styling

- Uses existing design tokens (colors, shadows, radii, glass-panel class)
- Tailwind v4 utility classes for layout/components
- Dark theme primary (respects system preference)
- CSS animations for scroll-in sections (`animate-rise-in`)

## Animations

- **Hero pipeline**: GSAP timeline with `useGSAP()` hook. Boxes stagger-in + connecting rays draw
- **Section entrance**: CSS `animate-rise-in` triggered on scroll via Intersection Observer
- **Smooth scroll**: CSS `scroll-behavior: smooth`

## Non-goals

- No changes to dashboard layouts, auth flow, or existing components
- No new shadcn/ui components
- No server functions or data fetching for the landing page
