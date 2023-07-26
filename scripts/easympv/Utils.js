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
don't really fit anywhere else.
----------------------------------------------------------------*/

// TODO: move some of this into OS.js

/**
 * Collection of miscellaneous functions used throughout all of easympv.
 */
var Utils = {};

Utils.commonFontName = "Overpass"; //"Overpass SemiBold";

Utils.updateInProgress = false;
Utils.isOnline = false;
Utils.latestUpdateData = undefined;

Utils.updateAvailable = false;
Utils.updateAvailableMpv = false;

Utils.mpvLatestVersion = "0.0.0";
Utils.displayVersion = "";
Utils.displayVersionMpv = "";

Utils.pipeName = "mpv";

Utils.naturalCompare = function(a, b) {
	var i, codeA
	, codeB = 1
	, posA = 0
	, posB = 0
	, alphabet = String.alphabet

	function getCode(str, pos, code) {
		if (code) {
			for (i = pos; code = getCode(str, i), code < 76 && code > 65;) ++i;
			return +str.slice(pos - 1, i)
		}
		code = alphabet && alphabet.indexOf(str.charAt(pos))
		return code > -1 ? code + 76 : ((code = str.charCodeAt(pos) || 0), code < 45 || code > 127) ? code
			: code < 46 ? 65               // -
			: code < 48 ? code - 1
			: code < 58 ? code + 18        // 0-9
			: code < 65 ? code - 11
			: code < 91 ? code + 11        // A-Z
			: code < 97 ? code - 37
			: code < 123 ? code + 5        // a-z
			: code - 63
	}


	if ((a+="") != (b+="")) for (;codeB;) {
		codeA = getCode(a, posA++)
		codeB = getCode(b, posB++)

		if (codeA < 76 && codeB < 76 && codeA > 66 && codeB > 66) {
			codeA = getCode(a, posA, posA)
			codeB = getCode(b, posB, posA = i)
			posB = i
		}

		if (codeA != codeB) return (codeA < codeB) ? -1 : 1
	}
	return 0
}

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
    }

    if(!OS.getConnectionStatus())
    {
        callback(undefined,"",undefined);
        return;
    }

    OS.versionGetLatestAsync(callback);
};

Utils.setDisplayVersion = function () {
    Utils.displayVersion = UI.SSA.setColorGreen() + Core.fancyCurrentVersion;
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
    if (OS.isWindows) {
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
Utils.showSystemMessagebox = function (text, async) {

    if(async == undefined) { async = false; }

    if(!OS.isWindows)
    {
        var isTerminal = (mp.utils.getenv("TERM") != undefined);
        if(isTerminal) {Utils.log(text,"messagebox","info"); return;}
    }

    OS.showMessage(text,async);
};

/**
 * X.
 */
 Utils.showAlert = function (type,text) {
    if (Settings.Data.useNativeNotifications)
    {
        var worked = OS.showNotification(text.replace(/\{(.+?)\}/g,'').replace(/@br@/g,'\\n'));

        if(!worked)
        {
            UI.Alerts.show(type,text);
        }
    }
    else
    {
        //Windows.Alerts.show(type,text);
        UI.Alerts.show(type,text);
    }

    if (type == "warning")
    {
        type = "warn";
    }
    Utils.log(text,"alert",type);
};

/**
 * Fetches newest mpv version number.
 */
Utils.getLatestMpvVersion = function () {
    if(!OS.getConnectionStatus())
    {
        return;
    }
    OS.versionGetLatestmpvAsync(function (success, result, error) {
        Utils.mpvLatestVersion = result.stdout.trim();
    });
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
    OS.packageGetAsync(Utils.latestUpdateData.version,Utils.doUpdateStage2)
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
        OS.packageExtractAsync(Utils.doUpdateStage3);
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
        OS.packageRemoveAsync(Utils.doUpdateStage4);
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
        OS.packageApplyAsync(Utils.latestUpdateData.version,Utils.doUpdateStage5)
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
            for (
                var i = 0;
                i < Utils.latestUpdateData.removeFiles.length;
                i++
            ) {
                OS.fileRemove(Utils.latestUpdateData.removeFiles[i]);
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
        if(OS.gitAvailable)
        {
            OS.gitUpdate(Utils.doUpdateStage5());
        }

    }
    return "";
};

/**
 * Updates mpv on Windows only.
 */
Utils.updateMpv = function () {
    if (OS.isWindows) {
        if (Settings.Data.mpvLocation != "unknown") {
            if (Utils.updateAvailableMpv) {
                OS.updateMpvWindows(Settings.Data.mpvLocation);
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

    if (OS.isWindows)
    {
        mpvLocation = mpvLocation + "mpv.exe"
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
            !OS.isWindows &&
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
    mp.msg.warn(mpvLocation);
    mp.msg.warn(cFile);
    mp.commandv("run",mpvLocation,cFile);
    Utils.log("!!! mpv will be restarted !!!","restart","warn")
    Utils.log("!!! Any custom options have not been passed to the new mpv instance, please restart manually if neccessary !!!","restart","warn")
    mp.commandv("quit-watch-later");
}

Utils.printCallStack = function(name) {
    var ename = "";
    if (name != undefined)
    {
        ename = name;
    }
    var e = new Error(ename);
    e.name = "Utils.printCallStack"
    dump(e.stack);
}

Utils.getCurrentTime = function()
{
    var time = new Date().toLocaleTimeString("de-DE-u-nu-latn-ca-iso8601-hc-h24"); // hopefully this is consistent
    var offset = time.split("+")[1].slice(0,2);
    time = time.split(" ")[0].slice(0,5);
    var temp = time.split(":");
    var hour = Number(temp[0]) + Number(offset);
    hour = hour.toString();

    if (hour == "24")
    {
        hour = "00";
    }

    if (hour.length == 1)
    {
        hour = "0" + hour;
    }

    time = hour + ":" + temp[1];
    return time;
}

module.exports = Utils;
