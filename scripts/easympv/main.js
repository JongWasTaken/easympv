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
eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Polyfills.js")));

/**
 * We start with parsing of the EASYMPV_ARGS environment variable, for future use.
 * Example: EASYMPV_ARGS="options=forcedMenuKey:z,showHiddenFiles:true;debug=true;workdir=/mnt/smb/Anime/Incoming" mpv <file>
 */
var Environment = {};
Environment.Arguments = mp.utils.getenv("EASYMPV_ARGS");
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
                    mp.msg.info("Environment variable overrides the following settings:");
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
                            mp.msg.info(temp2[0] + " -> " + val);
                        }
                    }
                }
            }
        }
        catch (e) {
            mp.msg.error("Error occured while processing EASYMPV_ARGS environment variable!");
            mp.msg.error("Error description: " + e);
        }
    }
}

var Extensions = [];
var extensionCode = "";
if (true == false && mpv.fileExists(mpv.getUserPath("~~/scripts/easympv/extensions/")))
{
    var extensions = mpv.getDirectoryContents(mpv.getUserPath("~~/scripts/easympv/extensions/"), "files");
    if (extensions.length != 0)
    {
        var extText = "";
        var extMeta = {};
        for (var j = 0; j < extensions.length; j++)
        {
            extText = mpv.readFile(mpv.getUserPath("~~/scripts/easympv/extensions/" + extensions[j]));
            try {
                extMeta = JSON.parse(extText.substring(2,extText.indexOf('\n')+1).trim());
                extMeta.code = extText.substring(extText.indexOf('\n')+1);
                Extensions.push(extMeta);
                mp.msg.info("Found extension \"" + extensions[j] + "\"!\n");
            }
            catch(e)
            {
                mp.msg.error("Invalid metadata for extension \"" + extensions[j] + "\":\n" + e.toString());
                mp.msg.error("This extension will not be loaded!");
            }
        }
    }

    for (var k = 0; k < Extensions.length; k++) {
        extensionCode += Extensions[k].code + "\n";
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
//Environment.isDebug = false;
if (mp.utils.file_info(mp.utils.get_user_path("~~/scripts/easympv/minified.js")) != undefined && !Environment.isDebug)
{
    mp.msg.info("Running on minified code!");
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/minified.js")));
}
else
{
    var loadOrder = ["Settings.js", "OS.js", "UI.js", "Utils.js", "Autoload.js", "API.js", "Browsers.js", "Chapters.js", "Core.js", "Setup.js", "Tests.js", "Video.js"];
    var code = "";
    for (var i = 0; i < loadOrder.length; i++)
    { code += mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/" + loadOrder[i])) + "\n\n"; }
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
        mp.msg.error("Encountered issue(s) during startup!");
        mp.msg.error("Issue description: " + e);
    }
}