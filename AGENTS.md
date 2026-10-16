# Working on X Draft

## Product

X Draft is a browser side-panel editor for non-native English speakers composing posts and replies on X. Its job is to preserve the writer's intent and personality while expressing the draft in natural English. Chinese and mixed-language input are supported.

The core path is: configure OpenRouter → paste a draft → choose Natural / Concise / Grammar only → generate → edit or copy. Keep this path small. The UI is Simplified Chinese; project documentation, comments, commit messages, and GitHub text should be English.

## Architecture

- Manifest V3; Chrome 116+ is the primary platform. Edge can load the same manifest, but is not the primary tested browser.
- Plain HTML, CSS, and ES modules. No framework or runtime dependency is needed.
- `src/background.js` configures side-panel toolbar behavior and storage access. It does not perform requests.
- `src/panel.js` owns UI state, persistence, and an AbortController per request.
- `src/rewrite.js` owns pure validation, prompts, and the OpenRouter boundary; tests inject `fetchImpl`.
- API keys and model IDs must remain user-editable. Presets are conveniences, never a restriction.
- Presets: `anthropic/claude-haiku-5.5`, `openai/gpt-6-luna`. Verify OpenRouter documentation/catalog before changing IDs or request parameters.

## Data boundaries

- Store the key and model only in `chrome.storage.local`, restricted to `TRUSTED_CONTEXTS`.
- Editor text belongs in `chrome.storage.session`, not durable local storage or sync.
- Never commit real keys, personal drafts, browser profiles, or `.env` files.
- Never log request headers, API keys, drafts, or raw provider errors.
- Do not render generated output as HTML. Use textarea values or textContent.
- Network access is limited to `https://openrouter.ai`; no proxy, analytics, or remote executable code.
- Do not add access to X pages, tabs, browsing history, or content scripts without an explicit product requirement.
- Preserve uncertainty, qualifiers, technical terms, links, and handles. Do not make the user sound more certain or invent facts.
- Do not add silent retries or model fallback: requests consume the user's API credits.

## UI changes

Preserve the compact editor hierarchy. Use the design-taste-frontend (taste) and Impeccable guidance for refinements, with product/editor context taking precedence over marketing-page patterns. The current direction is a calm, flat editor with a restrained green accent, native type, and no decorative imagery. See `DESIGN.md` for tokens and decisions.

Keep focus rings, explicit labels, native radio semantics, all error/empty/loading states, and reduced-motion support. Test narrow widths (320 and 400 px), a wider panel, both color schemes, and long text. Do not add landing-page sections to the side panel.

## Verification

```sh
npm ci
npm test
npm run check
npx playwright install chromium
npm run test:browser
npm run package
```

Unit tests validate the API boundary without spending credits. Browser tests load a real unpacked extension in a temporary Chromium profile and stub only API responses. Do not claim a live provider test unless a real key was explicitly supplied and used. A passing mocked test does not establish a model's editing quality or availability.

Run checks appropriate to the change. For UI or persistence changes, run browser tests. For API changes, run unit tests. For manifest/assets/release changes, regenerate and inspect the ZIP. Keep manifest and package versions aligned.

The ZIP uses an explicit file allowlist in `scripts/package.mjs`; update it if adding a runtime asset. Inspect for secrets before committing or publishing. Keep `README.md`, `PRIVACY.md`, and the store guide consistent with shipped behavior.

## GitHub and releases

This is a standalone public repository. Keep commits scoped to this folder; the parent workspace contains unrelated projects. Do not change its Git configuration or stage its files.

Publishing source to GitHub is separate from submitting an extension to the Chrome Web Store. Store submissions, changes to visibility, and releases should follow the user's stated scope. Do not imply store approval or promise review timing.
