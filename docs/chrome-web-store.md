# Publishing X Draft to the Chrome Web Store

The source repository being public does not publish the extension to the store. The extension currently runs through **Load unpacked**. This guide prepares a later store submission; no submission has been made.

## 1. Register as a developer

Use your own Google account in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). Complete developer registration, the one-time registration payment, and any account verification shown by Google. Follow the current [official registration instructions](https://developer.chrome.com/docs/webstore/register/).

## 2. Verify and package

From the repository root:

```sh
npm ci
npm test
npm run check
npx playwright install chromium
npm run test:browser
npm run package
```

Upload `dist/x-draft-0.1.0.zip`. `manifest.json` is at the ZIP root. The archive contains only runtime files and the license. Do not upload `.git`, `node_modules`, browser profiles, tests, screenshots containing keys, or environment files.

Before submission, do one live rewrite with your own key for each preset you intend to advertise. Automated tests mock responses and do not verify current model access, billing, response quality, or service availability. Remove your key before capturing screenshots.

## 3. Prepare the listing

Suggested name: **X Draft**

Suggested short description:

> Rewrite rough drafts into natural English without leaving the conversation. Bring your own OpenRouter key and model.

Suggested detailed description:

> X Draft is a small side-panel editor for non-native English speakers writing posts and replies on X. Paste a draft in English, Chinese, or a mixture. Choose Natural, Concise, or Grammar only, then edit and copy the result.
>
> Use your own OpenRouter API key and model ID. Claude Haiku 5.5 and GPT-6 Luna are included as shortcuts, and custom model IDs are supported. API usage is billed by OpenRouter. The interface is currently in Simplified Chinese.
>
> X Draft does not read the current page, access your X account, or publish posts. Your key is stored locally in your browser profile. Drafts and results are kept only for the browser session. Submitted drafts and optional context are sent directly to OpenRouter and your chosen model provider when you generate.

Choose the category and listing language that match the final product. Capture authentic screenshots of the installed side panel using example text. Include the empty editor, settings with a masked or absent key, and a completed rewrite. Follow the dashboard's current image dimensions and asset requirements; repository test screenshots are QA evidence, not automatically store-ready artwork.

Support URL: `https://github.com/Michaellzd/x-draft/issues`

Privacy policy URL: `https://github.com/Michaellzd/x-draft/blob/main/PRIVACY.md`

Confirm the privacy link is publicly readable while signed out. A dedicated hosted policy page can replace it later if required by the dashboard or review.

## 4. Complete privacy disclosures

Read [Google's privacy-fields guide](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) and make disclosures consistent with [PRIVACY.md](../PRIVACY.md). User text and API credentials are processed even though the developer has no backend; do not claim the extension handles no data.

Single purpose:

> Rewrite user-provided drafts into clear English inside a browser side panel, using a user-configured OpenRouter model.

Permission justifications:

| Permission | Justification |
| --- | --- |
| `storage` | Persist the user's API key/model locally and keep editor text for the current browser session |
| `sidePanel` | Show the rewriting editor beside the user's current conversation |
| `clipboardWrite` | Copy generated text only when the user clicks Copy |
| `https://openrouter.ai/*` | Authenticate and send user-requested rewrite calls directly to OpenRouter |

There is no remotely hosted executable code. Model responses are displayed as plain text and never executed. There are no content scripts, browsing-history permissions, analytics, or developer backend.

Drafts/context may contain personal communications or other information the user voluntarily pastes. Declare applicable categories in the actual dashboard based on its current definitions, including user-provided authentication information. Ensure data-use certifications accurately reflect the implementation and selected services.

## 5. Provide reviewer instructions

Suggested instructions:

> 1. Click the X Draft toolbar icon to open its side panel.
> 2. Enter a working OpenRouter API key. Choose an available text model or enter a custom OpenRouter model ID. Save settings.
> 3. Paste “I not sure this is what people need.” into the draft box.
> 4. Select Natural and click Generate. An English rewrite appears below.
> 5. Edit or copy the result. Reopen Settings to change the model or remove the key.
>
> No X login is needed, and the extension works beside any page. API usage requires an OpenRouter account with access to the selected model. The extension does not include bundled service credentials.

If Google requires test access, arrange a dedicated, limited-budget review key through the dashboard's private reviewer instructions. Never place credentials in the public listing, repository, screenshots, or package. Follow the reviewer's current access requirements.

## 6. Submit and maintain

Choose the intended distribution and territories, review the listing and privacy answers, and submit when ready. Approval and review timing are controlled by Google. See [the official publishing guide](https://developer.chrome.com/docs/webstore/publish).

For updates, increase both `manifest.json` and `package.json` versions, rerun checks, create a new ZIP, and upload it to the same store item. Keep the privacy policy and listing synchronized with shipped behavior.
