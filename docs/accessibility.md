# Accessibility

What the built-in card does:

- **Announces each step once** to screen readers — on the web through the card's polite live region,
  on React Native through `AccessibilityInfo.announceForAccessibility`. Change the wording with
  `labels.announce`.
- **Never steals focus.** The tour is a companion, not a modal; the user stays where they were.
- **Real buttons.** Next, Back, Skip, Show me and Take me there are buttons with visible focus rings
  on the web and button roles on native. On native they are at least 44 × 44 points; on the web they
are 34px tall with a 44px minimum width, above the WCAG 2.2 AA minimum target size of 24 × 24px.
- **Keyboard (web).** Esc skips, → next, ← back — ignored while typing in a field.
- **Reduced motion.** With the system setting on, the light is drawn still: no travelling spark, no
  draw-on animation.
- **Never points at nothing.** If a target cannot be found the card says so in words.

What we do not claim: no WCAG conformance claim is made for the library. Conformance belongs to your
app as a whole and needs testing with real assistive technology. Please report anything that gets in
a user's way — accessibility issues are treated as bugs.
