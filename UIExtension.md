UI Extensions
UI extensions expand the functionality of SillyTavern by hooking into its events and API. You can easily create your own extensions.

#Extension submissions
Want to contribute your extensions to the official repository? Contact us!

To ensure that all extensions are safe and easy to use, we have a few requirements:

Your extension must be open-source and have a libre license (see Choose a License). If unsure, AGPLv3 is a good choice.
Extensions must be compatible with the latest release version of SillyTavern. Please be ready to update your extension if something in the core changes.
Extensions must be well-documented. This includes a README file with installation instructions, usage examples, and a list of features.
Extensions that have a server plugin requirement to function will not be accepted.
#Examples
See live examples of simple SillyTavern extensions:

https://github.com/city-unit/st-extension-example - basic extension template. Showcases manifest creation, local script imports, adding a settings UI panel, and persistent extension settings usage.
#Bundling
Extensions can also utilize bundling to isolate themselves from the rest of the modules and use any dependencies from NPM, including UI frameworks like Vue, React, etc.

https://github.com/SillyTavern/Extension-WebpackTemplate - template repository of an extension using TypeScript and Webpack (no React).
https://github.com/SillyTavern/Extension-ReactTemplate - template repository of a barebone extension using React and Webpack.
To use relative imports from the bundle, you may need to create an import wrapper. Here's an example for Webpack:


// define
async function importFromScript(what) {
    const module = await import(/* webpackIgnore: true */'../../../../../script.js');
    return module[what];
}

// use
const generateRaw = await importFromScript('generateRaw');
#manifest.json
Every extension must have a folder in data/<user-handle>/extensions and have a manifest.json file which contains metadata about the extension and a path to a JS script file, which is the entry point of the extension.


{
    "display_name": "The name of the extension",
    "loading_order": 1,
    "requires": [],
    "optional": [],
    "js": "index.js",
    "css": "style.css",
    "author": "Your name",
    "version": "1.0.0",
    "homePage": "https://github.com/your/extension",
    "auto_update": true,
    "i18n": {
        "de-de": "i18n/de-de.json"
    }
}
display_name is required. Displays in the "Manage Extensions" menu.
loading_order is optional. Higher number loads later.
requires specifies the required Extras modules dependencies. An extension won't be loaded unless the connected Extras API provides all of them.
optional specifies the optional Extras dependencies.
js is the main JS file reference, and is required.
css is an optional style file reference.
author is required. It should contain the name or contact info of the author(s).
auto_update is set to true if the extension should auto-update when the version of the ST package changes.
i18n is an optional object that specifies the supported locales and their corresponding JSON files (see below).
Downloadable extensions are mounted into the /scripts/extensions/third-party folder, so relative imports should be used based on that. Be careful about where you create your extension during development if you plan on installing it from your GitHub which overwrites the content in the third-party folder.

#requires vs optional
requires - extension could be installed, but will not be loaded until the user connects to the Extras API that provides all of the specified modules.
optional - extension could be installed and will always be loaded, but any of the missing Extras API modules will be highlighted in the "Manage extensions" menu.
To check which modules are currently provided by the connected Extras API, import the modules array from scripts/extensions.js.

#Scripting
#Using getContext
The getContext() function in a SillyTavern global object gives you access to the SillyTavern context, which is a collection of all the main app state objects, useful functions and utilities.


const context = SillyTavern.getContext();
context.chat; // Chat log - MUTABLE
context.characters; // Character list
context.characterId; // Index of the current character
context.groups; // Group list
// And many more...
If you're missing any of the functions/properties in getContext, please get in touch with the developers or send us a Pull Request!

#Importing from other files
Using imports from SillyTavern code is unreliable and can break at any time if the internal structure of ST's modules changes. getContext provides a more stable API.

Unless you're building a bundled extension, you can import variables and functions from other JS files.

For example, this code snippet will generate a reply from the currently selected API in the background:


import { generateQuietPrompt } from "../../../../script.js";

async function handleMessage(data) {
    const text = data.message;
    const translated = await generateQuietPrompt(text);
    // ...
}
#State management
When the extension needs to persist its state, it can use extensionSettings object from the getContext() function to store and retrieve data. An extension can store any JSON-serializable data in the settings object and must use a unique key to avoid conflicts with other extensions.


const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();

// Define a unique identifier for your extension
const MODULE_NAME = 'my_extension';

// Define default settings
const defaultSettings = {
    enabled: false,
    option1: 'default',
    option2: 5
};

// Define a function to get or initialize settings
function getSettings() {
    // Initialize settings if they don't exist
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = structuredClone(defaultSettings);
    }

    // Ensure all default keys exist (helpful after updates)
    for (const key in defaultSettings) {
        if (extension_settings[MODULE_NAME][key] === undefined) {
            extension_settings[MODULE_NAME][key] = defaultSettings[key];
        }
    }

    return extension_settings[MODULE_NAME];
}

// Use the settings
const settings = getSettings();
settings.option1 = 'new value';

// Save the settings
saveSettingsDebounced();
#Internationalization
For general information on providing translations, see the Internationalization page.

Extensions can provide additional localized strings for use with the t, translate functions and the data-i18n attribute in HTML templates.

See the list of supported locales here (lang key): https://github.com/SillyTavern/SillyTavern/blob/release/public/locales/lang.json

#Direct addLocaleData call
Pass a locale code and an object with the translations to the addLocaleData function. Overrides of existing keys are NOT allowed. If the passed locale code is not a currently chosen locale, the data will be silently ignored.


SillyTavern.getContext().addLocaleData('fr-fr', { 'Hello': 'Bonjour' });
SillyTavern.getContext().addLocaleData('de-de', { 'Hello': 'Hallo' });
#Via the extension manifest
Add an i18n object with a list of supported locales and their corresponding JSON file paths (relative to your extension's directory) to the manifest.


{
  "display_name": "Foobar",
  "js": "index.js",
  // rest of the fields
  "i18n": {
    "fr-fr": "i18n/french.json",
    "de-de": "i18n/german.json"
  }
}
#Registering slash commands (new way)
While registerSlashCommand still exists for backward compatibility, new slash commands should now be registered through SlashCommandParser.addCommandObject() to provide extended details about the command and its parameters to the parser (and in turn to autocomplete and the command help).


SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'repeat',
    callback: (namedArgs, unnamedArgs) => {
        return Array(namedArgs.times ?? 5)
            .fill(unnamedArgs.toString())
            .join(isTrueBoolean(namedArgs.space.toString()) ? ' ' : '')
        ;
    },
    aliases: ['example-command'],
    returns: 'the repeated text',
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({ name: 'times',
            description: 'number of times to repeat the text',
            typeList: ARGUMENT_TYPE.NUMBER,
            defaultValue: '5',
        }),
        SlashCommandNamedArgument.fromProps({ name: 'space',
            description: 'whether to separate the texts with a space',
            typeList: ARGUMENT_TYPE.BOOLEAN,
            defaultValue: 'off',
            enumList: ['on', 'off'],
        }),
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({ description: 'the text to repeat',
            typeList: ARGUMENT_TYPE.STRING,
            isRequired: true,
        }),
    ],
    helpString: `
        <div>
            Repeats the provided text a number of times.
        </div>
        <div>
            <strong>Example:</strong>
            <ul>
                <li>
                    <pre><code class="language-stscript">/repeat foo</code></pre>
                    returns "foofoofoofoofoo"
                </li>
                <li>
                    <pre><code class="language-stscript">/repeat times=3 space=on bar</code></pre>
                    returns "bar bar bar"
                </li>
            </ul>
        </div>
    `,
}));
All registered commands can be used in STscript in any possible way.

#Listening to event types
Use eventSource.on() to listen for events:


import { eventSource, event_types } from "../../../../script.js";

eventSource.on(event_types.MESSAGE_RECEIVED, handleIncomingMessage);

function handleIncomingMessage(data) {
    // Handle message
}
The main event types are:

MESSAGE_RECEIVED
MESSAGE_SENT
CHAT_CHANGED
The rest can be found here.

#Do Extras request
Extras API is deprecated. It's not recommended to use it in new extensions.

The doExtrasFetch() function allows you to make requests to your SillyTavern Extra server.

For example, to call the /api/summarize endpoint:


import { getApiUrl, doExtrasFetch } from "../../extensions.js";

const url = new URL(getApiUrl());
url.pathname = '/api/summarize';

const apiResult = await doExtrasFetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'bypass',
    },
    body: JSON.stringify({
        // Request body
    })
});
getApiUrl() returns the base URL of the Extras serve.

The doExtrasFetch() function:

Adds the Authorization and Bypass-Tunnel-Reminder headers
Handles fetching the result
Returns the result (the response object)
This makes it easy to call your Extra's API from your plugin.

You can specify:

The request method: GET, POST, etc.
Additional headers
The body for POST requests
And any other fetch options