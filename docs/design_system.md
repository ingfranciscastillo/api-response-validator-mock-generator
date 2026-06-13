# Design System — API Response Validator & Mock Generator

A premium, dark-themed, enterprise-grade design system for a developer-focused SaaS platform. Dark mode is the primary and default experience.

---

## 1. Brand Principles

- **Trust & Precision** — clean grids, exact alignment, no visual noise
- **Technical Depth** — monospace for code/data, generous use of structured layouts
- **Premium Feel** — glassmorphism, subtle gradients, refined shadows, smooth motion
- **Clarity Under Density** — dashboards pack information without feeling cluttered

---

## 2. Color Palette

### Base (Dark Theme — Default)

| Token | Value | Usage |
|---|---|---|
| `--background` | `#0A0B0F` | App background (deep charcoal/near-black) |
| `--background-secondary` | `#0F1117` | Sidebar, panels base |
| `--surface` | `#15171F` | Card surfaces |
| `--surface-elevated` | `#1B1E28` | Modals, dropdowns, elevated panels |
| `--surface-glass` | `rgba(27, 30, 40, 0.6)` | Glassmorphism panels (with backdrop-blur) |
| `--border` | `#262A36` | Default borders |
| `--border-subtle` | `#1E212B` | Faint dividers |
| `--border-strong` | `#363B4A` | Emphasized borders, focus rings (inactive) |

### Text

| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `#F4F5F7` | Headings, primary content |
| `--text-secondary` | `#9CA3AF` | Body text, descriptions |
| `--text-tertiary` | `#6B7280` | Muted labels, placeholders |
| `--text-disabled` | `#4B5563` | Disabled states |

### Accent — Blue (Primary)

| Token | Value | Usage |
|---|---|---|
| `--accent-blue` | `#3B82F6` | Primary actions, links, active states |
| `--accent-blue-hover` | `#60A5FA` | Hover state |
| `--accent-blue-muted` | `rgba(59, 130, 246, 0.12)` | Background tints |
| `--accent-blue-border` | `rgba(59, 130, 246, 0.35)` | Borders on tinted elements |

### Accent — Cyan (Secondary)

| Token | Value | Usage |
|---|---|---|
| `--accent-cyan` | `#22D3EE` | Highlights, data visualization, "live" indicators |
| `--accent-cyan-muted` | `rgba(34, 211, 238, 0.12)` | Background tints |

### Accent — Violet (Tertiary)

| Token | Value | Usage |
|---|---|---|
| `--accent-violet` | `#A78BFA` | Premium/enterprise highlights, secondary CTAs, badges |
| `--accent-violet-muted` | `rgba(167, 139, 250, 0.12)` | Background tints |

### Semantic Status Colors

| Token | Value | Usage |
|---|---|---|
| `--success` | `#34D399` | Pass, valid, schema match |
| `--success-muted` | `rgba(52, 211, 153, 0.12)` | Success backgrounds |
| `--warning` | `#FBBF24` | Warnings, drift detected, non-breaking changes |
| `--warning-muted` | `rgba(251, 191, 36, 0.12)` | Warning backgrounds |
| `--error` | `#F87171` | Fail, violations, breaking changes |
| `--error-muted` | `rgba(248, 113, 113, 0.12)` | Error backgrounds |
| `--info` | `#60A5FA` | Informational notices |
| `--info-muted` | `rgba(96, 165, 250, 0.12)` | Info backgrounds |

### Gradients

| Name | Definition | Usage |
|---|---|---|
| `gradient-hero` | `linear-gradient(135deg, #3B82F6 0%, #22D3EE 50%, #A78BFA 100%)` | Hero accents, primary buttons, highlight borders |
| `gradient-surface` | `linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(167,139,250,0.04) 100%)` | Subtle panel backgrounds |
| `gradient-glow` | `radial-gradient(circle at top, rgba(59,130,246,0.25), transparent 70%)` | Background ambient glow behind hero/panels |
| `gradient-border` | `linear-gradient(135deg, rgba(59,130,246,0.4), rgba(34,211,238,0.2), rgba(167,139,250,0.4))` | Animated/static gradient borders on featured cards |

### Light Theme (Secondary — for accessibility/preference toggle)

| Token | Value |
|---|---|
| `--background` | `#FAFBFC` |
| `--surface` | `#FFFFFF` |
| `--border` | `#E5E7EB` |
| `--text-primary` | `#0F1117` |
| `--text-secondary` | `#4B5563` |
| Accent colors remain the same hue family, adjusted for contrast (slightly darker: `#2563EB`, `#0891B2`, `#7C3AED`) |

---

## 3. Typography

### Font Families

```css
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

- **JetBrains Mono** — code editors, JSON viewers, schema trees, endpoint paths, status codes, IDs, technical labels, badges
- **Inter** — all UI copy: headings, body text, navigation, buttons, descriptions

### Type Scale

| Token | Size / Line Height | Weight | Usage |
|---|---|---|---|
| `text-display` | 56px / 64px | 700 | Hero headline |
| `text-h1` | 36px / 44px | 700 | Page titles |
| `text-h2` | 28px / 36px | 600 | Section headers |
| `text-h3` | 20px / 28px | 600 | Card titles, panel headers |
| `text-h4` | 16px / 24px | 600 | Subsection headers |
| `text-body-lg` | 16px / 24px | 400 | Lead/supporting paragraph text |
| `text-body` | 14px / 20px | 400 | Default UI text |
| `text-body-sm` | 13px / 18px | 400 | Secondary labels, metadata |
| `text-caption` | 12px / 16px | 500 | Badges, tags, table headers (uppercase, letter-spacing 0.04em) |
| `text-mono-lg` | 14px / 22px | 500 | Code blocks, larger technical content |
| `text-mono` | 13px / 20px | 400 | JSON viewers, schema trees, paths |
| `text-mono-sm` | 12px / 18px | 400 | Inline codes, IDs, status codes |

---

## 4. Spacing & Layout

### Spacing Scale (4px base unit)

```
0.5 = 2px   1 = 4px    1.5 = 6px   2 = 8px
3 = 12px    4 = 16px   5 = 20px    6 = 24px
8 = 32px    10 = 40px  12 = 48px   16 = 64px
20 = 80px   24 = 96px  32 = 128px
```

### Layout Grid

- **Max content width:** 1440px (dashboard), 1280px (landing sections)
- **Sidebar width:** 264px (expanded), 72px (collapsed)
- **Topbar height:** 64px
- **Page padding:** 32px (desktop), 16px (mobile)
- **Card grid gaps:** 24px standard, 16px compact

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 6px | Badges, small buttons, inline tags |
| `--radius-md` | 10px | Inputs, buttons, list items |
| `--radius-lg` | 14px | Cards, panels |
| `--radius-xl` | 20px | Modals, large feature panels |
| `--radius-full` | 9999px | Pills, avatars, status dots |

---

## 5. Elevation & Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.4);
--shadow-glow-blue: 0 0 24px rgba(59, 130, 246, 0.25);
--shadow-glow-cyan: 0 0 24px rgba(34, 211, 238, 0.2);
--shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.04);
```

---

## 6. Glassmorphism Panel Spec

```css
.glass-panel {
  background: var(--surface-glass);
  backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md), var(--shadow-inset);
}
```

Used for: hero visualization panel, floating toolbars, command palette, notification toasts, modal overlays.

---

## 7. Component Styling Guidelines

### Buttons

| Variant | Style |
|---|---|
| **Primary** | `gradient-hero` background, white text, `--radius-md`, `--shadow-glow-blue` on hover, subtle scale (1.02) on hover |
| **Secondary** | `--surface-elevated` background, `--border` border, `--text-primary` text |
| **Ghost** | Transparent, `--text-secondary`, hover → `--surface` background |
| **Destructive** | `--error` background at 12% opacity, `--error` text/border, solid `--error` on hover |
| **Sizes** | `sm` (32px height), `md` (40px height, default), `lg` (48px height) |

### Status Badges

Pill-shaped (`--radius-full`), `text-caption`, with colored dot + muted background:

- **Pass / Valid** → `--success` dot, `--success-muted` background, `--success` text
- **Warning / Drift** → `--warning` dot, `--warning-muted` background, `--warning` text
- **Fail / Breaking** → `--error` dot, `--error-muted` background, `--error` text
- **Info / Pending** → `--info` dot, `--info-muted` background, `--info` text
- **Neutral / Draft** → `--text-tertiary` dot, `--surface-elevated` background, `--text-secondary` text

### Cards

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}
```

**Featured cards** (e.g., hero visualization, plan upsells) use `gradient-border` via a pseudo-element wrapper technique (1px gradient border, inner solid background).

### Code Editors / JSON Viewers

- Background: `--background-secondary`
- Font: `--font-mono`, `text-mono`
- Line numbers: `--text-tertiary`
- Syntax highlighting palette: keys in `--accent-cyan`, strings in `--success`, numbers in `--accent-violet`, booleans/null in `--accent-blue`, punctuation in `--text-tertiary`
- Diff additions: `--success-muted` background with left border `--success`
- Diff removals: `--error-muted` background with left border `--error`, strikethrough text

### Schema Trees / Endpoint Explorer

- Indentation: 20px per level with vertical guide lines in `--border-subtle`
- Expand/collapse chevrons: `--text-tertiary`, rotate on toggle
- Type labels (`string`, `integer`, `object`, etc.): `text-mono-sm`, `--accent-violet`
- Required field indicator: small red asterisk or `--error` dot
- HTTP method badges (endpoint explorer): color-coded pills
  - `GET` → `--accent-blue`
  - `POST` → `--success`
  - `PUT`/`PATCH` → `--warning`
  - `DELETE` → `--error`

### Upload Zones

- Dashed border (`1.5px dashed var(--border-strong)`), `--radius-lg`
- Center icon (`UploadCloud` from lucide), `--text-tertiary`
- Hover/drag-active: border becomes `--accent-blue`, background tint `--accent-blue-muted`, icon color shifts to `--accent-blue`

### Tables

- Header row: `text-caption`, uppercase, `--text-tertiary`, `--border-subtle` bottom border
- Row hover: `--surface-elevated` background
- Row height: 52px (default), 44px (compact)
- Zebra striping: not used (rely on hover + borders for clarity)

### Analytics Charts (recharts)

- Line/area colors: `--accent-blue`, `--accent-cyan`, `--accent-violet`, `--success`, `--warning`, `--error` (in that priority order for multi-series)
- Grid lines: `--border-subtle`, dashed
- Tooltips: `--surface-elevated` background, `--shadow-lg`, `--radius-md`
- Axis labels: `text-caption`, `--text-tertiary`

---

## 8. Motion & Micro-interactions

```css
--transition-fast: 120ms ease;
--transition-base: 200ms ease;
--transition-slow: 320ms cubic-bezier(0.4, 0, 0.2, 1);
```

- Hover states: color/border/shadow transitions at `--transition-fast`
- Modal/drawer entry: slide + fade at `--transition-slow`
- Tab switches: cross-fade at `--transition-base`
- Validation result reveals: staggered fade-in-up (50ms stagger per item)
- Loading states: skeleton shimmer using `gradient-surface` animated at 1.5s loop
- Status badge changes (e.g., validation completing): subtle pulse on color change

---

## 9. Iconography

- **Library:** lucide-react exclusively
- **Default size:** 16px (inline), 20px (buttons/nav), 24px (feature highlights), 32–48px (empty states, hero)
- **Stroke width:** 1.75 (default), 1.5 for large decorative icons
- **Color:** inherits `--text-secondary` by default; `--accent-blue` for active/selected nav items

---

## 10. Responsive Breakpoints

```css
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;
```

- **Dashboard:** sidebar collapses to icon-only below `--bp-lg`; below `--bp-md`, sidebar becomes an off-canvas drawer
- **Landing:** hero visualization stacks vertically below `--bp-lg`; feature grids go from 3-col → 2-col → 1-col at `--bp-lg` / `--bp-md`
- **Tables:** horizontal scroll below `--bp-md`, with sticky first column for key identifiers

---

## 11. Tailwind Config Mapping

These tokens should be wired into `tailwind.config.ts` under `theme.extend`:

```ts
colors: {
  background: 'var(--background)',
  'background-secondary': 'var(--background-secondary)',
  surface: 'var(--surface)',
  'surface-elevated': 'var(--surface-elevated)',
  border: { DEFAULT: 'var(--border)', subtle: 'var(--border-subtle)', strong: 'var(--border-strong)' },
  text: { primary: 'var(--text-primary)', secondary: 'var(--text-secondary)', tertiary: 'var(--text-tertiary)' },
  accent: { blue: 'var(--accent-blue)', cyan: 'var(--accent-cyan)', violet: 'var(--accent-violet)' },
  success: 'var(--success)', warning: 'var(--warning)', error: 'var(--error)', info: 'var(--info)',
},
fontFamily: {
  mono: ['JetBrains Mono', 'monospace'],
  sans: ['Inter', 'sans-serif'],
},
borderRadius: {
  sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)',
},
boxShadow: {
  sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)',
  'glow-blue': 'var(--shadow-glow-blue)', 'glow-cyan': 'var(--shadow-glow-cyan)',
},
```

shadcn/ui theme should be configured with these CSS variables overriding its default `:root` and `.dark` blocks (this app defaults to `.dark`).
