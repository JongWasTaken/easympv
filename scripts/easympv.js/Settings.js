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
	currentVersion: "unknown",
	newestVersion: "0.0.1",
}

Settings.update = function () {
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

module.exports = Settings;