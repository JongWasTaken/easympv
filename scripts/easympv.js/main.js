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

// Lets Go!
mp.msg.info("Starting!");
var Options = require("./Options"),
  Utils = require("./Utils"),
  Ass = require("./AssFormat"),
  OSD = require("./OSD"),
  Shaders = require("./Shaders"),
  Colors = require("./Colors"),
  Chapters = require("./Chapters"),
  Menu = require("./Menus"),
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
mp.msg.info(
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

// Add menu key binding and its logic
mp.add_key_binding(null, "easympv", function () {
  mp.msg.info("Menu key pressed!");
  // Rebuild menu
  Menu.rebuild();
  // If no menu is active, show main menu
  if (
    !Menu.main.isMenuActive() &&
    !Menu.shaders.isMenuActive() &&
    !Menu.chapters.isMenuActive() &&
    !Menu.settings.isMenuActive() &&
    !Menu.colors.isMenuActive()
  ) {
    // Titles and Descriptions are reset in case they have been modified
    Menu.main.resetText();
    Menu.colors.resetText();
    Menu.settings.resetText(version);
    Menu.chapters.resetText();
    Menu.shaders.resetText();

    Menu.main.renderMenu();
  // Else hide all menus (second keypress)
  } else {
    Menu.main.hideMenu();
    Menu.shaders.hideMenu();
    Menu.chapters.hideMenu();
    Menu.settings.hideMenu();
    Menu.colors.hideMenu();
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
