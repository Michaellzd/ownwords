# Install OwnWords without coding

OwnWords runs beside your current browser page. You do not need Git, Node.js, a terminal, or a developer account to use the downloadable extension. You do need desktop Chrome or Edge and your own OpenRouter API key.

## Download

**[Download the latest OwnWords ZIP](https://github.com/Michaellzd/ownwords/releases/latest/download/ownwords-chrome.zip)**

Alternatively, open [the latest release](https://github.com/Michaellzd/ownwords/releases/latest), expand **Assets** if necessary, and click **`ownwords-chrome.zip`**. Choose that file rather than **Source code (zip)** or **Source code (tar.gz)**.

## Install in Chrome

1. **Extract the ZIP.** On Windows, right-click the downloaded file and choose **Extract All**, then finish the extraction. On macOS, double-click it. Do not try to open the ZIP as an extension.
2. **Move the extracted folder to a permanent location**, such as a folder named OwnWords inside Documents. Keep this folder after installation: Chrome loads the extension from these files.
3. Type **`chrome://extensions`** in Chrome's address bar and press Enter. Browser settings addresses must be typed into the address bar, rather than a search engine.
4. Turn on **Developer mode** in the top-right corner. This exposes Chrome's manual installation button; it does not require you to write code.
5. Click **Load unpacked**. In the folder chooser, select the extracted folder that directly contains **`manifest.json`**. If you see another folder inside the extracted folder, open it until you find that file, then choose its containing folder.
6. Check that **OwnWords** appears in your extensions list and is enabled.
7. Click Chrome's **Extensions** menu, shown as a puzzle-piece button in the toolbar. Find **OwnWords** and click its pin button. Click the OwnWords icon to open the side panel.

This ZIP uses Chrome's **Load unpacked** installation and has not been reviewed or published on the Chrome Web Store. It does not install by double-clicking the ZIP. Google's [official Load unpacked instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) describe the same flow.

## Install in Edge

Use **`edge://extensions`** instead of `chrome://extensions`, then follow the same extract → Developer mode → Load unpacked steps. Pin OwnWords through Edge's Extensions menu. Chrome is the tested browser; Edge's side-panel behavior can differ.

The package targets Chrome 116+ and compatible desktop Chromium browsers. It does not support Firefox, Safari, or mobile browsers.

## First-time setup

1. Open [OpenRouter's API key settings](https://openrouter.ai/settings/keys) and sign in or create an account. Create your own key and copy it.
2. Open OwnWords. The connection settings open on first use. Paste the key into **API key**.
3. Choose **Claude Haiku 5.5**, **GPT-6 Luna**, or **Custom model**. A custom model needs the full ID from [OpenRouter's model catalog](https://openrouter.ai/models).
4. Click **Save settings**. The labels may appear in your browser's language; change the interface with the language picker in the header if needed.

OwnWords is free to download. Model calls use your OpenRouter account and may incur API charges; your chosen model must be available to that account. The key stays in this browser profile, unencrypted. Change it, switch models, or remove the key at any time in Settings. See [the privacy policy](../PRIVACY.md).

## Write your first reply

1. Open any website where you want to reply, comment, post, or send a message.
2. Write or paste **your own draft** into OwnWords. It can be rough, or mix languages.
3. Choose the **Output language**. English, Simplified Chinese, Japanese, Korean, and Spanish are supported.
4. Choose **Natural**, **Concise**, or **Grammar only**. If the draft is in another language, it will also be translated into your selected output language.
5. Optionally open **Add context** and paste the original comment or message. Context helps interpret your draft; it is not a request to generate a separate reply.
6. Click the rewrite button, or press **Cmd + Enter** on Mac / **Ctrl + Enter** on Windows.
7. Read the result to check it expresses your meaning. You can edit it before clicking **Copy**, then paste it into the website yourself.

The header language picker changes the interface only. It does not change your output language or rewrite any text. You remain in control of what you post.

## Update to a new version

GitHub downloads do **not** update automatically.

1. Copy any unfinished draft and result somewhere safe. Reloading the extension clears its temporary editor session.
2. Download and extract the latest **`ownwords-chrome.zip`**.
3. Copy the new files into the **same folder you installed originally**, replacing the old files. Keep the folder's location and name unchanged.
4. Open `chrome://extensions` (or `edge://extensions`) and click the **Reload** button on OwnWords.

Updating the files in the same installed folder preserves browser-managed settings. Installing from a different folder can create a separate extension with separate settings, so you may need to enter your key again. Removing the extension deletes its stored settings.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| No Load unpacked button | Turn on Developer mode in the extensions page |
| Chrome cannot find the manifest | Extract the ZIP and select the folder that directly contains `manifest.json` |
| OwnWords is not visible in the toolbar | Open the browser's Extensions menu and pin OwnWords |
| A connection or model error | Check the saved key, model ID, network connection, and OpenRouter account access/balance |
| Extension stops working after files were moved or deleted | Restore the folder to its original location, or load it from the new location and set it up again |
| Installation is blocked in a work or school browser | The organization may restrict manual extensions; ask the browser administrator |

If you still need help, [open an issue](https://github.com/Michaellzd/ownwords/issues). Include your browser/version, operating system, and the steps that failed. Do not include your API key or private drafts.
