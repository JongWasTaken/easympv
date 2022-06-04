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

/**
 * Collection of miscellaneous functions used throughout all of easympv.
 */
var Utils = {};

/**
 * undefined by default. After calling Utils.determineOS, this variable will be one of these values:
 * win, unix, mac, unknown
 */
Utils.OS = undefined;
Utils.OSisWindows = false;

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
Utils.determineOS = function() 
{
	if (mp.utils.getenv("OS") == "Windows_NT") {
		Utils.OS = "win";
		Utils.OSisWindows = true;
		Utils.directorySeperator = "\\";
		mp.msg.info("Detected operating system: Windows");
	} 
	else
	{
		var uname = mp.command_native({
			name: "subprocess",
			playback_only: false,
			capture_stdout: true,
			capture_stderr: false,
			args: ["sh","-c","uname -a"]
		})

		if(uname.status != "0")
		{
			Utils.OS = "unknown";
			mp.msg.warn("Detected operating system: unknown");
			mp.msg.error("Your OS is not supported.");
		}
		else
		{
			var output = uname.stdout.trim();
			if(output.includes("Darwin"))
			{
				Utils.OS = "macos";
				mp.msg.info("Detected operating system: macOS");
				mp.msg.error("macOS is currently not supported. Expect issues.");
			}
			else if(output.includes("Linux"))
			{
				Utils.OS = "linux";
				mp.msg.info("Detected operating system: Linux");
			}
			else
			{
				Utils.OS = "unix";
				mp.msg.info("Detected operating system: Unix-like");
			}

			mp.command_native({
				name: "subprocess",
				playback_only: false,
				capture_stdout: true,
				capture_stderr: false,
				args: ["sh","-c","chmod +x " + mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")]
			})
			/*
			mp.command_native({
				name: "subprocess",
				playback_only: false,
				capture_stdout: true,
				capture_stderr: false,
				args: ["sh","-c","chmod +x " + mp.utils.get_user_path("~~/scripts/easympv/yad")]
			})
			*/
		}
	}
}

Utils.pipeName = "mpv";

Utils.getLatestUpdateData = function()
{
	var callback = function (success, result, error)
	{
		if(result != undefined)
		{
			try {
				Utils.latestUpdateData = JSON.parse(result.stdout.trim());
				Settings.Data.newestVersion = Utils.latestUpdateData.version;
				Settings.save();
				Utils.updateAvailable = Utils.compareVersions(Settings.Data.currentVersion,Settings.Data.newestVersion);
				Utils.updateAvailableMpv = Utils.compareVersions(Utils.mpvVersion,Utils.mpvLatestVersion);
				Utils.setDisplayVersion();
				if(Settings.Data.downloadDependencies) {Utils.downloadDependencies();}
			}
			catch (dummy)
			{
				Utils.latestUpdateData = undefined;
			}
		}
		else
		{
			Utils.latestUpdateData = undefined;
		}
	}

	if (Utils.OSisWindows) {
		var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"get-version-latest"];
	} else {
		var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" get-version-latest"];
	}

	var r = mp.command_native_async({
		name: "subprocess",
		playback_only: false,
		capture_stdout: true,
		capture_stderr: false,
		args: args
	},callback)
}

Utils.setDisplayVersion = function ()
{
	Utils.displayVersion = SSA.setColorGreen() + Settings.Data.currentVersion
	Utils.displayVersionMpv = SSA.setColorGreen() + Utils.mpvVersion;
	if(Utils.updateAvailable)
	{
		Utils.displayVersion = SSA.setColorRed() + Settings.Data.currentVersion + " (" + Settings.Data.newestVersion + " available)";
	}
	if(Utils.updateAvailableMpv)
	{
		Utils.displayVersionMpv = SSA.setColorRed() + Utils.mpvVersion + " (" + Utils.mpvLatestVersion + " available)";
	}
}

/**
 * Opens mpv IPC server with the name mpv or /tmp/mpv on Linux systems.
 */
Utils.setIPCServer = function () 
{
	Utils.pipeName = "mpv";
	mp.msg.info("PipeName: mpv");
	if (Utils.OS != "win") {
		mp.set_property("input-ipc-server", "/tmp/" + Utils.pipeName); // sockets need a location
	} else {
		mp.set_property("input-ipc-server", Utils.pipeName); // named pipes exist in the limbo
	}
}

Utils.mpvVersion = mp.get_property("mpv-version").substring(4).split("-")[0];
Utils.mpvComparableVersion = Number(Utils.mpvVersion.substring(2));
Utils.ffmpegVersion = mp.get_property("ffmpeg-version");
Utils.libassVersion = mp.get_property("libass-version");

/**
 * Open file relative to config root. Can also run applications.
 */
Utils.openFile = function (file) 
{
	file = mp.utils.get_user_path("~~/") + "/" + file;
	file = file.replaceAll("//", "/");
	file = file.replaceAll('"+"', "/");
	if (Utils.OSisWindows) {
		file = file.replaceAll("/", "\\");
		mp.commandv("run", "cmd", "/c", "start " + file);
	} else if (Utils.OS == "unix") {
		mp.commandv("run", "sh", "-c", "xdg-open " + file);
	} else if (Utils.OS == "mac") {
		mp.commandv("run", "zsh", "-c", "open " + file);
	}
	mp.msg.info("Opening file: " + file);
};

/**
 * This function executes a given command string / argument string array and returns its stdout.
 * While this is very powerful, it might not be right approach for most problems.
 * @returns {string} stdout
 */
Utils.executeCommand = function(line)
{
	if (line == undefined)
	{
		line = ["echo","\"No line specified!\""];
	}

	var r = mp.command_native({
		name: "subprocess",
		playback_only: false,
		capture_stdout: true,
		args: line
	})
	if (r != undefined)
	{
		return r.stdout;
	}
	else
	{
		return "error";
	}
}

/**
 * Checks if the device can connect to the internet.
 * @returns {boolean} True if the device can connect to the internet
 */
Utils.checkInternetConnection = function()
{

	var callback = function(success, result, error)
	{
		if (result != undefined)
		{
			Utils.isOnline = Boolean(result.stdout.trim());
			if (!Settings.Data.manualInstallation) {
				mp.msg.verbose("Checking for updates...");
				Utils.getLatestUpdateData();
			}
		}
	}

	if (Utils.OSisWindows) {
		var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"get-connection-status"];
	} else {
		var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" get-connection-status"];
	}

	var r = mp.command_native_async({
		name: "subprocess",
		playback_only: false,
		capture_stdout: true,
		capture_stderr: false,
		args: args
	},callback)

}

/**
 * Fetches newest mpv version number.
 * @returns {string} version string
 */
 Utils.getLatestMpvVersion = function () 
 {
	var callback = function (success, result, error)
	{
		if (result != undefined)
		{
			Utils.mpvLatestVersion = r.stdout.trim();
		}
	}

	if (Utils.OSisWindows) {
		var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"get-version-latest-mpv"];
	} else {
		var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" get-version-latest-mpv"];
	}

	var r = mp.command_native_async({
		name: "subprocess",
		playback_only: false,
		capture_stdout: true,
		capture_stderr: false,
		args: args
	},callback)

}

/**
 * Exits mpv, but only if no update is currently in progress.
 */
Utils.exitMpv = function ()
{
	if (Utils.updateInProgress)
	{
		WindowSystem.Alerts.show("warning","An update is in progress.","","You cannot close mpv now!")
	}
	else
	{
		mp.commandv("quit-watch-later");
	}
}

/**
 * Finds and blocks all quit bindings. Used with updater.
 */
Utils.blockQuitButtons = function ()
{
	Utils.updateInProgress = true;
	var bindings = JSON.parse(mp.get_property("input-bindings"));
	var keysToBlock = [];
	Utils.idsToUnblock = [];
	for(i = 0; i < bindings.length; i++)
	{
		if(bindings[i].cmd.includes("quit-watch-later") || bindings[i].cmd.includes("quit"))
		{
			keysToBlock.push(bindings[i]);
		}
	}
	for(i = 0; i < keysToBlock.length; i++)
	{
		mp.add_forced_key_binding(keysToBlock[i].key,"prevent_close_" + i,Utils.exitMpv);
		Utils.idsToUnblock.push("prevent_close_" + i);
	}
}


/**
 * Removes previously blocked quit bindings. Used with updater.
 */
Utils.unblockQuitButtons = function ()
{
	Utils.updateInProgress = false;

	if(Utils.idsToUnblock.length == 0) {return;}

	// Unblock quit keys
	for(i = 0; i < Utils.idsToUnblock.length; i++)
	{
		mp.remove_key_binding(Utils.idsToUnblock[i]);
	}
}

/**
 * Stage 1 of the update chain. Downloads newest package.
 */
Utils.doUpdateStage1 = function () // download
{
	if (Utils.OSisWindows) {
		var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"get-package " + Utils.latestUpdateData.version];
	} else {
		var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" get-package " + Utils.latestUpdateData.version];
	}

	mp.command_native_async({
		name: "subprocess",
		playback_only: false,
		capture_stdout: false,
		capture_stderr: false,
		args: args
	},Utils.doUpdateStage2)
}

/**
 * Stage 2 of the update chain. Extracts downloaded package.
 */
Utils.doUpdateStage2 = function () // extract
{
	if(mp.utils.file_info(mp.utils.get_user_path("~~/package.zip")) != undefined)
	{
		if (Utils.OSisWindows) {
			var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"extract-package"];
		} else {
			var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" extract-package"];
		}
	
		mp.command_native_async({
			name: "subprocess",
			playback_only: false,
			capture_stdout: true,
			capture_stderr: false,
			args: args
		},Utils.doUpdateStage3)
	}
	else
	{
		Utils.unblockQuitButtons();
		WindowSystem.Alerts.show("error","Update has failed.","","Download error!");
		return;
	}
}

/**
 * Stage 3 of the update chain. Removes downloaded package.
 */
Utils.doUpdateStage3 = function () // delete package
{
	if(mp.utils.file_info(mp.utils.get_user_path("~~/package.zip")) != undefined && mp.utils.file_info(mp.utils.get_user_path("~~/easympv-"+Utils.latestUpdateData.version+"/")) != undefined)
	{
		if (Utils.OSisWindows) {
			var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"remove-package"];
		} else {
			var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" remove-package"];
		}
	
		mp.command_native_async({
			name: "subprocess",
			playback_only: false,
			capture_stdout: true,
			capture_stderr: false,
			args: args
		},Utils.doUpdateStage4)
	}
	else
	{
		Utils.unblockQuitButtons();
		WindowSystem.Alerts.show("error","Update has failed.","","Extraction error!");
		return;
	}
}

/**
 * Stage 4 of the update chain. Copies extracted files into place and deletes the temporary directory.
 */
Utils.doUpdateStage4 = function () // apply extracted package
{
	if(mp.utils.file_info(mp.utils.get_user_path("~~/package.zip")) == undefined)
	{
		
		if (Utils.OSisWindows) {
			var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"apply-package",Utils.latestUpdateData.version];
		} else {
			var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" apply-package " + Utils.latestUpdateData.version];
		}
	
		mp.command_native_async({
			name: "subprocess",
			playback_only: false,
			capture_stdout: true,
			capture_stderr: false,
			args: args
		},Utils.doUpdateStage5)
	}
	else
	{
		Utils.unblockQuitButtons();
		WindowSystem.Alerts.show("error","Update has failed.","","Deletion error!");
		return;
	}

}

/**
 * Stage 5 of the update chain. Removes all files in Utils.latestUpdateData.removeFiles and finishes the update.
 */
Utils.doUpdateStage5 = function()
{
	if(mp.utils.file_info(mp.utils.get_user_path("~~/extractedPackage")) == undefined)
	{
		if (Utils.latestUpdateData.removeFiles.length != 0)
		{
			var file = "";
			for (var i = 0; i < Utils.latestUpdateData.removeFiles.length; i++)
			{
				file = Utils.latestUpdateData.removeFiles[i];
	
				if (Utils.OSisWindows) {
					var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"remove-file " + file];
				} else {
					var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" remove-file " + file];
				}
			
				mp.command_native_async({
					name: "subprocess",
					playback_only: false,
					capture_stdout: false,
					capture_stderr: false,
					args: args
				})
			}
		}

		if (Utils.latestUpdateData.enableSettings.length != 0)
		{
			// set specified settings
			for (var i = 0; i < Utils.latestUpdateData.enableSettings.length; i++)
			{
				Settings.Data[Utils.latestUpdateData.enableSettings[i]] = true;
			}
		}
		// update version
		Settings.Data.currentVersion = Utils.latestUpdateData.version;

		// save to file
		Settings.save();

		// done
		Utils.unblockQuitButtons();
		WindowSystem.Alerts.show("info","Finished updating!","","Restart mpv to see changes.");
		Utils.updateAvailable = false;
		
	}
	else
	{
		Utils.unblockQuitButtons();
		WindowSystem.Alerts.show("error","Update has failed.","","Apply error!");
		return;
	}
}

/**
 * Updates easympv. Blocks quitting the application.
 */
Utils.doUpdate = function ()
{

	if(Utils.latestUpdateData == undefined)
	{
		return "Not connected to the internet!";
	}

	Utils.blockQuitButtons();
	Utils.doUpdateStage1();

	return "";
}

/**
 * Updates mpv on Windows only.
 */
Utils.updateMpv = function ()
{
	if(Utils.OSisWindows)
	{
		if(Settings.Data.mpvLocation != "unknown")
		{
			if(Utils.updateAvailableMpv)
			{
				var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"update-mpv", Settings.Data.mpvLocation];
				mp.command_native_async({
					name: "subprocess",
					playback_only: false,
					capture_stdout: true,
					capture_stderr: false,
					args: args
				})
			}
			else
			{
				WindowSystem.Alerts.show("info","mpv is up to date.","","");
			}
		}
		else
		{
			WindowSystem.Alerts.show("error","mpv location is unknown.","","Please update easympv.conf!");
		}
		}
	else
	{
		WindowSystem.Alerts.show("error","Only supported on Windows.","","");
	}
	return;
}

Utils.downloadDependencies = function()
{
	var dependencies = undefined;
	var installList = undefined;

	if (Utils.OSisWindows) {
		var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"get-dependencies"];
	} else {
		var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" get-dependencies"];
	}

	var r = mp.command_native({
		name: "subprocess",
		playback_only: false,
		capture_stdout: true,
		capture_stderr: false,
		args: args
	})

	if(r.stdout != undefined)
	{
		
		dependencies = JSON.parse(r.stdout.trim());
	}

	if(dependencies == undefined)
		return;
	
	if(Utils.OSisWindows)
	{
		installList = dependencies.windows;
	}
	if(Utils.OS == "unix")
	{
		installList = dependencies.linux;
	}
	if(Utils.OS == "mac")
	{
		installList = dependencies.macos;
	}

	for(var i = 0; i < dependencies.windows.length; i++)
	{
		if(Utils.OSisWindows)
		{
			var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"remove-file-generic",
			dependencies.windows[i].location.replaceAll("@mpvdir@",Settings.Data.mpvLocation)];
			mp.command_native({
				name: "subprocess",
				playback_only: false,
				capture_stdout: true,
				capture_stderr: false,
				args: args
			})
		} else {
			if(!dependencies.windows[i].location.includes("@mpvdir@"))
			{
				var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" remove-file " + dependencies.linux[i].location];
				mp.command_native({
					name: "subprocess",
					playback_only: false,
					capture_stdout: true,
					capture_stderr: false,
					args: args
				})
			}
		}

		
	}

	for(var i = 0; i < dependencies.linux.length; i++)
	{
		if (Utils.OSisWindows) {
			var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"remove-file",dependencies.linux[i].location];
		} else {
			var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" remove-file " + dependencies.linux[i].location];
		}
	
		var r = mp.command_native({
			name: "subprocess",
			playback_only: false,
			capture_stdout: true,
			capture_stderr: false,
			args: args
		})
	}

	for(var i = 0; i < dependencies.macos.length; i++)
	{
		if (Utils.OSisWindows) {
			var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"remove-file",dependencies.macos[i].location];
		} else {
			var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" remove-file " + dependencies.macos[i].location];
		}
	
		var r = mp.command_native({
			name: "subprocess",
			playback_only: false,
			capture_stdout: true,
			capture_stderr: false,
			args: args
		})
	}

	for(var i = 0; i < installList.length; i++)
	{
		if (Utils.OSisWindows) {
			var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"download-dependency",installList[i].url,installList[i].location.replaceAll("@mpvdir@",Settings.Data.mpvLocation)];
		} else {
			var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv/LinuxCompat.sh")+" download-dependency " + installList[i].url + " " + installList[i].location];
		}
	
		var r = mp.command_native({
			name: "subprocess",
			playback_only: false,
			capture_stdout: true,
			capture_stderr: false,
			args: args
		})
	}

	Settings.Data.downloadDependencies = false;
	Settings.save();

}

/**
 * Registers mpv on Windows only.
 */
Utils.registerMpv = function ()
{

	var onFinished = function ()
	{
		WindowSystem.Alerts.show("info","Successfully registered mpv!","Do not close any windows that have"," opened. They will close themselves.");
	}

	 if(Utils.OSisWindows)
	 {
		 if(Settings.Data.mpvLocation != "unknown")
		 {
			var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"elevate", Settings.Data.mpvLocation + "\\installer\\mpv-install.bat"];
			mp.command_native_async({
				name: "subprocess",
				playback_only: false,
				capture_stdout: true,
				capture_stderr: false,
				args: args
			},onFinished)
		 }
		 else
		 {
			 WindowSystem.Alerts.show("error","mpv location is unknown.","","Please update easympv.conf!");
		 }
	}
	else
	{
		WindowSystem.Alerts.show("error","Only supported on Windows.","","");
	}
	return;
}

/**
 * Unregisters mpv on Windows only.
 */
 Utils.unregisterMpv = function ()
 {
 
	 var onFinished = function ()
	 {
		 WindowSystem.Alerts.show("info","Successfully unregistered mpv!","Do not close any windows that have"," opened. They will close themselves.");
	 }
 
	  if(Utils.OSisWindows)
	  {
		  if(Settings.Data.mpvLocation != "unknown")
		  {
			 var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv/WindowsCompat.ps1").replaceAll("/", "\\"),"elevate", Settings.Data.mpvLocation + "\\installer\\mpv-uninstall.bat"];
			 mp.command_native_async({
				 name: "subprocess",
				 playback_only: false,
				 capture_stdout: true,
				 capture_stderr: false,
				 args: args
			 },onFinished)
		  }
		  else
		  {
			  WindowSystem.Alerts.show("error","mpv location is unknown.","","Please update easympv.conf!");
		  }
	 }
	 else
	 {
		 WindowSystem.Alerts.show("error","Only supported on Windows.","","");
	 }
	 return;
 }

/**
 * Compares two version strings.
 * @return {boolean} True if currentVersion is lower than newestVersion
 */
Utils.compareVersions = function (currentVersion,newestVersion)
{
	return Number(currentVersion.replace(/\./g,"")) < Number(newestVersion.replaceAll(/\./g,""));
}

/**
 * Reads and returns content of Credits file.
 * @return {string} credits 
 */
Utils.getCredits = function ()
{
	if(mp.utils.file_info(mp.utils.get_user_path("~~/easympv.conf")) == undefined)
		return;
	return mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Credits.txt"));
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
Utils.WL.populateCache = function () {
	if (
		mp.utils.file_info(mp.utils.get_user_path("~~/watch_later/")) !=
		undefined
	) {
		var wlFilesCache = mp.utils.readdir(
			mp.utils.get_user_path("~~/watch_later/"),
			"files"
		);
		for (i = 0; i < wlFilesCache.length; i++) {
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
 * @return {object} shader, color
 */
Utils.WL.getData = function () {
	var cFile;
	for (i = 0; i < Number(mp.get_property("playlist/count")); i++) {
		if (mp.get_property("playlist/" + i + "/current") == "yes") {
			cFile = mp.get_property("playlist/" + i + "/filename");
		}
	}
	cFile = Utils.md5(cFile).toUpperCase();
	var wlName;
	var wlContent;
	for (i = 0; i < Utils.WL.cache.length; i++) {
		if (Utils.WL.cache[i].name == cFile) {
			wlName = Utils.WL.cache[i].name;
			wlContent = Utils.WL.cache[i].content;
		}
	}
	if (wlContent != undefined) {
		var WLtmp = wlContent.split("\n");
		var cShader;
		var cColor;
		for (i = 0; i < WLtmp.length; i++) {
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
	for (i = 0; i < Number(mp.get_property("playlist/count")); i++) {
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
Utils.WL.createDummy = function ()
{
	var folder = mp.utils.get_user_path("~~/watch_later");
	var name = "00000000000000000000000000000000";
	if(Utils.OSisWindows)
	{
		folder = folder.replaceAll("/", "\\");
		Utils.executeCommand(["copy","nul",folder+"\\"+ name,">","nul"]);
	}
	else
	{
		Utils.executeCommand(["touch",folder + "/" + name])
	}
}

/**
 * Clears watch_later folder and creates a dummy file.
 */
Utils.WL.clear = function () {
	mp.msg.info("Clearing watchdata");
	var folder = mp.utils.get_user_path("~~/watch_later");
	if (Utils.OSisWindows) {
		folder = folder.replaceAll("/", "\\");
		Utils.executeCommand(["del","/Q","/S",folder]);
		Utils.executeCommand(["mkdir",folder]);
		Utils.WL.createDummy();
	} else if (Utils.OS == "mac") {
		mp.msg.info("macOS is not supported.");
	} else if (Utils.OS == "unix") {
		Utils.executeCommand(["rm","-rf",folder]);
		Utils.executeCommand(["mkdir",folder]);
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
	for (i = 64; i <= s.length; i += 64) {
		md5cycle(state, md5blk(s.substring(i - 64, i)));
	}
	s = s.substring(i - 64);
	var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	for (i = 0; i < s.length; i++)
		tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
	tail[i >> 2] |= 0x80 << (i % 4 << 3);
	if (i > 55) {
		md5cycle(state, tail);
		for (i = 0; i < 16; i++) tail[i] = 0;
	}
	tail[14] = n * 8;
	md5cycle(state, tail);
	return state;
};

var md5blk = function (s) {
	var md5blks = [],
		i;
	for (i = 0; i < 64; i += 4) {
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