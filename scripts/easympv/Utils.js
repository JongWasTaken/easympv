/*
 * UTILS.JS (MODULE)
 *
 * Author:                  Jong
 * URL:                     http://smto.pw/mpv
 * License:                 MIT License
 */

/*----------------------------------------------------------------
The Utils.js module

This file contains all the miscellaneous functions that
don't really fit anywhere else, such as opening/executing files,
operations on the watch_later folder, and other "nice to have" things.
----------------------------------------------------------------*/

"use strict";

var Settings = require("./Settings");
var Windows = require("./WindowSystem");

/**
 * Collection of miscellaneous functions used throughout all of easympv.
 */
var Utils = {};

Utils.OS = undefined;
Utils.OSisWindows = false;

Utils.commonFontName = "Overpass SemiBold";
Utils.directorySeperator = "/";

Utils.updateInProgress = false;
Utils.isOnline = false;
Utils.latestUpdateData = undefined;

Utils.updateAvailable = false;
Utils.updateAvailableMpv = false;

Utils.mpvLatestVersion = "0.0.0";
Utils.displayVersion = "";
Utils.displayVersionMpv = "";

/**
 * Determines OS by checking the output of uname.
 * Does not return anything, instead Utils.OS and Utils.directorySeperator get updated.
 */
Utils.determineOS = function () {
    if (mp.utils.getenv("OS") == "Windows_NT") {
        Utils.OS = "win";
        Utils.OSisWindows = true;
        Utils.directorySeperator = "\\";
        Utils.commonFontName = "Overpass Light";
        Utils.log("Detected operating system: Windows","startup","info");
    } else {
        var uname = mp.command_native({
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            capture_stderr: false,
            args: ["sh", "-c", "uname -a"],
        });

        if (uname.status != "0") {
            Utils.OS = "unknown";
            Utils.log("Detected operating system: unknown","startup","warn");
            Utils.log("There was an issue while identifying your operating system: uname is not available!","startup","error");
        } else {
            var output = uname.stdout.trim();
            if (output.includes("Darwin")) {
                Utils.OS = "macos";
                Utils.log("Detected operating system: macOS","startup","info");
                Utils.log(
                    "macOS support is experimental. Please report any issues.","startup","error"
                );
            } else if (output.includes("Linux")) {
                Utils.OS = "linux";
                Utils.log("Detected operating system: Linux","startup","info");
            } else {
                Utils.OS = "linux";
                Utils.log("Detected operating system: Unix-like?","startup","info");
                Utils.log(
                    "Your OS is untested, but if it is similar to Linux it will probably be fine.","startup","error"
                );
            }

            mp.command_native({
                name: "subprocess",
                playback_only: false,
                capture_stdout: true,
                capture_stderr: false,
                args: [
                    "sh",
                    "-c",
                    "chmod +x " +
                        mp.utils.get_user_path(
                            "~~/scripts/easympv/UnixCompat.sh"
                        ),
                ],
            });
        }
    }
};

Utils.pipeName = "mpv";

Utils.getLatestUpdateData = function () {
    var callback = function (success, result, error) {
        if (result != undefined) {
            try {
                Utils.latestUpdateData = JSON.parse(result.stdout.trim());
                Settings.Data.newestVersion = Utils.latestUpdateData.version;
                Settings.save();
                Utils.updateAvailable = Utils.compareVersions(
                    Settings.Data.currentVersion,
                    Settings.Data.newestVersion
                );
                Utils.updateAvailableMpv = Utils.compareVersions(
                    Utils.mpvVersion,
                    Utils.mpvLatestVersion
                );
                Utils.setDisplayVersion();
                if (Settings.Data.downloadDependencies) {
                    Utils.downloadDependencies();
                }
            } catch (dummy) {
                if(Utils.latestUpdateData == undefined) {
                    Utils.latestUpdateData = {};
                }
                if(Utils.latestUpdateData.version == undefined) {
                    Utils.latestUpdateData.version = "0.0.0";
                }
                if(Utils.latestUpdateData.changelog == undefined) {
                    Utils.latestUpdateData.changelog = "There was an issue while getting this data. Please restart mpv to retry!";
                }
                if(Utils.latestUpdateData.removeFiles == undefined) {
                    Utils.latestUpdateData.removeFiles = [];
                }
                if(Utils.latestUpdateData.enableSettings == undefined) {
                    Utils.latestUpdateData.enableSettings = [];
                }
            }
        } else {
            Utils.latestUpdateData = undefined;
        }
    };

    if (Utils.OSisWindows) {
        var args = [
            "powershell",
            "-executionpolicy",
            "bypass",
            mp.utils
                .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                .replaceAll("/", "\\"),
            "get-version-latest",
        ];
    } else {
        var args = [
            "sh",
            "-c",
            mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                " get-version-latest",
        ];
    }

    mp.command_native_async(
        {
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            capture_stderr: false,
            args: args,
        },
        callback
    );
};

Utils.setDisplayVersion = function () {
    Utils.displayVersion = UI.SSA.setColorGreen() + Settings.Data.currentVersion;
    Utils.displayVersionMpv = UI.SSA.setColorGreen() + Utils.mpvVersion;
    if (Utils.updateAvailable) {
        Utils.displayVersion =
            UI.SSA.setColorRed() +
            Settings.Data.currentVersion +
            " (" +
            Settings.Data.newestVersion +
            " available)";
    }
    if (Utils.updateAvailableMpv) {
        Utils.displayVersionMpv =
            UI.SSA.setColorRed() +
            Utils.mpvVersion +
            " (" +
            Utils.mpvLatestVersion +
            " available)";
    }
};

/**
 * Opens mpv IPC server with the name mpv or /tmp/mpv on Linux systems.
 */
Utils.setIPCServer = function () {
    Utils.pipeName = "mpv";
    Utils.log("Started IPC Server: PipeName is \""+Utils.pipeName+"\"","startup","info");
    if (Utils.OSisWindows) {
        mp.set_property("input-ipc-server", Utils.pipeName); // named pipes exist in the limbo
    } else {
        mp.set_property("input-ipc-server", "/tmp/" + Utils.pipeName); // sockets need a location
    }
};

Utils.mpvVersion = mp.get_property("mpv-version").substring(4).split("-")[0];
Utils.mpvComparableVersion = Number(Utils.mpvVersion.substring(2));
Utils.ffmpegVersion = mp.get_property("ffmpeg-version");
Utils.libassVersion = mp.get_property("libass-version");

/**
 * Open file relative to config root. Can also run applications.
 */
Utils.openFile = function (file,raw) {

    if (raw == undefined) {
        file = mp.utils.get_user_path("~~/") + "/" + file;
        file = file.replaceAll("//", "/");
        file = file.replaceAll('"+"', "/");
    }

    if (Utils.OSisWindows) {
        file = file.replaceAll("/", "\\");
        mp.commandv("run", "cmd", "/c", "start " + file);
    } else if (Utils.OS == "linux") {
        mp.commandv("run", "sh", "-c", "xdg-open " + file);
    } else if (Utils.OS == "macos") {
        mp.commandv("run", "sh", "-c", "/System/Applications/TextEdit.app/Contents/MacOS/TextEdit " + file);
    }
    Utils.log("Opening file: " + file,"main","info");
};

/**
 * This function executes a given command string / argument string array and returns its stdout.
 * While this is very powerful, it might not be right approach for most problems.
 * @returns {string} stdout
 */
Utils.executeCommand = function (line) {
    if (line == undefined) {
        line = ["echo", '"No line specified!"'];
    }

    var r = mp.command_native({
        name: "subprocess",
        playback_only: false,
        capture_stdout: true,
        args: line,
    });
    if (r != undefined) {
        return r.stdout;
    } else {
        return "error";
    }
};

/**
 * X.
 */
Utils.log = function (text, subject, level) {
    var msg = "";
    if (subject != undefined)
    {
        msg += "[" + subject + "] "
    }

    if (level == undefined)
    {
        level = "info";
    }

    msg += text;
    mp.msg.log(level, msg)
    return;
};

/**
 * This is a hacky way to restart code execution.
 * States WILL be wrong! 
 * Utils.restartMpv() is probably a better solution.
 */
Utils.softRestart = function () {
    Utils.log("!!! SOFT RESTART! LOG IS INVALID !!!","Utils","warn")
    require("./Core").startExecution();
};

/**
 * X.
 */
Utils.showSystemMessagebox = function (text, blockThread) {

    if(blockThread == undefined) { blockThread = true; }

    if(!Utils.OSisWindows)
    {
        var isTerminal = (mp.utils.getenv("TERM") != undefined);
        if(isTerminal) {Utils.log(text,"messagebox","info"); return;}
        else
        { 
            var args = [
                "sh",
                "-c",
                mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                    " messagebox \"" + text + "\""
            ];
        }
    }
    else
    { 
        var args = [
            "powershell",
            "-executionpolicy",
            "bypass",
            mp.utils
                .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                .replaceAll("/", "\\"),
            "messagebox \"" + text + "\"",
        ];
    }

    if(blockThread)
    {
        mp.command_native({
            name: "subprocess",
            playback_only: false,
            capture_stdout: false,
            capture_stderr: false,
            args: args,
        });
    }
    else
    {
        mp.command_native_async({
            name: "subprocess",
            playback_only: false,
            capture_stdout: false,
            capture_stderr: false,
            args: args,
        });
    }
};

/**
 * X.
 */
 Utils.showAlert = function (type,text) {

    if(!Utils.OSisWindows)
    {
            var args = [
                "sh",
                "-c",
                mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                    " alert \"" + text.replace(/\{(.+?)\}/g,'').replace(/@br@/g,'\\n') + "\""
            ];
    }
    else
    { 
        var args = [
            "powershell",
            "-executionpolicy",
            "bypass",
            mp.utils
                .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                .replaceAll("/", "\\"),
            "alert \"" + text.replace(/\{(.+?)\}/g,'').replace(/@br@/g,'\\n') + "\"",
        ];
    }

    var callback = function (x, result, y)
    {
        if (result.status != 0)
        {
            /*
            var slices = text.split(" ");
            var line1 = "";
            var line2 = "";
            var line3 = "";
            var len = 0;

            var limit = 24;

            for (var i = 0; i < slices.length; i++) 
            {
                var s = slices[i];
                
                if (len < limit)
                {
                    line1 += s + " ";
                }
                else if (len < (limit*2))
                {
                    line2 += s + " ";
                }
                else if (len < (limit*3))
                {
                    line3 += s + " ";
                }
                len = len + s.length;
            }

            var line = line1 + "@br@" + line2 + "@br@" + line3;
            */
            Windows.Alerts.show(type,text);
        }
        if (type == "warning")
        {
            type = "warn";
        }
        Utils.log(text,"alert",type);
    }

    if (Settings.Data.useNativeNotifications)
    {
        mp.command_native_async({
            name: "subprocess",
            playback_only: false,
            capture_stdout: false,
            capture_stderr: false,
            args: args,
        },callback);
    }
    else
    {
        callback(null,{"status":1}, null);
    }

};

/**
 * Checks if the device can connect to the internet.
 * @returns {boolean} True if the device can connect to the internet
 */
Utils.checkInternetConnection = function () {
    Utils.log("checkInternetConnection","startup","info");
    var callback = function (success, result, error) {
        if (result != undefined) {
            Utils.isOnline = Boolean(result.stdout.trim());
            //if (!Settings.Data.manualInstallation) {
                Utils.log("Checking for updates...","startup","info");
                Utils.getLatestUpdateData();
            //}
        }
    };

    if (Utils.OSisWindows) {
        var args = [
            "powershell",
            "-executionpolicy",
            "bypass",
            mp.utils
                .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                .replaceAll("/", "\\"),
            "get-connection-status",
        ];
    } else {
        var args = [
            "sh",
            "-c",
            mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                " get-connection-status",
        ];
    }

    var r = mp.command_native_async(
        {
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            capture_stderr: false,
            args: args,
        },
        callback
    );
};

/**
 * Fetches newest mpv version number.
 * @returns {string} version string
 */
Utils.getLatestMpvVersion = function () {
    var callback = function (success, result, error) {
        if (result != undefined) {
            Utils.mpvLatestVersion = r.stdout.trim();
        }
    };

    if (Utils.OSisWindows) {
        var args = [
            "powershell",
            "-executionpolicy",
            "bypass",
            mp.utils
                .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                .replaceAll("/", "\\"),
            "get-version-latest-mpv",
        ];
    } else {
        var args = [
            "sh",
            "-c",
            mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                " get-version-latest-mpv",
        ];
    }

    var r = mp.command_native_async(
        {
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            capture_stderr: false,
            args: args,
        },
        callback
    );
};

/**
 * Exits mpv, but only if no update is currently in progress.
 */
Utils.exitMpv = function () {
    if (Utils.updateInProgress) {
        Utils.showAlert(
            "warning",
            "An update is in progress. " +
            "You cannot close mpv now!"
        );
    } else {
        mp.commandv("quit-watch-later");
    }
};

/**
 * Finds and blocks all quit bindings. Used with updater.
 */
Utils.blockQuitButtons = function () {
    Utils.updateInProgress = true;
    var bindings = JSON.parse(mp.get_property("input-bindings"));
    var keysToBlock = [];
    Utils.idsToUnblock = [];
    for (var i = 0; i < bindings.length; i++) {
        if (
            bindings[i].cmd.includes("quit-watch-later") ||
            bindings[i].cmd.includes("quit")
        ) {
            keysToBlock.push(bindings[i]);
        }
    }
    for (var i = 0; i < keysToBlock.length; i++) {
        mp.add_forced_key_binding(
            keysToBlock[i].key,
            "prevent_close_" + i,
            Utils.exitMpv
        );
        Utils.idsToUnblock.push("prevent_close_" + i);
    }
};

/**
 * Removes previously blocked quit bindings. Used with updater.
 */
Utils.unblockQuitButtons = function () {
    Utils.updateInProgress = false;

    if (Utils.idsToUnblock.length == 0) {
        return;
    }

    // Unblock quit keys
    for (var i = 0; i < Utils.idsToUnblock.length; i++) {
        mp.remove_key_binding(Utils.idsToUnblock[i]);
    }
};

/**
 * Stage 1 of the update chain. Downloads newest package.
 */
Utils.doUpdateStage1 = function () // download
{
    if (Utils.OSisWindows) {
        var args = [
            "powershell",
            "-executionpolicy",
            "bypass",
            mp.utils
                .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                .replaceAll("/", "\\"),
            "get-package " + Utils.latestUpdateData.version,
        ];
    } else {
        var args = [
            "sh",
            "-c",
            mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                " get-package " +
                Utils.latestUpdateData.version,
        ];
    }

    mp.command_native_async(
        {
            name: "subprocess",
            playback_only: false,
            capture_stdout: false,
            capture_stderr: false,
            args: args,
        },
        Utils.doUpdateStage2
    );
};

/**
 * Stage 2 of the update chain. Extracts downloaded package.
 */
Utils.doUpdateStage2 = function () // extract
{
    if (
        mp.utils.file_info(mp.utils.get_user_path("~~/package.zip")) !=
        undefined
    ) {
        if (Utils.OSisWindows) {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "extract-package",
            ];
        } else {
            var args = [
                "sh",
                "-c",
                mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                    " extract-package",
            ];
        }

        mp.command_native_async(
            {
                name: "subprocess",
                playback_only: false,
                capture_stdout: true,
                capture_stderr: false,
                args: args,
            },
            Utils.doUpdateStage3
        );
    } else {
        Utils.unblockQuitButtons();
        Utils.showAlert(
            "error",
            "Update has failed. " +
            "Download error!"
        );
        return;
    }
};

/**
 * Stage 3 of the update chain. Removes downloaded package.
 */
Utils.doUpdateStage3 = function () // delete package
{
    if (
        mp.utils.file_info(mp.utils.get_user_path("~~/package.zip")) !=
            undefined &&
        mp.utils.file_info(
            mp.utils.get_user_path(
                "~~/easympv-" + Utils.latestUpdateData.version + "/"
            )
        ) != undefined
    ) {
        if (Utils.OSisWindows) {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "remove-package",
            ];
        } else {
            var args = [
                "sh",
                "-c",
                mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                    " remove-package",
            ];
        }

        mp.command_native_async(
            {
                name: "subprocess",
                playback_only: false,
                capture_stdout: true,
                capture_stderr: false,
                args: args,
            },
            Utils.doUpdateStage4
        );
    } else {
        Utils.unblockQuitButtons();
        Utils.showAlert(
            "error",
            "Update has failed. " +
            "Extraction error!"
        );
        return;
    }
};

/**
 * Stage 4 of the update chain. Copies extracted files into place and deletes the temporary directory.
 */
Utils.doUpdateStage4 = function () // apply extracted package
{
    if (
        mp.utils.file_info(mp.utils.get_user_path("~~/package.zip")) ==
        undefined
    ) {
        if (Utils.OSisWindows) {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "apply-package",
                Utils.latestUpdateData.version,
            ];
        } else {
            var args = [
                "sh",
                "-c",
                mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                    " apply-package " +
                    Utils.latestUpdateData.version,
            ];
        }

        mp.command_native_async(
            {
                name: "subprocess",
                playback_only: false,
                capture_stdout: true,
                capture_stderr: false,
                args: args,
            },
            Utils.doUpdateStage5
        );
    } else {
        Utils.unblockQuitButtons();
        Utils.showAlert(
            "error",
            "Update has failed. " +
            "Deletion error!"
        );
        return;
    }
};

/**
 * Stage 5 of the update chain. Removes all files in Utils.latestUpdateData.removeFiles and finishes the update.
 */
Utils.doUpdateStage5 = function () {
    if (
        mp.utils.file_info(mp.utils.get_user_path("~~/extractedPackage")) ==
        undefined
    ) {
        if (Utils.latestUpdateData.removeFiles.length != 0) {
            var file = "";
            for (
                var i = 0;
                i < Utils.latestUpdateData.removeFiles.length;
                i++
            ) {
                file = Utils.latestUpdateData.removeFiles[i];

                if (Utils.OSisWindows) {
                    var args = [
                        "powershell",
                        "-executionpolicy",
                        "bypass",
                        mp.utils
                            .get_user_path(
                                "~~/scripts/easympv/WindowsCompat.ps1"
                            )
                            .replaceAll("/", "\\"),
                        "remove-file " + file,
                    ];
                } else {
                    var args = [
                        "sh",
                        "-c",
                        mp.utils.get_user_path(
                            "~~/scripts/easympv/UnixCompat.sh"
                        ) +
                            " remove-file " +
                            file,
                    ];
                }

                mp.command_native_async({
                    name: "subprocess",
                    playback_only: false,
                    capture_stdout: false,
                    capture_stderr: false,
                    args: args,
                });
            }
        }

        if (Utils.latestUpdateData.enableSettings.length != 0) {
            // set specified settings
            for (
                var i = 0;
                i < Utils.latestUpdateData.enableSettings.length;
                i++
            ) {
                Settings.Data[Utils.latestUpdateData.enableSettings[i]] = true;
            }
        }
        // update version
        Settings.Data.currentVersion = Utils.latestUpdateData.version;

        // save to file
        Settings.save();

        // done
        Utils.unblockQuitButtons();
        Utils.showAlert(
            "info",
            "Finished updating! " +
            "Restart mpv to see changes."
        );
        Utils.updateAvailable = false;
    } else {
        Utils.unblockQuitButtons();
        Utils.showAlert(
            "error",
            "Update has failed. " +
            "Apply error!"
        );
        return;
    }
};

/**
 * Updates easympv. Blocks quitting the application.
 */
Utils.doUpdate = function () {
    if (Utils.latestUpdateData == undefined) {
        return "Not connected to the internet!";
    }

    Utils.blockQuitButtons();

    if (mp.utils.file_info(mp.utils.get_user_path("~~/.git/")) == undefined)
    { 
        Utils.doUpdateStage1();
    }
    else
    {
        if (Utils.OSisWindows) {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "git-update",
            ];
        } else {
            var args = [
                "sh",
                "-c",
                mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                    " git-update",
            ];
        }
    
        mp.command_native_async(
            {
                name: "subprocess",
                playback_only: false,
                capture_stdout: false,
                capture_stderr: false,
                args: args,
            },
            Utils.doUpdateStage5
        );
    }
    return "";
};

/**
 * Updates mpv on Windows only.
 */
Utils.updateMpv = function () {
    if (Utils.OSisWindows) {
        if (Settings.Data.mpvLocation != "unknown") {
            if (Utils.updateAvailableMpv) {
                var args = [
                    "powershell",
                    "-executionpolicy",
                    "bypass",
                    mp.utils
                        .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                        .replaceAll("/", "\\"),
                    "update-mpv",
                    Settings.Data.mpvLocation,
                ];
                mp.command_native_async({
                    name: "subprocess",
                    playback_only: false,
                    capture_stdout: true,
                    capture_stderr: false,
                    args: args,
                });
            } else {
                Utils.showAlert("info", "mpv is up to date.");
            }
        } else {
            Utils.showAlert(
                "error",
                "mpv location is unknown. " +
                "Please update easympv.conf!"
            );
        }
    } else {
        Utils.showAlert("error", "Only supported on Windows.");
    }
    return;
};

Utils.downloadDependencies = function () {
    var dependencies = undefined;
    var installList = undefined;

    if (Utils.OSisWindows) {
        var args = [
            "powershell",
            "-executionpolicy",
            "bypass",
            mp.utils
                .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                .replaceAll("/", "\\"),
            "get-dependencies",
        ];
    } else {
        var args = [
            "sh",
            "-c",
            mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                " get-dependencies",
        ];
    }

    var r = mp.command_native({
        name: "subprocess",
        playback_only: false,
        capture_stdout: true,
        capture_stderr: false,
        args: args,
    });

    if (r.stdout != undefined) {
        dependencies = JSON.parse(r.stdout.trim());
    }

    if (dependencies == undefined) return;

    if (Utils.OSisWindows) {
        installList = dependencies.windows;
    }
    if (Utils.OS == "linux" || Utils.OS == "unix") {
        installList = dependencies.linux;
    }
    if (Utils.OS == "macos") {
        installList = dependencies.macos;
    }

    for (var i = 0; i < dependencies.windows.length; i++) {
        if (Utils.OSisWindows) {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "remove-file-generic",
                dependencies.windows[i].location.replaceAll(
                    "@mpvdir@",
                    Settings.Data.mpvLocation
                ),
            ];
            mp.command_native({
                name: "subprocess",
                playback_only: false,
                capture_stdout: true,
                capture_stderr: false,
                args: args,
            });
        } else {
            if (!dependencies.windows[i].location.includes("@mpvdir@")) {
                var args = [
                    "sh",
                    "-c",
                    mp.utils.get_user_path(
                        "~~/scripts/easympv/UnixCompat.sh"
                    ) +
                        " remove-file " +
                        dependencies.linux[i].location,
                ];
                mp.command_native({
                    name: "subprocess",
                    playback_only: false,
                    capture_stdout: true,
                    capture_stderr: false,
                    args: args,
                });
            }
        }
    }

    for (var i = 0; i < dependencies.linux.length; i++) {
        if (Utils.OSisWindows) {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "remove-file",
                dependencies.linux[i].location,
            ];
        } else {
            var args = [
                "sh",
                "-c",
                mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                    " remove-file " +
                    dependencies.linux[i].location,
            ];
        }

        var r = mp.command_native({
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            capture_stderr: false,
            args: args,
        });
    }

    for (var i = 0; i < dependencies.macos.length; i++) {
        if (Utils.OSisWindows) {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "remove-file",
                dependencies.macos[i].location,
            ];
        } else {
            var args = [
                "sh",
                "-c",
                mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                    " remove-file " +
                    dependencies.macos[i].location,
            ];
        }

        var r = mp.command_native({
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            capture_stderr: false,
            args: args,
        });
    }

    for (var i = 0; i < installList.length; i++) {
        if (Utils.OSisWindows) {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "download-dependency",
                installList[i].url,
                installList[i].location.replaceAll(
                    "@mpvdir@",
                    Settings.Data.mpvLocation
                ),
            ];
        } else {
            var args = [
                "sh",
                "-c",
                mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                    " download-dependency " +
                    installList[i].url +
                    " " +
                    installList[i].location,
            ];
        }

        var r = mp.command_native({
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            capture_stderr: false,
            args: args,
        });
    }

    Settings.Data.downloadDependencies = false;
    Settings.save();

    // macOS requires discord game sdk to be in /usr/local/lib/
    if (!Utils.OSisWindows) 
    {
        var args = [
            "sh",
            "-c",
            mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                " dependency-postinstall",
        ];
        var r = mp.command_native({
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            capture_stderr: false,
            args: args,
        });
    }
};

/**
 * Registers mpv on Windows only.
 */
Utils.registerMpv = function () {
    var onFinished = function () {
        Utils.showAlert(
            "info",
            "Successfully registered mpv! " +
            "Do not close any windows that have" +
            " opened. They will close themselves."
        );
    };

    if (Utils.OSisWindows) {
        if (Settings.Data.mpvLocation != "unknown") {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "elevate",
                Settings.Data.mpvLocation + "\\installer\\mpv-install.bat",
            ];
            mp.command_native_async(
                {
                    name: "subprocess",
                    playback_only: false,
                    capture_stdout: true,
                    capture_stderr: false,
                    args: args,
                },
                onFinished
            );
        } else {
            Utils.showAlert(
                "error",
                "mpv location is unknown. " +
                "Please update easympv.conf!"
            );
        }
    } else {
        Utils.showAlert("error", "Only supported on Windows.");
    }
    return;
};

/**
 * Unregisters mpv on Windows only.
 */
Utils.unregisterMpv = function () {
    var onFinished = function () {
        Utils.showAlert(
            "info",
            "Successfully unregistered mpv! " +
            "Do not close any windows that have" +
            " opened. They will close themselves."
        );
    };

    if (Utils.OSisWindows) {
        if (Settings.Data.mpvLocation != "unknown") {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "elevate",
                Settings.Data.mpvLocation + "\\installer\\mpv-uninstall.bat",
            ];
            mp.command_native_async(
                {
                    name: "subprocess",
                    playback_only: false,
                    capture_stdout: true,
                    capture_stderr: false,
                    args: args,
                },
                onFinished
            );
        } else {
            Utils.showAlert(
                "error",
                "mpv location is unknown. " +
                "Please update easympv.conf!"
            );
        }
    } else {
        Utils.showAlert("error", "Only supported on Windows.");
    }
    return;
};

/**
 * Compares two version strings.
 * @return {boolean} True if currentVersion is lower than newestVersion
 */
Utils.compareVersions = function (currentVersion, newestVersion) {
    return (
        Number(currentVersion.replace(/\./g, "")) <
        Number(newestVersion.replaceAll(/\./g, ""))
    );
};

/**
 * Reads and returns content of Credits file.
 * @return {string} credits
 */
Utils.getCredits = function () {
    if (
        mp.utils.file_info(mp.utils.get_user_path("~~/easympv.conf")) ==
        undefined
    )
        return;
    return mp.utils.read_file(
        mp.utils.get_user_path("~~/scripts/easympv/Credits.txt")
    );
};

Utils.restartMpv = function () {
    // try to restart mpv in-place
    var mpvLocation = "/usr/bin/mpv";

    if (Settings.Data.mpvLocation != "unknown")
    {
        mpvLocation = Settings.Data.mpvLocation;
    }

    if (mp.utils.file_info(mpvLocation) == undefined)
    {
        Utils.log("mpv location is unknown! mpv will now terminate!","restart","info");
        mp.commandv("quit-watch-later"); 
    }
    
    if (Utils.OSisWindows)
    {
        mpvLocation = mpvLocation.replaceAll("/", "\\");
    }

    var cFile = mp.get_property("playlist/0/filename");

    for (var i = 0; i < Number(mp.get_property("playlist/count")); i++) {
        if (mp.get_property("playlist/" + i + "/current") == "yes") {
            cFile = mp.get_property("playlist/" + i + "/filename");
            break;
        }
    }

    // cFile could be a relative path, so we need to expand it
    if (cFile != undefined) {
        if (
            !Utils.OSisWindows &&
            mp.utils.file_info(
                mp.get_property("working-directory") + "/" + cFile
            ) != undefined
        ) {
            cFile =
                mp.get_property("working-directory") +
                "/" +
                cFile.replaceAll("./", "");
        }
    }
    else
    {
        cFile = "--player-operation-mode=pseudo-gui";
    }

    mp.commandv("run",mpvLocation,cFile)
    Utils.log("!!! mpv will be restarted !!!","restart","warn")
    Utils.log("!!! Any custom options have not been passed to the new mpv instance, please restart manually if neccessary !!!","restart","warn")
    mp.commandv("quit-watch-later");
}

/**
 * Clears watch_later folder and creates a dummy file.
 */
Utils.clearWL = function () {
    Utils.log("Clearing watch_later folder","main","info")
    var folder = mp.utils.get_user_path("~~/watch_later");
    if (Utils.OSisWindows) {
        folder = folder.replaceAll("/", "\\");
        Utils.executeCommand(["del", "/Q", "/S", folder]);
        Utils.executeCommand(["mkdir", folder]);
        Utils.WL.createDummy();
    } else {
        Utils.executeCommand(["rm", "-rf", folder]);
        Utils.executeCommand(["mkdir", folder]);
        Utils.WL.createDummy();
    }
};

module.exports = Utils;
