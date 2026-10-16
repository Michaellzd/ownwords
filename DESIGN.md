# X Draft design

X Draft is an Operate surface: a compact editor used beside an ongoing conversation. The audience is a non-native English speaker who wants to communicate clearly while keeping their own voice.

## Direction

Calm, direct, and personal. The draft and output carry the visual weight. Settings are disclosed on first use and can be collapsed afterward. Context is optional. No marketing sections, illustrations, nested cards, animated loading decorations, or decorative icons.

Taste configuration: design variance 3, motion intensity 2, visual density 5. These settings suit a narrow browser panel with repeated daily use. Apply taste's relevant typography, color, state, and accessibility guidance, with Impeccable's product-mode rules resolving marketing-only patterns.

## System

- System-native sans-serif type for fast startup and readable Chinese and English.
- Compact heading: 20–26 px. Draft/result: 14 px with 1.7 line height. Utility labels: 12–13 px.
- Single restrained green accent. Light canvas `#f8f9f7`, ink `#202923`, accent `#2f5943`. Dark mode follows system preference with dedicated tokens.
- Flat surfaces and 1 px borders. Inputs and buttons use 5–6 px radii. No gradients or shadows.
- One column, max width 660 px, 24 px gutters (16 px below 340 px).
- Native form semantics, 42 px primary controls, visible focus rings, themed selection/caret/scrollbars, and a native radio group.
- One short result appearance transition indicates new content. Honor reduced-motion preferences. No entrance animations for static editor fields.

## State behavior

First run opens settings. Save returns focus to the draft. Generating disables duplicate submission and exposes Cancel. Failures preserve the draft and previous output. If the user changes input while generating, the returned result is marked as belonging to the previous input. Result copying confirms completion, and clipboard failure selects the text for manual copying.

UI refinements use the local design-taste-frontend skill and [Impeccable](https://github.com/pbakaus/impeccable). Skill content is not bundled into the extension.
