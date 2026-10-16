# X Draft

**Your voice, in clearer English.**

A small Chrome / Edge side-panel extension for non-native English speakers who post and reply on X. Paste a rough draft, choose how much to change, and copy a natural English version without opening another AI website.

Bring your own **OpenRouter API key** and **model ID**. Both are editable. There is no account system, subscription, or application server.

## Try it locally

1. Clone this repository, or download and unzip it.
2. Open `chrome://extensions` in Chrome (116 or newer).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `x-draft` folder containing `manifest.json`.
5. Pin **X Draft** in the browser toolbar, then click its icon to open the side panel.
6. Enter your OpenRouter key, choose a model, and save.

For Edge, load the same folder through `edge://extensions`. Chrome is the tested target; other Chromium browsers may implement side panels differently. Firefox and Safari are not supported by this manifest.

**No build or npm install is needed to use the extension.**

## Write and rewrite

Paste English, Chinese, or a mixture into the draft box. Choose:

| Mode | What changes |
| --- | --- |
| Natural | Conversational English that stays close to your voice |
| Concise | Less repetition, with the important meaning preserved |
| Grammar only | Minimal grammar and wording corrections |

Optionally paste the original post into **Context** to help interpret your reply. Click Generate or press **Cmd/Ctrl + Enter**, edit the result if needed, and copy it.

The UI is currently in Simplified Chinese; generated drafts are in English. It does not post to X, read the page, or access your X account. Character counts are ordinary text counts, not X's weighted post-length calculation.

## Models and API keys

The settings include two editable presets:

- `anthropic/claude-haiku-5.5` (default): [OpenRouter model page](https://openrouter.ai/anthropic/claude-haiku-5.5)
- `openai/gpt-6-luna`: [OpenRouter model page](https://openrouter.ai/openai/gpt-6-luna)

Choose **Custom model** to enter another model ID, such as `provider/model-name`. Copy the full ID from [OpenRouter's model catalog](https://openrouter.ai/models). You can change the key and model at any time. Model availability, access, and pricing are determined by OpenRouter and its providers. API usage is billed to your OpenRouter account.

Requests use the standard [OpenRouter chat completions API](https://openrouter.ai/docs/api/api-reference/chat/create-a-chat-completion). They ask for plain text so a model does not need structured-output support. An unavailable model produces an error; the extension does not silently switch to a different model.

## Storage and privacy

- Your key and selected model are stored in `chrome.storage.local`, never Chrome Sync. The key is **not encrypted** and should be treated as accessible to someone with access to your browser profile.
- Draft, context, selected editing mode, and result are saved in `chrome.storage.session`, surviving panel closure within the current browser session. Session storage is cleared when the browser restarts or the extension is disabled, reloaded, or updated.
- Click **Clear** to remove the current draft, context, and result from the editor and session storage. **Remove key** deletes the saved key, while keeping the model selection.
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
```

`npm run test:browser` loads the real unpacked extension in an isolated Chromium profile and mocks only OpenRouter responses. It covers settings, custom models, rewriting, errors, cancellation, clipboard, stale results, session recovery, and narrow layouts. It does not use real API credits. `npm run package` creates `dist/x-draft-0.1.0.zip` from an explicit runtime-file allowlist.

The runtime is plain HTML, CSS, and JavaScript with no third-party runtime dependencies, remote scripts, or build pipeline. Playwright is a development dependency only.

| File | Purpose |
| --- | --- |
| `manifest.json` | Manifest V3 permissions and entry points |
| `panel.html` | Side-panel markup |
| `src/panel.js` | Editor state, settings, clipboard, cancellation |
| `src/rewrite.js` | Validation, editing prompt, OpenRouter requests |
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
