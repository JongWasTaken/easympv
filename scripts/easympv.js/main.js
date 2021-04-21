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
  SelectionMenu = require("./SelectionMenu"),
  randomPipeNames = true,
  assOverride = false,
  Menu = {},
  subtitleStyleOverride = false,
  version = "1.7",
  manual = false,
  debug = false;

var userConfig = new Options.advanced_options(
  {
    auto_close: 5,
    max_lines: 20,
    font_size: 30,
    font_alpha: 1.0,
    anime4k_strengh: 4,
    anime4k_strength: 4,
    subtitleStyleOverride: false,
    useRandomPipeName: true,
    manualInstallation: false,
    debugMode: false,
    keys_menu_up: "{up}",
    keys_menu_down: "{down}",
    keys_menu_up_fast: "{shift+up}",
    keys_menu_down_fast: "{shift+down}",
    keys_menu_left: "{left}",
    keys_menu_right: "{right}",
    keys_menu_open: "{enter}",
    keys_menu_undo: "{bs}",
    keys_menu_help: "{h}",
    keys_menu_close: "{esc}",
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
    auto_close: 5,
    max_lines: 20,
    font_size: 30,
    font_alpha: 1.0,
    keys_menu_up: "{up}",
    keys_menu_down: "{down}",
    keys_menu_up_fast: "{shift+up}",
    keys_menu_down_fast: "{shift+down}",
    keys_menu_left: "{left}",
    keys_menu_right: "{right}",
    keys_menu_open: "{enter}",
    keys_menu_undo: "{bs}",
    keys_menu_help: "{h}",
    keys_menu_close: "{esc}",
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

mp.msg.info("Indexing WL...");
var wlFilesCache = mp.utils.readdir(
  mp.utils.get_user_path("~~/watch_later/"),
  "files"
);
var wlCache = [];
for (i = 0; i < wlFilesCache.length; i++) {
  var file = {
    name: wlFilesCache[i],
    content: mp.utils.read_file(
      mp.utils.get_user_path("~~/watch_later/") + wlFilesCache[i]
    ),
  };
  wlCache.push(file);
}

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

    var cFile;
    for (i = 0; i < Number(mp.get_property("playlist/count")); i++) {
      if (mp.get_property("playlist/" + i + "/current") == "yes") {
        cFile = mp.get_property("playlist/" + i + "/filename");
      }
    }
    cFile = Utils.md5(cFile).toUpperCase();

    var wlName;
    var wlContent;

    for (i = 0; i < wlCache.length; i++) {
      if (wlCache[i].name == cFile) {
        wlName = wlCache[i].name;
        wlContent = wlCache[i].content;
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
      Shaders.applyByName(cShader);
      Colors.applyLookByName(cColor);
    }
  };

  var on_shutdown = function () {
    mp.msg.info("Writing data to watch_later...");
    var cFile;
    for (i = 0; i < Number(mp.get_property("playlist/count")); i++) {
      if (mp.get_property("playlist/" + i + "/current") == "yes") {
        cFile = mp.get_property("playlist/" + i + "/filename");
      }
    }
    var WLfile =
      mp.utils.get_user_path("~~/") +
      "/watch_later/" +
      Utils.md5(cFile).toUpperCase();
    var WLtmp = mp.utils.read_file(WLfile);
    var cShader = Shaders.name;
    var cColor = Colors.lookName;
    var WLtmp = WLtmp + "shader=" + cShader + "\n" + "color=" + cColor + "\n";
    mp.utils.write_file("file://" + WLfile, WLtmp);
  };

  Menu.main = new SelectionMenu({
    maxLines: userConfig.getValue("max_lines"),
    menuFontAlpha: userConfig.getValue("font_alpha"),
    menuFontSize: userConfig.getValue("font_size"),
    autoCloseDelay: userConfig.getValue("auto_close"),
    titleImage: "logo",
    titleImageX: 36,
    titleImageY: 30,
    keyRebindings: {
      "Menu-Up": userConfig.getMultiValue("keys_menu_up"),
      "Menu-Down": userConfig.getMultiValue("keys_menu_down"),
      "Menu-Up-Fast": userConfig.getMultiValue("keys_menu_up_fast"),
      "Menu-Down-Fast": userConfig.getMultiValue("keys_menu_down_fast"),
      "Menu-Left": userConfig.getMultiValue("keys_menu_left"),
      "Menu-Right": userConfig.getMultiValue("keys_menu_right"),
      "Menu-Open": userConfig.getMultiValue("keys_menu_open"),
      "Menu-Undo": userConfig.getMultiValue("keys_menu_undo"),
      "Menu-Help": userConfig.getMultiValue("keys_menu_help"),
      "Menu-Close": userConfig.getMultiValue("keys_menu_close"),
    },
  });

  Menu.main.build = function () {
    var options = [];
    options.push({
      menuText: "Close\n\n",
      item: "close",
    });
    options.push({
      menuText: "Open...",
      item: "open",
    });
    /*
    options.push({
        'menuText': 'Show playlist',
        'item': 'show'
    });
    */
    options.push({
      menuText: "Shuffle playlist\n",
      item: "shuffle",
    });
    options.push({
      menuText: "Shaders",
      item: "shaders",
    });
    options.push({
      menuText: "Colors",
      item: "colors",
    });
    options.push({
      menuText: "Chapters\n",
      item: "chapters",
    });
    options.push({
      menuText: "Preferences\n\n",
      item: "options",
    });
    options.push({
      menuText: "Quit mpv",
      item: "quit",
    });
    return {
      options: options,
    };
  };

  Menu.main.handler = function (action) {
    var selection = Menu.main.getSelectedItem();
    switch (action) {
      case "Menu-Open":
        Menu.main.hideMenu();
        if (selection.item == "colors") {
          if (!Menu.colors.isMenuActive()) {
            Menu.colors.renderMenu();
          } else {
            Menu.colors.hideMenu();
          }
        } else if (selection.item == "shaders") {
          if (!Menu.shaders.isMenuActive()) {
            Menu.shaders.renderMenu();
          } else {
            Menu.shaders.hideMenu();
          }
        } else if (selection.item == "chapters") {
          if (!Menu.chapters.isMenuActive()) {
            Menu.chapters.renderMenu();
          } else {
            Menu.chapters.hideMenu();
          }
        } else if (selection.item == "options") {
          if (!Menu.settings.isMenuActive()) {
            Menu.settings.renderMenu();
          } else {
            Menu.settings.hideMenu();
          }
        } else if (selection.item == "close") {
          Menu.main.hideMenu();
        } else if (selection.item == "show") {
          Menu.main.hideMenu();
          var playlist = "   ";
          var i;
          for (i = 0; i < mp.get_property("playlist/count"); i++) {
            if (mp.get_property("playlist/" + i + "/playing") === "yes") {
              playlist = playlist + "➤ ";
            } else {
              playlist = playlist + "   ";
            }
            playlist =
              playlist + mp.get_property("playlist/" + i + "/filename") + "\n";
          }
          mp.osd_message(Ass.startSeq() + Ass.size(8) + playlist, 3);
        } else if (selection.item == "shuffle") {
          mp.commandv("playlist-shuffle");
        } else if (selection.item == "open") {
          Utils.externalUtil("open " + randomPipeName);
        } else if (selection.item == "quit") {
          mp.commandv("quit_watch_later");
        }
    }
  };

  Menu.main.setCallbackMenuOpen(Menu.main.handler);
  Menu.main.setCallbackMenuRight(Menu.main.handler);

  Menu.shaders = new SelectionMenu({
    maxLines: userConfig.getValue("max_lines"),
    menuFontAlpha: userConfig.getValue("font_alpha"),
    menuFontSize: userConfig.getValue("font_size"),
    autoCloseDelay: userConfig.getValue("auto_close"),
    titleImage: "shaders",
    titleImageX: 36,
    titleImageY: 30,
    keyRebindings: {
      "Menu-Up": userConfig.getMultiValue("keys_menu_up"),
      "Menu-Down": userConfig.getMultiValue("keys_menu_down"),
      "Menu-Up-Fast": userConfig.getMultiValue("keys_menu_up_fast"),
      "Menu-Down-Fast": userConfig.getMultiValue("keys_menu_down_fast"),
      "Menu-Left": userConfig.getMultiValue("keys_menu_left"),
      "Menu-Right": userConfig.getMultiValue("keys_menu_right"),
      "Menu-Open": userConfig.getMultiValue("keys_menu_open"),
      "Menu-Undo": userConfig.getMultiValue("keys_menu_undo"),
      "Menu-Help": userConfig.getMultiValue("keys_menu_help"),
      "Menu-Close": userConfig.getMultiValue("keys_menu_close"),
    },
  });

  Menu.shaders.build = function () {
    var options = [];
    options.push({
      menuText: "Back\n\n",
      item: "back",
    });

    options.push({
      menuText: "[Disable All Shaders]",
      item: "clear",
    });

    options.push({
      menuText: "[Select Default Shader]\n\n",
      item: "select",
    });

    options.push({
      menuText: "Recommended Anime4K Settings\n",
      item: "a4k_auto_user",
    });
    options.push({
      menuText: "SD Anime4K Faithful",
      item: "a4k_sd_1",
    });
    options.push({
      menuText: "SD Anime4K Improved",
      item: "a4k_sd_2",
    });
    options.push({
      menuText: "SD Anime4K Improved & Deblured\n",
      item: "a4k_sd_3",
    });
    options.push({
      menuText: "HD Anime4K Faithful",
      item: "a4k_hd_1",
    });
    options.push({
      menuText: "HD Anime4K Improved",
      item: "a4k_hd_2",
    });
    options.push({
      menuText: "HD Anime4K Improved & Deblured\n",
      item: "a4k_hd_3",
    });
    options.push({
      menuText: "Adaptive Sharpen",
      item: "adaptivesharpen",
    });
    options.push({
      menuText: "KrigBilateral (experimental)",
      item: "krig",
    });
    options.push({
      menuText: "A4K Denoiser (experimental)",
      item: "a4k_denoise",
    });
    options.push({
      menuText: "FSRCNNX (High x16/experimental)",
      item: "FSRCNNX16",
    });
    options.push({
      menuText: "FXAA",
      item: "fxaa",
    });
    options.push({
      menuText: "CRT",
      item: "crt",
    });
    options.push({
      menuText: "NNEDI3 (128 Neurons/experimental)",
      item: "nnedi3_128",
    });
    /*
    options.push({
        'menuText': 'NNEDI3 (256 Neurons/experimental)',
        'item': 'nnedi3_256'
    });
    */
    return {
      options: options,
    };
  };

  Menu.shaders.handler = function (action) {
    var selection = Menu.shaders.getSelectedItem();
    switch (action) {
      case "Menu-Open":
        Menu.shaders.hideMenu();
        if (selection.item == "back") {
          if (!Menu.main.isMenuActive()) {
            Menu.main.renderMenu();
          } else {
            Menu.main.hideMenu();
          }
        } else if (selection.item == "select") {
          Utils.externalUtil("a4k");
        } else {
          Shaders.apply(selection.item);
          if (selection.item != "clear") {
            mp.osd_message(
              Ass.startSeq() +
                Ass.size(14) +
                "Shaders: {\\c&H0cff00&}enabled " +
                Shaders.name
            );
          }
        }
        break;

      case "Menu-Right":
        var cselection = Menu.shaders.getIdx();
        if (
          selection.item != "back" &&
          selection.item != "select" &&
          selection.item != "clear"
        ) {
          Shaders.apply(selection.item);
          Menu.shaders.setDescription(
            "Shaders are used for post-proccesing. Anime4K will make Cartoon & Anime look even better.\nUse the right arrow key to preview a profile. Use Enter to confirm.\nCurrently enabled Shaders: " +
              Shaders.name
          );
          Menu.shaders.setIdx(cselection);
          Menu.shaders.renderMenu("*");
        }
        break;
    }
  };
  Menu.shaders.setCallbackMenuOpen(Menu.shaders.handler);
  Menu.shaders.setCallbackMenuRight(Menu.shaders.handler);

  Menu.chapters = new SelectionMenu({
    maxLines: userConfig.getValue("max_lines"),
    menuFontAlpha: userConfig.getValue("font_alpha"),
    menuFontSize: userConfig.getValue("font_size"),
    autoCloseDelay: 30,
    keyRebindings: {
      "Menu-Up": userConfig.getMultiValue("keys_menu_up"),
      "Menu-Down": userConfig.getMultiValue("keys_menu_down"),
      "Menu-Up-Fast": userConfig.getMultiValue("keys_menu_up_fast"),
      "Menu-Down-Fast": userConfig.getMultiValue("keys_menu_down_fast"),
      "Menu-Left": userConfig.getMultiValue("keys_menu_left"),
      "Menu-Right": userConfig.getMultiValue("keys_menu_right"),
      "Menu-Open": userConfig.getMultiValue("keys_menu_open"),
      "Menu-Undo": userConfig.getMultiValue("keys_menu_undo"),
      "Menu-Help": userConfig.getMultiValue("keys_menu_help"),
      "Menu-Close": userConfig.getMultiValue("keys_menu_close"),
    },
  });

  Menu.chapters.build = function () {
    var options = [];
    options.push({
      menuText: "Back\n\n",
      item: "back",
    });
    options.push({
      menuText: "Confirm\n\n",
      item: "confirm",
    });
    options.push({
      menuText: "Toggle Mode →",
      item: "tmode",
    });
    options.push({
      menuText: "Toggle Status →",
      item: "tstatus",
    });
    return {
      options: options,
    };
  };

  Menu.chapters.handler = function (action) {
    var selection = Menu.chapters.getSelectedItem();
    switch (action) {
      case "Menu-Open":
        if (selection.item == "back") {
          Menu.chapters.hideMenu();
          if (!Menu.main.isMenuActive()) {
            Menu.main.renderMenu();
          } else {
            Menu.main.hideMenu();
          }
        } else if (selection.item == "confirm") {
          Menu.chapters.hideMenu();
        }
        break;
      case "Menu-Right":
        var cselection = Menu.chapters.getIdx();
        if (selection.item == "tmode") {
          if (Chapters.mode == "skip") {
            Chapters.mode = "slowdown";
          } else {
            Chapters.mode = "skip";
          }
          Menu.chapters.setDescription(
            '(Use the Right Arrow Key to change settings.)\n\nThis will autodetect Openings, Endings and Previews and then either "skip" or "slowdown" them.\nCurrent Mode: ' +
              Chapters.mode +
              "\nCurrently " +
              Chapters.status
          );
          Menu.chapters.setIdx(cselection);
          Menu.chapters.renderMenu("*");
        } else if (selection.item == "tstatus") {
          if (Chapters.status == "disabled") {
            Chapters.status = "enabled";
          } else {
            Chapters.status = "disabled";
          }
          Menu.chapters.setDescription(
            '(Use the Right Arrow Key to change settings.)\n\nThis will autodetect Openings, Endings and Previews and then either "skip" or "slowdown" them.\nCurrent Mode: ' +
              Chapters.mode +
              "\nCurrently " +
              Chapters.status
          );
          Menu.chapters.setIdx(cselection);
          Menu.chapters.renderMenu("*");
        }
        break;
    }
  };
  Menu.chapters.setCallbackMenuOpen(Menu.chapters.handler);
  Menu.chapters.setCallbackMenuRight(Menu.chapters.handler);

  Menu.settings = new SelectionMenu({
    maxLines: userConfig.getValue("max_lines"),
    menuFontAlpha: userConfig.getValue("font_alpha"),
    menuFontSize: userConfig.getValue("font_size"),
    autoCloseDelay: userConfig.getValue("auto_close"),
    keyRebindings: {
      "Menu-Up": userConfig.getMultiValue("keys_menu_up"),
      "Menu-Down": userConfig.getMultiValue("keys_menu_down"),
      "Menu-Up-Fast": userConfig.getMultiValue("keys_menu_up_fast"),
      "Menu-Down-Fast": userConfig.getMultiValue("keys_menu_down_fast"),
      "Menu-Left": userConfig.getMultiValue("keys_menu_left"),
      "Menu-Right": userConfig.getMultiValue("keys_menu_right"),
      "Menu-Open": userConfig.getMultiValue("keys_menu_open"),
      "Menu-Undo": userConfig.getMultiValue("keys_menu_undo"),
      "Menu-Help": userConfig.getMultiValue("keys_menu_help"),
      "Menu-Close": userConfig.getMultiValue("keys_menu_close"),
    },
  });

  Menu.settings.build = function () {
    var options = [];
    options.push({
      menuText: "Back\n\n",
      item: "back",
    });
    options.push({
      menuText: "More Options...\n",
      item: "options",
    });
    if (!manual) {
      options.push({
        menuText: "Check for updates",
        item: "updater",
      });
    }
    options.push({
      menuText: "Credits and Licensing",
      item: "credits",
    });
    options.push({
      menuText: "Override Subtitle Style",
      item: "ass",
    });
    options.push({
      menuText: "Toggle Discord RPC\n",
      item: "discord",
    });
    options.push({
      menuText: "Edit easympv.conf",
      item: "easympvconf",
    });
    options.push({
      menuText: "Edit mpv.conf",
      item: "mpvconf",
    });
    options.push({
      menuText: "Edit input.conf\n",
      item: "inputconf",
    });
    if (randomPipeNames) {
      options.push({
        menuText: "Switch to unsecure IPC server (!)\n",
        item: "remote",
      });
    }
    options.push({
      menuText: "Input a command",
      item: "command",
    });
    options.push({
      menuText: "Open config folder\n\n\n",
      item: "config",
    });
    options.push({
      menuText: "Clear watchlater data",
      item: "clearwld",
    });
    if (debug == true) {
      options.push({
        menuText: "Open console",
        item: "console",
      });
      options.push({
        menuText: "Open debug screen",
        item: "debug",
      });
    }
    if (!manual) {
      options.push({
        menuText: "Uninstall... (!)",
        item: "reset",
      });
    }

    return {
      options: options,
    };
  };

  Menu.settings.handler = function (action) {
    var selection = Menu.settings.getSelectedItem();
    switch (action) {
      case "Menu-Open":
        Menu.settings.hideMenu();
        if (selection.item == "back") {
          if (!Menu.main.isMenuActive()) {
            Menu.main.renderMenu();
          } else {
            Menu.main.hideMenu();
          }
        } else if (selection.item == "ass") {
          toggle_assoverride();
        } else if (selection.item == "discord") {
          mp.commandv("script-binding", "drpc_toggle");
        } else if (selection.item == "easympvconf") {
          Utils.openFile("script-opts+easympv.conf");
        } else if (selection.item == "mpvconf") {
          Utils.openFile("mpv.conf");
        } else if (selection.item == "inputconf") {
          Utils.openFile("input.conf");
        } else if (selection.item == "updater") {
          Utils.externalUtil("update");
        } else if (selection.item == "reset") {
          Utils.externalUtil("reset");
        } else if (selection.item == "config") {
          Utils.openFile(""); // yes, empty string, see Utils.openFile()
        } else if (selection.item == "clearwld") {
          Utils.clearWatchdata();
        } else if (selection.item == "command") {
          Utils.externalUtil("guicommand " + randomPipeName);
        } else if (selection.item == "options") {
          Utils.externalUtil("options");
        } else if (selection.item == "console") {
          Utils.externalUtil("console");
        } else if (selection.item == "credits") {
          Utils.externalUtil("credits");
        } else if (selection.item == "debug") {
          Utils.externalUtil("debug " + randomPipeName);
        } else if (selection.item == "remote") {
          randomPipeName = "mpv";
          randomPipeNames = false;
          mp.set_property("input-ipc-server", "mpv");
        }
    }
  };
  Menu.settings.setCallbackMenuOpen(Menu.settings.handler);
  Menu.settings.setCallbackMenuRight(Menu.settings.handler);

  Menu.colors = new SelectionMenu({
    maxLines: colorboxuserConfig.getValue("max_lines"),
    menuFontAlpha: colorboxuserConfig.getValue("font_alpha"),
    menuFontSize: colorboxuserConfig.getValue("font_size"),
    autoCloseDelay: colorboxuserConfig.getValue("auto_close"),
    titleImage: "colorbox",
    titleImageX: 36,
    titleImageY: 30,
    keyRebindings: {
      "Menu-Up": colorboxuserConfig.getMultiValue("keys_menu_up"),
      "Menu-Down": colorboxuserConfig.getMultiValue("keys_menu_down"),
      "Menu-Up-Fast": colorboxuserConfig.getMultiValue("keys_menu_up_fast"),
      "Menu-Down-Fast": colorboxuserConfig.getMultiValue("keys_menu_down_fast"),
      "Menu-Left": colorboxuserConfig.getMultiValue("keys_menu_left"),
      "Menu-Right": colorboxuserConfig.getMultiValue("keys_menu_right"),
      "Menu-Open": colorboxuserConfig.getMultiValue("keys_menu_open"),
      "Menu-Undo": colorboxuserConfig.getMultiValue("keys_menu_undo"),
      "Menu-Help": colorboxuserConfig.getMultiValue("keys_menu_help"),
      "Menu-Close": colorboxuserConfig.getMultiValue("keys_menu_close"),
    },
  });

  Menu.colors.build = function () {
    var title,
      options = [];

    options.push({
      menuText: "Back\n\n",
      preset: "back",
    });

    options.push({
      menuText: "[Disable All Presets]",
      preset: "reset",
    });

    options.push({
      menuText: "[Select Default Preset]\n\n",
      preset: "default",
    });

    for (title in Colors.presetCache) {
      options.push({
        menuText: title,
        preset: Colors.presetCache[title],
      });
    }

    /*
    var paddedIdx,
        missingPadLen,
        totalPadLen = (String(options.length - 2)).length;
    if (totalPadLen < 2)
        totalPadLen = 2;
    for (i = 2, len = options.length; i < len; ++i) {
        paddedIdx = String(i - 1);
        missingPadLen = paddedIdx.length - totalPadLen;
        if (missingPadLen < 0)
            paddedIdx = '0000000000'.slice(missingPadLen)+paddedIdx;
            options[i].menuText = paddedIdx + ': ' + options[i].menuText;
    }
    */

    return {
      options: options,
    };
  };

  Menu.colors.handler = function (action) {
    var selection = Menu.colors.getSelectedItem();
    if (selection.preset === "reload") {
      Menu.rebuild(true);
      return;
    }
    switch (action) {
      case "Menu-Open":
        Menu.colors.hideMenu();
        if (selection.preset == "back") {
          if (!Menu.main.isMenuActive()) {
            Menu.main.renderMenu();
          } else {
            Menu.main.hideMenu();
          }
        } else if (selection.preset == "default") {
          Utils.externalUtil("color");
        } else {
          Colors.applyLookWithFeedback(selection.menuText, selection.preset);
        }
        break;
      case "Menu-Right":
        var cselection = Menu.colors.getIdx();
        if (
          selection.preset != "back" &&
          selection.preset != "reset" &&
          selection.preset != "default"
        ) {
          Colors.applyLookWithFeedback(selection.menuText, selection.preset);
          //Colors.applyLook(selection.preset);
          Menu.colors.setDescription(
            "Use the right arrow key to preview a profile. Use Enter to confirm.\nProfiles can be customized in the preferences.\nCurrent Profile: " +
              Colors.lookName
          );
          Menu.colors.setIdx(cselection);
          Menu.colors.renderMenu("*");
        }

        break;
    }
  };

  Menu.colors.setCallbackMenuOpen(Menu.colors.handler);
  Menu.colors.setCallbackMenuRight(Menu.colors.handler);

  Menu.rebuild = function (reload) {
    if (reload) {
      var newConfig = new Options.advanced_options({ presets: [] });
      colorboxuserConfig.options.presets = newConfig.getValue("presets");
    }
    Menu.colors.setOptions(Menu.colors.build().options, 0);
    if (reload && Menu.colors.isMenuActive()) Menu.colors.renderMenu();

    Menu.main.setOptions(Menu.main.build().options, 0);
    if (reload && Menu.main.isMenuActive()) Menu.main.renderMenu();

    Menu.shaders.setOptions(Menu.shaders.build().options, 0);
    if (reload && Menu.shaders.isMenuActive()) Menu.shaders.renderMenu();

    Menu.chapters.setOptions(Menu.chapters.build().options, 0);
    if (reload && Menu.chapters.isMenuActive()) Menu.chapters.renderMenu();

    Menu.settings.setOptions(Menu.settings.build().options, 0);
    if (reload && Menu.settings.isMenuActive()) Menu.settings.renderMenu();
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

  //mp.observe_property("chapter-metadata/by-key/title", undefined, early_load)

  var startupPreset = colorboxuserConfig.getValue("startup_preset");
  if (startupPreset.length) {
    Colors.lookName = startupPreset;
    Colors.applyLookByName(startupPreset);
  }
})();
