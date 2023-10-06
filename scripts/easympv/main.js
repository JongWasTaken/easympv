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
                    mp.msg.warn("Environment variable overrides the following settings:");
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
                            mp.msg.warn(temp2[0] + " -> " + val);
                        }
                    }
                }
            }
        }
        catch (e) {
            mp.msg.warn("[easympv] Error occured while processing EASYMPV_ARGS environment variable!");
            mp.msg.warn("Error description: " + e);
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

if (mp.utils.file_info(mp.utils.get_user_path("~~/scripts/easympv/minified.js")) != undefined)
{
    mp.msg.warn("[easympv] Running minified code!");
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/minified.js")));
}
else
{
    // These are used by other files, the order is important.
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Settings.js")));
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/OS.js")));
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/UI.js")));
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Utils.js")));
    // Everything else
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Autoload.js")));
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/API.js")));
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Browsers.js")));
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Chapters.js")));
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Core.js")));
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Setup.js")));
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Tests.js")));
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Video.js")));
}

var errorCounter = 0;

if (Environment.isDebug) {
    Core.startExecution();
}
else
{
    try {
        Core.startExecution();
    }
    catch (e) {
        errorCounter++;
        mp.msg.error("Encountered " + errorCounter + " issue(s) during startup!");
        mp.msg.error("Last issue description: " + e);
    }
}