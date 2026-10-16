# OwnWords

**Your own thoughts. Expressed clearly.**

A small Chrome / Edge side-panel extension for replies, comments, posts, and messages across the browser. Write your own draft first, then use AI to make it clearer and more natural in the language you choose, without opening another AI website.

Bring your own **OpenRouter API key** and **model ID**. Both are editable. There is no account system, subscription, or application server.

## Download and install

### [Download OwnWords for Chrome / Edge](https://github.com/Michaellzd/ownwords/releases/latest/download/ownwords-chrome.zip)

**No coding, Git, Node.js, or terminal commands needed.** Download the ZIP above, or visit [the latest release](https://github.com/Michaellzd/ownwords/releases/latest) and choose **`ownwords-chrome.zip`** under Assets. The automatically listed source-code downloads are for developers.

1. **Unzip the download.** On Windows, right-click the ZIP and choose **Extract All**. On macOS, double-click it.
2. **Keep the extracted folder somewhere permanent**, such as Documents. Chrome needs these files to keep the extension working.
3. In Chrome's address bar, type **`chrome://extensions`** and press Enter.
4. Turn on **Developer mode** at the top right, then click **Load unpacked**.
5. Choose the extracted folder **containing `manifest.json`**. Select the folder, not the ZIP file.
6. Click Chrome's **Extensions** menu (the puzzle-piece button), pin **OwnWords**, then click its icon.
7. Enter your [OpenRouter API key](https://openrouter.ai/settings/keys), choose a model, and click **Save settings**. Your interface may follow your browser's language; use the language picker to change it.

You can now write your own draft, select the output language, and rewrite. OwnWords is free to download; model requests use your OpenRouter account and may incur API charges.

For Edge, use **`edge://extensions`** in step 3. Chrome 116+ is the tested target; other Chromium browsers may implement side panels differently. Firefox, Safari, and mobile browsers are not supported by this package.

OwnWords is not yet on the Chrome Web Store, so this download uses Chrome's manual **Load unpacked** installation. See [Google's installation instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) or our [step-by-step installation, setup, and update guide](docs/install.md). A plain-text guide, **`START-HERE.txt`**, is also included in the download.

## Why your draft comes first

OwnWords started with a personal need: I am not a native English speaker, but I often communicate in English on X. I wanted help making my wording clear without repeatedly opening ChatGPT or Claude.

The need goes beyond X and English. People write comments, replies, and messages on many websites, in many languages. The important part is that **the thought starts with you**. Your first version holds your meaning, even when its grammar is rough or its languages are mixed. AI should help express that meaning, while preserving your point of view, uncertainty, and personality.

OwnWords edits your draft. It does not generate replies from an empty box, invent your opinions or experiences, or publish anything. You review the result and decide what to use. The [product principles in AGENTS.md](AGENTS.md#product) guide future development.

## Write and rewrite

Write or paste your own draft in any language, or a mixture. Choose the **output language**, then an editing mode:

| Mode | What changes |
| --- | --- |
| Natural | Conversational wording that stays close to your voice |
| Concise | Less repetition, with the important meaning preserved |
| Grammar only | Minimal grammar and wording corrections |

If the draft is in another language, all modes translate it faithfully into the selected output language. Grammar only then makes the smallest necessary corrections. Model capabilities determine translation and editing quality.

Optionally paste the original comment, post, or message into **Context** to help interpret your draft. Click **Rewrite draft** or press **Cmd/Ctrl + Enter**, read and edit the result if needed, then copy it into your conversation.

OwnWords works beside any website through manual paste and copy. It does not read the page, access your website accounts, or post on your behalf. Character counts are ordinary text counts; individual websites may use different rules.

## Languages

Both the interface and rewrite output support:

| Language | Name shown in the picker |
| --- | --- |
| English | English |
| Simplified Chinese | 简体中文 |
| Japanese | 日本語 |
| Korean | 한국어 |
| Spanish | Español |

The language picker in the header changes interface labels, placeholders, accessibility labels, and status/error messages immediately. On first use, the interface follows a supported browser language, falling back to English. Your explicit choice is saved locally.

**Output language** is a separate picker next to the editor. It defaults to English and remembers your selection. For example, you can use the interface in Japanese, write a rough draft in Korean, and request English output. Changing the interface language never translates, replaces, or submits your draft or result. Changing the output language requires a new rewrite; the previous result is marked as belonging to the earlier selection.

The extension's toolbar title and browser-managed description follow Chrome's language using native localization files. They are independent of the in-panel interface preference. No extra AI call or permission is needed to switch languages.

## Models and API keys

The settings include two editable presets:

- `anthropic/claude-haiku-5.5` (default): [OpenRouter model page](https://openrouter.ai/anthropic/claude-haiku-5.5)
- `openai/gpt-6-luna`: [OpenRouter model page](https://openrouter.ai/openai/gpt-6-luna)

Choose **Custom model** to enter another model ID, such as `provider/model-name`. Copy the full ID from [OpenRouter's model catalog](https://openrouter.ai/models). You can change the key and model at any time. Model availability, access, and pricing are determined by OpenRouter and its providers. API usage is billed to your OpenRouter account.

Requests use the standard [OpenRouter chat completions API](https://openrouter.ai/docs/api/api-reference/chat/create-a-chat-completion). They ask for plain text so a model does not need structured-output support. An unavailable model produces an error; the extension does not silently switch to a different model.

## Storage and privacy

- Your key, selected model, interface language, and output language are stored in `chrome.storage.local`, never Chrome Sync. The key is **not encrypted** and should be treated as accessible to someone with access to your browser profile.
- Draft, context, selected editing mode, and result are saved in `chrome.storage.session`, surviving panel closure within the current browser session. Session storage is cleared when the browser restarts or the extension is disabled, reloaded, or updated.
- Click **Clear** to remove the current draft, context, and result from the editor and session storage. **Remove key** deletes the saved key, while keeping the model and language selections.
- On Generate, the extension sends the draft and optional context directly to OpenRouter and the selected model provider over HTTPS. The key is sent only to OpenRouter as an authorization header.
- There is no developer backend, telemetry, analytics, browsing-history collection, or content script. Provider retention and processing are governed by their policies.
- Closing the side panel stops its in-flight work. Reopen it to recover saved editor text and generate again. Cancel stops the local request; a provider may still complete or bill an already-submitted request.

Read the full [privacy policy](PRIVACY.md).

## Development

Node.js 22 or newer is needed only for development and packaging.

```sh
npm ci
npm test
npm run check
npx playwright install chromium
npm run test:browser
npm run package
npm run test:package
```

`npm run test:browser` loads the real unpacked extension in an isolated Chromium profile and mocks only OpenRouter responses. It covers settings, custom models, language independence/persistence, rewriting, localized errors, cancellation, clipboard, stale results, session recovery, and narrow layouts in all five languages. It does not use real API credits.

`npm run package` creates a versioned ZIP such as `dist/ownwords-0.2.0.zip` plus the identical `dist/ownwords-chrome.zip` download from an explicit file allowlist. Both include the runtime, all translations, and the installation guide. `npm run test:package` rebuilds, inspects, extracts, and runs the browser tests against the packaged extension. Contributors can also load this source folder directly through **Load unpacked**, with no build step.

The runtime is plain HTML, CSS, and JavaScript with no third-party runtime dependencies, remote scripts, or build pipeline. Playwright is a development dependency only.

| File | Purpose |
| --- | --- |
| `manifest.json` | Manifest V3 permissions and entry points |
| `panel.html` | Side-panel markup |
| `src/panel.js` | Editor state, settings, clipboard, cancellation |
| `src/rewrite.js` | Validation, editing prompt, OpenRouter requests |
| `src/languages.js` | Supported language IDs and browser-language resolution |
| `src/i18n.js`, `src/locales/` | In-panel interface translations |
| `_locales/` | Chrome-native description and toolbar translations |
| `src/background.js` | Toolbar behavior and storage access restriction |
| `src/panel.css` | Responsive styles and light/dark tokens |
| `AGENTS.md` | Working rules for coding agents |

## Chrome Web Store

This repository is public source code. It is **not yet published on the Chrome Web Store**. Local use works immediately with Load unpacked.

See [the publishing guide](docs/chrome-web-store.md) for packaging, listing content, permissions, privacy disclosures, reviewer instructions, and submission steps.

## License

[MIT](LICENSE).

## Say hello

Built by [Michael Lu](https://x.com/michael_lu_03). Welcome to follow me on X for updates and conversations about building indie projects.

## More products

Explore my other products:

- [AI Takeaway](https://aitakeaway.net/)
- [Auralume AI](https://auralumeai.com/)
- [Encorette](https://burningbridgesmv.org/)
