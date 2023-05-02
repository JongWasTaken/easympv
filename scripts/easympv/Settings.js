/*
 * SETTINGS.JS (MODULE)
 *
 * Author:                     Jong
 * URL:                        https://smto.pw/mpv
 * License:                    MIT License
 */

/*----------------------------------------------------------------
The Settings.js module

This file handles serialization and deserialization of the
easympv.conf file located in the mpv config root directory.
It also provides sane defaults in case configuration files
are missing.
----------------------------------------------------------------*/

"use strict";

/**
 * This module handles serialization and deserialization of the
 * easympv.conf file located in the mpv config root directory.
 * It also provides sane defaults in case configuration files
 * are missing.
 */
var Settings = {};

Settings.mpvConfig = {};
Settings.inputConfig = {};
Settings.presets = {};
Settings.cache = {};

/////////////////////////////////////////// easympv.conf

/**
 * This object contains deserialized data from easympv.conf.
 * Call Settings.reload() to update it.
 */
Settings.Data = {
    mpvLocation: "unknown",
    forcedMenuKey: "m",
    fadeMenus: false,
    defaultShaderSet: "none",
    defaultColorProfile: "none",
    simpleVRR: false,
    refreshRate: 144,
    showHiddenFiles: false,
    allowFolderDeletion: false,
    startIPCServer: false,
    useNativeNotifications: true,
    notifyAboutUpdates: true,
    debugMode: false,
    saveFullLog: false,
    fileBrowserFavorites: { locations: [] },
    currentVersion: "0.0.0",
    newestVersion: "0.0.1",
    doMigration: false,
    downloadDependencies: false,
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
    if (
        mp.utils.file_info(mp.utils.get_user_path("~~/easympv.conf")) ==
        undefined
    )
        return;
    var lines = mp.utils
        .read_file(mp.utils.get_user_path("~~/easympv.conf"))
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
                        mp.msg.warn("Could not parse JSON in easympv.conf: " + e);
                        value = { locations: [] };
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

    for (var i = 0; i < Settings.Data["fileBrowserFavorites"].locations.length; i++) {
        Settings.Data["fileBrowserFavorites"].locations[i] = Settings.Data["fileBrowserFavorites"].locations[i].replaceAll("\/\/","\/");
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

    if (
        mp.utils.file_info(mp.utils.get_user_path("~~/easympv.conf")) ==
        undefined
    ) {
        var defaultConfigString = "";
        defaultConfigString += "### easympv.conf ###\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Location of mpv executable.\n";
        defaultConfigString += "# Default: none\n";
        defaultConfigString += "# Example: C:\\Users\\user\\Desktop\\mpv\n";
        defaultConfigString += "# Use a full path. Only required on Windows!\n";
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
        defaultConfigString += "# Whether to use fade-ins and fade-outs on menus.\n";
        defaultConfigString += "# Having this enabled might result in a performance penalty.\n";
        defaultConfigString += "# This ultimately comes down to personal preference.\n";
        defaultConfigString += "# Default: true\n";
        defaultConfigString += "fadeMenus=true\n";
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
        defaultConfigString +=
            "# Whether to show hidden files and folders in the file browser.\n";
        defaultConfigString += "# Default: false\n";
        defaultConfigString += "showHiddenFiles=x\n";
        defaultConfigString += "\n";
        defaultConfigString +=
        "# Whether the file browser should allow you to remove folders.\n";
        defaultConfigString +=
        "# IMPORTANT: There is a reason this is disabled by default!\n";
        defaultConfigString += "# Default: false\n";
        defaultConfigString += "allowFolderDeletion=x\n";
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
            "# Default: true.\n";
        defaultConfigString += "useNativeNotifications=x\n";
        defaultConfigString += "\n";
        defaultConfigString += "# Whether to show alerts when out-of-date.\n";
        defaultConfigString += "# Default: true\n";
        defaultConfigString += "notifyAboutUpdates=x\n";
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
            "# This should be a valid JSON array. Default: {\"locations\":[]}\n";
        defaultConfigString += "fileBrowserFavorites=x\n";
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
            "# Whether to download dependencies on the next startup.\n";
        defaultConfigString +=
            "# Usually false. You may set this to true if you changed your operating system.\n";
        defaultConfigString += "# This is modified automatically!\n";
        defaultConfigString += "downloadDependencies=x\n";
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
        defaultConfigString += "# ! THIS WILL DISCARD YOUR CONFIGURATION !\n";
        defaultConfigString +=
            "# This is modified automatically and should not be changed!\n";
        defaultConfigString += "isFirstLaunch=x\n";

        lines = defaultConfigString.replaceAll("\r\n", "\n").split("\n");
    } else {
        lines = mp.utils
            .read_file(mp.utils.get_user_path("~~/easympv.conf"))
            .replaceAll("\r\n", "\n")
            .split("\n");
    }

    if(Utils.OSisWindows && Settings.Data["mpvLocation"] == "unknown")
    {
        var searchPaths = [
            "~~home\\AppData\\Local\\mpv\\",
            "C:\\Program Files\\mpv\\",
            "~~desktop\\mpv\\"
        ];
        var location = undefined;

        for(var s = 0; s < searchPaths.length; s++)
        {
            if(mp.utils.file_info(mp.utils.get_user_path(searchPaths[s] + "mpv.exe")) != undefined){
                location = searchPaths[s];
                break;
            }
        }

        if (location != undefined)
        {
            Settings.Data["mpvLocation"] = location;
        }
    }

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
    mp.utils.write_file(
        "file://" + mp.utils.get_user_path("~~/easympv.conf"),
        this.DataCopy
    );
};

Settings.migrate = function () {
    var copy = {};
    // read current settings into variable
    if (
        mp.utils.file_info(mp.utils.get_user_path("~~/easympv.conf")) !=
        undefined
    ) {
        var lines = mp.utils
            .read_file(mp.utils.get_user_path("~~/easympv.conf"))
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
    var file = "easympv.conf";
    if (Utils.OSisWindows) {
        var args = [
            "powershell",
            "-executionpolicy",
            "bypass",
            mp.utils
                .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                .replaceAll("/", "\\"),
            "remove-file " + file,
        ];
    } else {
        var args = [
            "sh",
            "-c",
            mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                " remove-file " +
                file,
        ];
    }
    mp.command_native({
        name: "subprocess",
        playback_only: false,
        capture_stdout: false,
        capture_stderr: false,
        args: args,
    });

    Settings.Data.doMigration = false;

    Settings.save();
};

/////////////////////////////////////////// mpv.conf

/**
 * This object contains deserialized data from mpv.conf.
 * Call Settings.mpvConfig.reload() to update it.
 */
Settings.mpvConfig.Data = {
    input_default_bindings: "no",
    osd_bar: "no",
    keep_open: "yes",
    autofit_larger:"75%x75%",
    osd_font_size: "24",

    sub_scale: "1",
    vo: "gpu",
    deband: "yes",
    sigmoid_upscaling: "yes",
    linear_downscaling: "yes",
    correct_downscaling: "yes",
    sub_ass_force_style: "Kerning", //TODO: change these to something more sane
    demuxer_mkv_subtitle_preroll: "yes",
    blend_subtitles: "yes",

    alang: "Japanese,ja,jap,jpn",
    slang: "Full,English,eng,en,Subtitles",

    scale: "spline36",
    cscale: "spline36",
    dscale: "mitchell",
    tscale: "mitchell",
    video_sync: "audio",
    temporal_dither: "yes",

    title: "${filename}",
    screenshot_directory:".",
    screenshot_format: "png",
    screenshot_png_compression: "8",
    screenshot_template: "\"%F_%p\"",
    speed: "1.0",
    volume: "100",

    ad_lavc_downmix: "no",
    audio_channels: "stereo",
};

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
    if (
        mp.utils.file_info(mp.utils.get_user_path("~~/mpv.conf")) == undefined
    ) {
        return;
    } else {
        var confFile = mp.utils
            .read_file(mp.utils.get_user_path("~~/mpv.conf"))
            .replaceAll("\r\n", "\n")
            .split("\n");
    }

    for (var i = 0; i <= confFile.length - 1; i++) {
        if (confFile[i].trim().substring(0, 1) != "#") {
            if (confFile[i].includes("=")) {
                var temp = confFile[i].split("=");
                var option = temp[0].trim().replaceAll("-", "_");
                var value = temp[1].trim().split("#")[0];

                if (value == "true") {
                    value = true;
                }
                if (value == "false") {
                    value = false;
                }
                Settings.mpvConfig.Data[option] = value;
            } else {
                var option = confFile[i].trim().replaceAll("-", "_");
                var value = "@empty@";
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
        mp.set_property(option.replaceAll("_", "-"),value);
    }
};

Settings.mpvConfig.reset = function () {
    var file = "mpv.conf";
    if (Utils.OSisWindows) {
        var args = [
            "powershell",
            "-executionpolicy",
            "bypass",
            mp.utils
                .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                .replaceAll("/", "\\"),
            "remove-file " + file,
        ];
    } else {
        var args = [
            "sh",
            "-c",
            mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                " remove-file " +
                file,
        ];
    }
    mp.command_native({
        name: "subprocess",
        playback_only: false,
        capture_stdout: false,
        capture_stderr: false,
        args: args,
    });

    Settings.mpvConfig.save();
};

/**
 * Serializes Settings.mpvConfig.Data into mpv.conf.
 */
Settings.mpvConfig.save = function () {
    // IF file DOES NOT exist:
    // - Generate new file with sane defaults
    // - Replace Values

    // IF file DOES exist:
    // - Check if an option exists, if yes replace, else append
    var copy = "";
    var lines = [];

    if (
        mp.utils.file_info(mp.utils.get_user_path("~~/mpv.conf")) == undefined
    ) {
        var defaultConfigString = "";
        defaultConfigString += "### mpv.conf ###\n";
        defaultConfigString += "# See https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst#list-of-input-commands &\n";
        defaultConfigString += "# https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst#property-list for reference\n\n";
        defaultConfigString += "# Check https://github.com/JongWasTaken/easympv/wiki/Setup#default-settings\n";
        defaultConfigString += "# for more information about the default settings.\n";
        lines = defaultConfigString.replaceAll("\r\n", "\n").split("\n");
    } else {
        lines = mp.utils
            .read_file(mp.utils.get_user_path("~~/mpv.conf"))
            .replaceAll("\r\n", "\n")
            .split("\n");
    }

    for (var i = 0; i <= lines.length - 1; i++) {
        var option = "";
        var value = "";
        var string = "";
        if (lines[i].includes("=")) {
            option = lines[i].split("=")[0];
        } else {
            option = lines[i];
        }

        if (Settings.mpvConfig.Data[option] != undefined) {
            value = Settings.mpvConfig.Data[option];
            option = option.replaceAll("_", "-");
            if (value == "@empty@") {
                string = option;
            } else {
                string = option + "=" + value;
            }
        } else {
            string = lines[i];
        }
        copy = copy + string + "\n";
    }

    for (var item in Settings.mpvConfig.Data) {
        if (!copy.includes(item)) {
            var val = Settings.mpvConfig.Data[item];
            item = item.replaceAll("_", "-");
            if (val == "@empty@") {
                copy = copy + item + "\n";
            } else {
                copy = copy + item + "=" + val + "\n";
            }
        }
    }

    copy = copy.replace(new RegExp("\\n$"), "");
    mp.utils.write_file(
        "file://" + mp.utils.get_user_path("~~/mpv.conf"),
        copy
    );

    Settings.Data.resetMpvConfig = false;
    Settings.save();
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

    mp.utils.write_file(
        "file://" + mp.utils.get_user_path("~~/input.conf"),
        defaultConfigString
    );

    Settings.Data.resetInputConfig = false;
    Settings.save();

};

Settings.inputConfig.reload = function () {
    if (mp.utils.file_info(mp.utils.get_user_path("~~/input.conf")) == undefined)
    {
        return;
    };

    var lines = mp.utils
    .read_file(mp.utils.get_user_path("~~/input.conf"))
    .replaceAll("\r\n", "\n")
    .split("\n");

    for (var i = 0; i <= lines.length - 1; i++) {
        if (lines[i].trim().substring(0, 1) != "#") {
            if (lines[i].trim() != "")
            {
                var command = lines[i].trim().split("#")[0];
                mp.commandv("keybind",command.split(" ")[0],command.substring(command.indexOf(" ") + 1));
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

    Settings.presets.shadersets = [];
    Settings.presets.colorpresets = [];
    Settings.presets.fileextensions = [];
    Settings.presets.hints = [];
    Settings.presets.shadersetsUser =  [];
    Settings.presets.colorpresetsUser =  [];
    Settings.presets.images = [];

    var seperator = ":";
    if (Utils.OSisWindows) {
        seperator = ";";
    };

    if(mp.utils.file_info(mp.utils.get_user_path("~~/scripts/easympv/Presets.json")) != undefined)
    {
        var json = JSON.parse(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Presets.json")));
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
        if (json["hints"] != undefined) {
            for (var i = 0; i <= json["hints"].length-1; i++) {
                Settings.presets.hints.push(json["hints"][i]);
            }
        }
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

    if(mp.utils.file_info(mp.utils.get_user_path("~~/easympv.json")) != undefined)
    {
        var jsonUser = JSON.parse(mp.utils.read_file(mp.utils.get_user_path("~~/easympv.json")));

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

        if (jsonUser["hints"] != undefined) {
            for (var i = 0; i <= jsonUser["hints"].length-1; i++) {
                Settings.presets.hints.push(jsonUser["hints"][i]);
            }
        }

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
            "_comment": "For more information please visit the wiki: https://github.com/JongWasTaken/easympv/wiki/Presets",
            "shadersets": {},
            "colorpresets": {},
            "fileextensions": [],
            "hints": [],
            "images": []
        };

        mp.utils.write_file(
            "file://" + mp.utils.get_user_path("~~/easympv.json"),
            JSON.stringify(dummyFile,null,4)
        );
    }
}

Settings.presets.reload = function () {
    Settings.presets.load();
}

Settings.cache.perFileSaves = [];

Settings.cache.load = function() {

    var currentTime = Date.now();
    var period = 2592000; // 30 * 24 * 60 * 60

    Settings.cache.perFileSaves = [];

    if(
        mp.utils.file_info(mp.utils.get_user_path("~~/easympv-cache.json")) !=
        undefined
    ) {
        var json = JSON.parse(mp.utils.read_file(mp.utils.get_user_path("~~/easympv-cache.json")));
        for(var i = 0; i < json["perFileSaves"].length; i++)
        {
            var key = json["perFileSaves"][i];
            //mp.msg.warn(key.timestamp)
            if (key.timestamp != undefined)
            {
                //mp.msg.warn(Number(currentTime - key.timestamp));
                //mp.msg.warn(Number(currentTime - key.timestamp) < period);
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

    mp.utils.write_file(
        "file://" + mp.utils.get_user_path("~~/easympv-cache.json"),
        JSON.stringify(temp,null,4)
    );
}

module.exports = Settings;
