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

// TODO: fix ColorsMenu not showing Colors.presetCache

"use strict";

// polyfill for String.includes()
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

String.prototype.replaceAll = function(str, newStr){
  if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
    return this.replace(str, newStr);
  }
  return this.replace(new RegExp(str, 'g'), newStr);
};

// Lets Go!
mp.msg.info("Starting!");
var Options = require("./Options"),
  Utils = require("./Utils"),
  Ass = require("./AssFormat"),
  OSD = require("./OSD"),
  Shaders = require("./Shaders"),
  Colors = require("./Colors"),
  Chapters = require("./Chapters"),
  //Menu = require("./MenuDefinitions"),
  MenuSystem = require("./MenuSystem"),
  isFirstFile = true,
  randomPipeNames = true,
  assOverride = false,
  subtitleStyleOverride = false,
  startupShader = "none",
  version = "1.8",
  manual = false,
  debug = false;

// Creating options
var userConfig = new Options.advanced_options(
  {
    shader: "none",
    subtitleStyleOverride: false,
    useRandomPipeName: true,
    manualInstallation: false,
    debugMode: false,
  },
  "easympv" // file name to read from
);

MenuSystem.displayMethod = "overlay";

// Read Shaders.json early
Shaders.populateSets();

// Get values from file
startupShader = userConfig.getValue("shader");
debug = userConfig.getValue("debugMode");
subtitleStyleOverride = userConfig.getValue("subtitleStyleOverride");
randomPipeNames = userConfig.getValue("useRandomPipeName");
manual = userConfig.getValue("manualInstallation");

// Creating options for colorbox
var colorboxuserConfig = new Options.advanced_options(
  {
    presets: [],
    startup_preset: "",
  },
  "colorbox"
);

// Loading presets from file
mp.msg.info("Loading color presets...");
Colors.buildCache(colorboxuserConfig.getValue("presets"));

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
if (randomPipeNames) {
  // the pipe name is randomized and passed to the utility for slightly more security
  // 8 randomized integers
  var randomPipeName = Math.floor(Math.random() * 10).toString();
  randomPipeName = randomPipeName + Math.floor(Math.random() * 10).toString();
  randomPipeName = randomPipeName + Math.floor(Math.random() * 10).toString();
  randomPipeName = randomPipeName + Math.floor(Math.random() * 10).toString();
  randomPipeName = randomPipeName + Math.floor(Math.random() * 10).toString();
  randomPipeName = randomPipeName + Math.floor(Math.random() * 10).toString();
  randomPipeName = randomPipeName + Math.floor(Math.random() * 10).toString();
  randomPipeName = randomPipeName + Math.floor(Math.random() * 10).toString();
  mp.msg.info("PipeName: randomized");
} else {
  var randomPipeName = "mpv";
  mp.msg.info("PipeName: mpv");
}

if(Utils.os != "win")
{
  mp.set_property("input-ipc-server", "/tmp/" + randomPipeName); // sockets need a location
}
else {
  mp.set_property("input-ipc-server", randomPipeName); // named pipes exist in the limbo
}

// Automatic check for updates
if (!manual) {
  mp.msg.info("Checking for updates...");
  // Utility will check for updates and write a short lua script to scripts folder if outdated
  Utils.externalUtil("check");
}

// TODO: Fix or remove
var toggle_assoverride = function (silent) {
  if (assOverride == false) {
    assOverride = true;
    mp.set_property("sub-ass-styles", "~~/shaders/hs.ass");
    //mp.set_property("blend-subtitles", "no");
    //mp.set_property("sub-ass-scale-with-window", "yes");
    mp.set_property("sub-ass-override", "force");
    mp.msg.info("Overriding subtitle styling.");
    if (!silent) {
      mp.osd_message(
        Ass.startSeq() +
          Ass.size(14) +
          "Override Subtitle Style: {\\c&H0cff00&}enabled"
      );
    }
  } else if (assOverride == true) {
    assOverride = false;
    //mp.set_property("blend-subtitles", "yes");
    //mp.set_property("sub-ass-scale-with-window", "no");
    mp.set_property("sub-ass-override", "no");
    mp.msg.info("Enabled subtitle styling.");
    if (!silent) {
      mp.osd_message(
        Ass.startSeq() +
          Ass.size(14) +
          "Override Subtitle Style: {\\c&H3440eb&}disabled"
      );
    }
  }
};

// Per File Option Saving (Step 1: Cache)
Utils.cacheWL(); // Create a copy of watch_later folder, as current file will get deleted by mpv after read
mp.msg.warn(
  'Please ignore "Error parsing option shader (option not found)" errors. These are expected.'
); // because mpv does not know our custom options

// This will be executed on file-load
var on_start = function () {

  // TODO: give priority to user selected Shaderset/Colorset for current session
  // Per File Option Saving (Part 2: Loading for video file)
  var wld = Utils.getWLData();


  if(isFirstFile) // will only be applied for the first file
  {

    if (!mp.get_property("path").includes("video=")) { // shader will not be applied if using video device
      if (wld == undefined) { Shaders.apply(startupShader); }
    }

    // TODO: Fix or remove
    if (subtitleStyleOverride) {
      toggle_assoverride(true);
    }

    // Audio Filter
    if (  // Checks for default.sofa and applies it as an audio filter if found
      mp.utils.file_info(mp.utils.get_user_path("~~/") + "/default.sofa") !=
      undefined
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
    }

    isFirstFile = false;
  }

  if (wld != undefined) {
    if(wld.shader != undefined)
    {
      Shaders.apply(wld.shader);
    }
    if(wld.color != undefined)
    {
      Colors.applyLookByName(wld.color);
    }
  }
};

// This will be executed on shutdown
var on_shutdown = function () {
  // Per File Option Saving (Part 3: Saving for video file)
  // This is not ideal, as data will only be saved when mpv is being closed.
  // Ideally, this would be in the on_startup block, after a file change.
  mp.msg.info("Writing data to watch_later...");
  Utils.writeWLData(Shaders.name,Colors.lookName);
};

////////////////////////////////////////////////////////////////////////

var MainMenuSettings = {
  title: Ass.insertSymbolFA("")+"{\\1c&H782B78&}easy{\\1c&Hffffff&}mpv",
  description: "[displayMethod: "+ MenuSystem.displayMethod +"]",
  descriptionColor: "4444ee",
  image: "logo"
};

var MainMenuItems = [
  {
    title: "Close        ",
    item: "close"
  },
  {
    title: "Open...",
    item: "open",
    description: "This is a test description to test    the new overlay displayMethod",
  },
  {
    title: "Shaders",
    item: "shaders"
  },
  {
    title: "Colors",
    item: "colors"
  },
  {
    title: "Chapters    ",
    item: "chapters"
  },
  {
    title: "Preferences        ",
    item: "options"
  },
  {
    title: "Quit mpv",
    item: "quit"
  }
];

if(mp.get_property("path") != null)
{
  if(mp.get_property("path").includes("video="))
  {
    MainMenuItems.splice(1,0,{
      title: "[Reload Video Device]    ",
      item: "videodevice_reload",
    });
  }
}
  if(Number(mp.get_property("playlist-count")) > 1) {
  MainMenuItems.splice(2,0,{
    title: "[Shuffle playlist]    ",
    item: "shuffle",
    });
  }

var MainMenu = new MenuSystem.Menu(MainMenuSettings,MainMenuItems,undefined)

MainMenu.handler = function (event, action) {
  if(event == "enter")
  {
    MainMenu.hideMenu();
    if (action == "colors") {
      if (!ColorsMenu.isMenuVisible) {
        ColorsMenu.showMenu();
      } else {
        ColorsMenu.hideMenu();
      }
    } else if (action == "shaders") {
      if (!ShadersMenu.isMenuVisible) {
        ShadersMenu.showMenu();
      } else {
        ShadersMenu.hideMenu();
      }
    } else if (action == "chapters") {
      if (!ChaptersMenu.isMenuVisible) {
        ChaptersMenu.showMenu();
      } else {
        ChaptersMenu.hideMenu();
      }
    } else if (action == "options") {
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
          playlist + mp.get_property("playlist/" + i + "/filename") + "    ";
      }
      mp.osd_message(Ass.startSeq() + Ass.size(8) + playlist, 3);
    } else if (action == "shuffle") {
      mp.commandv("playlist-shuffle");
    } else if (action == "open") {
      Utils.externalUtil("open " + randomPipeName);
    } else if (action == "quit") {
      mp.commandv("quit_watch_later");
    } else if (action == "videodevice_reload") {
      Utils.externalUtil("videoreload "+randomPipeName);
    }
  }
};

var ShadersMenuSettings = {
  title: "{\\1c&H782B78&}"+Ass.insertSymbolFA("")+Ass.white()+"Shaders",
  description: "Shaders are used for post-proccesing. Anime4K will make Cartoon & Anime look even better.    Use the right arrow key to preview a profile. Use Enter to confirm.    Currently enabled Shaders: " + Shaders.name,
  image: "shaders",
}

var ShadersMenuItems = [
{
  title: "[Disable All Shaders]",
  item: "clear",
},
{
  title: "[Select Default Shader]        ",
  item: "select",
},
{
  title: "Recommended Anime4K Settings    ",
  item: "a4k_auto",
}];

for (var i = 0; i < Shaders.sets.length; i++) {
  ShadersMenuItems.push({
    title: Shaders.sets[i].name,
    item: Shaders.sets[i].name
  });
}

var ShadersMenu = new MenuSystem.Menu(ShadersMenuSettings,ShadersMenuItems,MainMenu);

ShadersMenu.handler = function (event, action) {
  //mp.msg.warn(event + " - " + action)
  switch (event) {
    case "enter":
      ShadersMenu.hideMenu();
      if (action == "select") {
        Utils.externalUtil("a4k");
      } else {
        Shaders.apply(action);
        ShadersMenu.setDescription(
          "Shaders are used for post-proccesing. Anime4K will make Cartoon & Anime look even better.    Use the right arrow key to preview a profile. Use Enter to confirm.    Currently enabled Shaders: " +
            Shaders.name
         );
        if (action != "clear") {
          mp.osd_message(
            Ass.startSeq() +
              Ass.size(11) +
              "Shaders: {\\c&H0cff00&}enabled " +
              Shaders.name
          );
        }
      }
      break;
    case "right":
      if (
        action != "back" &&
        action != "select" &&
        action != "clear"
      ) {
        Shaders.apply(action);
        ShadersMenu.setDescription(
         "Shaders are used for post-proccesing. Anime4K will make Cartoon & Anime look even better.    Use the right arrow key to preview a profile. Use Enter to confirm.    Currently enabled Shaders: " +
           Shaders.name
        );
        ShadersMenu.AppendSuffixToCurrentItem();
      }
      break;
  }
};

var ChaptersMenuSettings = {
  image: "chapters",
  title: "{\\1c&H782B78&}"+Ass.insertSymbolFA("")+Ass.white()+"Chapters",
  description: '(Use the Right Arrow Key to change settings.)        This will autodetect Openings, Endings and Previews and then either "skip" or "slowdown" them.    Current Mode: ' +
  Chapters.mode +
  "    Currently " +
  Chapters.status
}

var ChaptersMenuItems = [
{
  title: "Confirm        ",
  item: "confirm",
},
{
  title: "[Change Mode]",
  item: "tmode",
},
{
  title: "[Toggle]",
  item: "tstatus",
}
];

var ChaptersMenu = new MenuSystem.Menu(ChaptersMenuSettings,ChaptersMenuItems,MainMenu);

ChaptersMenu.handler = function (event, action) {
  switch (event) {
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
          '(Use the Right Arrow Key to change settings.)        This will autodetect Openings, Endings and Previews and then either "skip" or "slowdown" them.    Current Mode: ' +
            Chapters.mode +
            "    Currently " +
            Chapters.status
        );
        ChaptersMenu.AppendSuffixToCurrentItem();

      } else if (action == "tstatus") {
        if (Chapters.status == "disabled") {
          Chapters.status = "enabled";
        } else {
          Chapters.status = "disabled";
        }
        ChaptersMenu.setDescription(
          '(Use the Right Arrow Key to change settings.)        This will autodetect Openings, Endings and Previews and then either "skip" or "slowdown" them.    Current Mode: ' +
            Chapters.mode +
            "    Currently " +
            Chapters.status
        );
        ChaptersMenu.AppendSuffixToCurrentItem();
      }
      break;
  }
};

var SettingsMenuSettings = {
  image: "settings",
  title: "{\\1c&H782B78&}"+Ass.insertSymbolFA("")+Ass.white()+"Settings",
  description: "easympv-scripts " + version
}

var SettingsMenuItems = [
  {
    title: "More Options...    ",
    item: "options",
  },
  {
    title: "Credits and Licensing",
    item: "credits",
  },
  {
    title: "Override Subtitle Style",
    item: "ass",
  },
  {
    title: "Toggle Discord RPC    ",
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
    title: "Edit input.conf    ",
    item: "inputconf",
  },
  {
    title: "Input a command",
    item: "command",
  },
  {
    title: "Open config folder            ",
    item: "config",
  },
  {
    title: "Clear watchlater data",
    item: "clearwld",
  }
];

if (!manual) {
  SettingsMenuItems.splice(1,0,{
    title: "Check for updates",
    item: "updater"
  });
}

if (randomPipeNames) {
  SettingsMenuItems.push({
    title: "Switch to insecure IPC server (!)    ",
    item: "remote"
  });
}
if (!manual) {
  SettingsMenuItems.push({
    title: "Uninstall...",
    item: "reset",
    color : "ff0000"
  });
}

if (debug == true) {
  SettingsMenuItems.push({
    title: "Open console",
    item: "console",
  });
  SettingsMenuItems.push({
    title: "Open debug screen",
    item: "debug",
  });
}

var SettingsMenu = new MenuSystem.Menu(SettingsMenuSettings,SettingsMenuItems,MainMenu);

SettingsMenu.handler = function (event, action) {
  if(event == "enter") {
    SettingsMenu.hideMenu();
    if (action == "ass") {
      toggle_assoverride();
    } else if (action == "discord") {
      mp.commandv("script-binding", "drpc_toggle");
    } else if (action == "easympvconf") {
      Utils.openFile("script-opts+easympv.conf");
    } else if (action == "mpvconf") {
      Utils.openFile("mpv.conf");
    } else if (action == "inputconf") {
      Utils.openFile("input.conf");
    } else if (action == "updater") {
      Utils.externalUtil("update");
    } else if (action == "reset") {
      Utils.externalUtil("reset");
    } else if (action == "config") {
      Utils.openFile(""); // yes, empty string, see Utils.openFile()
    } else if (action == "clearwld") {
      Utils.clearWatchdata();
    } else if (action == "command") {
      Utils.externalUtil("guicommand " + randomPipeName);
    } else if (action == "options") {
      Utils.externalUtil("options");
    } else if (action == "console") {
      Utils.externalUtil("console");
    } else if (action == "credits") {
      Utils.externalUtil("credits");
    } else if (action == "debug") {
      Utils.externalUtil("debug " + randomPipeName);
    } else if (action == "remote") {
      randomPipeName = "mpv";
      randomPipeNames = false;
      mp.set_property("input-ipc-server", "mpv");
    }
  }
};

var ColorsMenuSettings = {
  image: "colors",
  title: Ass.insertSymbolFA("") + "{\\1c&H375AFC&}C{\\1c&H46AEFF&}o{\\1c&H17E8FF&}l{\\1c&H70BF47&}o{\\1c&HFFD948&}r{\\1c&HE6A673&}s",
  description: "Use the right arrow key to preview a profile. Use Enter to confirm.    Profiles can be customized in the preferences.    Current Profile: " +
  Colors.lookName
}

var ColorsMenuItems = [
  {
    title: "[Disable All Presets]",
    item: "reset",
  },
  {
    title: "[Select Default Preset]        ",
    item: "default",
  }
];

for (var title in Colors.presetCache) {
  ColorsMenuItems.push({
    title: title,
    item: Colors.presetCache[title],
  });
}

var ColorsMenu = new MenuSystem.Menu(ColorsMenuSettings, ColorsMenuItems, MainMenu);

ColorsMenu.handler = function (event, action) {
  var selection = ColorsMenu.getSelectedItem();

  switch (event) {
    case "enter":
      ColorsMenu.hideMenu();
      if (action == "default") {
        Utils.externalUtil("color");
      } else {
        Colors.applyLookWithFeedback(selection.title, action);
      }
      break;
    case "right":
      if (
        action != "back" &&
        action != "reset" &&
        action != "default"
      ) {
        Colors.applyLookWithFeedback(selection.title, action);
        //Colors.applyLook(action);
        ColorsMenu.setDescription(
          "Use the right arrow key to preview a profile. Use Enter to confirm.    Profiles can be customized in the preferences.    Current Profile: " +
            Colors.lookName
        );
        ColorsMenu.AppendSuffixToCurrentItem();
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

// TODO: Remove or expand
mp.add_key_binding("n", "toggle-sofa", function () {
  // undocumented, woohoo!
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

// Mouse Input preliminary work
/*
mp.observe_property(
  "mouse-pos",
  undefined,
  function() {
    var json_mouse = JSON.parse(mp.get_property("mouse-pos"));
    var x =  json_mouse.x;
    var y =  json_mouse.y;
    //mp.msg.info("Current mouse coords: X " + x + ", Y " + y);
  }
);
*/
// Set startup preset from file
var startupPreset = colorboxuserConfig.getValue("startup_preset");
if (startupPreset.length) {
  Colors.lookName = startupPreset;
  Colors.applyLookByName(startupPreset);
}
