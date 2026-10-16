# Working on OwnWords

## Product

OwnWords is a browser writing companion for people who want to express their own thoughts clearly and naturally in the language they choose. It works beside any website where someone writes a reply, comment, post, or message. X is where the founder's need started, not a boundary of the product.

### Why it exists

The founder is not a native English speaker and frequently communicates in English on X. His drafts can contain unclear or unnatural wording. Opening a separate ChatGPT or Claude website just to fix the wording interrupts the conversation. A browser side panel keeps that editing step close to wherever he is already writing.

This need applies to people with different native languages and to conversations across the browser: social networks, forums, discussion communities, comment sections, and other websites. English is a useful default output language, not the product's only language. Interface language and output language are independent user choices.

### The user's thinking comes first

The founder deliberately wants to write a first version himself. That version contains his own meaning. The AI's role is to improve how that meaning is expressed, rather than originate the reply on his behalf. A rough sentence, mixed-language text, or imperfect grammar is enough to begin; the draft does not need to be polished.

Treat these as product requirements:

- Start from a draft written or deliberately supplied by the user. An empty draft must never trigger a paid request or produce an invented reply.
- Preserve the user's meaning, point of view, personality, uncertainty, humor, and intended strength of expression. Fluent writing must not replace the user's voice with a generic AI voice.
- Improve wording, grammar, clarity, and concision, or translate faithfully into the selected output language. Do not invent opinions, arguments, facts, personal experiences, promises, or stronger claims.
- Context helps interpret what the user wrote. A pasted original post is not an instruction to answer that post independently.
- Keep the user in control: they choose the language and editing mode, review or edit the result, then copy it when ready. Generation does not publish or submit anything.
- Work across websites without requiring a login to X or another platform. Do not make the core experience depend on a platform-specific integration.
- Let each user supply and change their own OpenRouter API key and model ID. Presets are optional conveniences.
- Keep the tool close to the conversation, simple, and quick to use. Do not turn it into a general chat client, an automatic comment generator, or an engagement bot.

The core path is: configure OpenRouter → write or paste your own draft → choose output language and Natural / Concise / Grammar only → rewrite → review, edit, or copy. Keep this path small. Project documentation, comments, commit messages, and GitHub text should be English. The interface supports multiple languages independently of the output language.

## Architecture

- Manifest V3; Chrome 116+ is the primary platform. Edge can load the same manifest, but is not the primary tested browser.
- Plain HTML, CSS, and ES modules. No framework or runtime dependency is needed.
- `src/background.js` configures side-panel toolbar behavior and storage access. It does not perform requests.
- `src/panel.js` owns UI state, persistence, and an AbortController per request.
- `src/rewrite.js` owns pure validation, prompts, and the OpenRouter boundary; tests inject `fetchImpl`.
- `src/languages.js` defines the supported language identifiers and trusted prompt names. `src/i18n.js` and `src/locales/` translate the panel; `_locales/` translates Chrome-managed metadata.
- Interface and output languages currently support English, Simplified Chinese, Japanese, Korean, and Spanish. The interface follows the browser on first use, with English fallback; output defaults to English. Persist both choices separately from credentials.
- Every API request must include the selected output language in its system prompt, independently of the interface language. In Grammar only mode, a draft in another language is faithfully translated first, then minimally corrected.
- Switching languages must preserve text and unsaved credentials, require no API call, and retranslate current status/error/accessibility text. An output-language change makes a previous result stale; a UI-language change does not.
- API keys and model IDs must remain user-editable. Presets are conveniences, never a restriction.
- Presets: `anthropic/claude-haiku-5.5`, `openai/gpt-6-luna`. Verify OpenRouter documentation/catalog before changing IDs or request parameters.

## Data boundaries

- Store the key/model and non-sensitive language preferences in separate records in `chrome.storage.local`, restricted to `TRUSTED_CONTEXTS`.
- Editor text belongs in `chrome.storage.session`, not durable local storage or sync.
- Never commit real keys, personal drafts, browser profiles, or `.env` files.
- Never log request headers, API keys, drafts, or raw provider errors.
- Do not render generated output as HTML. Use textarea values or textContent.
- Network access is limited to `https://openrouter.ai`; no proxy, analytics, or remote executable code.
- Do not add access to web page contents, tabs, browsing history, or content scripts without an explicit product requirement.
- Preserve uncertainty, qualifiers, technical terms, links, and handles. Do not make the user sound more certain or invent facts.
- Do not add silent retries or model fallback: requests consume the user's API credits.

## UI changes

Preserve the compact editor hierarchy. Use the design-taste-frontend (taste) and Impeccable guidance for refinements, with product/editor context taking precedence over marketing-page patterns. The current direction is a calm, flat editor with a restrained green accent, native type, and no decorative imagery. See `DESIGN.md` for tokens and decisions.

Keep focus rings, explicit labels, native radio semantics, all error/empty/loading states, and reduced-motion support. Test narrow widths (320 and 400 px), a wider panel, both color schemes, all supported interface languages, and long text. Do not add landing-page sections to the side panel. Keep browser-native language names in the pickers so users can recover from selecting an unfamiliar interface language.

When adding a language, add a complete panel dictionary, Chrome metadata messages, its entry in `LANGUAGES`, and prompt/locale/browser coverage. Keep translation keys and interpolation parameters in sync. Do not interpolate free-form user language names into the system prompt. Use stable error codes and translate them in the panel; never display raw provider errors.

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
