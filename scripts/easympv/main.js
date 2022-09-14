/*
 * EASYMPV.JS (main.js)
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
    (DONE) Remake settings menu (with save/load)
    (DONE) Folder navigation from current directory
    (DONE) Utility: DirectShow readout to stdout 
    (DONE) Utility: return version in stdout on check
    (DONE) UpdateMenu: display changelog
    (DONE) MenuSystem: scrolling
    (DONE) Implement Updater
    (DONE) Windows (un)registration
    (DONE) Change command_native -> command_native_async to speed up launch times
    (DONE) Migrate Config on update
    (DONE) Implement version comparison for base mpv
    (DONE) Dependency downloader
    (DONE) Replace placeholder titles
    (DONE) Fix input.conf if needed -> Settings.inputConfig.reset(), Settings.Data.resetInputConfig
    (DONE) On-screen logs: make it toggleble using a key and put it in the bottom right corner
    (DONE) Logging, like into an actual file. Make it disabled by default though.
    (DONE) Initial API for adding/removing menus
    (DONE) Settings: Add useNativeNotifications: true; Implement in Utils.js
    (DONE?) Finish Settings.mpvSettings.*
    (DONE) Replace zenity/PWSH input with in-window input
    (DONE) Find a way to restart mpv in-place
    (DONE) Make Settings reload actually set properties
    (DONE) Never actually restart mpv
    (DONE) Add more log points
    (DONE) Replace Shaders.json/Colors.json with Presets.json (Settings module)
    First time configuration wizard -> A bunch of menus basically, new module would be nice
    Advanced settings menu
    (ALWAYS ONGOING) Update comments/documentation
    (ALWAYS ONGOING) Move away from the util as much as possible

    Add h for help in menus
    

    Test everything again because of the try/catch wrapper!

IDEAS:
    Advanced settings, like the utility had before
        BONUS IDEA: use PWSH on windows/zenity on linux for this
    FFI.js -> easympv-ffi.lua
    https://github.com/rossy/mpv-repl/blob/master/repl.lua

KNOWN ISSUES:
    AUTOMATIC SHADERS DONT WORK???
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


var Core = require("./Core");
var Settings = require("./Settings");
var Utils = require("./Utils");
var SSA = require("./SSAHelper");
var ImageOSD = require("./ImageOSD");
var Shaders = require("./Shaders");
var Colors = require("./Colors");
var Chapters = require("./Chapters");
var MenuSystem = require("./MenuSystem");
var WindowSystem = require("./WindowSystem");
var Browsers = require("./Browsers");
var Wizard = require("./FirstTimeWizard");
var API = require("./API");

var errorCounter = 0;

/* 
    We wrap Core.startExecution() in a try/catch block. 
    This way the entire plugin will not crash when something goes wrong.
*/

try {
    Core.startExecution();
}
catch (e) {
    errorCounter++;
    mp.msg.error("Encountered "+errorCounter+" issue(s) during runtime!");
    mp.msg.error("Last issue description: " + e);
}
//Core.startExecution();