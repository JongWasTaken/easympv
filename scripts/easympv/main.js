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

KNOWN ISSUES:
    INCOMPATIBILITY WITH SYNCPLAY: syncplay offsets the OSD, which makes most of the menus out-of-bounds.
        WORKAROUND: disable Chat message input & Chat message output in syncplay
*/

// Polyfills and extensions first
eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Polyfills.js")));

var Autoload = require("./Autoload");
var API = require("./API");
var Browsers = require("./Browsers");
var Chapters = require("./Chapters");
var Core = require("./Core");
var Wizard = require("./FirstTimeWizard");
var UI = require("./UI");
var OS = require("./OS");
var Settings = require("./Settings");
var Utils = require("./Utils");
var Tests = require("./Tests");
var Video = require("./Video");

var Environment = {};
Environment.Arguments = mp.utils.getenv("EASYMPV_ARGS");
// example: EASYMPV_ARGS="options=forcedMenuKey:z,showHiddenFiles:true;debug=true;workdir=/mnt/smb/Anime/Incoming"
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
                    mp.msg.warn("Settings Override:");
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
                            mp.msg.warn(temp2[0] + " = " + val);
                        }
                    }
                }
            }
        }
        catch (e) {
            mp.msg.warn("[easympv] Invalid EASYMPV_ARGS environment variable!");
            mp.msg.warn("Error description: " + e);
        }
    }
}

var errorCounter = 0;

mp.register_script_message("__internal",function(msg) {
    if(msg == "restart")
    {
        Core.doUnregistrations();
        Core.startExecution();
    }
});

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
        mp.msg.error("Encountered "+errorCounter+" issue(s) during startup!");
        mp.msg.error("Last issue description: " + e);
    }
}