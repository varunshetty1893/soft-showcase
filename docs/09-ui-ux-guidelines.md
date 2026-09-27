# 09 — UI/UX Guidelines

## Design Philosophy

Soft Showcase is a **professional platform** for showcasing software projects. The design should communicate trust, clarity, and quality. Projects and their screenshots should be the visual heroes.

---

## Visual Direction

| Principle | Description |
|---|---|
| Professional | Corporate-clean without being cold |
| Minimal | Enough white space to let content breathe |
| Modern | Current design patterns, not dated |
| Trustworthy | Colors and typography that convey reliability |
| Content-first | UI elements support the content, not compete with it |

---

## What to AVOID

- Excessive gradients everywhere
- Heavy purple or dark-blue-dominant themes
- Excessive glassmorphism effects
- Large, slow animations that delay content
- Fake testimonials or fabricated statistics
- Cluttered layouts with too much information per screen
- Neon colors or playful/gamified aesthetics

---

## Color Palette

Primary colors should be subtle and professional. Suggested direction:

| Token | Description | Example |
|---|---|---|
| `--color-primary` | Brand accent | Slate blue or deep teal |
| `--color-primary-hover` | Button hover | Slightly darker |
| `--color-background` | Page background | Near-white (#FAFAFA) |
| `--color-surface` | Card backgrounds | White |
| `--color-border` | Borders | Light gray (#E5E7EB) |
| `--color-text-primary` | Main text | Near-black (#111827) |
| `--color-text-secondary` | Secondary text | Gray (#6B7280) |
| `--color-success` | Success states | Green (#10B981) |
| `--color-warning` | Warning states | Amber (#F59E0B) |
| `--color-error` | Error states | Red (#EF4444) |

> The exact palette is finalized during design system implementation in Phase 6.

---

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Headings | Inter or similar modern sans | 700 | h1: 2.5rem, h2: 2rem, h3: 1.5rem |
| Body | Inter | 400 | 1rem (16px) |
| Labels | Inter | 500 | 0.875rem |
| Code/tech tags | Mono font | 400 | 0.75rem |

Use Google Fonts: **Inter** is strongly recommended.

---

## Spacing System

Use a consistent 4px base grid. Common values:

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-12` | 48px |
| `space-16` | 64px |

---

## Border Radius

| Element | Radius |
|---|---|
| Cards | 12px |
| Buttons | 8px |
| Inputs | 6px |
| Badges/tags | 4px |
| Modals | 16px |
| Avatar | 50% |

---

## Component Standards

### Buttons

| Variant | Use Case |
|---|---|
| Primary | Main CTA (Submit, Import, Publish) |
| Secondary | Secondary actions (Cancel, Back) |
| Outline | Tertiary actions |
| Ghost | Navigation links |
| Danger | Destructive actions (Delete, Deactivate) |

Minimum button height: **40px** on desktop, **44px** on mobile (touch targets).

### Cards (Project Card)

- Subtle shadow or border
- Primary image at top
- Title (bold), short description (2 lines max, truncated)
- Technology tags
- Category badge
- Clear "View Project" CTA

### Modals

- Centered overlay
- Accessible (focus trap, ESC to close)
- Clear close button
- No content behind backdrop is interactive

### Forms

- Labels always visible (no placeholder-only labels)
- Inline error messages below the field
- Required fields marked with * or "Required"
- Character counters for textareas

### Badges / Tags

- Technology badges: small, monospaced, subtle background
- Category badge: larger, category color or neutral
- Status badges: color-coded (NEW=blue, PUBLISHED=green, DRAFT=yellow, ARCHIVED=gray)

---

## Micro-Interactions

Keep subtle and fast:

- Button hover: slight darkening + cursor pointer
- Card hover: slight lift (box-shadow increase)
- Form focus: border color change to primary
- Success toast: slide in from top-right
- Loading states: skeleton screens (not spinners for full pages)

---

## Responsive Breakpoints

| Breakpoint | Min Width | Target |
|---|---|---|
| Mobile | 0px | Phones |
| Tablet | 640px | iPads portrait |
| Laptop | 1024px | Laptops |
| Desktop | 1280px | Desktop monitors |
| Wide | 1536px | Large/ultrawide |

---

## Mobile-First Rules

1. Design mobile layout first.
2. Stack columns vertically on mobile.
3. Navigation collapses to hamburger menu.
4. Contact buttons become a sticky floating bar at bottom on project detail pages.
5. Tables become scrollable or card-format on mobile.
6. Admin pages: prioritize functionality over layout aesthetics on mobile.
7. Touch targets minimum 44×44px.

---

## Screenshot Gallery

- Primary image: large hero image
- Additional images: thumbnail strip below
- Click/tap to open full-size lightbox
- Lightbox: keyboard navigable (arrow keys, ESC)
- Alt text required on all images

---

## Contact Buttons (Project Page)

Design priority: these buttons must be highly visible and actionable.

```
Interested in this project?
Contact the project provider directly.

[ 💬 Discuss on WhatsApp ]    ← WhatsApp green
[ ✉ Send Email Inquiry ]      ← Primary brand color
```

On mobile: these float at the bottom of the screen as a persistent bar.

---

## Empty States

Every list/table should have a meaningful empty state:

```
📭 No projects found

Try adjusting your filters
or browse all categories.

[ Browse All Projects ]
```

---

## Error States

Friendly, non-technical language:

```
Something went wrong

We couldn't load the projects.
Please refresh the page or try again later.

[ Try Again ]
```

---

## Loading States

Use skeleton screens (gray placeholder blocks) instead of spinners where possible. Spinners are acceptable for short operations (button submits).

---

## Accessibility Requirements

| Requirement | Notes |
|---|---|
| Color contrast | WCAG AA minimum (4.5:1 for text) |
| Keyboard navigation | All interactive elements reachable via Tab |
| Focus indicators | Visible focus rings on all interactive elements |
| Alt text | All `<img>` elements have descriptive alt |
| Form labels | All inputs have associated `<label>` |
| ARIA roles | Used where semantic HTML is insufficient |
| Modal focus trap | Focus stays within open modal |
| Skip links | "Skip to main content" link for screen readers |

---

## Admin UI Guidelines

Admin pages may use a more data-dense layout than public pages.

- Tables with sortable columns
- Pagination or infinite scroll
- Status badge chips
- Quick action buttons per row
- Bulk action support (future)
- Admin sidebar navigation (fixed left)

Admin should feel like a **professional CMS tool**, not a toy dashboard.
