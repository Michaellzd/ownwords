# OwnWords Privacy Policy

Last updated: October 16, 2026

OwnWords is an open-source browser extension maintained by [Michaellzd](https://github.com/Michaellzd). It helps you improve your own drafts in your chosen language, beside any website, using your own OpenRouter account. The project was previously named X Draft.

## Information the extension handles

**API credentials and preferences.** You provide an OpenRouter API key and a model ID. These, along with your interface and output language choices, are stored locally in the browser profile using `chrome.storage.local`, not Chrome Sync. The key is not encrypted by the extension. You can remove it in Settings. Uninstalling the extension removes its browser-managed storage. Browser language preferences are read locally to choose the initial interface language; switching the interface does not make a network request.

**Editor content.** Your draft, optional conversation context, editing mode, and result are held in browser session storage. They survive closing and reopening the side panel during the session. Browser restart, extension reload/update, or disabling the extension clears this storage. The Clear button removes the draft, context, and result from the editor and session storage.

**Text submitted for rewriting.** Only when you request a rewrite, the extension sends your draft, optional context, selected model ID, output language, and editing instructions to OpenRouter over HTTPS. The interface-language preference is not included in the request. Your API key is sent to OpenRouter for authentication. OpenRouter routes the request to the selected model provider. Those services process the submitted text and may retain it according to their own terms and privacy settings. Ordinary connection metadata, such as your IP address, is visible to the service receiving the connection.

## What the developer receives

The extension has no developer-operated backend and sends no drafts, keys, or usage analytics to the developer. It does not collect browsing history, inspect web pages, read your website accounts, automatically read the clipboard, or post messages. Copy writes only the result you choose to copy to your clipboard.

The developer does not sell user data or use it for advertising. Information handled by the extension is used only to provide its user-requested text editing function. Its use of user data adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Third-party services

OpenRouter and the selected model provider have separate privacy practices. Review [OpenRouter's privacy policy](https://openrouter.ai/privacy), your OpenRouter account settings, and your chosen provider's terms before submitting sensitive text. API usage charges are handled by OpenRouter, not this extension.

## Permissions

- **storage:** Save your configuration locally and your editor state for the browser session.
- **sidePanel:** Display the editor beside the current website.
- **clipboardWrite:** Copy the result when you click Copy.
- **https://openrouter.ai/*:** Send the rewrite request directly to OpenRouter.

## Contact and changes

For privacy questions, use [the project issue tracker](https://github.com/Michaellzd/ownwords/issues). Do not include API keys or private text in public issues. Material changes to this policy will be published in this repository with an updated date.
