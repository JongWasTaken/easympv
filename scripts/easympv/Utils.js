/*
 * UTILS.JS (PART OF EASYMPV)
 *
 * Author:                  Jong
 * URL:                     https://github.com/JongWasTaken/easympv
 * License:                 MIT License
 */

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
                if(Utils.latestUpdateData.testedAgainst == undefined) {
                    Utils.latestUpdateData.testedAgainst = "0.36.0";
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
        mpv.setProperty("input-ipc-server", Utils.pipeName); // named pipes exist in the limbo
    } else {
        mpv.setProperty("input-ipc-server", "/tmp/" + Utils.pipeName); // sockets need a location
    }
};

Utils.mpvVersion = mpv.getProperty("mpv-version").substring(4).split("-")[0];
Utils.mpvComparableVersion = Number(Utils.mpvVersion.substring(2));
Utils.ffmpegVersion = mpv.getProperty("ffmpeg-version");
Utils.libassVersion = mpv.getProperty("libass-version");


/**
 * X.
 */
Utils.log = function (text, _, level) {
    var msg = "";
    //if (subject != undefined)
    //{
    //    msg += "[" + subject + "] "
    //}

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
        var isTerminal = (mpv.getEnv("TERM") != undefined);
        if(isTerminal) {Utils.log(text,"messagebox","info"); return;}
    }

    OS.showMessage(text,async);
};

/**
 * Fetches newest mpv version number.
 */
Utils.getLatestMpvVersion = function () {
    if(Utils.latestUpdateData.testedAgainst != undefined)
    {
        Utils.mpvLatestVersion = Utils.latestUpdateData.testedAgainst;
    }
};

/**
 * Exits mpv, but only if no update is currently in progress.
 */
Utils.exitMpv = function () {
    if (Utils.updateInProgress) {
        UI.Alerts.push(Settings.getLocalizedString("alerts.updateinprogress"), Utils.updateChainAlertCategory, UI.Alerts.Urgencies.Warning);
    } else {
        mpv.commandv("quit-watch-later");
    }
};

/**
 * Finds and blocks all quit bindings. Used with updater.
 */
Utils.blockQuitButtons = function () {
    Utils.updateInProgress = true;
    var bindings = JSON.parse(mpv.getProperty("input-bindings"));
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

Utils.updateChainAlertCategory = "Update Chain";

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
    if (mpv.fileExists(mpv.getUserPath("~~/package.zip"))) {
        OS.packageExtractAsync(Utils.doUpdateStage3);
    } else {
        Utils.unblockQuitButtons();
        UI.Alerts.push(Settings.getLocalizedString("alerts.updatefailed"), Utils.updateChainAlertCategory, UI.Alerts.Urgencies.Error);
        return;
    }
};

/**
 * Stage 3 of the update chain. Removes downloaded package.
 */
Utils.doUpdateStage3 = function () // delete package
{
    if (
        mpv.fileExists(mpv.getUserPath("~~/package.zip")) &&
        mpv.fileExists(mpv.getUserPath("~~/easympv-" + Utils.latestUpdateData.version + "/"))
    ) {
        OS.packageRemoveAsync(Utils.doUpdateStage4);
    } else {
        Utils.unblockQuitButtons();
        UI.Alerts.push(Settings.getLocalizedString("alerts.updatefailed.extracterror"), Utils.updateChainAlertCategory, UI.Alerts.Urgencies.Error);
        return;
    }
};

/**
 * Stage 4 of the update chain. Copies extracted files into place and deletes the temporary directory.
 */
Utils.doUpdateStage4 = function () // apply extracted package
{
    if (
        !mpv.fileExists(mpv.getUserPath("~~/package.zip"))
    ) {
        OS.packageApplyAsync(Utils.latestUpdateData.version,Utils.doUpdateStage5)
    } else {
        Utils.unblockQuitButtons();
        UI.Alerts.push(Settings.getLocalizedString("alerts.updatefailed.deleteerror"), Utils.updateChainAlertCategory, UI.Alerts.Urgencies.Error);
        return;
    }
};

/**
 * Stage 5 of the update chain. Removes all files in Utils.latestUpdateData.removeFiles and finishes the update.
 */
Utils.doUpdateStage5 = function () {
    if (
        !mpv.fileExists(mpv.getUserPath("~~/extractedPackage"))
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
        UI.Alerts.push(Settings.getLocalizedString("alerts.updatefinished"), Utils.updateChainAlertCategory, UI.Alerts.Urgencies.Normal);

        Utils.updateAvailable = false;
    } else {
        Utils.unblockQuitButtons();
        UI.Alerts.push(Settings.getLocalizedString("alerts.updatefailed.applyerror"), Utils.updateChainAlertCategory, UI.Alerts.Urgencies.Error);
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

    if (!mpv.fileExists(mpv.getUserPath("~~/.git/")))
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
                UI.Alerts.push(Settings.getLocalizedString("alerts.uptodate"), undefined, UI.Alerts.Urgencies.Normal);
            }
        } else {
            UI.Alerts.push(Settings.getLocalizedString("alerts.locationunknown"), undefined, UI.Alerts.Urgencies.Error);
        }
    } else {
        UI.Alerts.push(Settings.getLocalizedString("alerts.onlyonwindows"), undefined, UI.Alerts.Urgencies.Normal);
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
    if (!mpv.fileExists(mpv.getUserPath("~~/easympv.conf")))
        return;
    return mpv.readFile(
        mpv.getUserPath("~~/scripts/easympv/Credits.txt")
    );
};

Utils.getFileName = function (path) {
    var pathParts = path.split(OS.directorySeperator);
    return pathParts[pathParts.length - 1];
};

Utils.removeFileExtension = function (filename) {
    var temp = Utils.getFileName(filename).split(".");
    temp.pop();
    return temp.join(".");
};

Utils.getParentDirectory = function (workDir) {
    var newDir = "";
    if (workDir.charAt(workDir.length - 1) == OS.directorySeperator) {
        workDir = workDir.substring(0, workDir.length - 1);
    }
    var workDirTree = workDir.split(OS.directorySeperator);

    if (!OS.isWindows && workDirTree.length < 3) {
        workDirTree[0] = "/";
    }

    for (var i = 0; i < workDirTree.length - 1; i++) {
        if (i == 0) {
            newDir = workDirTree[0];
        } else {
            newDir = newDir + OS.directorySeperator + workDirTree[i];
        }
    }

    if (newDir.charAt(newDir.length - 1) == ":") {
        newDir += OS.directorySeperator;
    }

    return newDir;
};

Utils.restartMpv = function (targetFile, exitCurrentInstance) {

    if (exitCurrentInstance == undefined) exitCurrentInstance = true;

    var proper = OS.getProcessArguments();
    var mpvLocation = "/usr/bin/mpv";

    if (proper != undefined) {
        mpvLocation = proper.splice(0, 1)[0];
    }
    else {
        if (Settings.Data.mpvLocation != "unknown")
        {
            mpvLocation = Settings.Data.mpvLocation;
        }

        if (!mpv.fileExists(mpvLocation))
        {
            Utils.log("mpv location is unknown! mpv will now terminate!","restart","info");
            mpv.commandv("quit-watch-later");
        }

        if (OS.isWindows)
        {
            mpvLocation = mpvLocation + "mpv.exe"
            mpvLocation = mpvLocation.replaceAll("/", "\\");
        }
    }

    var cFile = mpv.getProperty("playlist/0/filename");

    for (var i = 0; i < Number(mpv.getProperty("playlist/count")); i++) {
        if (mpv.getProperty("playlist/" + i + "/current") == "yes") {
            cFile = mpv.getProperty("playlist/" + i + "/filename");
            break;
        }
    }

    // cFile could be a relative path, so we need to expand it
    if (cFile != undefined) {
        if (
            !OS.isWindows &&
            mpv.fileExists(
                mpv.getProperty("working-directory") + "/" + cFile
            )
        ) {
            cFile =
                mpv.getProperty("working-directory") +
                "/" +
                cFile.replaceAll("./", "");
        }
    }
    else
    {
        cFile = "--player-operation-mode=pseudo-gui";
    }

    var args = [];
    args.push("run");
    args.push(mpvLocation);
    for (var i = 0; i < proper.length; i++) {
        args.push(proper[i]);
    }
    if (targetFile != undefined) {
        args.push(targetFile);
    } else args.push(cFile);

    mpv.commandv.apply(undefined, args);
    if(exitCurrentInstance) {
        mpv.printWarn("!!! mpv will be restarted !!!");
        mpv.printWarn("!!! Custom options may not have been passed to the new mpv instance, please restart manually if neccessary !!!");
        mpv.commandv("quit-watch-later");
    }
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
    var hour = Number(temp[0]);

    if (Settings.Data.daylightSavingTime)
    {
        hour = hour + Number(offset);
    }

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