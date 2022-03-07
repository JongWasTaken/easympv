/*
 * EASYMPV.JS (main.js)
 *
 * Author:              Jong
 * URL:                 https://smto.pw/mpv
 * License:             Apache License, Version 2.0
 *
 * Useful links:
 * LUA documentation, most functions are the same in javascript:
 *     https://github.com/mpv-player/mpv/blob/master/DOCS/man/lua.rst
 * JavaScript documentation, for the few odd ones out:
 *     https://github.com/mpv-player/mpv/blob/master/DOCS/man/javascript.rst
 * input.conf documentation, for commands, properties, events and other tidbits
 *     https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst
 *     https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst#property-list
 *
 * Important!
 *     mpv uses MuJS, which is ES5 compliant, but not ES6!
 *     Most IE polyfills will probably work.
 *
 * Snippets:
 *     how to check for a file (check for undefined)
 *          mp.utils.file_info(mp.utils.get_user_path("~~/FOLDER/")+"FILE")
 */

/*

Current dependencies:
mpv 33+
Windows only:
	PowerShell
	wmic
Linux only:
	GNU coreutils
	zenity
*/

/*
	TODO:
	(DONEish) - Remake settings menu (with save/load)
	(DONE) - Folder navigation from current directory
	(ONGOING) - Move away from the util as much as possible
	- DirectShow readout in Utility
	- Figure out updating without utility GUI
	(DONE) MenuSystem: scrolling
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

String.prototype.insertAt = function(index, string)
{   
  return this.substring(0, index) + string + this.substring(index);
}

Number.prototype.isOdd = function () {
	return this % 2 == 1;
};

Math.percentage = function (partialValue, totalValue) {
	return Math.round((100 * partialValue) / totalValue);
} 

// Lets Go!
mp.msg.info("Starting!");
var Settings = require("./Settings"),
	Utils = require("./Utils"),
	SSA = require("./SSAHelper"),
	OSD = require("./OSD"),
	Shaders = require("./Shaders"),
	Colors = require("./Colors"),
	Chapters = require("./Chapters"),
	MenuSystem = require("./MenuSystem"),
	WindowSystem = require("./WindowSystem"),
	Browsers = require("./Browsers"),
	isFirstFile = true,
	sofaEnabled = false,
	displayVersion = "";

// Set Utils.os
Utils.determineOS();

// Read easympv.conf
Settings.reload();
var notifyAboutUpdates = new Boolean(Settings.Data.notifyAboutUpdates.toString());

// Read JSON files early early
Shaders.populateSets();
Colors.populateSets();

// Image indexing for later display (like menus)
mp.msg.info("Indexing images...");
// add every bmp file in .mpv/images/ to OSD. Name = Filename without .bmp, Image Dimensions must be 200 x 60 (w x h),
var imageArray = mp.utils.readdir(
		mp.utils.get_user_path("~~/images/"),
		"files"
	),
	i;
for (i = 0; i < imageArray.length; i++) {
	if (imageArray[i].includes(".bmp") && !imageArray[i].includes(".info")) {
		OSD.addFile(imageArray[i].replace(".bmp", ""), imageArray[i]);
		//mp.msg.info("Indexed image: " + imageArray[i]);
	}
}

// IPC server startup
mp.msg.info("Starting ipc server...");
Utils.setIPCServer(Settings.Data.randomPipeName);

// Automatic check for updates
if (!Settings.Data.manualInstallation) {
	mp.msg.info("Checking for updates...");
	// Utility will check for updates and write a short lua script to scripts folder if outdated
	Utils.externalUtil("check");
}

// Per File Option Saving (Step 1: Cache)
Utils.cacheWL(); // Create a copy of watch_later folder, as current file will get deleted by mpv after read
mp.msg.warn(
	'Please ignore "Error parsing option shader (option not found)" errors. These are expected.'
); // because mpv does not know our custom options

if(Number(Settings.Data.currentVersion.replace(/\./g,"")) < Number(Settings.Data.newestVersion.replaceAll(/\./g,"")))
{
	displayVersion = SSA.setColorRed() + Settings.Data.currentVersion + " (" + Settings.Data.newestVersion + " available)";
}
else
{
	displayVersion = SSA.setColorGreen() + Settings.Data.currentVersion;
}

// This will be executed on file-load
var on_start = function () {
	// done ? TODO: give priority to user selected Shaderset/Colorset for current session
	// Per File Option Saving (Part 2: Loading for video file)
	var wld = Utils.getWLData();

	if (isFirstFile) {
		// will only be applied for the first file
		if (!mp.get_property("path").includes("video=")) {
			// shader will not be applied if using video device
			if (wld == undefined) {
				Shaders.apply(Settings.Data.defaultShaderSet);
			}
		}

		// Audio Filter
		if (
			// Checks for default.sofa and applies it as an audio filter if found
			mp.utils.file_info(
				mp.utils.get_user_path("~~/") + "/default.sofa"
			) != undefined
		) {
			mp.msg.info("Sofa file found!");
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
		if (wld.shader != undefined && !Shaders.manualSelection) {
			Shaders.apply(wld.shader);
		}
		if (wld.color != undefined) {
			// We dont Colors.apply this, because mpv already does that by itself.
			// Instead we just set it to Colors.name, achieving the same result.
			Colors.name = wld.color;
		}
	}

	Browsers.FileBrowser.currentLocation = mp.get_property("working-directory");
};

// This will be executed on shutdown
var on_shutdown = function () {
	// Per File Option Saving (Part 3: Saving for video file)
	// This is not ideal, as data will only be saved when mpv is being closed.
	// Ideally, this would be in the on_startup block, after a file change.
	mp.msg.info("Writing data to watch_later...");
	Utils.writeWLData(Shaders.name, Colors.name);
};

////////////////////////////////////////////////////////////////////////


var descriptionShaders = function (a) {
	return "Shaders post-process video to improve image quality.@br@" +
	"Use the right arrow key to preview a profile. Use Enter to confirm.@br@Currently enabled Shaders: " + SSA.setColorYellow() + a;
};
var descriptionChapters = function (a,b) {
	var b1;
	if(b == "enabled")
	{
		b1 = SSA.setColorGreen();
	} else { b1 = SSA.setColorRed();};
	return '(Use the Right Arrow Key to change settings.)@br@'+
	'@br@This will autodetect Openings, Endings and Previews and then either "skip" or "slowdown" them.@br@' +
	SSA.setColorYellow() + "Current Mode: " + a + "@br@" +
	SSA.setColorYellow()+"Currently " + b1 + b;
};
var descriptionColors = function (a) {
	return "Use the right arrow key to preview a profile. Use Enter to confirm.@br@"+
	"Profiles can be customized in the preferences.@br@Current Profile: " + SSA.setColorYellow() + a;
};

var MainMenuSettings = {
	title: SSA.insertSymbolFA("") + "{\\1c&H782B78&}easy{\\1c&Hffffff&}mpv",
	description: "niggerniggerniggerniggernigger@br@niggerniggerniggerniggernigger@br@niggerniggerniggerniggernigger",
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
		description: "Files, Discs & Devices",
		//description: "Files, Discs, Devices & URLs",
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

if (mp.get_property("path") != null) {
	if (mp.get_property("path").includes("video=")) {
		MainMenuItems.splice(1, 0, {
			title: "[Reload Video Device]@br@",
			item: "videodevice_reload",
		});
	}
}
if (Number(mp.get_property("playlist-count")) > 1) {
	MainMenuItems.splice(2, 0, {
		title: "[Shuffle playlist]@br@",
		item: "shuffle",
	});
}

var MainMenu = new MenuSystem.Menu(MainMenuSettings, MainMenuItems, undefined);
var quitCounter = 0;
var quitTitle = MainMenu.items[MainMenu.items.length-1].title;
MainMenu.eventHandler = function (event, action) {
	Utils.executeCommand();
	if (event == "enter") {
		//w.show();
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
		} else if (action == "open") { //TODO:
			MainMenu.hideMenu();
			Browsers.Selector.open(MainMenu);
		} else if (action == "quit") {
			quitCounter++;
			if(!quitCounter.isOdd())
			{ 
				mp.commandv("quit_watch_later"); 
			}
			else
			{
				quitTitle = MainMenu.getSelectedItem().title;
				MainMenu.getSelectedItem().title = SSA.setColorRed() + "Are you sure?";
				MainMenu.redrawMenu();
			}
		} else if (action == "videodevice_reload") {
			Utils.externalUtil("videoreload " + Utils.pipeName);
			MainMenu.hideMenu();
		}
		else {MainMenu.hideMenu();}
	}
	else if (event == "hide")
	{
		MainMenu.items[MainMenu.items.length-1].title = quitTitle;
		quitCounter = 0;
	}
	else if (event == "show")
	{
		if(Settings.Data.newestVersion != Settings.Data.currentVersion && notifyAboutUpdates)
		{
			notifyAboutUpdates = false;
			WindowSystem.Alerts.show("info","An update is available.","Current Version: " + Settings.Data.currentVersion,"New Version: " + Settings.Data.newestVersion);
		}
	}
};

var ShadersMenuSettings = {
	title:
		"{\\1c&H782B78&}" +
		SSA.insertSymbolFA("") +
		SSA.setColorWhite() +
		"Shaders",
	description: descriptionShaders(Shaders.name),
	image: "shaders",
};

var ShadersMenuItems = [
	{
		title: "[Disable All Shaders]",
		item: "clear",
	},
	{
		title: "[Select Default Shader]@br@@us10@@br@",
		item: "select",
	},
	{
		title: "Recommended Live Action Settings",
		item: "la_auto",
	},
	{
		title: "Recommended Anime4K Settings@br@@us10@@br@",
		item: "a4k_auto",
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
	//mp.msg.warn(event + " - " + action)
	switch (event) {
		case "show":
			ShadersMenu.setDescription(descriptionShaders(Shaders.name));
			break;
		case "enter":
			ShadersMenu.hideMenu();
			if (action == "select") {
				Utils.externalUtil("a4k");
			} else {
				Shaders.apply(action);
				ShadersMenu.setDescription(descriptionShaders(Shaders.name));
				if (action == "clear") {
					WindowSystem.Alerts.show("info","Shaders have been disabled.");
				}
				else
				{
					WindowSystem.Alerts.show("info","Shader has been enabled:",SSA.setColorYellow() + Shaders.name);
				}
			}
			break;
		case "right":
			if (action != "back" && action != "select" && action != "clear") {
				Shaders.apply(action);
				ShadersMenu.setDescription(descriptionShaders(Shaders.name));
				ShadersMenu.appendSuffixToCurrentItem();
			}
			break;
		case "left":
			if (action != "back" && action != "select" && action != "clear") {
				Shaders.apply(action);
				var oldSuffix = new String(ShadersMenu.itemSuffix);
				ShadersMenu.setDescription(descriptionShaders(Shaders.name));
				ShadersMenu.itemSuffix = " (default)";
				Settings.Data.defaultShaderSet = action;
				ShadersMenu.appendSuffixToCurrentItem();
				ShadersMenu.itemSuffix = oldSuffix;
			}
			break;
	}
	Settings.save();
};

var ChaptersMenuSettings = {
	image: "chapters",
	title:
		"{\\1c&H782B78&}" +
		SSA.insertSymbolFA("") +
		SSA.setColorWhite() +
		"Chapters",
	description: descriptionChapters(Chapters.mode,Chapters.status)
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
	}
];

var ChaptersMenu = new MenuSystem.Menu(
	ChaptersMenuSettings,
	ChaptersMenuItems,
	MainMenu
);

ChaptersMenu.eventHandler = function (event, action) {
	switch (event) {
		case "show":
			ChaptersMenu.setDescription(descriptionChapters(Chapters.mode,Chapters.status));
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
				ChaptersMenu.setDescription(descriptionChapters(Chapters.mode,Chapters.status));
				ChaptersMenu.appendSuffixToCurrentItem();
			} else if (action == "tstatus") {
				if (Chapters.status == "disabled") {
					Chapters.status = "enabled";
				} else {
					Chapters.status = "disabled";
				}
				ChaptersMenu.setDescription(descriptionChapters(Chapters.mode,Chapters.status));
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
	description: "easympv-scripts " + displayVersion,
};

var SettingsMenuItems = [
	{
		title: "More Options...",
		item: "options",
	},
	{
		title: "Reload config@br@@us10@@br@",
		item: "reload",
	},
	{
		title: "Credits and Licensing",
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

if (!Settings.Data.manualInstallation) {
	SettingsMenuItems.splice(2, 0, {
		title: "Check for updates",
		item: "updater",
	});
}

if (Settings.Data.useRandomPipeName) {
	SettingsMenuItems.push({
		title: "Switch to insecure IPC server (!)@br@",
		item: "remote",
	});
}
if (!Settings.Data.manualInstallation) {
	SettingsMenuItems.push({
		title: "Uninstall...",
		item: "reset",
		color: "ff0000",
	});
}

if (Settings.Data.debugMode == true) {
	SettingsMenuItems.push({
		title: "Open console",
		item: "console",
	});
	SettingsMenuItems.push({
		title: "Open debug screen",
		item: "debug",
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
			Utils.externalUtil("update");
		} else if (action == "reset") {
			Utils.externalUtil("reset");
		} else if (action == "config") {
			Utils.openFile("");
		} else if (action == "clearwld") {
			Utils.clearWatchdata();
		} else if (action == "command") {
			Utils.externalUtil("guicommand " + Utils.pipeName);
		} else if (action == "options") {
			Utils.externalUtil("options");
		} else if (action == "console") {
			Utils.externalUtil("console");
		} else if (action == "credits") {
			Utils.externalUtil("credits");
		} else if (action == "reload") {
			//Settings.reload();
			Settings.save();
			WindowSystem.Alerts.show("info","Configuration reloaded.");
		} else if (action == "debug") {
			Utils.externalUtil("debug " + Utils.pipeName);
		} else if (action == "remote") {
			Settings.Data.useRandomPipeName = false;
			Utils.setIPCServer(Settings.Data.useRandomPipeName);
		}
	}
};

var ColorsMenuSettings = {
	image: "colors",
	title:
		SSA.insertSymbolFA("") +
		"{\\1c&H375AFC&}C{\\1c&H46AEFF&}o{\\1c&H17E8FF&}l{\\1c&H70BF47&}o{\\1c&HFFD948&}r{\\1c&HE6A673&}s",
	description:
		"Use the right arrow key to preview a profile. Use Enter to confirm.@br@Profiles can be customized in the preferences.@br@Current Profile: " +
		Colors.name,
};

var ColorsMenuItems = [
	{
		title: "[Disable All Presets]",
		item: "none",
	},
	{
		title: "[Select Default Preset]@br@@us10@@br@",
		item: "default",
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
	var selection = ColorsMenu.getSelectedItem();

	switch (event) {
		case "show":
			ColorsMenu.setDescription(descriptionColors(Colors.name));
			break;
		case "enter":
			ColorsMenu.hideMenu();
			if (action == "default") {
				Utils.externalUtil("color");
			} else {
				Colors.apply(action);
				if(action == "none")
				{
					WindowSystem.Alerts.show("info", "Color profile has been disabled.")
				}
				else
				{
					WindowSystem.Alerts.show("info", "Color profile has been enabled:",SSA.setColorYellow() + Colors.name);
				}
			}
			break;
		case "right":
			if (action != "back" && action != "default") {
				Colors.apply(action);
				ColorsMenu.setDescription(descriptionColors(Colors.name));
				ColorsMenu.appendSuffixToCurrentItem();
			}

			break;
	}
};

////////////////////////////////////////////////////////////////////////

// Add menu key binding and its logic
mp.add_key_binding(null, "easympv", function () {
	mp.msg.info("Menu key pressed!");
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

mp.add_key_binding(null, "menu-test", function () { // its k
	mp.msg.info("Window key pressed!");
	WindowSystem.Alerts.show("error","You pressed the window key!","AAAAAAAAAAAaaaa","Congratulations!");
	/*
	if (!w.isWindowVisible) {
		w.show();
	} else {
		w.hide();
	}
	*/
});

mp.add_key_binding("n", "toggle-sofa", function () {
	if(mp.utils.file_info(mp.utils.get_user_path("~~/default.sofa")) != undefined) {
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
		if(sofaEnabled) 
		{
			WindowSystem.Alerts.show("info", "Sofalizer:",SSA.setColorGreen() + "enabled")
		}
		else 
		{
			WindowSystem.Alerts.show("info", "Sofalizer:",SSA.setColorRed() + "disabled")
		}
	}
	else 
	{
		WindowSystem.Alerts.show("warning", "File not found:",SSA.setColorYellow() + "default.sofa")
	}
}); 
// Registering functions to events
mp.register_event("file-loaded", on_start);
mp.register_event("shutdown", on_shutdown);

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
		/*
		if (mp.get_property("osd-height") < 600)
		{
			currentmenu.settings.displayMethod = "message";
		}
		else
		{
			currentmenu.settings.displayMethod = "overlay";
		}
		*/
		currentmenu.showMenu();
	}
});

Colors.name = Settings.Data.defaultColorProfile;
Colors.apply(Settings.Data.defaultColorProfile);
