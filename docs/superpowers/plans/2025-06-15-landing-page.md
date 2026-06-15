# Landing Page Implementation Plan

> **For agentic workers:** Inline execution.

**Goal:** Build a full marketing landing page at `/` with hero animation (GSAP), feature showcases, and footer.

**Architecture:** Single page route with standalone layout (no sidebar/topbar). 8 sections composed from individual components in `src/components/landing/`. GSAP for hero pipeline animation, CSS animations for scroll-in sections.

**Tech Stack:** React 19, TanStack Router, Tailwind v4, GSAP + @gsap/react, lucide-react

---

## File Structure

### Files to Create:
- `src/components/landing/HeroSection.tsx` — Hero full-bleed + CTA buttons
- `src/components/landing/HeroPipeline.tsx` — GSAP-animated pipeline visualization
- `src/components/landing/TrustBar.tsx` — Logo placeholder row
- `src/components/landing/FeaturesGrid.tsx` — 3-column feature cards
- `src/components/landing/FeatureDeepDive.tsx` — Reusable alternating section (used ×5)
- `src/components/landing/DashboardPreview.tsx` — Glass panel dashboard mock
- `src/components/landing/AdvancedFeatures.tsx` — 4-column features strip
- `src/components/landing/CtaSection.tsx` — Gradient CTA panel
- `src/components/landing/Footer.tsx` — Full footer

### Files to Modify:
- `src/routes/index.tsx` — Replace redirect with landing page composition
- `package.json` — Add gsap + @gsap/react dependencies

### Task 1: Install GSAP

- [ ] **Install packages**

Run: `npm install gsap @gsap/react`

### Task 2: Create HeroPipeline component

**Create:** `src/components/landing/HeroPipeline.tsx`

GSAP-animated pipeline showing: `Spec → Response → Validation → Mock`

Four glass-panel boxes with icons in a horizontal pipeline connected by animated rays/lines. Uses `useGSAP()` for staggered entrance and `contextSafe()` for any interactive replay.

### Task 3: Create HeroSection component

**Create:** `src/components/landing/HeroSection.tsx`

Full-bleed section with:
- Gradient glow background
- Headline: "Validate API Responses. Generate Perfect Mocks. Ship With Confidence."
- Supporting paragraph
- Two CTAs: primary (→ /register), secondary (scrolls to preview)
- HeroPipeline component below CTAs

### Task 4: Create TrustBar component

**Create:** `src/components/landing/TrustBar.tsx`

Simple row of 4-5 muted placeholder logo boxes with "Trusted by teams at..." heading.

### Task 5: Create FeaturesGrid component

**Create:** `src/components/landing/FeaturesGrid.tsx`

3-column responsive grid with Card-based feature items:
- Schema Validation (FileSearch icon)
- Automated Mock Generation (WandSparkles icon)
- Difference Detection (GitCompareArrows icon)

Each card: icon, title, description, "Learn more →" anchor link.

### Task 6: Create FeatureDeepDive component

**Create:** `src/components/landing/FeatureDeepDive.tsx`

Reusable alternating section. Props:
- `title: string`
- `description: string`
- `isReversed?: boolean` — flips image/text layout
- `children: React.ReactNode` — the visual content (simplified mock component)

Two-column layout: visual (left/default) + text (right/default). Responsive: stacks on mobile.

### Task 7: Create DashboardPreview component

**Create:** `src/components/landing/DashboardPreview.tsx`

Large `.glass-panel` container with simplified dashboard mock:
- Row of 4 mini stat cards
- Simple chart area (bars)
- Compact table with sample rows
- Uses existing CSS class `glass-panel`

### Task 8: Create AdvancedFeatures component

**Create:** `src/components/landing/AdvancedFeatures.tsx`

4-column responsive grid with icon + label:
- Contract Drift Detection (GitBranch icon)
- Breaking Change Alerts (AlertTriangle icon)
- Version Comparison (ArrowLeftRight icon)
- Team Collaboration (Users icon)

### Task 9: Create CtaSection component

**Create:** `src/components/landing/CtaSection.tsx`

Gradient panel section using `bg-gradient-hero`:
- Headline: "Ship APIs your team can trust"
- CTA button: "Start Validating APIs"
- Responsive, centered

### Task 10: Create Footer component

**Create:** `src/components/landing/Footer.tsx`

4-column grid footer:
- Column 1: Product (Features, Pricing placeholder, Changelog placeholder)
- Column 2: Docs (Documentation, API Reference, Guides — all placeholders)
- Column 3: Legal (Privacy, Terms, Security)
- Column 4: Social (GitHub icon, Twitter icon placeholder)
- Bottom bar: copyright

### Task 11: Rewrite index.tsx

**Modify:** `src/routes/index.tsx`

Replace current redirect with:
- Import all landing components
- Compose them in order
- Add `useEffect` scroll-to logic for "View Demo" CTA
- Clean layout: `<main>` wrapper, no `Shell` or sidebar

### Task 12: Build and verify

Run: `npm run build` to verify no errors
