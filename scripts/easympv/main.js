/*
 * EASYMPV.JS (main.js)
 *
 * Author:              Jong
 * URL:                 https://smto.pw/mpv
 * License:             MIT License
 */

/*
Useful links:
	LUA documentation, most functions are the same in javascript:
		https://github.com/mpv-player/mpv/blob/master/DOCS/man/lua.rst
	JavaScript documentation, for the few odd ones out:
		https://github.com/mpv-player/mpv/blob/master/DOCS/man/javascript.rst
	input.conf documentation, for commands, properties, events and other tidbits
		https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst
		https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst#property-list

Important good-to-knows:
	mpv uses MuJS, which is ES5 compliant, but not ES6!
		Most IE polyfills will probably work.
	Windows is more picky with font names, in case of issues:
		Open the .ttf file of your font and use the value of "Font name:" at the top.

Snippets:
	How to check for a file
		mp.utils.file_info(mp.utils.get_user_path("~~/FOLDER/FILE")) != undefined

Current dependencies:
	mpv 33+
	Windows only:
		PowerShell
		.NET Framework 4
	Linux only:
		GNU coreutils
		either wget or curl
		zenity

TODO :
	(DONE) Remake settings menu (with save/load)
	(DONE) Folder navigation from current directory
	(DONE) Utility: DirectShow readout to stdout 
	(DONE) Utility: return version in stdout on check
	(DONE) UpdateMenu: display changelog
	(DONE) MenuSystem: scrolling
	(DONE) Implement Updater
	(DONE) Windows (un)registration
	(DONE) Change command_native -> command_native_async to speed up launch times
	(DONE) Migrate Config on update
	(DONE) Implement version comparison for base mpv
	(DONE) Dependency downloader
	(DONE) Replace placeholder titles
	(DONE) Fix input.conf if needed -> Settings.inputConfig.reset(), Settings.Data.resetInputConfig
	First time configuration wizard -> A bunch of menus basically, new module would be nice
	Finish Settings.mpvSettings.*
	Advanced settings menu
	(ALWAYS ONGOING) Update comments/documentation
	(ALWAYS ONGOING) Move away from the util as much as possible

IDEAS:
	Advanced settings, like the utility had before
		BONUS IDEA: use PWSH on windows/zenity on linux for this
	FFI.js -> easympv-ffi.lua

KNOWN ISSUES:
	none?

UNNAMED LIST OF "things to test on Windows specifically":
	(WORKS) Utils.showSystemAlert -> Powershell implementation of 'alert'
	(WORKS) ImageOSD -> get image dimensions using powershell
	Browsers.DeviceBrowser.menuEventHandler -> low latency profile
*/
"use strict";

// Polyfills and extensions first
String.prototype.includes = function (search, start) {
	if (typeof start !== "number") {
		start = 0;
	}
	if (start + search.length > this.length) {
		return false;
	} else {
		return this.indexOf(search, start) !== -1;
	}
};

String.prototype.replaceAll = function (str, newStr) {
	if (
		Object.prototype.toString.call(str).toLowerCase() === "[object regexp]"
	) {
		return this.replace(str, newStr);
	}
	return this.replace(new RegExp(str, "g"), newStr);
};

String.prototype.trim = function () {
	return this.replace(/(?:^\s+|\s+$)/g, "");
};

String.prototype.trimStart = function () {
	return this.replace(/^\s+/, "");
};

String.prototype.trimEnd = function () {
	return this.replace(/\s+$/, "");
};

String.prototype.insertAt = function (index, string) {
	return this.substring(0, index) + string + this.substring(index);
};

Number.prototype.isOdd = function () {
	return this % 2 == 1;
};

Math.percentage = function (partialValue, totalValue) {
	return Math.round((100 * partialValue) / totalValue);
};

mp.msg.verbose("Starting!");
var Settings = require("./Settings");
var Utils = require("./Utils");
var SSA = require("./SSAHelper");
var ImageOSD = require("./ImageOSD");
var Shaders = require("./Shaders");
var Colors = require("./Colors");
var Chapters = require("./Chapters");
var MenuSystem = require("./MenuSystem");
var WindowSystem = require("./WindowSystem");
var Browsers = require("./Browsers");
var Wizard = require("./FirstTimeWizard");

var isFirstFile = true;
var sofaEnabled = false;

// Setup
Settings.load();
mp.msg.info("easympv " + Settings.Data.currentVersion + " starting...");
Utils.determineOS();
Utils.checkInternetConnection();

if (Settings.Data.doMigration) {
	Settings.migrate();
}
if (Settings.Data.resetMpvConfig) {
	Settings.mpvConfig.reset();
}
if (Settings.Data.resetInputConfig) {
	Settings.inputConfig.reset();
}
if (mp.utils.file_info(mp.utils.get_user_path("~~/input.conf")) == undefined) {
	Settings.inputConfig.reset();
}

var notifyAboutUpdates = new Boolean(
	Settings.Data.notifyAboutUpdates.toString()
);

Shaders.populateSets();
Colors.populateSets();

var imageArray = mp.utils.readdir(
		mp.utils.get_user_path("~~/scripts/easympv/images/"),
		"files"
	),
	i;
for (i = 0; i < imageArray.length; i++) {
	if (imageArray[i].includes(".bmp") && !imageArray[i].includes(".info")) {
		ImageOSD.addImage(imageArray[i].replace(".bmp", ""), imageArray[i]);
	}
}

Settings.Data.newestVersion = "0.0.0";

Utils.WL.populateCache();

Settings.save();
Browsers.FileBrowser.currentLocation = mp.get_property("working-directory");

//TODO: do not commit this
//Wizard.Start();

var onFileLoad = function () {
	var wld = Utils.WL.getData();
	if (isFirstFile) {
		if (
			mp.utils.file_info(
				mp.utils.get_user_path("~~/") + "/default.sofa"
			) != undefined
		) {
			mp.msg.verbose("Sofa file found!");
			var path = mp.utils
				.get_user_path("~~/")
				.toString()
				.replace(/\\/g, "/")
				.substring(2);
			mp.commandv(
				"af",
				"set",
				"lavfi=[sofalizer=sofa=C\\\\:" + path + "/default.sofa]"
			);
			sofaEnabled = true;
		}

		isFirstFile = false;
	}

	if (wld != undefined) {
		mp.msg.warn(
			'Please ignore "Error parsing option x (option not found)" errors. These are expected.'
		);
		if (wld.shader != undefined && !Shaders.manualSelection) {
			Shaders.apply(wld.shader);
		}
		if (wld.color != undefined) {
			// We dont Colors.apply this, because mpv already does that by itself.
			// Instead we just set Colors.name, achieving the same result.
			Colors.name = wld.color;
		}
	}
	var cFile;
	for (i = 0; i < Number(mp.get_property("playlist/count")); i++) {
		if (mp.get_property("playlist/" + i + "/current") == "yes") {
			cFile = mp.get_property("playlist/" + i + "/filename");
		}
	}

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
			mp.msg.warn(cFile);
		}
		Browsers.FileBrowser.currentLocation = cFile;
		Browsers.FileBrowser.currentLocation =
			Browsers.FileBrowser.getParentDirectory();
	}
};

// This will be executed on shutdown
var onShutdown = function () {
	// This is not ideal, as data will only be saved when mpv is being closed.
	// Ideally, this would be in the on_startup block, before a file change.
	mp.msg.info("Writing data to watch_later...");
	Utils.WL.writeData(Shaders.name, Colors.name);
};

var descriptionShaders = function (a, b) {
	return (
		"Shaders post-process video to improve image quality.@br@" +
		"Use the right arrow key to preview a profile.@br@Use the left arrow key to set it as default.@br@Use Enter to confirm.@br@" +
		"Current default Shaders: " +
		SSA.setColorYellow() +
		b +
		"@br@" +
		"Currently enabled Shaders: " +
		SSA.setColorYellow() +
		a
	);
};
var descriptionChapters = function (a, b) {
	var b1;
	b1 = SSA.setColorRed();
	if (b == "enabled") {
		b1 = SSA.setColorGreen();
	}
	return (
		"(Use the Right Arrow Key to change settings.)@br@" +
		'@br@This will autodetect Openings, Endings and Previews and then either "skip" or "slowdown" them.@br@' +
		SSA.setColorYellow() +
		"Current Mode: " +
		a +
		"@br@" +
		SSA.setColorYellow() +
		"Currently " +
		b1 +
		b
	);
};
var descriptionColors = function (a, b) {
	return (
		"Use the right arrow key to preview a profile.@br@Use the left arrow key to set it as default.@br@Use Enter to confirm.@br@" +
		"Current default Profile: " +
		SSA.setColorYellow() +
		b +
		"@br@" +
		"Current Profile: " +
		SSA.setColorYellow() +
		a
	);
};
var descriptionSettings = function (a, b) {
	return (
		"mpv " +
		b +
		"@br@" +
		"easympv " +
		a +
		"@br@" +
		"ffmpeg " +
		Utils.ffmpegVersion +
		"@br@" +
		"libass" +
		Utils.libassVersion
	);
};

var MainMenuSettings = {
	title: SSA.insertSymbolFA("") + "{\\1c&H782B78&}easy{\\1c&Hffffff&}mpv",
	description: "",
	descriptionColor: "ff0000",
	image: "logo",
};

var MainMenuItems = [
	{
		title: "Close@br@@br@",
		item: "close",
	},
	{
		title: "Open...",
		item: "open",
		description: "Files, Discs, Devices & URLs",
	},
	{
		title: "Shaders",
		item: "shaders",
	},
	{
		title: "Colors",
		item: "colors",
	},
	{
		title: "Chapters@br@",
		item: "chapters",
	},
	{
		title: "Preferences@br@@us10@@br@",
		item: "options",
	},
	{
		title: "Quit mpv",
		item: "quit",
	},
];

if (Number(mp.get_property("playlist-count")) > 1) {
	MainMenuItems.splice(2, 0, {
		title: "[Shuffle playlist]@br@",
		item: "shuffle",
	});
}

var MainMenu = new MenuSystem.Menu(MainMenuSettings, MainMenuItems, undefined);
var quitCounter = 0;
var quitTitle = MainMenu.items[MainMenu.items.length - 1].title;
MainMenu.eventHandler = function (event, action) {
	if (event == "enter") {
		if (action == "colors") {
			MainMenu.hideMenu();
			if (!ColorsMenu.isMenuVisible) {
				ColorsMenu.showMenu();
			} else {
				ColorsMenu.hideMenu();
			}
		} else if (action == "shaders") {
			MainMenu.hideMenu();
			if (!ShadersMenu.isMenuVisible) {
				ShadersMenu.showMenu();
			} else {
				ShadersMenu.hideMenu();
			}
		} else if (action == "chapters") {
			MainMenu.hideMenu();
			if (!ChaptersMenu.isMenuVisible) {
				ChaptersMenu.showMenu();
			} else {
				ChaptersMenu.hideMenu();
			}
		} else if (action == "options") {
			MainMenu.hideMenu();
			if (!SettingsMenu.isMenuVisible) {
				SettingsMenu.showMenu();
			} else {
				SettingsMenu.hideMenu();
			}
		} else if (action == "show") {
			MainMenu.hideMenu();
			var playlist = "   ";
			var i;
			for (i = 0; i < mp.get_property("playlist/count"); i++) {
				if (mp.get_property("playlist/" + i + "/playing") === "yes") {
					playlist = playlist + "➤ ";
				} else {
					playlist = playlist + "   ";
				}
				playlist =
					playlist +
					mp.get_property("playlist/" + i + "/filename") +
					"@br@";
			}
			mp.osd_message(SSA.startSequence() + SSA.setSize(8) + playlist, 3);
		} else if (action == "shuffle") {
			MainMenu.hideMenu();
			mp.commandv("playlist-shuffle");
		} else if (action == "open") {
			MainMenu.hideMenu();
			Browsers.Selector.open(MainMenu);
		} else if (action == "quit") {
			quitCounter++;
			if (!quitCounter.isOdd()) {
				Utils.exitMpv();
				MainMenu.hideMenu();
			} else {
				quitTitle = MainMenu.getSelectedItem().title;
				MainMenu.getSelectedItem().title =
					SSA.setColorRed() + "Are you sure?";
				MainMenu.redrawMenu();
			}
		} else {
			MainMenu.hideMenu();
		}
	} else if (event == "hide") {
		MainMenu.items[MainMenu.items.length - 1].title = quitTitle;
		quitCounter = 0;
	} else if (event == "show") {
		if (Utils.updateAvailable && notifyAboutUpdates) {
			notifyAboutUpdates = false;
			WindowSystem.Alerts.show(
				"info",
				"An update is available.",
				"Current Version: " + Settings.Data.currentVersion,
				"New Version: " + Settings.Data.newestVersion
			);
		}
	}
};

var ShadersMenuSettings = {
	title:
		"{\\1c&H782B78&}" +
		SSA.insertSymbolFA("") +
		SSA.setColorWhite() +
		"Shaders",
	description: descriptionShaders(
		Shaders.name,
		Settings.Data.defaultShaderSet
	),
	image: "shaders",
};

var ShadersMenuItems = [
	{
		title: "[Disable All Shaders]@br@@us10@@br@",
		item: "none",
	},
	{
		title: "Recommended All-Purpose Settings",
		item: "Automatic All-Purpose",
	},
	{
		title: "Recommended Anime4K Settings@br@@us10@@br@",
		item: "Automatic Anime4K",
	},
];

for (var i = 0; i < Shaders.sets.length; i++) {
	ShadersMenuItems.push({
		title: Shaders.sets[i].name,
		item: Shaders.sets[i].name,
	});
}

var ShadersMenu = new MenuSystem.Menu(
	ShadersMenuSettings,
	ShadersMenuItems,
	MainMenu
);

ShadersMenu.eventHandler = function (event, action) {
	switch (event) {
		case "show":
			ShadersMenu.setDescription(
				descriptionShaders(Shaders.name, Settings.Data.defaultShaderSet)
			);
			break;
		case "enter":
			ShadersMenu.hideMenu();
			if (action != "@back@") {
				Shaders.apply(action);
				ShadersMenu.setDescription(
					descriptionShaders(
						Shaders.name,
						Settings.Data.defaultShaderSet
					)
				);
				if (action == "clear") {
					WindowSystem.Alerts.show(
						"info",
						"Shaders have been disabled."
					);
				} else {
					WindowSystem.Alerts.show(
						"info",
						"Shader has been enabled:",
						SSA.setColorYellow() + Shaders.name
					);
				}
			}
			break;
		case "right":
			if (action != "@back@" && action != "clear") {
				Shaders.apply(action);
				ShadersMenu.setDescription(
					descriptionShaders(
						Shaders.name,
						Settings.Data.defaultShaderSet
					)
				);
				ShadersMenu.appendSuffixToCurrentItem();
			}
			break;
		case "left":
			if (action != "@back@") {
				Settings.Data.defaultShaderSet = action;
				Settings.save();
				WindowSystem.Alerts.show(
					"info",
					"Default shader changed to:",
					"",
					Settings.Data.defaultShaderSet
				);
				ShadersMenu.setDescription(
					descriptionShaders(
						Shaders.name,
						Settings.Data.defaultShaderSet
					)
				);
			}
			break;
	}
};

var ChaptersMenuSettings = {
	image: "chapters",
	title:
		"{\\1c&H782B78&}" +
		SSA.insertSymbolFA("") +
		SSA.setColorWhite() +
		"Chapters",
	description: descriptionChapters(Chapters.mode, Chapters.status),
};

var ChaptersMenuItems = [
	{
		title: "[Change Mode]",
		item: "tmode",
	},
	{
		title: "[Toggle]@br@@us10@@br@",
		item: "tstatus",
	},
	{
		title: "Confirm",
		item: "confirm",
	},
];

var ChaptersMenu = new MenuSystem.Menu(
	ChaptersMenuSettings,
	ChaptersMenuItems,
	MainMenu
);

ChaptersMenu.eventHandler = function (event, action) {
	switch (event) {
		case "show":
			ChaptersMenu.setDescription(
				descriptionChapters(Chapters.mode, Chapters.status)
			);
			break;
		case "enter":
			if (action == "back") {
				ChaptersMenu.hideMenu();
				if (!MainMenu.isMenuActive()) {
					MainMenu.renderMenu();
				} else {
					MainMenu.hideMenu();
				}
			} else if (action == "confirm") {
				ChaptersMenu.hideMenu();
			}
			break;
		case "right":
			if (action == "tmode") {
				if (Chapters.mode == "skip") {
					Chapters.mode = "slowdown";
				} else {
					Chapters.mode = "skip";
				}
				ChaptersMenu.setDescription(
					descriptionChapters(Chapters.mode, Chapters.status)
				);
				ChaptersMenu.appendSuffixToCurrentItem();
			} else if (action == "tstatus") {
				if (Chapters.status == "disabled") {
					Chapters.status = "enabled";
				} else {
					Chapters.status = "disabled";
				}
				ChaptersMenu.setDescription(
					descriptionChapters(Chapters.mode, Chapters.status)
				);
				ChaptersMenu.appendSuffixToCurrentItem();
			}
			break;
	}
};

var SettingsMenuSettings = {
	image: "settings",
	title:
		"{\\1c&H782B78&}" +
		SSA.insertSymbolFA("") +
		SSA.setColorWhite() +
		"Settings",
	description: descriptionSettings(
		Utils.displayVersion,
		Utils.displayVersionMpv
	),
};

var SettingsMenuItems = [
	{
		title: "Reload config",
		item: "reload",
	},
	{
		title: "Credits",
		item: "credits",
	},
	{
		title: "Toggle Discord RPC@br@@us10@@br@",
		item: "discord",
	},
	{
		title: "Edit easympv.conf",
		item: "easympvconf",
	},
	{
		title: "Edit mpv.conf",
		item: "mpvconf",
	},
	{
		title: "Edit input.conf",
		item: "inputconf",
	},
	{
		title: "Input a command",
		item: "command",
	},
	{
		title: "Open config folder@br@@us10@@br@",
		item: "config",
	},
	{
		title: "Clear watchlater data",
		item: "clearwld",
	},
];

if (Utils.isOnline) {
	SettingsMenuItems.splice(2, 0, {
		title: "Check for updates",
		item: "updater",
	});
}

var SettingsMenu = new MenuSystem.Menu(
	SettingsMenuSettings,
	SettingsMenuItems,
	MainMenu
);

SettingsMenu.eventHandler = function (event, action) {
	if (event == "enter") {
		SettingsMenu.hideMenu();
		if (action == "ass") {
			toggle_assoverride();
		} else if (action == "discord") {
			mp.commandv("script-binding", "drpc_toggle");
		} else if (action == "easympvconf") {
			Utils.openFile("easympv.conf");
		} else if (action == "mpvconf") {
			Utils.openFile("mpv.conf");
		} else if (action == "inputconf") {
			Utils.openFile("input.conf");
		} else if (action == "updater") {
			var updateConfirmation = false;
			var umenu = new MenuSystem.Menu(
				{
					title: "Update",
					autoClose: "0",
					description:
						"You are on version " +
						SSA.setColorYellow() +
						Settings.Data.currentVersion +
						"@br@" +
						"The latest available version is " +
						SSA.setColorYellow() +
						Settings.Data.newestVersion +
						"@br@@br@" +
						Utils.latestUpdateData.changelog,
				},
				[],
				SettingsMenu
			);

			umenu.eventHandler = function (event, action) {
				if (event == "hide") {
					umenu = undefined;
					updateConfirmation = false;
				} else if (event == "enter" && action != "@back@") {
					if (updateConfirmation) {
						umenu.hideMenu();
						Utils.doUpdate();
					} else {
						umenu.items[1].title =
							SSA.setColorRed() + "Are you sure?";
						umenu.redrawMenu();
						updateConfirmation = true;
					}
				} else if (event == "show" && Utils.updateAvailable) {
					if (umenu.items.length == 1) {
						umenu.items.push({
							title:
								"Update to version " +
								SSA.setColorYellow() +
								Settings.Data.newestVersion,
							item: "update",
						});
					}
				}
			};
			if (Settings.Data.debugMode) {
				umenu.settings.description +=
					"@br@@br@[Debug Mode Information]@br@These files will be removed:@br@";

				for (
					var i = 0;
					i < Utils.latestUpdateData.removeFiles.length;
					i++
				) {
					umenu.settings.description +=
						" - " + Utils.latestUpdateData.removeFiles[i] + "@br@";
				}
				umenu.settings.description +=
					"@br@These settings will be enabled:@br@";
				for (
					var i = 0;
					i < Utils.latestUpdateData.enableSettings.length;
					i++
				) {
					umenu.settings.description +=
						" - " +
						Utils.latestUpdateData.enableSettings[i] +
						"@br@";
				}
			}
			umenu.showMenu();
		} else if (action == "config") {
			Utils.openFile("");
		} else if (action == "clearwld") {
			Utils.WL.clear();
		} else if (action == "command") {
			var readCommand = function (success, result, error) {
				if (result.status == "0") {
					mp.command(result.stdout.trim());
				}
			};

			WindowSystem.Alerts.show(
				"info",
				"Command Input window has opened!"
			);
			if (Utils.OSisWindows) {
				var r = mp.command_native_async(
					{
						name: "subprocess",
						playback_only: false,
						capture_stdout: true,
						args: [
							"powershell",
							"-executionpolicy",
							"bypass",
							mp.utils
								.get_user_path(
									"~~/scripts/easympv/WindowsCompat.ps1"
								)
								.replaceAll("/", "\\"),
							"show-command-box",
						],
					},
					readCommand
				);
			} else {
				var r = mp.command_native_async(
					{
						name: "subprocess",
						playback_only: false,
						capture_stdout: true,
						args: [
							"zenity",
							"--title=mpv",
							"--forms",
							"--text=Execute command",
							"--add-entry=mpv command:",
						],
					},
					readCommand
				);
			}
		} else if (action == "credits") {
			var cmenu = new MenuSystem.Menu(
				{
					title: "Credits",
					autoClose: "0",
					description: Utils.getCredits().replaceAll("\n", "@br@"),
				},
				[],
				SettingsMenu
			);
			cmenu.eventHandler = function (event, action) {
				if (event == "hide") {
					cmenu = undefined;
				}
			};
			cmenu.showMenu();
		} else if (action == "reload") {
			Settings.reload();
			WindowSystem.Alerts.show("info", "Configuration reloaded.");
		} else if (action == "remote") {
			Settings.Data.useRandomPipeName = false;
			Utils.setIPCServer(Settings.Data.useRandomPipeName);
			Settings.save();
		}
	} else if (event == "show") {
		if (Utils.isOnline && SettingsMenuItems[2].item != "updater") {
			SettingsMenuItems.splice(2, 0, {
				title: "Check for updates",
				item: "updater",
			});
		}
		Utils.setDisplayVersion();
		SettingsMenu.setDescription(
			descriptionSettings(Utils.displayVersion, Utils.displayVersionMpv)
		);
	}
};

var ColorsMenuSettings = {
	image: "colors",
	title:
		SSA.insertSymbolFA("") +
		"{\\1c&H375AFC&}C{\\1c&H46AEFF&}o{\\1c&H17E8FF&}l{\\1c&H70BF47&}o{\\1c&HFFD948&}r{\\1c&HE6A673&}s",
	description: descriptionColors(
		Colors.name,
		Settings.Data.defaultColorProfile
	),
};

var ColorsMenuItems = [
	{
		title: "[Disable All Presets]@br@@us10@@br@",
		item: "none",
	},
];

for (var i = 0; i < Colors.sets.length; i++) {
	ColorsMenuItems.push({
		title: Colors.sets[i].name,
		item: Colors.sets[i].name,
	});
}

var ColorsMenu = new MenuSystem.Menu(
	ColorsMenuSettings,
	ColorsMenuItems,
	MainMenu
);

ColorsMenu.eventHandler = function (event, action) {
	switch (event) {
		case "show":
			ColorsMenu.setDescription(
				descriptionColors(
					Colors.name,
					Settings.Data.defaultColorProfile
				)
			);
			break;
		case "enter":
			ColorsMenu.hideMenu();
			Colors.apply(action);
			if (action == "none") {
				WindowSystem.Alerts.show(
					"info",
					"Color profile has been disabled."
				);
			} else {
				WindowSystem.Alerts.show(
					"info",
					"Color profile has been enabled:",
					SSA.setColorYellow() + Colors.name
				);
			}

			break;
		case "right":
			if (action != "@back@") {
				Colors.apply(action);
				ColorsMenu.setDescription(
					descriptionColors(
						Colors.name,
						Settings.Data.defaultColorProfile
					)
				);
				ColorsMenu.appendSuffixToCurrentItem();
			}
			break;
		case "left":
			if (action != "@back@") {
				Settings.Data.defaultColorProfile = action;
				ColorsMenu.setDescription(
					descriptionColors(
						Colors.name,
						Settings.Data.defaultColorProfile
					)
				);
				WindowSystem.Alerts.show(
					"info",
					"Default color profile changed to:",
					"",
					Settings.Data.defaultColorProfile
				);
				Settings.save();
			}
			break;
	}
};

////////////////////////////////////////////////////////////////////////

// Add menu key binding and its logic
mp.add_key_binding(null, "easympv", function () {
	mp.msg.verbose("Menu key pressed!");
	// If no menu is active, show main menum
	if (
		//!ColorsMenu.isMenuVisible &&
		!ShadersMenu.isMenuVisible &&
		!ChaptersMenu.isMenuVisible &&
		!SettingsMenu.isMenuVisible &&
		!MainMenu.isMenuVisible
	) {
		MainMenu.showMenu();
		// Else hide all menus (second keypress)
	} else {
		MainMenu.hideMenu();
		ShadersMenu.hideMenu();
		ChaptersMenu.hideMenu();
		SettingsMenu.hideMenu();
		//ColorsMenu.hideMenu();
	}
});

// below was used to test alerts
/*
mp.add_key_binding("k", "menu-test", function () {
	mp.msg.verbose("Window key pressed!");
	WindowSystem.Alerts.show("error","You pressed the window key!","XXXXXXXXXXXXXXX","Congratulations!");
});
*/

mp.add_key_binding("n", "toggle-sofa", function () {
	if (
		mp.utils.file_info(mp.utils.get_user_path("~~/default.sofa")) !=
		undefined
	) {
		sofaEnabled = !sofaEnabled;
		var path = mp.utils
			.get_user_path("~~/")
			.toString()
			.replace(/\\/g, "/")
			.substring(2);
		mp.commandv(
			"af",
			"toggle",
			"lavfi=[sofalizer=sofa=C\\\\:" + path + "/default.sofa]"
		);
		if (sofaEnabled) {
			WindowSystem.Alerts.show(
				"info",
				"Sofalizer:",
				SSA.setColorGreen() + "enabled"
			);
		} else {
			WindowSystem.Alerts.show(
				"info",
				"Sofalizer:",
				SSA.setColorRed() + "disabled"
			);
		}
	} else {
		WindowSystem.Alerts.show(
			"warning",
			"File not found:",
			SSA.setColorYellow() + "default.sofa"
		);
	}
});

// Registering functions to events
mp.register_event("file-loaded", onFileLoad);
mp.register_event("shutdown", onShutdown);

// Registering an observer to check for chapter changes (Chapters.js)
mp.observe_property(
	"chapter-metadata/by-key/title",
	undefined,
	Chapters.Handler
);

// Registering an observer to fix Menus on window size change
mp.observe_property("osd-height", undefined, function () {
	var currentmenu = MenuSystem.getDisplayedMenu();
	if (currentmenu != undefined) {
		currentmenu.hideMenu();
		currentmenu.showMenu();
	}
});

Colors.name = Settings.Data.defaultColorProfile;
Colors.apply(Settings.Data.defaultColorProfile);
