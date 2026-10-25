# BingeByte --- Design System & UI Direction

> **Purpose:** This document is the source of truth for BingeByte's
> visual design and user-interface decisions. Google Antigravity should
> read and follow it before creating or modifying UI. Keep new work
> consistent with these rules unless the project owner explicitly
> changes this document.

## 1. Brand Foundation

-   **Product name:** BingeByte
-   **Product category:** Movie and TV streaming-related web
    application.
-   **Brand personality:** Premium, cinematic, sophisticated, modern,
    and minimalist in its supporting details.
-   **Primary design goal:** Make BingeByte feel like a carefully
    art-directed cinematic experience---not a generic streaming template
    with a dark theme.
-   **Visual priority:** Cinematic content and imagery first; interface
    chrome second.
-   **Logo approach for the current version:** Text-only wordmark. Do
    not invent or add a standalone icon or symbol yet.

### Brand principles

1.  **Cinematic first.** Use striking film and TV artwork, considered
    composition, strong typographic hierarchy, and atmosphere.
2.  **Minimal by design.** Every visible element should serve a purpose.
    Avoid decorative UI that competes with content.
3.  **Premium, not flashy.** Use restraint, deliberate spacing, and
    subtle interaction states instead of excessive glow, gradients,
    borders, or animation.
4.  **Content is the hero.** The interface should frame movie and show
    artwork rather than compete with it.
5.  **Consistent throughout.** Shared components, pages, and states must
    use the same tokens and visual rules.

## 2. Wordmark

The approved wordmark is:

**BingeByte**

### Wordmark rules

-   Use the exact casing `BingeByte`: uppercase **B** in both "Binge"
    and "Byte"; all other letters lowercase.
-   Use the selected cinematic wordmark direction: elegant, refined
    typography with subtle typographic character.
-   The current wordmark is text-only. Do not add a play icon, film
    reel, clapperboard, pixel mark, badge, or separate logo symbol.
-   Do not recolor "Byte" as a second tone at this stage.
-   Default wordmark color: soft white on the dark background.
-   Keep the wordmark legible at small sizes in the header and other
    compact placements.
-   Do not stretch, skew, outline, glow, or add drop shadows to the
    wordmark.
-   Do not replace the approved styling with an unrelated generic logo
    treatment.

### Typography

The intended typeface is **Geist**, the typeface associated with Vercel.
The user referred to this as "Vercel Jest"; interpret that as **Geist**,
not Jest (the JavaScript testing framework).

-   Use Geist as the primary UI typeface and the starting point for the
    wordmark.
-   Prefer carefully chosen weight, size, line-height, and spacing over
    decorative effects.
-   Use a restrained hierarchy: strong display headings, clear section
    titles, readable body copy, and subdued metadata.
-   Avoid using many different font families or weights.
-   If a more expressive display treatment is needed, preserve the
    approved cinematic character and do not change the overall
    typography direction without approval.

## 3. Color System

The two approved brand colors are:

  -----------------------------------------------------------------------
  Token                   Value                   Purpose
  ----------------------- ----------------------- -----------------------
  `--color-background`    `#151319`               Main page/canvas
                                                  background

  `--color-surface`       `#1B1820`               Elevated surfaces,
                                                  navigation surfaces,
                                                  and panels
  -----------------------------------------------------------------------

These colors are the foundation of the visual identity and should remain
prominent.

### Supporting colors

The following are practical supporting values for readability and
structure. They do not introduce a branded accent hue.

  --------------------------------------------------------------------------
  Token                      Value                   Purpose
  -------------------------- ----------------------- -----------------------
  `--color-text-primary`     `#F5F3F7`               Main text and wordmark

  `--color-text-secondary`   `#AAA5B2`               Supporting copy and
                                                     metadata

  `--color-border-subtle`    `#302B36`               Quiet dividers and
                                                     boundaries

  `--color-surface-deep`     `#100F13`               Deeper overlays or
                                                     layered surfaces

  `--color-white`            `#FFFFFF`               High-contrast text or
                                                     essential emphasis
                                                     where appropriate
  --------------------------------------------------------------------------

Treat these supporting values as implementation defaults; the two
owner-selected colors above are the confirmed brand colors.

### Accent-color decision

-   **No dedicated brand accent color is selected yet.**
-   Use white or soft white for essential emphasis and interactive
    states when needed.
-   Do not introduce violet, cyan, red, blue, gold, or another accent
    hue as a recurring brand color without approval.
-   Do not create two-tone branding.
-   If an accent color is proposed later, document it and obtain
    approval before applying it broadly.

### Color usage rules

-   Avoid using pure black for every background. The selected
    charcoal-purple tones should define the interface.
-   Use surface colors to establish hierarchy sparingly, not to wrap
    every element in a separate card.
-   Keep text contrast strong and readable.
-   Avoid large, decorative gradients. Gradients may be used behind
    cinematic artwork when needed to keep overlaid text legible.
-   Avoid colored glows, neon outlines, and ornamental gradients.
-   Artwork may contain varied colors; the surrounding interface should
    remain restrained and neutral.

## 4. Overall Visual Language

### Desired

-   Dark charcoal foundations.
-   Cinematic stills, backdrops, and poster artwork.
-   Large, intentional visual compositions.
-   Refined typography and readable text hierarchy.
-   Restrained borders and separators.
-   Thoughtful negative space.
-   Subtle transitions and responsive interaction feedback.
-   A consistent, editorially composed layout.

### Avoid

-   A generic streaming-site template with no distinct visual character.
-   Excessive rounded cards or "everything inside a card" layouts.
-   Excessive pill-shaped buttons, filters, chips, and navigation items.
-   Unnecessary outlines and borders around every component.
-   Excessive gradients, glows, shadows, glassmorphism, or neon effects.
-   Overcrowded layouts and inconsistent alignment.
-   Decorative animation that distracts from browsing.
-   Random accent colors or one-off styles.
-   Unnecessary UI chrome that competes with movie artwork.

## 5. Cinematic Imagery

Movie and TV artwork should provide much of the atmosphere and visual
identity.

-   Give featured artwork enough space to feel cinematic.
-   Use high-quality backdrops and posters where available.
-   Preserve image aspect ratios appropriate to their role; do not
    stretch artwork.
-   Use gradients or dark overlays only when necessary for text
    contrast.
-   Position text and controls deliberately so they do not obscure
    important subjects in the artwork.
-   Keep text readable across bright, dark, and visually busy images.
-   Use consistent poster ratios within the same content rail.
-   Use suitable image fallbacks for missing or failed artwork without
    breaking layout.
-   Avoid placing too many labels, badges, or buttons over posters.
-   Do not use random stock imagery as a substitute for movie artwork
    when real content artwork is available.

## 6. Layout and Component Principles

The following are design principles, not a final page-by-page product
specification. Build actual layouts around the existing product
requirements and avoid inventing major product features.

### Navigation

-   Keep navigation compact, aligned, and easy to scan.
-   The `BingeByte` wordmark should be the primary brand element in the
    navigation.
-   Align navigation items, search, and account controls consistently.
-   Avoid excessive pill styling and oversized navigation controls.
-   Use restrained active, hover, focus, and selected states.
-   Ensure navigation remains usable at narrower viewport widths.

### Hero and featured content

-   Treat the hero as a cinematic focal point.
-   Use a wide backdrop when the content supports it.
-   Establish a clear hierarchy between category/metadata, title,
    summary, and actions.
-   Keep actions limited to what the current product requirements need.
-   Use a carefully tuned overlay when necessary for text readability.
-   Avoid putting the entire hero inside a heavily bordered or rounded
    card unless there is a clear layout reason.

### Movie and TV content rails

-   Use consistent poster dimensions and spacing within each rail.
-   Let artwork dominate; keep titles and metadata compact and legible.
-   Use subtle hover feedback. Avoid exaggerated zooming, glowing
    borders, or distracting movement.
-   Make horizontal scrolling and navigation clear when rails overflow.
-   Maintain consistent alignment between rails and page edges.

### Buttons and controls

-   Use simple, purposeful shapes. Do not default to pill-shaped
    controls.
-   Primary actions should be clear without introducing an unapproved
    accent color.
-   Use white/soft-white contrast for primary emphasis where
    appropriate.
-   Keep secondary actions quieter.
-   Provide visible hover, focus, active, disabled, and loading states.
-   Ensure focus states remain accessible even while the brand accent is
    undecided.

### Surfaces, cards, and borders

-   Use `#1B1820` for elevated surfaces when useful.
-   Prefer layout, spacing, and typography to excessive boxes and
    borders.
-   Use subtle borders only where they improve separation or usability.
-   Apply corner rounding selectively and consistently; do not make
    every element a pill or oversized rounded card.
-   Avoid excessive shadows and glass-like treatments.

### Search, filters, and metadata

-   Keep controls visually quiet and consistent with the charcoal
    palette.
-   Make labels, filter states, and metadata easy to understand.
-   Do not introduce decorative badges or color coding without a
    functional reason.
-   Do not invent product functionality that has not been specified.

### Detail pages

-   Preserve the cinematic emphasis of the title's artwork.
-   Keep title, summary, and key metadata clearly structured.
-   Use the same typography, spacing, surface, and control rules as the
    rest of the application.
-   Avoid cramming every possible detail into the first viewport;
    establish hierarchy and progressive disclosure where appropriate.

## 7. Motion and Interaction

Motion should make the interface feel polished and responsive---not slow
or theatrical.

-   Prefer subtle opacity, color, and small transform transitions.
-   Keep hover effects restrained.
-   Avoid large, repeated zoom effects, constant movement, or
    distracting parallax.
-   Do not delay core actions for decorative animation.
-   Respect `prefers-reduced-motion`.
-   Provide immediate interaction feedback and avoid animations that
    make the app feel sluggish.

## 8. Responsive Design and Accessibility

-   Design for mobile, tablet, and desktop; do not treat mobile as a
    shrunken desktop layout.
-   Preserve cinematic imagery while ensuring important text and
    controls remain usable on small screens.
-   Prevent horizontal overflow except in intentional horizontal content
    rails.
-   Use semantic HTML and accessible control labels.
-   Ensure keyboard navigation and visible focus states.
-   Maintain readable contrast for text and controls.
-   Do not communicate state using color alone.
-   Provide useful alternative text for meaningful images; use empty
    alternative text for purely decorative imagery.
-   Ensure controls have comfortable touch targets on mobile.
-   Test layouts with long titles, missing metadata, and missing
    artwork.

## 9. Consistency and Implementation Rules for Antigravity

Before implementing or changing UI:

1.  Read this file and treat it as the visual source of truth.
2.  Inspect existing project structure and reuse existing components and
    tokens where possible.
3.  Centralize colors and shared visual values as design tokens/CSS
    variables rather than scattering raw values throughout the codebase.
4.  Use the same typography, spacing, borders, and interaction rules
    across pages.
5.  Prefer reusable components over duplicated page-specific styling.
6.  Do not introduce a new font, brand color, logo symbol, visual
    effect, or component-library aesthetic that conflicts with this
    document.
7.  Do not redesign the brand or reinterpret the wordmark without
    explicit approval.
8.  Do not add product features simply because they appear in a visual
    reference.
9.  Keep code maintainable and avoid unnecessary dependencies for visual
    effects.
10. After implementation, inspect the result at mobile, tablet, and
    desktop sizes and fix spacing, alignment, contrast, overflow, and
    inconsistent styling.
11. Check loading, empty, error, hover, focus, and disabled states where
    applicable.
12. If a requirement is genuinely ambiguous and affects the brand or
    architecture, ask before making a consequential decision. For small
    implementation details, choose the simplest option consistent with
    this document.

## 10. Decisions Intentionally Left Open

Do not treat these as finalized:

-   Dedicated accent color.
-   Final spacing scale and exact corner-radius scale.
-   Exact page-by-page layout and responsive breakpoints.
-   Whether a standalone logo symbol will be added later.
-   Additional brand assets and motion guidelines.
-   Product features not yet specified in the project requirements.

Use restrained, consistent defaults until these are deliberately
decided. Do not let undecided details block implementation of the
confirmed direction.

## 11. Definition of Done for Visual Work

A UI change is ready for review when:

-   It follows the BingeByte cinematic, premium, restrained visual
    direction.
-   It uses the approved charcoal colors and does not invent a brand
    accent.
-   It preserves the `BingeByte` wordmark and intended Geist typography.
-   Artwork remains the visual focus where appropriate.
-   Alignment, spacing, hierarchy, and component styling are consistent.
-   The interface is responsive and accessible.
-   Hover, focus, loading, empty, and error states are considered where
    relevant.
-   There are no avoidable overflow issues, broken image layouts, or
    distracting effects.
-   The result feels like one coherent product rather than a collection
    of unrelated components.

------------------------------------------------------------------------

**Core rule:** When in doubt, choose the simpler implementation that
protects the cinematic artwork, refined typography, charcoal palette,
and premium feel. Do not add visual decoration merely because it is easy
to implement.
