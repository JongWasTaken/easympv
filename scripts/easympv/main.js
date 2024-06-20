/*
 * EASYMPV (main.js)
 *
 * Author:              Jong
 * URL:                 https://github.com/JongWasTaken/easympv
 * License:             MIT License
 */

/*
Useful links:
    LUA documentation, most functions are the same in javascript:
        https://github.com/mpv-player/mpv/blob/master/DOCS/man/lua.rst
    JavaScript documentation, for the few odd ones out:
        https://github.com/mpv-player/mpv/blob/master/DOCS/man/javascript.rst
    input.conf documentation, for commands, properties, events and other tidbits
        https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst
        https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst#property-list

Important good-to-knows:
    mpv uses MuJS, which is ES5 compliant, but not ES6!
        Most IE polyfills will probably work.
    libASS on Windows is more picky with font names, in case of issues:
        Open the .ttf file of your font and use the value of "Font name:" at the top.

Current dependencies:
    mpv 33+
    Windows only:
        PowerShell
        .NET Framework 4
    macOS:
        mpv must have been installed using brew
    Linux only:
        GNU coreutils
        either wget or curl
        xclip OR wl-clipboard (if you use Wayland; when in doubt, install both!)

TODOs:
    - playlist menu should have cursor on "currently playing" when opened
    - rebuild playlist if empty onFileLoad

KNOWN ISSUES:
    INCOMPATIBILITY WITH SYNCPLAY: syncplay offsets the OSD, which makes most of the menus out-of-bounds.
        WORKAROUND: disable Chat message input & Chat message output in syncplay
*/

var startTime = Date.now();

// Polyfills and extensions first
eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Preload.js")));

/**
 * We start with parsing of the EASYMPV_ARGS environment variable, for future use.
 * Example: EASYMPV_ARGS="options=forcedMenuKey:z,showHiddenFiles:true;debug=true;workdir=/mnt/smb/Anime/Incoming" mpv <file>
 */
var Environment = {};
Environment.Arguments = mpv.getEnv("EASYMPV_ARGS");
if(Environment.Arguments != undefined)
{
    Environment.Arguments = Environment.Arguments.split(";");

    Environment.isDebug = false;
    Environment.BrowserWorkDir = undefined;
    Environment.SettingsOverrides = undefined;

    for (var i = 0; i < Environment.Arguments.length; i++)
    {
        try {
            if(Environment.Arguments[i].includes("="))
            {
                var temp = Environment.Arguments[i].split("=");
                var key = temp[0];
                var value =  temp[1];
                if (key == "debug")
                {
                    Environment.isDebug = Boolean(value);
                }
                else if (key == "workdir")
                {
                    Environment.BrowserWorkDir = value;
                }
                else if (key == "options")
                {
                    value = value.split(",");
                    Environment.SettingsOverrides = {};
                    mpv.printInfo("Environment variable overrides the following settings:");
                    for (var j = 0; j < value.length; j++)
                    {
                        var temp2 = value[j].split(":");
                        if (temp2.length == 2)
                        {

                            var val = temp2[1];
                            if (val == "true")
                            {
                                val = true;
                            }
                            else if (val == "false") {
                                val = false;
                            }

                            Environment.SettingsOverrides[temp2[0]] = val;
                            mpv.printInfo(temp2[0] + " -> " + val);
                        }
                    }
                }
            }
        }
        catch (e) {
            mpv.printError("Error occured while processing EASYMPV_ARGS environment variable!");
            mpv.printError("Error description: " + e);
        }
    }
}
Environment.undead = false;
if (typeof Watchdog != "undefined") {
    Environment.undead = true;
    Watchdog = undefined;
}

var Extensions = [];
if (mpv.fileExists(mpv.getUserPath("~~/scripts/easympv/extensions/")))
{
    var extensions = mpv.getDirectoryContents(mpv.getUserPath("~~/scripts/easympv/extensions/"), "files");
    if (extensions.length != 0)
    {
        var extText = "";
        var extMeta = {};
        for (var j = 0; j < extensions.length; j++)
        {
            try {
                extText = mpv.readFile(mpv.getUserPath("~~/scripts/easympv/extensions/" + extensions[j]));
                extMeta = JSON.parse(extText.substring(2,extText.indexOf('\n')+1).trim());
                extMeta.code = extText.substring(extText.indexOf('\n')+1);
                Extensions.push(extMeta);
                mpv.printInfo("Found extension \"" + extensions[j] + "\"!");
            }
            catch(e)
            {
                mpv.printError("Invalid metadata for extension \"" + extensions[j] + "\":\n" + e.toString());
                mpv.printError("This extension will not be loaded!");
            }
        }
    }

}

/**
 * Why use eval() instead of import()?
 * This used to be a bunch of import() statements, and the files had module.exports at the bottom.
 * While this did work, it wasn't quite the correct way of using CommonJS modules, as our files aren't really modules,
 * but rather pseudo-"classes" that exist mostly for code-readability reasons.
 * I found that using eval() instead of import() actually decreases start-up times, while also resolving some issues around
 * modules accessing other modules.
 * The only downside to this approach is that we need to make sure files are eval()'d in the correct order, otherwise we crash.
 */
if (mpv.fileExists(mpv.getUserPath("~~/scripts/easympv/minified.js")) && !Environment.isDebug)
{
    mpv.printInfo("Running on minified code!");
    eval(mpv.readFile(mpv.getUserPath("~~/scripts/easympv/minified.js")));
}
else
{
    var loadOrder = ["Settings.js", "OS.js", "UI.js", "Utils.js", "Autoload.js", "API.js", "Browsers.js", "Chapters.js", "Core.js", "Setup.js", "Tests.js", "Video.js", "ExtensionLoader.js"];
    var code = "/* THIS FILE EXISTS FOR DEBUGGING PURPOSES ONLY: DO NOT COMMIT; DO NOT EDIT; CHANGES WILL BE LOST! */\n\n";
    for (var i = 0; i < loadOrder.length; i++)
    { code += mpv.readFile(mpv.getUserPath("~~/scripts/easympv/" + loadOrder[i])) + "\n\n"; }
    if (Environment.isDebug) {
        mpv.printWarn("Debug mode enabled: Code will be written to \"runtime.js\" before evaluation!")
        mpv.writeFile(
            "file://" + mpv.getUserPath("~~/scripts/easympv/runtime.js"),
            code
        );
    }
    eval(code);
}

if (Environment.isDebug) {
    Core.startExecution();
}
else
{
    try {
        Core.startExecution();
    }
    catch (e) {
        mpv.printError("Encountered issue(s) during startup!");
        mpv.printError("Issue description: " + e);
    }
}