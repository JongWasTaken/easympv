/*
 * SETTINGS.JS (MODULE)
 *
 * Author:					Jong
 * URL:						https://smto.pw/mpv
 * License:					MIT License
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

/////////////////////////////////////////// easympv.conf

/**
 * This object contains deserialized data from easympv.conf.
 * Call Settings.reload() to update it.
 */
Settings.Data = {
	mpvLocation: "unknown",
	defaultShaderSet: "none",
	defaultColorProfile: "none",
	startIPCServer: false,
	manualInstallation: false,
	notifyAboutUpdates: true,
	debugMode: false,
	currentVersion: "0.0.0",
	newestVersion: "0.0.1",
	doMigration: false,
	downloadDependencies: false,
	resetMpvConfig: false,
	resetInputConfig: false,
	firstTimeStartup: false,
}

/**
 * Same as Settings.reload().
 */
Settings.load = function () {
	Settings.reload();
}

/**
 * Deserializes easympv.conf and updates Settings.Data.
 */
Settings.reload = function () {
	if(mp.utils.file_info(mp.utils.get_user_path("~~/easympv.conf")) == undefined)
		return;
	var lines = mp.utils.read_file(
		mp.utils.get_user_path("~~/easympv.conf")
	).split('\n');
	
	for (var i = 0; i <= lines.length-1; i++) {
		if(lines[i].substring(0,1) != "#")
		{
			if(lines[i].includes('='))
			{
				var temp = lines[i].split('=');
				var option = temp[0].trim();
				var value = temp[1].trim().split('#')[0];

				if(value == "true")
				{
					value = true;
				}
				if(value == "false")
				{
					value = false;
				}
				Settings.Data[option] = value;

			}
		}
	}
}

/**
 * Serializes Settings.Data into easympv.conf.
*/
Settings.save = function () {
	this.DataCopy = "";
	var lines = [];

	if(mp.utils.file_info(mp.utils.get_user_path("~~/easympv.conf")) == undefined) {
		var defaultConfigString = "";
		
		defaultConfigString += "#!!v3\n";
		defaultConfigString += "### easympv.conf ###\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Location of mpv executable.\n";
		defaultConfigString += "# Default: none\n";
		defaultConfigString += "# Example: C:\\Users\\user\\Desktop\\mpv\n";
		defaultConfigString += "# Use a full path. Only required on Windows!\n";
		defaultConfigString += "mpvLocation=unknown\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Default shader set to load at runtime.\n";
		defaultConfigString += "# Default: none\n";
		defaultConfigString += "# Use the full name of a shader as it appears in the shader menu!\n";
		defaultConfigString += "defaultShaderSet=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Default color profile to load at runtime.\n";
		defaultConfigString += "# Default: none\n";
		defaultConfigString += "# Use the full name of a profile as it appears in the colors menu!\n";
		defaultConfigString += "defaultColorProfile=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Whether to start the mpv IPC server on startup.\n";
		defaultConfigString += "# Default: false\n";
		defaultConfigString += "# You should only enable this if you use external scripts such as remotes.\n";
		defaultConfigString += "# On Windows, a named pipe \"mpv\" will be created.\n";
		defaultConfigString += "# On Unix-likes a socket will be created: /tmp/mpv\n";
		defaultConfigString += "startIPCServer=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Whether this installation is manual or automatic.\n";
		defaultConfigString += "# If you installed easympv via the executable, this will be false.\n";
		defaultConfigString += "manualInstallation=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Whether to show alerts when out-of-date.\n";
		defaultConfigString += "# Default: true\n";
		defaultConfigString += "notifyAboutUpdates=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Will show more menu options. Useful for testing.\n";
		defaultConfigString += "# Default: false\n";
		defaultConfigString += "debugMode=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# ! Settings below are set automatically, though some might be of interest !\n";
		defaultConfigString += "\n";
		defaultConfigString += "# The currently installed version of easympv.\n";
		defaultConfigString += "# This is modified automatically and should not be changed!\n";
		defaultConfigString += "currentVersion=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# The newest known version of easympv.\n";
		defaultConfigString += "# If up-to-date, this value will be the same as currentVersion.\n";
		defaultConfigString += "# If the newest version is unknown, this value will be 0.0.0\n";
		defaultConfigString += "# This is modified automatically and should not be changed!\n";
		defaultConfigString += "newestVersion=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Whether to migrate this configuration on the next startup.\n";
		defaultConfigString += "# This means that the config will be regenerated while preserving your settings.\n";
		defaultConfigString += "# Usually false, unless you just updated, in which case it will be true.\n";
		defaultConfigString += "# This is modified automatically!\n";
		defaultConfigString += "doMigration=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Whether to download dependencies on the next startup.\n";
		defaultConfigString += "# Usually false. You may set this to true if you changed your operating system.\n";
		defaultConfigString += "# This is modified automatically!\n";
		defaultConfigString += "downloadDependencies=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Whether to reset the mpv.conf file to default values on the next startup.\n";
		defaultConfigString += "# Default: false.\n";
		defaultConfigString += "# This is NOT modified automatically, set this to true as troubleshooting!\n";
		defaultConfigString += "resetMpvConfig=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Whether to reset the input.conf file to default values on the next startup.\n";
		defaultConfigString += "# Default: false.\n";
		defaultConfigString += "# This is NOT modified automatically, set this to true as troubleshooting!\n";
		defaultConfigString += "resetInputConfig=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Whether to show the First Time configuration Wizard on the next startup.\n";
		defaultConfigString += "# Usually false, unless you just installed easympv.\n"; 
		defaultConfigString += "# Some updates might enable this too.\n";
		defaultConfigString += "# ! THIS WILL DISCARD YOUR CONFIGURATION !\n";
		defaultConfigString += "# This is modified automatically and should not be changed!\n";
		defaultConfigString += "firstTimeStartup=x\n";

		lines = defaultConfigString.split('\n');
	}
	else
	{
		lines = mp.utils.read_file(
			mp.utils.get_user_path("~~/easympv.conf")
		).split('\n');
	}

	for (var i = 0; i <= lines.length-1; i++) {
		if(lines[i].includes('=')) { try {
			//mp.msg.warn(lines[i]);
			var option = lines[i].split('=')[0].trim();
			var value = Settings.Data[option];
			//mp.msg.warn(option + "=" + value);
			lines[i] = option + "=" + value;
		} catch (x) { } }
		this.DataCopy = this.DataCopy + lines[i] + "\n";
	}
	this.DataCopy = this.DataCopy.replace(new RegExp("\\n$"), "");
	mp.utils.write_file(
		"file://" + mp.utils.get_user_path("~~/easympv.conf"),
		this.DataCopy
	);
}

Settings.migrate = function ()
{
	var copy = {};
	// read current settings into variable
	if(mp.utils.file_info(mp.utils.get_user_path("~~/easympv.conf")) != undefined)
	{
		var lines = mp.utils.read_file(
			mp.utils.get_user_path("~~/easympv.conf")
		).split('\n');
	
		for (var i = 0; i <= lines.length-1; i++) {
			if(lines[i].substring(0,1) != "#")
			{
				if(lines[i].includes('='))
				{
					var temp = lines[i].split('=');
					var option = temp[0].trim();
					var value = temp[1].trim().split('#')[0];
	
					if(value == "true")
					{
						value = true;
					}
					if(value == "false")
					{
						value = false;
					}
					copy[option] = value;
				}
			}
		}
	}

	// delete easympv.conf
	var file = "easympv.conf"
	if (Utils.OS == "win") {
		var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv.js/WindowsCompat.ps1").replaceAll("/", "\\"),"remove-file " + file];
	} else {
		var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv.js/LinuxCompat.sh")+" remove-file " + file];
	}
	mp.command_native({
		name: "subprocess",
		playback_only: false,
		capture_stdout: false,
		capture_stderr: false,
		args: args
	})

	// set options to backup
	for(var element in Settings.Data) 
	{
		mp.msg.warn("1 | " + element)
		if(copy[element] != undefined)
		{
			mp.msg.warn("2 | " + copy[element])
			mp.msg.warn("3 | " + Settings.Data[element])
			Settings.Data[element] = copy[element];
		}
	};

	Settings.Data.doMigration = false;

	Settings.save();
}

/////////////////////////////////////////// mpv.conf

/**
 * This object contains deserialized data from mpv.conf.
 * Call Settings.mpvConfig.reload() to update it.
 */
Settings.mpvConfig.Data = {
	placeholder: "unknown",
}

/**
 * Same as Settings.mpvConfig.reload().
 */
Settings.mpvConfig.load = function () {
	Settings.reload();
}

/**
 * Deserializes mpv.conf and updates Settings.mpvConfig.Data.
*/
Settings.mpvConfig.reload = function () {
}

/**
 * Serializes Settings.mpvConfig.Data into mpv.conf.
*/
Settings.mpvConfig.save = function () {
}

/////////////////////////////////////////// input.conf

/**
 * Resets input.conf to default values.
*/
Settings.inputConfig.reset = function () {

	// delete input.conf
	var file = "input.conf"
	if (Utils.OS == "win") {
		var args = ["powershell", "-executionpolicy", "bypass", mp.utils.get_user_path("~~/scripts/easympv.js/WindowsCompat.ps1").replaceAll("/", "\\"),"remove-file " + file];
	} else {
		var args = ["sh","-c",mp.utils.get_user_path("~~/scripts/easympv.js/LinuxCompat.sh")+" remove-file " + file];
	}
	mp.command_native({
		name: "subprocess",
		playback_only: false,
		capture_stdout: false,
		capture_stderr: false,
		args: args
	})

	var lines = [];
	var defaultConfigString = "";
	defaultConfigString += "### input.conf ###\n";
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
	defaultConfigString += "q quit-watch-later\n";
	defaultConfigString += "m script_binding easympv\n";
	defaultConfigString += "k script_binding menu-test\n";
	defaultConfigString += "i script-binding stats/display-stats-toggle\n";
	defaultConfigString += "a cycle-values video-aspect \"16:9\" \"4:3\" \"1024:429\"\n";
	defaultConfigString += "f cycle-values sub-scale \"0.8\" \"0.9\" \"1\" \"1.1\" \"1.2\"\n";
	defaultConfigString += "c script-binding open-config\n";
	defaultConfigString += "b script_binding toggle-sofa\n";
	defaultConfigString += "SPACE cycle pause\n";
	defaultConfigString += "o add sub-delay -0.1\n";
	defaultConfigString += "p add sub-delay +0.1\n";
	defaultConfigString += "d script-binding drpc_toggle\n";
	defaultConfigString += "x show-text \"${playlist}\"\n";
	defaultConfigString += "n seek 90\n";
	lines = defaultConfigString.split('\n');

	mp.utils.write_file(
		"file://" + mp.utils.get_user_path("~~/easympv.conf"),
		this.DataCopy
	);
}

module.exports = Settings;