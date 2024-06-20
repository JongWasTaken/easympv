/*
 * SETTINGS.JS (PART OF EASYMPV)
 *
 * Author:                     Jong
 * URL:                        https://github.com/JongWasTaken/easympv
 * License:                    MIT License
 */

/**
 * This file handles serialization and deserialization of the
 * easympv.conf file located in the mpv config root directory.
 * It also provides sane defaults in case configuration files
 * are missing.
 */
var Settings = {};

Settings.mpvConfig = {};
Settings.inputConfig = {};
Settings.presets = {};
Settings.cache = {};

Settings.locale = {};

/////////////////////////////////////////// easympv.conf

/**
 * This object contains deserialized data from easympv.conf.
 * Call Settings.reload() to update it.
 */
Settings.Data = {
    // General
    language: "en",
    mpvLocation: "unknown",
    forcedMenuKey: "m",
    daylightSavingTime: false,
    // Visual
    selectorColor: "ba0f8d",
    showHints: true,
    showClock: false,
    clockPosition: "top-left",
    fadeMenus: false,
    scrollAlerts: true,
    // Sets
    defaultShaderSet: "none",
    defaultColorProfile: "none",
    // VRR
    simpleVRR: false,
    refreshRate: 144,
    // File Browser
    shortFileNames: true,
    showHiddenFiles: false,
    useTrash: true,
    allowFolderDeletion: false,
    // Misc
    startIPCServer: false,
    useNativeNotifications: false,
    notifyAboutUpdates: true,
    compatibilityMode: false,
    debugMode: false,
    saveFullLog: false,
    fileBrowserFavorites: [],
    // Versioning
    currentVersion: "0.0.0",
    newestVersion: "0.0.1",
    doMigration: false,
    resetMpvConfig: false,
    resetInputConfig: false,
    isFirstLaunch: true,
};

/**
 * Same as Settings.reload().
 */
Settings.load = function () {
    Settings.reload();
};

/**
 * Deserializes easympv.conf and updates Settings.Data.
 */
Settings.reload = function () {
    if (!mpv.fileExists(mpv.getUserPath("~~/easympv.conf")))
        return;
    var lines = mpv.readFile(mpv.getUserPath("~~/easympv.conf"))
        .replaceAll("\r\n", "\n")
        .split("\n");

    for (var i = 0; i <= lines.length - 1; i++) {
        if (lines[i].substring(0, 1) != "#") {
            if (lines[i].includes("=")) {
                var temp = lines[i].split("=");
                var option = temp[0].trim();
                var value = temp[1].trim().split("#")[0];

                if (value.charAt(0) == "{")
                {
                    try
                    {
                        value = JSON.parse(value);
                    }
                    catch (e)
                    {
                        mpv.printWarn("Could not parse JSON in easympv.conf: " + e);
                        value = {};
                    }
                }
                else if (value.charAt(0) == "[")
                {
                    try
                    {
                        value = JSON.parse(value);
                    }
                    catch (e)
                    {
                        mpv.printWarn("Could not parse JSON in easympv.conf: " + e);
                        value = [];
                    }
                }
                else
                {
                    value = value.replaceAll("\"","");
                    if (value == "true") {
                        value = true;
                    }
                    if (value == "false") {
                        value = false;
                    }
                }

                Settings.Data[option] = value;
            }
        }
    }

    if (Settings.Data.fileBrowserFavorites.hasOwnProperty("locations")) {
        var temp = Settings.Data.fileBrowserFavorites.locations;
        Settings.Data.fileBrowserFavorites = temp;
    }

    for (var i = 0; i < Settings.Data.fileBrowserFavorites.length; i++) {
        Settings.Data.fileBrowserFavorites[i] = Settings.Data.fileBrowserFavorites[i].replaceAll("\/\/","\/");
    }

    if(Environment.SettingsOverrides != undefined)
    {
        for(var key in Environment.SettingsOverrides)
        {
            Settings.Data[key] = Environment.SettingsOverrides[key];
        }
    }
};

/**
 * Serializes Settings.Data into easympv.conf.
 */
Settings.save = function () {
    this.DataCopy = "";
    var lines = [];

    if (!mpv.fileExists(mpv.getUserPath("~~/easympv.conf"))) {
        var defaultConfigString = "";
        defaultConfigString += "### easympv.conf ###\n";
        defaultConfigString += "\n";
        defaultConfigString += "## GENERAL\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Language of easympv.\n";
        defaultConfigString += "# Default: en\n";
        defaultConfigString += "# Possible values: \"en\" for english, \"de\" for german\n";
        defaultConfigString += "# See all available languages in the \"locale\" folder of the easympv directory.\n";
        defaultConfigString += "language=en\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Location of mpv executable.\n";
        defaultConfigString += "# Default: unknown\n";
        defaultConfigString += "# Example: C:\\Users\\user\\Desktop\\mpv\\\n";
        defaultConfigString += "# Use a full path. This is only required on Windows, as on other Operating Systems it is assumed to in the $PATH.\n";
        defaultConfigString += "# If this is set to unknown, easympv will attempt to find on your system.\n";
        defaultConfigString += "mpvLocation=unknown\n";
        defaultConfigString += "\n";
        defaultConfigString += "# The key that easympv will force its menu on.\n";
        defaultConfigString += "# Default: m\n";
        defaultConfigString += "# Set this to \"disable\" to disable forcing the keybind.\n";
        defaultConfigString += "# In that case, you will need to add your own keybind to input.conf:\n";
        defaultConfigString += "# Something like: \"m script_binding easympv\"\n";
        defaultConfigString += "forcedMenuKey=m\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Whether to add an hour to the current time, to compensate for daylight saving time.\n";
        defaultConfigString += "# Default: false\n";
        defaultConfigString += "daylightSavingTime=false\n";
        defaultConfigString += "\n";
        defaultConfigString += "\n";
        defaultConfigString += "## VISUALS\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Color of the selector in menus.\n";
        defaultConfigString += "# These are the hardcoded values available in the config menu:\n";
        defaultConfigString += "# green: 66ff66\n";
        defaultConfigString += "# purple: bb108d\n";
        defaultConfigString += "# red: eb4034\n";
        defaultConfigString += "# yellow: ffff33\n";
        defaultConfigString += "# blue: 00ccff\n";
        defaultConfigString += "# pink: ff77ff\n";
        defaultConfigString += "# Default: 66ff66 (green)\n";
        defaultConfigString += "# Use a RGB Hex value, but omit the hash sign.\n";
        defaultConfigString += "selectorColor=66ff66\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Whether to show hints on the main menu.\n";
        defaultConfigString += "# Default: true\n";
        defaultConfigString += "# It looks quite empty without them.\n";
        defaultConfigString += "showHints=true\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Whether to show a clock on screen.\n";
        defaultConfigString += "# The clock should be pretty unobstrusive and its position can be chosen.\n";
        defaultConfigString += "# This ultimately comes down to personal preference.\n";
        defaultConfigString += "# Default: false\n";
        defaultConfigString += "showClock=false\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Where to show the clock once enabled.\n";
        defaultConfigString += "# Choose one of the four screen corners: top-left, top-right, bottom-left, bottom-right\n";
        defaultConfigString += "# This ultimately comes down to personal preference.\n";
        defaultConfigString += "# Default: top-left\n";
        defaultConfigString += "clockPosition=top-left\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Whether to use fade-ins and fade-outs on menus.\n";
        defaultConfigString += "# Having this enabled might result in a performance penalty.\n";
        defaultConfigString += "# This ultimately comes down to personal preference.\n";
        defaultConfigString += "# Default: true\n";
        defaultConfigString += "fadeMenus=true\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Whether to have alerts move across the screen.\n";
        defaultConfigString += "# Having this enabled might result in a performance penalty.\n";
        defaultConfigString += "# This ultimately comes down to personal preference.\n";
        defaultConfigString += "# Default: true\n";
        defaultConfigString += "scrollAlerts=true\n";
        defaultConfigString += "\n";
        defaultConfigString += "\n";
        defaultConfigString += "## SETS\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Default shader set to load at launch.\n";
        defaultConfigString += "# Default: none\n";
        defaultConfigString +=
            "# Use the full name of a shader as it appears in the shader menu!\n";
        defaultConfigString += "defaultShaderSet=x\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Default color profile to load at launch.\n";
        defaultConfigString += "# Default: none\n";
        defaultConfigString +=
            "# Use the full name of a profile as it appears in the colors menu!\n";
        defaultConfigString += "defaultColorProfile=x\n";
        defaultConfigString += "\n";
        defaultConfigString += "\n";
        defaultConfigString += "## VRR\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Enables use of G-Sync/FreeSync in mpv.\n";
        defaultConfigString += "# If enabled, mpv will first check your video files FPS. If this value is below half of your refresh rate,\n";
        defaultConfigString += "# VRR will be enabled by doubling every frame and setting the display-fps to double the video FPS.\n";
        defaultConfigString += "#\n";
        defaultConfigString += "# Example: Video file has 23.976 FPS, Display has 144Hz refresh rate and can go as low as 40Hz.\n";
        defaultConfigString += "# If enabled, mpv will output every frame twice, resulting in 47.952Hz, which is more than 40Hz.\n";
        defaultConfigString += "#\n";
        defaultConfigString += "# You must also set your refresh rate below and have mpv fullscreen'd for this to work!\n";
        defaultConfigString += "# Default: false\n";
        defaultConfigString += "simpleVRR=x\n";
        defaultConfigString += "\n";
        defaultConfigString += "# The current refresh rate of your monitor. This is only required for simpleVRR!\n";
        defaultConfigString += "# Default: 144\n";
        defaultConfigString += "refreshRate=x\n";
        defaultConfigString += "\n";
        defaultConfigString += "\n";
        defaultConfigString += "## FILE BROWSER\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Whether to strip file names to improve readability.\n";
        defaultConfigString += "#\n";
        defaultConfigString += "# Example: Lets say you have a file like this:\n";
        defaultConfigString += "#     [SomeGroup] Awesome TV Show - 07 (1080p) [719C821A].mkv\n";
        defaultConfigString += "# Enabling this option will make it show up like this instead:\n";
        defaultConfigString += "#     Awesome TV Show - 07 (mkv)\n";
        defaultConfigString += "#\n";
        defaultConfigString += "# Default: true\n";
        defaultConfigString += "shortFileNames=x\n";
        defaultConfigString += "\n";
        defaultConfigString +=
            "# Whether to show hidden files and folders in the file browser.\n";
        defaultConfigString += "# Default: false\n";
        defaultConfigString += "showHiddenFiles=x\n";
        defaultConfigString += "\n";
        defaultConfigString += "# If enabled, files will be trashed instead of permanently deleted.\n";
        defaultConfigString += "# Default: true\n";
        defaultConfigString += "useTrash=x\n";
        defaultConfigString += "\n";
        defaultConfigString +=
        "# Whether the file browser should allow you to remove folders.\n";
        defaultConfigString +=
        "# IMPORTANT: There is a reason this is disabled by default!\n";
        defaultConfigString += "# Default: false\n";
        defaultConfigString += "allowFolderDeletion=x\n";
        defaultConfigString += "\n";
        defaultConfigString += "\n";
        defaultConfigString += "## MISC\n";
        defaultConfigString += "\n";
        defaultConfigString +=
            "# Whether to start the mpv IPC server on startup.\n";
        defaultConfigString += "# Default: false\n";
        defaultConfigString +=
            "# You should only enable this if you use external scripts such as remotes.\n";
        defaultConfigString +=
            '# On Windows, a named pipe "mpv" will be created.\n';
        defaultConfigString +=
            "# On Unix-likes a socket will be created: /tmp/mpv\n";
        defaultConfigString += "startIPCServer=x\n";
        defaultConfigString += "\n";
        defaultConfigString +=
            "# Whether to use your operating system's native notifications.\n";
        defaultConfigString +=
            "# If false, notifications will be shown inside the mpv window.\n";
        defaultConfigString +=
            "# Default: false\n";
        defaultConfigString += "useNativeNotifications=x\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Whether to show alerts when out-of-date.\n";
        defaultConfigString += "# Default: true\n";
        defaultConfigString += "notifyAboutUpdates=x\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Enabling this will force the legacy display method for menus.\n";
        defaultConfigString += "# Things WILL break if this is enabled!\n";
        defaultConfigString += "# Only enable this if you are stuck on a mpv version lower or equal to 32, otherwise leave it disabled.\n";
        defaultConfigString += "# Default: false\n";
        defaultConfigString += "compatibilityMode=x\n";
        defaultConfigString += "\n";
        defaultConfigString +=
            "# This will make the log more detailed along with other changes.\n";
        defaultConfigString +=
            "# You should not enable this unless you know what you are doing, as this option WILL slow down mpv.\n";
        defaultConfigString += "# Default: false\n";
        defaultConfigString += "debugMode=x\n";
        defaultConfigString += "\n";
        defaultConfigString +=
            "# This will disable log trimming, which can be useful for debugging and testing.\n";
        defaultConfigString +=
            "# You should not enable this unless you know what you are doing, as this option WILL slow down mpv and INCREASE memory usage by A LOT.\n";
        defaultConfigString += "# Default: false\n";
        defaultConfigString += "saveFullLog=x\n";
        defaultConfigString += "\n";
        defaultConfigString +=
        "# ! Settings below are set automatically, though some might be of interest !\n";
        defaultConfigString += "\n";
        defaultConfigString +=
            "# List of favorite'd folders in the File Browser.\n";
        defaultConfigString +=
            "# This should be a valid JSON array. Default: []\n";
        defaultConfigString += "fileBrowserFavorites=x\n";
        defaultConfigString += "\n";
        defaultConfigString += "\n";
        defaultConfigString += "## VERSIONING AND TROUBLESHOOTING\n";
        defaultConfigString += "\n";
        defaultConfigString +=
            "# The currently installed version of easympv.\n";
        defaultConfigString +=
            "# This is modified automatically and should not be changed!\n";
        defaultConfigString += "currentVersion=x\n";
        defaultConfigString += "\n";
        defaultConfigString += "# The newest known version of easympv.\n";
        defaultConfigString +=
            "# If up-to-date, this value will be the same as currentVersion.\n";
        defaultConfigString +=
            "# If the newest version is unknown, this value will be 0.0.0\n";
        defaultConfigString +=
            "# This is modified automatically and should not be changed!\n";
        defaultConfigString += "newestVersion=x\n";
        defaultConfigString += "\n";
        defaultConfigString +=
            "# Whether to migrate this configuration on the next startup.\n";
        defaultConfigString +=
            "# This means that the config will be regenerated while preserving your settings.\n";
        defaultConfigString +=
            "# Usually false, unless you just updated, in which case it will be true.\n";
        defaultConfigString += "# This is modified automatically!\n";
        defaultConfigString += "doMigration=x\n";
        defaultConfigString += "\n";
        defaultConfigString +=
            "# Whether to reset the mpv.conf file to default values on the next startup.\n";
        defaultConfigString += "# Default: false.\n";
        defaultConfigString +=
            "# This is NOT modified automatically, set this to true as troubleshooting!\n";
        defaultConfigString += "resetMpvConfig=x\n";
        defaultConfigString += "\n";
        defaultConfigString +=
            "# Whether to reset the input.conf file to default values on the next startup.\n";
        defaultConfigString += "# Default: false.\n";
        defaultConfigString +=
            "# This is NOT modified automatically, set this to true as troubleshooting!\n";
        defaultConfigString += "resetInputConfig=x\n";
        defaultConfigString += "\n";
        defaultConfigString +=
            "# Whether to show the First Time configuration Wizard on the next startup.\n";
        defaultConfigString +=
            "# Usually false, unless you just installed easympv.\n";
        defaultConfigString += "# Some updates might enable this too.\n";
        defaultConfigString += "# ! THIS WILL RESET PARTS OF YOUR CONFIGURATION !\n";
        defaultConfigString +=
            "# This is modified automatically and should not be changed!\n";
        defaultConfigString += "isFirstLaunch=x\n";

        lines = defaultConfigString.replaceAll("\r\n", "\n").split("\n");
    } else {
        lines = mpv.readFile(mpv.getUserPath("~~/easympv.conf"))
            .replaceAll("\r\n", "\n")
            .split("\n");
    }

    Settings.findMpvWindows();

    for (var i = 0; i <= lines.length - 1; i++) {
        if (lines[i].includes("=")) {
            try {
                var option = lines[i].split("=")[0].trim();
                var value = Settings.Data[option];

                if (typeof value === "object")
                {
                    value = JSON.stringify(value,undefined,0);
                }

                lines[i] = option + "=" + value;
            } catch (x) {}
        }
        this.DataCopy = this.DataCopy + lines[i] + "\n";
    }
    this.DataCopy = this.DataCopy.replace(new RegExp("\\n$"), "");
    mpv.writeFile(
        "file://" + mpv.getUserPath("~~/easympv.conf"),
        this.DataCopy
    );
};

Settings.findMpvWindows = function () {

    if (mpv.fileExists(mpv.getUserPath("~~/INSTALLER_DATA_LOCATION")))
    {
        var loc = mpv.readFile(mpv.getUserPath("~~/INSTALLER_DATA_LOCATION")).trim();
        Settings.Data.mpvLocation = loc;
        OS.fileRemove("INSTALLER_DATA_LOCATION");
        return;
    }

    if(OS.isWindows && Settings.Data.mpvLocation == "unknown")
    {
        var searchPaths = [
            mpv.getEnv("LOCALAPPDATA") + "\\mpv\\",
            mpv.getEnv("PROGRAMFILES") + "\\mpv\\",
            mpv.getEnv("userprofile") + "\\Desktop\\mpv\\"
        ];
        var location = undefined;

        for(var s = 0; s < searchPaths.length; s++)
        {
            if(mpv.fileExists(mpv.getUserPath(searchPaths[s] + "mpv.exe"))){
                location = searchPaths[s];
                break;
            }
        }

        if (location != undefined)
        {
            Settings.Data.mpvLocation = location;
        }
    }
}

Settings.migrate = function () {
    var copy = {};
    // read current settings into variable
    if (mpv.fileExists(mpv.getUserPath("~~/easympv.conf"))) {
        var lines = mpv.readFile(mpv.getUserPath("~~/easympv.conf"))
            .replaceAll("\r\n", "\n")
            .split("\n");

        for (var i = 0; i <= lines.length - 1; i++) {
            if (lines[i].substring(0, 1) != "#") {
                if (lines[i].includes("=")) {
                    var temp = lines[i].split("=");
                    var option = temp[0].trim();
                    var value = temp[1].trim().split("#")[0];

                    if (value.charAt(0) == "{")
                    {
                        try
                        {
                            value = JSON.parse(value);
                        }
                        catch (e)
                        {
                            value = { locations: [] };
                        }
                    }

                    if (value == "true") {
                        value = true;
                    }
                    if (value == "false") {
                        value = false;
                    }

                    copy[option] = value;
                }
            }
        }
    }

    // set options to backup
    for (var element in Settings.Data) {
        if (copy[element] != undefined) {
            Settings.Data[element] = copy[element];
        }
    }

    // delete easympv.conf
    OS.fileRemove("easympv.conf");

    Settings.Data.doMigration = false;

    Settings.save();
};

/////////////////////////////////////////// mpv.conf

/**
 * This object contains deserialized data from mpv.conf.
 * Call Settings.mpvConfig.reload() to update it.
 * Default values should be sane and work on any device, FTW will update it on first run.
 */
Settings.mpvConfig.Data = {
    input_default_bindings: "no",
    osd_bar: "no",
    keep_open: "yes",
    autofit_larger:"75%x75%",
    osd_font_size: "24",

    sub_scale: "1",
    vo: "gpu",
    hwdec: "auto-safe",
    deband: "no",
    sigmoid_upscaling: "no",
    correct_downscaling: "no",

    alang: "",
    slang: "",

    scale: "bilinear",
    cscale: "bilinear",
    dscale: "bilinear",
    tscale: "oversample",
    video_sync: "audio",

    title: "${filename}",
    screenshot_directory:".",
    screenshot_format: "png",
    screenshot_png_compression: "8",
    screenshot_template: "\"%F_%p\"",
    speed: "1.0",
    volume: "100",

    //ad_lavc_downmix: "yes",
    //audio_channels: "stereo",
};

Settings.mpvConfig.DataDefaults = JSON.parse(JSON.stringify(Settings.mpvConfig.Data));

/**
 * Same as Settings.mpvConfig.reload().
 */
Settings.mpvConfig.load = function () {
    Settings.mpvConfig.reload();
};

/**
 * Deserializes mpv.conf and updates Settings.mpvConfig.Data.
 */
Settings.mpvConfig.reload = function () {
    if (!mpv.fileExists(mpv.getUserPath("~~/mpv.conf"))) {
        return;
    } else {
        var confFile = mpv.readFile(mpv.getUserPath("~~/mpv.conf"))
            .replaceAll("\r\n", "\n")
            .split("\n");
    }

    for (var i = 0; i <= confFile.length - 1; i++) {
        if (confFile[i].trim().substring(0, 1) != "#") {
            if (confFile[i].includes("=")) {
                var temp = confFile[i].split("=");
                var option = temp[0].trim().replaceAll("-", "_");
                var value = temp[1].trim().split("#")[0];

                Settings.mpvConfig.Data[option] = value;
            } else {
                var option = confFile[i].trim().replaceAll("-", "_");
                var value = "yes";
                Settings.mpvConfig.Data[option] = value;
            }
        }
    }

    for(var option in Settings.mpvConfig.Data)
    {
        var value = Settings.mpvConfig.Data[option];
        if (value == "@empty@")
        {
            value = "yes";
        }
        mpv.setProperty(option.replaceAll("_", "-"),value);
    }
};

Settings.mpvConfig.reset = function () {
    OS.fileRemove("mpv.conf");
    Settings.mpvConfig.Data = Settings.mpvConfig.DataDefaults;
    Settings.Data.resetMpvConfig = false;
    Settings.mpvConfig.save();
    Settings.save();
};

/**
 * Serializes Settings.mpvConfig.Data into mpv.conf.
 */
Settings.mpvConfig.save = function () {
    var lines = [];

    lines.push("### mpv.conf ###");
    lines.push("# See https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst#list-of-input-commands &");
    lines.push("# https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst#property-list for reference");
    lines.push("# Check https://github.com/JongWasTaken/easympv/wiki/Setup#choosing-default-settings");
    lines.push("# for more information about the default settings.");

    for (var key in Settings.mpvConfig.Data)
    {
        if (key.trim() != "")
        {
            lines.push(key.replaceAll("_", "-") + "=" + Settings.mpvConfig.Data[key]);
        }
    }

    //copy = copy.replace(new RegExp("\\n$"), "");
    mpv.writeFile(
        "file://" + mpv.getUserPath("~~/mpv.conf"),
        lines.join("\n")
    );
};

/////////////////////////////////////////// input.conf

/**
 * Resets input.conf to default values.
 */
Settings.inputConfig.reset = function () {
    var defaultConfigString = "";
    defaultConfigString += "### input.conf ###\n";
    defaultConfigString += "# See https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst for reference\n";
    defaultConfigString += "MBTN_LEFT cycle pause\n";
    defaultConfigString += "MBTN_LEFT_DBL cycle fullscreen\n";
    defaultConfigString += "MBTN_RIGHT cycle pause\n";
    defaultConfigString += "WHEEL_DOWN add volume -5\n";
    defaultConfigString += "WHEEL_UP add volume 5\n";
    defaultConfigString += "MBTN_FORWARD add speed 0.1\n";
    defaultConfigString += "MBTN_BACK add speed -0.1\n";
    defaultConfigString += "MBTN_MID script_binding easympv\n";
    defaultConfigString += "\n";
    defaultConfigString += "PLAYPAUSE cycle pause\n";
    defaultConfigString += "NEXT script_binding chapter_next\n";
    defaultConfigString += "\n";
    defaultConfigString += "DOWN add speed -0.1\n";
    defaultConfigString += "UP add speed 0.1\n";
    defaultConfigString += "LEFT script_binding chapter_prev\n";
    defaultConfigString += "RIGHT script_binding chapter_next\n";
    defaultConfigString += "s async screenshot\n";
    defaultConfigString += "tab async screenshot\n";
    defaultConfigString += "q quit-watch-later\n";
    defaultConfigString += "m script_binding easympv\n";
    defaultConfigString += "esc script_binding easympv\n";
    defaultConfigString += "k script_binding menu-test\n";
    defaultConfigString += "i script-binding stats/display-stats-toggle\n";
    defaultConfigString +=
        'a cycle-values video-aspect "16:9" "4:3" "1024:429"\n';
    defaultConfigString +=
        'f cycle-values sub-scale "0.8" "0.9" "1" "1.1" "1.2"\n';
    defaultConfigString += "c script-binding open-config\n";
    defaultConfigString += "b script_binding toggle-sofa\n";
    defaultConfigString += "SPACE cycle pause\n";
    defaultConfigString += "o add sub-delay -0.1\n";
    defaultConfigString += "p add sub-delay +0.1\n";
    defaultConfigString += "d script-binding drpc_toggle\n";
    defaultConfigString += 'x show-text "${playlist}"\n';
    defaultConfigString += "n seek 90\n";
    defaultConfigString += "Shift+n seek -90\n";
    defaultConfigString += "\n";
    defaultConfigString += "PGDWN add volume -1\n";
    defaultConfigString += "PGUP add volume 1\n";
    defaultConfigString +=
        'Shift+PGUP cycle-values sub-scale "0.8" "0.9" "1" "1.1" "1.2"\n';
    defaultConfigString +=
        'Shift+PGDWN cycle-values video-aspect "16:9" "4:3" "1024:429"\n';
    //defaultConfigString = defaultConfigString.replaceAll("\r\n","\n");

    mpv.writeFile(
        "file://" + mpv.getUserPath("~~/input.conf"),
        defaultConfigString
    );

    Settings.Data.resetInputConfig = false;
    Settings.save();

};

Settings.inputConfig.reload = function () {
    if (!mpv.fileExists(mpv.getUserPath("~~/input.conf")))
    {
        return;
    };

    var lines = mpv.readFile(mpv.getUserPath("~~/input.conf"))
    .replaceAll("\r\n", "\n")
    .split("\n");

    for (var i = 0; i <= lines.length - 1; i++) {
        if (lines[i].trim().substring(0, 1) != "#") {
            if (lines[i].trim() != "")
            {
                var command = lines[i].trim().split("#")[0];
                mpv.commandv("keybind",command.split(" ")[0],command.substring(command.indexOf(" ") + 1));
            }
        }
    }

};

Settings.presets.shadersets = [];

Settings.presets.shaderset = function (name, files) {
    this.name = name;
    this.files = files;
    return this;
};

Settings.presets.colorpresets = [];

Settings.presets.colorpreset = function (name, data) {
    this.name = name;
    this.data = data;
    return this;
};

Settings.presets.hints = [];

Settings.presets.shadersetsUser =  [];
Settings.presets.colorpresetsUser =  [];

Settings.presets.images = [];

Settings.presets.load = function () {
    try {
        mpv.printInfo("[settings] Loading language: " + Settings.Data.language);
        Settings.locale = JSON.parse(mpv.readFile(mpv.getUserPath("~~/scripts/easympv/locale/"+Settings.Data.language+".json")));
    }
    catch (_) {
        mpv.printWarn("[settings] Selected language could not be loaded! Falling back to localization keys...");
        Settings.locale = {};
    }

    Settings.presets.shadersets = [];
    Settings.presets.colorpresets = [];
    Settings.presets.fileextensions = [];
    Settings.presets.hints = ["This is a dummy hint, your localization file does not provide any hints!"];
    if (Settings.locale["hints"] != undefined)
    {
        Settings.presets.hints = Settings.locale["hints"];
    }
    Settings.presets.shadersetsUser =  [];
    Settings.presets.colorpresetsUser =  [];
    Settings.presets.images = [];

    var seperator = ":";
    if (OS.isWindows) {
        seperator = ";";
    };

    if(mpv.fileExists(mpv.getUserPath("~~/scripts/easympv/Presets.json")))
    {
        var json = JSON.parse(mpv.readFile(mpv.getUserPath("~~/scripts/easympv/Presets.json")));
        if (json["shadersets"] != undefined) {
            for (var set in json["shadersets"]) {
                var filelist = "";
                var i = 0;
                for (i = 0; i < json["shadersets"][set].length; i++) {
                    filelist = filelist + "~~/scripts/easympv/shaders/" + json["shadersets"][set][i] + seperator;
                }
                filelist = filelist.slice(0, filelist.length - 1);
                Settings.presets.shadersets.push(new Settings.presets.shaderset(set, filelist));
            }

            // Sort the array
            Settings.presets.shadersets.reverse();
            var i;
            var sorttemp_master = [];
            var sorttemp_sd = [];
            var sorttemp_hd = [];
            var sorttemp2 = [];
            for (i = 0; i < Settings.presets.shadersets.length; i++) {
                if (Settings.presets.shadersets[i].name.includes("Worse, but less demanding")) {
                    sorttemp_sd.push(Settings.presets.shadersets[i]);
                } else if (Settings.presets.shadersets[i].name.includes("Better, but more demanding")) {
                    sorttemp_hd.push(Settings.presets.shadersets[i]);
                } else {
                    sorttemp2.push(Settings.presets.shadersets[i]);
                }
            }
            sorttemp_sd.reverse();
            sorttemp_hd.reverse();

            for (i = 0; i < sorttemp_sd.length; i++) {
                sorttemp_master.push(sorttemp_sd[i]);
            }
            for (i = 0; i < sorttemp_hd.length; i++) {
                sorttemp_master.push(sorttemp_hd[i]);
            }
            for (i = 0; i < sorttemp2.length; i++) {
                sorttemp_master.push(sorttemp2[i]);
            }

            Settings.presets.shadersets = sorttemp_master;
        }
        if (json["colorpresets"] != undefined) {
            for (var set in json["colorpresets"]) {
                Settings.presets.colorpresets.push(
                    new Settings.presets.colorpreset(set, {
                        contrast: json["colorpresets"][set].contrast,
                        brightness: json["colorpresets"][set].brightness,
                        gamma: json["colorpresets"][set].gamma,
                        saturation: json["colorpresets"][set].saturation,
                        hue: json["colorpresets"][set].hue,
                        sharpen: parseFloat(json["colorpresets"][set].sharpen),
                    })
                );
            }
        }
        if (json["fileextensions"] != undefined) {
            for (var i = 0; i <= json["fileextensions"].length-1; i++) {
                Settings.presets.fileextensions.push(json["fileextensions"][i]);
            }
        }
        /*
        if (json["hints"] != undefined) {
            for (var i = 0; i <= json["hints"].length-1; i++) {
                Settings.presets.hints.push(json["hints"][i]);
            }
        }
        */
        if (json["images"] != undefined) {
            for (var i = 0; i <= json["images"].length-1; i++) {
                var file = json["images"][i].file;
                json["images"][i].file = "~~/scripts/easympv/images/" + json["images"][i].file;
                json["images"][i].name = file.substring(0,file.length-4);
                json["images"][i].active = false;
                json["images"][i].id = i;
                if (json["images"][i].height == undefined || json["images"][i].width == undefined || json["images"][i].offset == undefined) {
                    var x = ImageOSD.getImageInfo(json["images"][i].file);
                    json["images"][i].height = x.h;
                    json["images"][i].width = x.w;
                    json["images"][i].offset = x.offset;
                }
            }
            Settings.presets.images = json["images"];
        }
    }

    if(mpv.fileExists(mpv.getUserPath("~~/easympv.json")))
    {
        var jsonUser = JSON.parse(mpv.readFile(mpv.getUserPath("~~/easympv.json")));

        if (jsonUser["shadersets"] != undefined) {
            for (var set in jsonUser["shadersets"]) {
                var filelist = "";
                var i = 0;
                for (i = 0; i < jsonUser["shadersets"][set].length; i++) {
                    filelist = filelist + "~~/shaders/" + jsonUser["shadersets"][set][i] + seperator;
                }
                filelist = filelist.slice(0, filelist.length - 1);
                Settings.presets.shadersetsUser.push(new Settings.presets.shaderset(set, filelist));
            }
        }

        if (jsonUser["colorpresets"] != undefined) {
            for (var set in jsonUser["colorpresets"]) {
                Settings.presets.colorpresetsUser.push(
                    new Settings.presets.colorpreset(set, {
                        contrast: jsonUser["colorpresets"][set].contrast,
                        brightness: jsonUser["colorpresets"][set].brightness,
                        gamma: jsonUser["colorpresets"][set].gamma,
                        saturation: jsonUser["colorpresets"][set].saturation,
                        hue: jsonUser["colorpresets"][set].hue,
                        sharpen: parseFloat(jsonUser["colorpresets"][set].sharpen),
                    })
                );
            }
        }

        if (jsonUser["fileextensions"] != undefined) {
            for (var i = 0; i <= jsonUser["fileextensions"].length-1; i++) {
                Settings.presets.fileextensions.push(jsonUser["fileextensions"][i]);
            }
        }

        /*
        if (jsonUser["hints"] != undefined) {
            for (var i = 0; i <= jsonUser["hints"].length-1; i++) {
                Settings.presets.hints.push(jsonUser["hints"][i]);
            }
        }
        */
        if (jsonUser["images"] != undefined) {
            for (var i = 0; i <= jsonUser["images"].length-1; i++) {
                var file = jsonUser["images"][i].file;
                jsonUser["images"][i].file = "~~/images/" + jsonUser["images"][i].file;
                jsonUser["images"][i].name = file.substring(0,file.length-4);
                jsonUser["images"][i].active = false;
                jsonUser["images"][i].id = i;
                if (jsonUser["images"][i].height == undefined || jsonUser["images"][i].width == undefined || jsonUser["images"][i].offset == undefined) {
                    var x = ImageOSD.getImageInfo(jsonUser["images"][i].file);
                    jsonUser["images"][i].height = x.h;
                    jsonUser["images"][i].width = x.w;
                    jsonUser["images"][i].offset = x.offset;
                }
            }
            Settings.presets.images = Settings.presets.images.concat(jsonUser["images"]);
        }
    }
    else
    {
        var dummyFile = {
            "_comment": "This file is intended to be edited by the user. See https://github.com/JongWasTaken/easympv/wiki/Presets for more information.",
            "shadersets": {},
            "colorpresets": {},
            "fileextensions": [],
            "images": []
        };

        mpv.writeFile(
            "file://" + mpv.getUserPath("~~/easympv.json"),
            JSON.stringify(dummyFile,null,4)
        );
    }
}

Settings.presets.reload = function () {
    Settings.presets.load();
}

Settings.getLocalizedString = function(identifier)
{
    var lstr = Settings.locale[identifier];
    if (lstr == undefined)
    {
        return identifier;
    }
    return lstr;
}

Settings.cache.perFileSaves = [];

Settings.cache.load = function() {

    var currentTime = Date.now();
    var period = 2592000; // 30 * 24 * 60 * 60

    Settings.cache.perFileSaves = [];

    if(mpv.fileExists(mpv.getUserPath("~~/easympv-cache.json"))) {
        var json = JSON.parse(mpv.readFile(mpv.getUserPath("~~/easympv-cache.json")));
        for(var i = 0; i < json["perFileSaves"].length; i++)
        {
            var key = json["perFileSaves"][i];
            //mpv.printWarn(key.timestamp)
            if (key.timestamp != undefined)
            {
                //mpv.printWarn(Number(currentTime - key.timestamp));
                //mpv.printWarn(Number(currentTime - key.timestamp) < period);
                if (Number(currentTime - key.timestamp) < period)
                {
                    Settings.cache.perFileSaves.push(key);
                }
            }

        }
        //Settings.cache.perFileSaves = json["perFileSaves"];
    }
    else {
        Settings.cache.save();
    }
}

Settings.cache.reload = function() {
    Settings.cache.load();
}

Settings.cache.save = function() {
    var temp = {
        perFileSaves: Settings.cache.perFileSaves,
    };

    mpv.writeFile(
        "file://" + mpv.getUserPath("~~/easympv-cache.json"),
        JSON.stringify(temp,null,4)
    );
}