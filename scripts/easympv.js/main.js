/*
 * EASYMPV.JS(main.js), using parts of COLORBOX.JS by VideoPlayerCode
 *
 * Author:              Jong
 * URL:                 http://smto.pw/mpv
 * License:             Apache License, Version 2.0
 *
 * Useful links:
 * LUA documentation, most functions are the same in javascript:
 *     https://github.com/mpv-player/mpv/blob/master/DOCS/man/lua.rst
 * JavaScript documentation, for the few odd ones out:
 *     https://github.com/mpv-player/mpv/blob/master/DOCS/man/javascript.rst
 * input.conf documentation, for commands, properties and other tidbits
 *     https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst
 *     https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst#property-list
 *
 * Important!
 *     mpv uses MuJS, which is ES5 compliant, but not ES6!
 *     Most IE polyfills can be used though.
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

mp.msg.info("Starting!");
var Options = require("./Options"),
  Utils = require("./Utils"),
  Ass = require("./AssFormat"),
  OSD = require("./OSD"),
  Shaders = require("./Shaders"),
  Colors = require("./Colors"),
  Chapters = require("./Chapters"),
  Menu = require("./Menus"),
  randomPipeNames = true,
  assOverride = false,
  subtitleStyleOverride = false,
  version = "1.7",
  manual = false,
  debug = false;

var userConfig = new Options.advanced_options(
  {
    anime4k_strengh: 4,
    anime4k_strength: 4,
    subtitleStyleOverride: false,
    useRandomPipeName: true,
    manualInstallation: false,
    debugMode: false,
  },
  "easympv"
);

// get values from settings file
debug = userConfig.getValue("debugMode");
subtitleStyleOverride = userConfig.getValue("subtitleStyleOverride");
randomPipeNames = userConfig.getValue("useRandomPipeName");
manual = userConfig.getValue("manualInstallation");

if (userConfig.getValue("anime4k_strengh") != 4) {
  // typo correction
  Shaders.anime4k_strength = userConfig.getValue("anime4k_strengh");
} else {
  Shaders.anime4k_strength = userConfig.getValue("anime4k_strength");
}

var colorboxuserConfig = new Options.advanced_options(
  {
    presets: [],
    startup_preset: "",
  },
  "colorbox"
);

mp.msg.info("Loading color presets...");
Colors.buildCache(colorboxuserConfig.getValue("presets"));

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
    mp.msg.info("Indexed image: " + imageArray[i]);
  }
}
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
mp.set_property("input-ipc-server", randomPipeName);

if (!manual) {
  mp.msg.info("Checking for updates...");
  // Utility will check for updates and write a short lua script to scripts folder if outdated
  Utils.externalUtil("check");
}

// mp.utils.file_info(mp.utils.get_user_path("~~/FOLDER/")+"FILE") ; just an old snippet, how to check for a file (check for undefined)

var toggle_assoverride = function (silent) {
  if (assOverride == false) {
    assOverride = true;
    mp.set_property("sub-ass-styles", "~~/shaders/hs.ass");
    mp.set_property("blend-subtitles", "no");
    mp.set_property("sub-ass-scale-with-window", "yes");
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
    mp.set_property("blend-subtitles", "yes");
    mp.set_property("sub-ass-scale-with-window", "no");
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

Utils.cacheWL();

mp.msg.info(
  'Please ignore "Error parsing option shader (option not found)" errors. They are expected.'
);

(function () {
  var on_start = function () {
    // this function gets executed on file-load event

    // unlock speedcaps
    mp.msg.info("Unlocking speedcaps for scaletempo2...");
    mp.commandv(
      "af",
      "remove",
      "scaletempo2"
    );
    mp.commandv(
      "af",
      "add",
      "scaletempo2=min-speed=0.1:max-speed=10.0:search-interval=30:window-size=20"
    );


    mp.msg.info("Applying startup shader...");
    if (!mp.get_property("path").includes("video=")) {
      Shaders.apply("a4k_auto_event"); // autoapply a4k
    }
    if (subtitleStyleOverride) {
      toggle_assoverride(true);
    }

    // checks for default.sofa and applies it as an audio filter if found
    if (
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

    var wld = Utils.getWLData();
    if (wld != undefined) {
      Shaders.applyByName(wld.shader);
      Colors.applyLookByName(wld.color);
    }
  };

  var on_shutdown = function () {
    mp.msg.info("Writing data to watch_later...");
    Utils.writeWLData(Shaders.name,Colors.lookName);
  };


  mp.add_key_binding(null, "easympv", function () {
    mp.msg.info("Menu key pressed!");
    Menu.rebuild();
    if (
      !Menu.main.isMenuActive() &&
      !Menu.shaders.isMenuActive() &&
      !Menu.chapters.isMenuActive() &&
      !Menu.settings.isMenuActive() &&
      !Menu.colors.isMenuActive()
    ) {
      Menu.main.setTitle("easympv");

      Menu.colors.setTitle("easympv colors");
      Menu.colors.setDescription(
        "Use the right arrow key to preview a profile. Use Enter to confirm.\nProfiles can be customized in the preferences.\nCurrent Profile: " +
          Colors.lookName
      );

      Menu.settings.setTitle("easympv preferences");
      Menu.settings.setDescription("easympv(plugin), version " + version);

      Menu.chapters.setTitle("easympv chapters");
      Menu.chapters.setDescription(
        '(Use the Right Arrow Key to change settings.)\n\nThis will autodetect Openings, Endings and Previews and then either "skip" or "slowdown" them.\nCurrent Mode: ' +
          Chapters.mode +
          "\nCurrently " +
          Chapters.status
      );

      Menu.shaders.setTitle("easympv shaders");
      Menu.shaders.setDescription(
        "Shaders are used for post-proccesing. Anime4K will make Cartoon & Anime look even better.\nUse the right arrow key to preview a profile. Use Enter to confirm.\nCurrently enabled Shaders: " +
          Shaders.name
      );

      Menu.main.renderMenu();
    } else {
      Menu.main.hideMenu();
      Menu.shaders.hideMenu();
      Menu.chapters.hideMenu();
      Menu.settings.hideMenu();
      Menu.colors.hideMenu();
    }
  });

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

  mp.register_event("file-loaded", on_start);
  mp.register_event("shutdown", on_shutdown);

  mp.observe_property(
    "chapter-metadata/by-key/title",
    undefined,
    Chapters.Handler
  ); // hacky way to detect a chapter change

  mp.observe_property(
    "mouse-pos",
    undefined,
    function() {
      var json_mouse = JSON.parse(mp.get_property("mouse-pos"));
      var x =  json_mouse.x;
      var y =  json_mouse.y;
      //mp.msg.info("Current mouse coords: X " + x + ", Y " + y);
    }
  ); // mouse input

  //mp.observe_property("chapter-metadata/by-key/title", undefined, early_load)

  var startupPreset = colorboxuserConfig.getValue("startup_preset");
  if (startupPreset.length) {
    Colors.lookName = startupPreset;
    Colors.applyLookByName(startupPreset);
  }
})();
