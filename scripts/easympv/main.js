/*
 * EASYMPV (main.js)
 *
 * Author:              Jong
 * URL:                 https://smto.pw/mpv
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

Snippets:
    How to check for a file
        mp.utils.file_info(mp.utils.get_user_path("~~/FOLDER/FILE")) != undefined

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

TODO :
    First time configuration wizard -> A bunch of menus basically, new module would be nice
    Advanced settings menu
    Add h for help in menus
    Load subtitles via File Browser
    Combine all UI-related code into one file (UI.js)

IDEAS:
    Advanced settings, like the utility had before
    FFI.js -> easympv-ffi.lua
    On-screen-controls -> would ensure android compatibility and tablets in general
    https://github.com/rossy/mpv-repl/blob/master/repl.lua

KNOWN ISSUES:
    AUTOMATIC SHADERS DONT WORK SOMETIMES
    INCOMPATIBILITY WITH SYNCPLAY: syncplay offsets the OSD, which makes most of the menus out-of-bounds.
        WORKAROUND: disable Chat message input & Chat message output in syncplay

UNNAMED LIST OF "things to test on Windows specifically":
    Utils.restartMpv
    Settings.migrate -> find mpv path
    Utils.Input -> Paste
    Browsers.DeviceBrowser.menuEventHandler -> low latency profile
*/

// Polyfills and extensions first
String.prototype.includes = function (search, start) {
    if (typeof start !== "number") {
        start = 0;
    }
    if (start + search.length > this.length) {
        return false;
    } else {
        return this.indexOf(search, start) !== -1;
    }
};

String.prototype.replaceAll = function (str, newStr) {
    if (
        Object.prototype.toString.call(str).toLowerCase() === "[object regexp]"
    ) {
        return this.replace(str, newStr);
    }
    return this.replace(new RegExp(str, "g"), newStr);
};

String.prototype.trim = function () {
    return this.replace(/(?:^\s+|\s+$)/g, "");
};

String.prototype.trimStart = function () {
    return this.replace(/^\s+/, "");
};

String.prototype.trimEnd = function () {
    return this.replace(/\s+$/, "");
};

String.prototype.insertAt = function (index, string) {
    return this.substring(0, index) + string + this.substring(index);
};

Number.prototype.isOdd = function () {
    return this % 2 == 1;
};

Math.percentage = function (partialValue, totalValue) {
    return Math.round((100 * partialValue) / totalValue);
};

var API = require("./API");
var Browsers = require("./Browsers");
var Chapters = require("./Chapters");
var Colors = require("./Colors");
var Core = require("./Core");
var Wizard = require("./FirstTimeWizard");
var UI = require("./UI");
var OS = require("./OS");
var Settings = require("./Settings");
var Shaders = require("./Shaders");
var Utils = require("./Utils");
var WindowSystem = require("./WindowSystem");

var Environment = {};
Environment.isDebug = mp.utils.getenv("EASYMPV_DEBUG") == undefined ? false : true;
Environment.BrowserWorkDir = mp.utils.getenv("EASYMPV_BROWSER_WORKDIR");
Environment.Arguments = mp.utils.getenv("EASYMPV_ARGS");

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
        mp.msg.error("Encountered "+errorCounter+" issue(s) during runtime!");
        mp.msg.error("Last issue description: " + e);
    }
}