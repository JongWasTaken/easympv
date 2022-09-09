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
hashing strings to MD5, operations on the watch_later folder,
and other "nice to have" things.
----------------------------------------------------------------*/

"use strict";

var Settings = require("./Settings");
var Windows = require("./WindowSystem");
var SSA = require("./SSAHelper");

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
    Utils.displayVersion = SSA.setColorGreen() + Settings.Data.currentVersion;
    Utils.displayVersionMpv = SSA.setColorGreen() + Utils.mpvVersion;
    if (Utils.updateAvailable) {
        Utils.displayVersion =
            SSA.setColorRed() +
            Settings.Data.currentVersion +
            " (" +
            Settings.Data.newestVersion +
            " available)";
    }
    if (Utils.updateAvailableMpv) {
        Utils.displayVersionMpv =
            SSA.setColorRed() +
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
    Utils.log("Started IPC Server: PipeName is \"mpv\"","main","info");
    if (Utils.OS != "win") {
        mp.set_property("input-ipc-server", "/tmp/" + Utils.pipeName); // sockets need a location
    } else {
        mp.set_property("input-ipc-server", Utils.pipeName); // named pipes exist in the limbo
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
        mp.commandv("run", "sh", "-c", "open " + file);
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
    Utils.doUpdateStage1();

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
        Utils.log("mpv will now terminate (file reset)","startup","info");
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
    Utils.log("!!! A file reset has occurred, mpv has been restarted !!!","restart","warn")
    Utils.log("!!! Any custom options have not been passed to the new mpv instance, please restart manually if neccessary !!!","restart","warn")
    mp.commandv("quit"); 
}

Utils.Input = {};
Utils.Input.Callback = undefined;
Utils.Input.isShown = false;
Utils.Input.Buffer = "";
Utils.Input.OSD = undefined;
Utils.Input.TextSettings = SSA.setBorder(2) + SSA.setFont("Roboto");
Utils.Input.InputPrefix = "";
Utils.Input.Prefix = "";

Utils.Input.keybindOverrides = [
    { key: "ESC", id: "empv_input_esc" },
    
    { key: "KP_ENTER", id: "empv_input_kp_enter" },
    { key: "ENTER", id: "empv_input_enter" },
    { key: "SPACE", id: "empv_input_space" },

    { key: "INS", id: "empv_input_insert" },
    { key: "DEL", id: "empv_input_delete" },

    { key: "~", id: "empv_input_tilde" },
    { key: "`", id: "empv_input_backtick" },
    { key: "1", id: "empv_input_one" },
    { key: "!", id: "empv_input_exclamation" },
    { key: "2", id: "empv_input_two" },
    { key: "@", id: "empv_input_at" },
    { key: "3", id: "empv_input_three" },
    { key: "SHARP", id: "empv_input_hash" },
    { key: "4", id: "empv_input_four" },
    { key: "$", id: "empv_input_dollar" },
    { key: "5", id: "empv_input_five" },
    { key: "%", id: "empv_input_percent" },
    { key: "6", id: "empv_input_six" },
    { key: "^", id: "empv_input_caret" },
    { key: "7", id: "empv_input_seven" },
    { key: "&", id: "empv_input_ampersand" },
    { key: "8", id: "empv_input_eight" },
    { key: "*", id: "empv_input_star" },
    { key: "9", id: "empv_input_nine" },
    { key: "(", id: "empv_input_bracket_opened" },
    { key: "0", id: "empv_input_zero" },
    { key: ")", id: "empv_input_bracket_closed" },
    { key: "-", id: "empv_input_minus" },
    { key: "_", id: "empv_input_underscore" },
    { key: "=", id: "empv_input_equals" },
    { key: "+", id: "empv_input_plus" },
    { key: "BS", id: "empv_input_bs" },

    { key: "q", id: "empv_input_q" },
    { key: "w", id: "empv_input_w" },
    { key: "e", id: "empv_input_e" },
    { key: "r", id: "empv_input_r" },
    { key: "t", id: "empv_input_t" },
    { key: "y", id: "empv_input_y" },
    { key: "u", id: "empv_input_u" },
    { key: "i", id: "empv_input_i" },
    { key: "o", id: "empv_input_o" },
    { key: "p", id: "empv_input_p" },
    { key: "a", id: "empv_input_a" },
    { key: "s", id: "empv_input_s" },
    { key: "d", id: "empv_input_d" },
    { key: "f", id: "empv_input_f" },
    { key: "g", id: "empv_input_g" },
    { key: "h", id: "empv_input_h" },
    { key: "j", id: "empv_input_j" },
    { key: "k", id: "empv_input_k" },
    { key: "l", id: "empv_input_l" },
    { key: "z", id: "empv_input_z" },
    { key: "x", id: "empv_input_x" },
    { key: "c", id: "empv_input_c" },
    { key: "v", id: "empv_input_v" },
    { key: "b", id: "empv_input_b" },
    { key: "n", id: "empv_input_n" },
    { key: "m", id: "empv_input_m" },

    { key: "Q", id: "empv_input_q_uppercase" },
    { key: "W", id: "empv_input_w_uppercase" },
    { key: "E", id: "empv_input_e_uppercase" },
    { key: "R", id: "empv_input_r_uppercase" },
    { key: "T", id: "empv_input_t_uppercase" },
    { key: "Y", id: "empv_input_y_uppercase" },
    { key: "U", id: "empv_input_u_uppercase" },
    { key: "I", id: "empv_input_i_uppercase" },
    { key: "O", id: "empv_input_o_uppercase" },
    { key: "P", id: "empv_input_p_uppercase" },
    { key: "A", id: "empv_input_a_uppercase" },
    { key: "S", id: "empv_input_s_uppercase" },
    { key: "D", id: "empv_input_d_uppercase" },
    { key: "F", id: "empv_input_f_uppercase" },
    { key: "G", id: "empv_input_g_uppercase" },
    { key: "H", id: "empv_input_h_uppercase" },
    { key: "J", id: "empv_input_j_uppercase" },
    { key: "K", id: "empv_input_k_uppercase" },
    { key: "L", id: "empv_input_l_uppercase" },
    { key: "Z", id: "empv_input_z_uppercase" },
    { key: "X", id: "empv_input_x_uppercase" },
    { key: "C", id: "empv_input_c_uppercase" },
    { key: "V", id: "empv_input_v_uppercase" },
    { key: "B", id: "empv_input_b_uppercase" },
    { key: "N", id: "empv_input_n_uppercase" },
    { key: "M", id: "empv_input_m_uppercase" },

    { key: "{", id: "empv_input_curly_bracket_opened" },
    { key: "}", id: "empv_input_curly_bracket_closed" },
    { key: "[", id: "empv_input_square_bracket_opened" },
    { key: "]", id: "empv_input_square_bracket_closed" },
    { key: "\\", id: "empv_input_backslash" },
    { key: "|", id: "empv_input_pipe" },
    { key: ";", id: "empv_input_semicolon" },
    { key: ":", id: "empv_input_colon" },
    { key: "'", id: "empv_input_apostrophe" },
    { key: "\"", id: "empv_input_quotation" },
    { key: ",", id: "empv_input_comma" },
    { key: "<", id: "empv_input_lessthan" },
    { key: ".", id: "empv_input_dot" },
    { key: ">", id: "empv_input_greaterthan" },
    { key: "/", id: "empv_input_slash" },
    { key: "?", id: "empv_input_question" },

    { key: "UP", id: "empv_input_up" },
    { key: "DOWN", id: "empv_input_down" },
    { key: "LEFT", id: "empv_input_left" },
    { key: "RIGHT", id: "empv_input_right" },

    { key: "MBTN_MID", id: "empv_input_mbtn_mid" },
    { key: "WHEEL_UP", id: "empv_input_mbtn_up" },
    { key: "WHEEL_DOWN", id: "empv_input_mbtn_down" },

    { key: "Ctrl+a", id: "empv_input_ctrl_a" },
    { key: "Ctrl+v", id: "empv_input_ctrl_v" },
];

Utils.Input.handleKeyPress = function (key) {
    if(key == "Ctrl+v" || key == "INS") {
        if (Utils.OSisWindows) {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "get-clipboard",
            ];
        } else {
            var args = [
                "sh",
                "-c",
                mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                    " get-clipboard",
            ];
        }
    
        var result = mp.command_native(
            {
                name: "subprocess",
                playback_only: false,
                capture_stdout: true,
                capture_stderr: false,
                args: args,
            });

        Utils.Input.Buffer += result.stdout.trim().replace(/\{/g,'\{').replace(/\}/g,'\}');
    }
    else if (key == "Ctrl+a")
    {
        Utils.Input.Buffer = "";
    }
    else if (key == "BS" || key == "DEL" || key == "LEFT")
    {
        Utils.Input.Buffer = Utils.Input.Buffer.substring(0,Utils.Input.Buffer.length-1);
    }
    else if (key == "SPACE")
    {
        Utils.Input.Buffer += " ";
    }
    else if (key == "ESC")
    {
        Utils.Input.hide(false);
        return;
    }
    else if (key == "ENTER" || key == "KP_ENTER")
    {
        Utils.Input.hide(true);
        return;
    }
    else if (key == "SHARP")
    {
        Utils.Input.Buffer += "#";
    }
    else if (key == "{")
    {
        Utils.Input.Buffer += "\\{";
    }
    else if (key == "}")
    {
        Utils.Input.Buffer += "\\}";
    }
    else if (key == "UP" || key == "RIGHT" || key == "DOWN" || key == "MBTN_MID" || key == "WHEEL_UP" || key == "WHEEL_DOWN")
    {}
    else
    {
        Utils.Input.Buffer += key;
    }
    Utils.Input.OSD.data = Utils.Input.Prefix + Utils.Input.Buffer + "_";
    Utils.Input.OSD.update();
}

Utils.Input.show = function (callback, prefix) {

    if(callback == undefined)
    {
        return;
    }

    mp.commandv("set","pause","yes");

    if(prefix != undefined)
    {
        Utils.Input.InputPrefix = prefix;
    }
    else
    {
        Utils.Input.InputPrefix = "Input: ";
    }

    Utils.Input.InputPrefix = SSA.setBold(true) + Utils.Input.InputPrefix + Utils.Input.TextSettings + SSA.setBold(false);

    Utils.Input.Prefix = 
        SSA.setSize("24") + Utils.Input.TextSettings +
        "Press Enter to submit your Input. Press ESC to abort.\n" +
        SSA.setSize("24") + Utils.Input.TextSettings +
        "Press CTRL+V to paste.\n" +
        SSA.setSize("32") + Utils.Input.TextSettings;

    if(Utils.Input.isShown)
    {
        return;
    }
    Utils.Input.isShown = true;

    Utils.Input.Buffer = "";

    var tempFunction = function (x, key) {
        return function () {
            x.handleKeyPress(key);
        };
    };

    for (var i = 0; i < Utils.Input.keybindOverrides.length; i++) {
        var currentKey = Utils.Input.keybindOverrides[i];
        mp.add_forced_key_binding(
            currentKey.key,
            currentKey.id,
            tempFunction(this,currentKey.key),
            { repeatable: true }
        );
    }

    Utils.Input.OSD = mp.create_osd_overlay("ass-events");
    Utils.Input.OSD.res_y = mp.get_property("osd-height");
    Utils.Input.OSD.res_x = mp.get_property("osd-width");
    Utils.Input.OSD.z = 1000;

    Utils.Input.Prefix += Utils.Input.InputPrefix;
    Utils.Input.OSD.data = Utils.Input.Prefix + "_";
    Utils.Input.OSD.update();
    Utils.Input.Callback = callback;
}

Utils.Input.hide = function (success) {

    if(!Utils.Input.isShown)
    {
        return;
    }
    Utils.Input.isShown = false;

    for (var i = 0; i < Utils.Input.keybindOverrides.length; i++) {
        var currentKey = Utils.Input.keybindOverrides[i];
        mp.remove_key_binding(currentKey.id);
    }

    mp.commandv(
        "osd-overlay",
        Utils.Input.OSD.id,
        "none",
        "",
        0,
        0,
        0,
        "no",
        "no"
    );
    Utils.Input.OSD = undefined;
    Utils.Input.Callback(success,Utils.Input.Buffer.slice().replace(/\\/g,''));
    Utils.Input.Buffer = "";

    Utils.Input.InputPrefix = "";
    Utils.Input.Prefix = "";
}

Utils.OSDLog = {};
Utils.OSDLog.Buffer = "";
Utils.OSDLog.BufferCounter = 0;
Utils.OSDLog.show = function () {

    Utils.OSDLog.OSD = mp.create_osd_overlay("ass-events");
    Utils.OSDLog.OSD.res_y = mp.get_property("osd-height");
    Utils.OSDLog.OSD.res_x = mp.get_property("osd-width");
    Utils.OSDLog.OSD.z = 1;

    Utils.OSDLog.Timer = setInterval(function () {
        Utils.OSDLog.OSD.data = Utils.OSDLog.Buffer;
        Utils.OSDLog.OSD.update();
    }, 100);
    
}

Utils.OSDLog.addToBuffer = function (msg) {
    var color = "";
    if (msg.level == "debug")
    {
        color = SSA.setColorGray();
    }
    if (msg.level == "info")
    {
        color = SSA.setColorWhite();
    }
    if (msg.level == "warn")
    {
        color = SSA.setColorYellow();
    }
    if (msg.level == "error")
    {
        color = SSA.setColorRed();
    }
    if (Utils.OSDLog.BufferCounter > 150)
    {
        Utils.OSDLog.Buffer = Utils.OSDLog.Buffer.substring(0,15000)
        Utils.OSDLog.BufferCounter = 0;
    }
    if (msg.prefix != "osd/libass")
    {
        Utils.OSDLog.Buffer = SSA.setFont("Roboto") + SSA.setTransparency("3f") + color + SSA.setSize(16) + SSA.setBorder(0) + SSA.setBold(true) +
            "[" + msg.prefix + "] " + SSA.setBold(false) + msg.text + "\n" + Utils.OSDLog.Buffer;
    }
    Utils.OSDLog.BufferCounter++;
};

Utils.OSDLog.hide = function () {
    clearInterval(Utils.OSDLog.Timer);
    mp.commandv(
        "osd-overlay",
        Utils.OSDLog.OSD.id,
        "none",
        "",
        0,
        0,
        0,
        "no",
        "no"
    );
    Utils.OSDLog.OSD = undefined;
}

Utils.showInteractiveCommandInput = function () {
    var readCommand = function (success, result) {
        if (success) {
            mp.command(result);
            Utils.showAlert(
                "info",
                "Command executed!"
            );
        }
    };
    Utils.Input.show(readCommand,"Command: ");
}

/**
 * Reads, writes and modifies watch_later folder.
 */
Utils.WL = {};

Utils.WL.cache = [];

/**
 * Caches watch_later folder to memory. Limited to 999 entries.
 * Access cache with Utils.wlCache
 */
Utils.WL.createCache = function () {
    Utils.log("Building watch_later cache","startup","info");
    if (
        mp.utils.file_info(mp.utils.get_user_path("~~/watch_later/")) !=
        undefined
    ) {
        var wlFilesCache = mp.utils.readdir(
            mp.utils.get_user_path("~~/watch_later/"),
            "files"
        );
        for (var i = 0; i < wlFilesCache.length; i++) {
            if (i < 1000) {
                var file = {
                    name: wlFilesCache[i],
                    content: mp.utils.read_file(
                        mp.utils.get_user_path("~~/watch_later/") +
                            wlFilesCache[i]
                    ),
                };
                Utils.WL.cache.push(file);
            } else {
                break;
            }
        }
    }
};

/**
 * Fetches data of current file from previously cached watch_later data.
 * @return {object} {shader, color}
 */
Utils.WL.getData = function () {
    var cFile;
    for (var i = 0; i < Number(mp.get_property("playlist/count")); i++) {
        if (mp.get_property("playlist/" + i + "/current") == "yes") {
            cFile = mp.get_property("playlist/" + i + "/filename");
        }
    }
    cFile = Utils.md5(cFile).toUpperCase();
    var wlName;
    var wlContent;
    for (var i = 0; i < Utils.WL.cache.length; i++) {
        if (Utils.WL.cache[i].name == cFile) {
            wlName = Utils.WL.cache[i].name;
            wlContent = Utils.WL.cache[i].content;
        }
    }
    if (wlContent != undefined) {
        var WLtmp = wlContent.split("\n");
        var cShader;
        var cColor;
        for (var i = 0; i < WLtmp.length; i++) {
            var WLtmp2 = WLtmp[i].split("=");
            if (WLtmp2[0].includes("shader")) {
                cShader = WLtmp2[1];
            }
            if (WLtmp2[0].includes("color")) {
                cColor = WLtmp2[1];
            }
        }
        var results = { shader: cShader, color: cColor };
        return results;
    }
};

/**
 * This function finds the current videos wlFile and writes a shaderset and colorset to it.
 */
Utils.WL.writeData = function (shader, color) {
    var cFile;
    for (var i = 0; i < Number(mp.get_property("playlist/count")); i++) {
        if (mp.get_property("playlist/" + i + "/current") == "yes") {
            cFile = mp.get_property("playlist/" + i + "/filename");
        }
    }
    if (cFile != undefined) {
        var WLfile =
            mp.utils.get_user_path("~~/") +
            "/watch_later/" +
            Utils.md5(cFile).toUpperCase();

        if (mp.utils.file_info(WLfile) != undefined) {
            var WLtmp = mp.utils.read_file(WLfile);
            var WLtmp =
                WLtmp + "shader=" + shader + "\n" + "color=" + color + "\n";
            mp.utils.write_file("file://" + WLfile, WLtmp);
        }
    }
};

/**
 * Creates a dummy file in watch_later folder.
 */
Utils.WL.createDummy = function () {
    var folder = mp.utils.get_user_path("~~/watch_later");
    var name = "00000000000000000000000000000000";
    if (Utils.OSisWindows) {
        folder = folder.replaceAll("/", "\\");
        Utils.executeCommand(["copy", "nul", folder + "\\" + name, ">", "nul"]);
    } else {
        Utils.executeCommand(["touch", folder + "/" + name]);
    }
};

/**
 * Clears watch_later folder and creates a dummy file.
 */
Utils.WL.clear = function () {
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

// The entire section below is dedicated to implementing a fast MD5 hashing algorithm in native JS.
// It is copy-pasted from here: https://gist.github.com/jhoff/7680711 / http://www.myersdaily.org/joseph/javascript/md5-text.html
// There is no license for this, but the source site is ancient and has no mention of one, so i think this is fine.

// MD5 block starts //
var md5cycle = function (x, k) {
    var a = x[0],
        b = x[1],
        c = x[2],
        d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
};

var cmn = function (q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
};

var ff = function (a, b, c, d, x, s, t) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
};

var gg = function (a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
};

var hh = function (a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
};

var ii = function (a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
};

var add32 = function (a, b) {
    return (a + b) & 0xffffffff;
};

var md51 = function (s) {
    var txt = "";
    var n = s.length,
        state = [1732584193, -271733879, -1732584194, 271733878],
        i;
    for (var i = 64; i <= s.length; i += 64) {
        md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < s.length; i++)
        tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
    tail[i >> 2] |= 0x80 << (i % 4 << 3);
    if (i > 55) {
        md5cycle(state, tail);
        for (var i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
};

var md5blk = function (s) {
    var md5blks = [],
        i;
    for (var i = 0; i < 64; i += 4) {
        md5blks[i >> 2] =
            s.charCodeAt(i) +
            (s.charCodeAt(i + 1) << 8) +
            (s.charCodeAt(i + 2) << 16) +
            (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
};

var hex_chr = "0123456789abcdef".split("");

var rhex = function (n) {
    var s = "",
        j = 0;
    for (; j < 4; j++)
        s +=
            hex_chr[(n >> (j * 8 + 4)) & 0x0f] + hex_chr[(n >> (j * 8)) & 0x0f];
    return s;
};

var hex = function (x) {
    for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]);
    return x.join("");
};
// MD5 block ends //

/**
 * Calculates MD5 hash of given string.
 * @return {string} Hash
 */
Utils.md5 = function (s) {
    return hex(md51(s));
};

module.exports = Utils;
