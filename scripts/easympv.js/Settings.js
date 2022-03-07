/*
 * SETTINGS.JS (MODULE)
 *
 * Author:					Jong
 * URL:						https://smto.pw/mpv
 * License:					MIT License
 */

"use strict";

var Settings = require = {};

Settings.Data = {
	defaultShaderSet: "none",
	defaultColorProfile: "none",
	useRandomPipeName: true,
	manualInstallation: false,
	notifyAboutUpdates: true,
	debugMode: false,
	currentVersion: "1.8.0",
	newestVersion: "1.8.0",
}

Settings.load = function () {
	Settings.reload();
}

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

Settings.save = function () {
	this.DataCopy = "";
	var lines = [];

	if(mp.utils.file_info(mp.utils.get_user_path("~~/easympv.conf")) == undefined) {
		var defaultConfigString = "";
		
		defaultConfigString += "#!!v3\n";
		defaultConfigString += "### easympv.conf, regenerated ###\n";
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
		defaultConfigString += "# Wether to obscure the pipe name for slightly more security\n";
		defaultConfigString += "# Default: true\n";
		defaultConfigString += "# You should disable this if you use external scripts such as remotes, the pipename will be mpv.\n";
		defaultConfigString += "useRandomPipeName=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Wether this installation is manual or automatic.\n";
		defaultConfigString += "# If you installed easympv via the executable, this will be false.\n";
		defaultConfigString += "manualInstallation=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Wether to show alerts when out-of-date.\n";
		defaultConfigString += "# Default: true\n";
		defaultConfigString += "notifyAboutUpdates=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# Will show more menu options. Useful for testing.\n";
		defaultConfigString += "# Default: false\n";
		defaultConfigString += "debugMode=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# The currently installed version of easympv.\n";
		defaultConfigString += "# This is modified automatically and should not be changed!\n";
		defaultConfigString += "currentVersion=x\n";
		defaultConfigString += "\n";
		defaultConfigString += "# The newest known version of easympv.\n";
		defaultConfigString += "# If up-to-date, this value will be the same as currentVersion.\n";
		defaultConfigString += "# This is modified automatically and should not be changed!\n";
		defaultConfigString += "newestVersion=x\n";

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

	mp.utils.write_file(
		"file://" + mp.utils.get_user_path("~~/easympv.conf"),
		this.DataCopy
	);
}

module.exports = Settings;