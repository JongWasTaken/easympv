/*
 * MENUS.JS (MODULE)
 *
 * Author:              Jong
 * URL:                 https://smto.pw/mpv
 * License:             MIT License
 *
 */

var Menu = {},
Utils = require("./Utils"),
Ass = require("./AssFormat"),
OSD = require("./OSD"),
Shaders = require("./Shaders"),
Colors = require("./Colors"),
Chapters = require("./Chapters"),
SelectionMenu = require("./SelectionMenu");

var auto_close = 5;
var max_lines= 15;
var font_size= 30;
var font_alpha= 1.0;

Menu.main = new SelectionMenu({
    autoCloseDelay: auto_close,
    maxLines: max_lines,
    menuFontSize: font_size,
    menuFontAlpha: font_alpha,
    titleImage: "logo",
    titleImageX: 36,
    titleImageY: 30,
  });

  Menu.main.build = function () {
    var options = [];
    options.push({
      menuText: "Close\n\n",
      item: "close",
    });
    if(mp.get_property("path") != null)
    {
      if(mp.get_property("path").includes("video="))
      {
       options.push({
         menuText: "[Reload Video Device]\n",
         item: "videodevice_reload",
       });
      }
    }
     if(Number(mp.get_property("playlist-count")) > 1) {
       options.push({
         menuText: "[Shuffle playlist]\n",
         item: "shuffle",
       });
     }
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
        } else if (selection.item == "videodevice_reload") {
          Utils.externalUtil("videoreload "+randomPipeName);
        }
    }
  };

  Menu.main.resetText = function () {
    Menu.main.setTitle("easympv");
  };

  Menu.main.setCallbackMenuOpen(Menu.main.handler);
  Menu.main.setCallbackMenuRight(Menu.main.handler);

  Menu.shaders = new SelectionMenu({
    autoCloseDelay: auto_close,
    maxLines: max_lines,
    menuFontSize: font_size,
    menuFontAlpha: font_alpha,
    titleImage: "shaders",
    titleImageX: 36,
    titleImageY: 30,
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
      item: "a4k_auto",
    });
    var i;
    for (i = 0; i < Shaders.sets.length; i++) {
      options.push({
        menuText: Shaders.sets[i].name,
        item: Shaders.sets[i].name,
      });
    }

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

  Menu.shaders.resetText = function () {
    Menu.shaders.setTitle("Shaders");
    Menu.shaders.setDescription(
      "Shaders are used for post-proccesing. Anime4K will make Cartoon & Anime look even better.\nUse the right arrow key to preview a profile. Use Enter to confirm.\nCurrently enabled Shaders: " +
        Shaders.name
    );
  };

  Menu.shaders.setCallbackMenuOpen(Menu.shaders.handler);
  Menu.shaders.setCallbackMenuRight(Menu.shaders.handler);

  Menu.chapters = new SelectionMenu({
    autoCloseDelay: auto_close,
    maxLines: max_lines,
    menuFontSize: font_size,
    menuFontAlpha: font_alpha,
    titleImage: "chapters",
    titleImageX: 36,
    titleImageY: 30,
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
      menuText: "[Change Mode]",
      item: "tmode",
    });
    options.push({
      menuText: "[Toggle]",
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
          Menu.chapters.renderMenu("(Changed to "+Chapters.mode+")");
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
          Menu.chapters.renderMenu("(Changed to "+Chapters.status+")");
        }
        break;
    }
  };

  Menu.chapters.resetText = function () {
    Menu.chapters.setTitle("Chapters");
    Menu.chapters.setDescription(
      '(Use the Right Arrow Key to change settings.)\n\nThis will autodetect Openings, Endings and Previews and then either "skip" or "slowdown" them.\nCurrent Mode: ' +
        Chapters.mode +
        "\nCurrently " +
        Chapters.status
    );
  };

  Menu.chapters.setCallbackMenuOpen(Menu.chapters.handler);
  Menu.chapters.setCallbackMenuRight(Menu.chapters.handler);

  Menu.settings = new SelectionMenu({
    autoCloseDelay: auto_close,
    maxLines: max_lines,
    menuFontSize: font_size,
    menuFontAlpha: font_alpha,
    titleImage: "settings",
    titleImageX: 36,
    titleImageY: 30,
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
        menuText: "Switch to insecure IPC server (!)\n",
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

  Menu.settings.resetText = function (version) {
    Menu.settings.setTitle("Settings");
    Menu.settings.setDescription("easympv-scripts " + version);
  };

  Menu.settings.setCallbackMenuOpen(Menu.settings.handler);
  Menu.settings.setCallbackMenuRight(Menu.settings.handler);

  Menu.colors = new SelectionMenu({
    autoCloseDelay: auto_close,
    maxLines: max_lines,
    menuFontSize: font_size,
    menuFontAlpha: font_alpha,
    titleImage: "colors",
    titleImageX: 36,
    titleImageY: 30,
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

  Menu.colors.resetText = function () {
    Menu.colors.setTitle("Colors");
    Menu.colors.setDescription(
      "Use the right arrow key to preview a profile. Use Enter to confirm.\nProfiles can be customized in the preferences.\nCurrent Profile: " +
        Colors.lookName
    );
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

module.exports = Menu;