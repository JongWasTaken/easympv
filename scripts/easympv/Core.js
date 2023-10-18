/*
 * CORE.JS (PART OF EASYMPV)
 *
 * Author:                  Jong
 * URL:                     https://github.com/JongWasTaken/easympv
 * License:                 MIT License
 */

/**
 * This module used to be main.js, but it was split to make
 * things like soft-restarts possible.
 */
var Core = {};

var isFirstFile = true;
//var sofaEnabled = false;
var resetOccured = false;
var notifyAboutUpdates = false;
Core.fancyCurrentVersion = "";
var cFile;

//TODO: clean up

Core.Menus = {};

Core.enableSaveTimer = true;
Core.enableChapterSeeking = true;

Core.setSaveTimer = function()
{
    Core.saveTimer = setInterval(function(){
        mp.command("write-watch-later-config");
    }, 30000);
}

Core.pauseSaveTimer = function(_,pause) {
    if (pause)
    {
        clearInterval(Core.saveTimer);
        Core.saveTimer = undefined;
    }
    else
    {
        if (Core.saveTimer == undefined)
        {
            Core.setSaveTimer();
        }
    }
};

Core.onFileLoad = function () {
    // mpv does not provide a reliable way to get the current filename, so we (ab)use playlists
    // (stream-open-filename does not work with relative paths and URLs!)
    for (var i = 0; i < Number(mp.get_property("playlist/count")); i++) {
        if (mp.get_property("playlist/" + i + "/current") == "yes") {
            cFile = mp.get_property("playlist/" + i + "/filename");
            break;
        }
    }

    // cFile could be a relative path, so we need to expand it
    if (cFile != undefined) {
        if (
            !OS.isWindows &&
            mp.utils.file_info(
                mp.get_property("working-directory") + "/" + cFile
            ) != undefined
        ) {
            cFile =
                mp.get_property("working-directory") +
                "/" +
                cFile.replaceAll("./", "");
        }
    }
    Browsers.FileBrowser.currentLocation = cFile;
    Browsers.FileBrowser.gotoParentDirectory();

    if (isFirstFile) {
        if (
            mp.utils.file_info(
                mp.utils.get_user_path("~~/") + "/default.sofa"
            ) != undefined
        ) {
            Utils.log("Sofa file found!");
            var path = mp.utils
                .get_user_path("~~/")
                .toString()
                .replace(/\\/g, "/")
                .substring(2);
            if (OS.isWindows)
            {
                mp.commandv(
                    "af",
                    "set",
                    "lavfi=[sofalizer=sofa=C\\\\:" + path + "/default.sofa]"
                );
            }
            else
            {
                mp.commandv(
                    "af",
                    "set",
                    "lavfi=[sofalizer=sofa=" + path + "/default.sofa]"
                );
            }
            sofaEnabled = true;
        }
        Video.Shaders.apply(Settings.Data.defaultShaderSet);
        isFirstFile = false;
        //TODO: check playlist size
        if (Autoload.enabled)
        {
            //Autoload.buildPlaylist();
            Autoload.loadedFile = cFile;
            Autoload.loadFolder();
        }
    }



    for (var i = 0; i < Settings.cache.perFileSaves.length; i++) {
        if (Settings.cache.perFileSaves[i].file == cFile){
            Video.Shaders.apply(Settings.cache.perFileSaves[i].shaderset)
            Video.Colors.apply(Settings.cache.perFileSaves[i].colorpreset);
            Settings.cache.perFileSaves.splice(i, 1);
            break;
        }
    }

    if (Settings.Data.showClock)
    {
        UI.Time.show();
    }

    if (!isFirstFile && Autoload.enabled)
    {
        Autoload.loadedFile = cFile;
        Autoload.loadFolder();
    }
};

Core.onShutdown = function () {
    if (cFile != undefined && cFile != "")
    {
        Utils.log("Saving per-file settings...","shutdown","info");
        Settings.cache.perFileSaves.push({file: cFile, shaderset: Video.Shaders.name, colorpreset: Video.Colors.name, timestamp: Date.now()});
        Settings.cache.save();
    }
};

var redrawMenus = function () {
    var currentmenu = UI.Menus.getDisplayedMenu();
    if (currentmenu != undefined) {
        var temp1 = currentmenu.settings.fadeIn;
        var temp2 = currentmenu.settings.fadeOut;
        currentmenu.settings.fadeIn = false;
        currentmenu.settings.fadeOut = false;
        currentmenu.hideMenu();
        currentmenu.showMenu();
        currentmenu.settings.fadeIn = temp1;
        currentmenu.settings.fadeOut = temp2;
    }
};

Core.doRegistrations = function () {
    var handleMenuKeypress = function () {
        if (UI.Menus.menuKeyDisabled)
        {
            return;
        }
        Utils.log("Menu key pressed!");
        var currentmenu = UI.Menus.getDisplayedMenu();
        if (currentmenu != undefined) {
            currentmenu.hideMenu();
            return;
        }
        Core.Menus.MainMenu.showMenu();
    };

    var handleChapterSeek = function(direction)
    {
        var chapters = mp.get_property("chapters");
        if (chapters == undefined) {chapters = 0;}
        else {chapters = Number(chapters);}
        var chapter = mp.get_property("chapter");
        if (chapter == undefined) {chapter = 0;}
        else {chapter = Number(chapter);}
        if ((chapter + direction) < 0)
        {
            mp.command("playlist_prev")
            mp.commandv("script-message", "osc-playlist")
        }
        else if ((chapter + direction) >= chapters)
        {
            mp.command("playlist_next")
            mp.commandv("script-message", "osc-playlist")
        }
        else
        {
            mp.commandv("add", "chapter", direction)
            mp.commandv("script-message", "osc-chapterlist")
        }
    }

    mp.add_key_binding(null, "easympv", handleMenuKeypress);
    if (Settings.Data.forcedMenuKey != "disabled")
    {
        mp.add_forced_key_binding(Settings.Data.forcedMenuKey, "easympv-forced-menu", handleMenuKeypress);
    }

    if (Core.enableChapterSeeking)
    {
        mp.add_key_binding(null, "chapter_next", function() {handleChapterSeek(1);});
        mp.add_key_binding(null, "chapter_prev", function() {handleChapterSeek(-1);});
        mp.add_key_binding(null, "empv_chapter_next", function() {handleChapterSeek(1);});
        mp.add_key_binding(null, "empv_chapter_prev", function() {handleChapterSeek(-1);});
    }

    mp.add_forced_key_binding("Ctrl+`", "empv_command_hotkey", UI.Input.showInteractiveCommandInput);
    mp.add_forced_key_binding("Ctrl+Alt+`", "empv_log_hotkey", function () {
        if (UI.Input.OSDLog.OSD == undefined)
        {
            UI.Input.OSDLog.show();
        return;
        }
        UI.Input.OSDLog.hide();
    });

    if(Settings.Data.debugMode)
    {
        mp.add_forced_key_binding("Ctrl+M", "empv_tests_hotkey", function() {
            Core.Menus.TestsMenu.showMenu();
            UI.Time.show();
            return;
        });

        mp.add_forced_key_binding("Ctrl+~", "empv_eval_hotkey", function() {
            UI.Input.showJavascriptInput();
            return;
        });
    }

    if(OS.isSteamGamepadUI)
    {
        // override keys to work with gamepad
        // THIS ASSUMES THE DEFAULT KEYBOARD+MOUSE EMULATION PRESET IN STEAM INPUT
        // using commandv does not give user feedback, so we need to that

        // left stick
        mp.add_forced_key_binding("w", "empv_steaminput_lup", function() { mp.commandv("add","volume","1"); mp.osd_message("Volume: " + Number(mp.get_property("volume")) + "%"); });
        mp.add_forced_key_binding("s", "empv_steaminput_ldown", function() { mp.commandv("add","volume","-1"); mp.osd_message("Volume: " + Number(mp.get_property("volume")) + "%"); });
        mp.add_forced_key_binding("a", "empv_steaminput_lleft", function() { mp.commandv("script_binding","chapter_prev"); });
        mp.add_forced_key_binding("d", "empv_steaminput_lright", function() { mp.commandv("script_binding","chapter_next"); });

        // dpad
        mp.add_forced_key_binding("1", "empv_steaminput_dup", function() { mp.commandv("add","speed","0.1"); mp.osd_message("Speed: " + Number(mp.get_property("speed")).toFixed(2)); });
        mp.add_forced_key_binding("3", "empv_steaminput_ddown", function() { mp.commandv("add","speed","-0.1"); mp.osd_message("Speed: " + Number(mp.get_property("speed")).toFixed(2)); });
        mp.add_forced_key_binding("4", "empv_steaminput_dleft", function() { mp.commandv("seek","5"); });
        mp.add_forced_key_binding("2", "empv_steaminput_dright", function() { mp.commandv("seek","-5"); });

        // right stick is mouse

        // buttons
        mp.add_forced_key_binding("esc", "empv_steaminput_start", function() { mp.commandv("script_binding","easympv"); });
        mp.add_forced_key_binding("tab", "empv_steaminput_select", function() { mp.commandv("script_binding","stats/display-stats-toggle"); });
        mp.add_forced_key_binding("space", "empv_steaminput_a", function() { mp.commandv("cycle","pause"); });
        mp.add_forced_key_binding("e", "empv_steaminput_b", function() { mp.commandv("cycle","pause"); });
        mp.add_forced_key_binding("r", "empv_steaminput_x", function() { mp.commandv("cycle-values", "video-aspect-override", "16:9", "4:3", "1024:429", "-1"); mp.osd_message("Aspect ratio override: " + mp.get_property("video-aspect-override")); });
        mp.add_forced_key_binding("f", "empv_steaminput_y", function() { mp.commandv("cycle-values", "sub-scale", "0.8", "0.9", "1", "1.1", "1.2"); mp.osd_message("Sub Scale: " + Number(mp.get_property("sub-scale")).toFixed(3)); });
        mp.add_forced_key_binding("WHEEL_UP", "empv_steaminput_rb", function() { mp.commandv("add", "sub-delay", "0.1"); mp.osd_message("Sub delay: " + Number(mp.get_property("sub-delay")).toFixed(1) + "s"); });
        mp.add_forced_key_binding("WHEEL_DOWN", "empv_steaminput_lb", function() { mp.commandv("add", "sub-delay", "-0.1"); mp.osd_message("Sub delay: " + Number(mp.get_property("sub-delay")).toFixed(1) + "s"); });

        // lt and rt are mouse buttons
    }

    // Registering functions to events
    mp.register_event("file-loaded", Core.onFileLoad);
    mp.register_event("shutdown", Core.onShutdown);
    mp.register_script_message("json",API.handleIncomingJSON);

    if (Core.enableSaveTimer)
    {
        mp.observe_property("pause", "bool", Core.pauseSaveTimer);
        Core.setSaveTimer();
    }

    // Registering an observer to check for chapter changes (Chapters.js)
    mp.observe_property(
        "chapter-metadata/by-key/title",
        undefined,
        Chapters.handler
    );

    if(Settings.Data.simpleVRR)
    {
        mp.observe_property("speed",undefined,Video.FPS.checkVRR);
    }

    // Registering an observer to redraw Menus on window size change
    mp.observe_property("osd-height", undefined, redrawMenus);
}

Core.doUnregistrations = function () {
    mp.remove_key_binding("easympv");
    mp.remove_key_binding("easympv-forced-menu");
    mp.remove_key_binding("empv_command_hotkey");
    mp.remove_key_binding("empv_log_hotkey");
    mp.remove_key_binding("empv_eval_hotkey");
    if (Core.enableChapterSeeking)
    {
        mp.remove_key_binding("empv_chapter_next");
        mp.remove_key_binding("empv_chapter_prev");
        mp.remove_key_binding("chapter_next");
        mp.remove_key_binding("chapter_prev");
    }

    if(OS.isSteamGamepadUI)
    {
        try {
            mp.remove_key_binding("empv_steaminput_lup");
            mp.remove_key_binding("empv_steaminput_ldown");
            mp.remove_key_binding("empv_steaminput_lleft");
            mp.remove_key_binding("empv_steaminput_lright");
            mp.remove_key_binding("empv_steaminput_dup");
            mp.remove_key_binding("empv_steaminput_ddown");
            mp.remove_key_binding("empv_steaminput_dleft");
            mp.remove_key_binding("empv_steaminput_dright");
            mp.remove_key_binding("empv_steaminput_start");
            mp.remove_key_binding("empv_steaminput_select");
            mp.remove_key_binding("empv_steaminput_a");
            mp.remove_key_binding("empv_steaminput_b");
            mp.remove_key_binding("empv_steaminput_x");
            mp.remove_key_binding("empv_steaminput_y");
            mp.remove_key_binding("empv_steaminput_rb");
            mp.remove_key_binding("empv_steaminput_lb");
        }
        catch(x) {}
    }

    mp.unregister_event(UI.Input.OSDLog.addToBuffer);
    mp.unregister_event(Core.onFileLoad);
    mp.unregister_event(Core.onShutdown);
    mp.unregister_event(API.handleIncomingJSON);

    mp.unobserve_property(Chapters.handler);
    mp.unobserve_property(redrawMenus);

    if (Core.enableSaveTimer)
    {
        try{
            clearInterval(Core.saveTimer);
        } catch(e) {}
        Core.saveTimer = undefined;
    }
}

Core.defineMenus = function () {
    var descriptionShaders = function (a, b) {
        return (
            Settings.getLocalizedString("Shaders.menu.description") +
            Settings.getLocalizedString("Shaders.menu.description.default") +
            UI.SSA.setColorYellow() +
            b +
            "@br@" +
            Settings.getLocalizedString("Shaders.menu.description.enabled") +
            UI.SSA.setColorYellow() +
            a
        );
    };
    var descriptionColors = function (a, b) {
        return (
            Settings.getLocalizedString("Colors.menu.description") +
            Settings.getLocalizedString("Colors.menu.description.default") +
            UI.SSA.setColorYellow() +
            b +
            "@br@" +
            Settings.getLocalizedString("Colors.menu.description.enabled") +
            UI.SSA.setColorYellow() +
            a
        );
    };
    var descriptionSettings = function (a, b) {
        return (
            "mpv " + b +
            "@br@easympv " + a
        );
    };

    var MainMenuSettings = {
        title: UI.SSA.insertSymbolFA("") + " easympv",
        description: "",
        image: "logo",
        customKeyEvents: [{key: "h", event: "help"}]
    };

    var MainMenuItems = [
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Main.close.title") +"@br@@br@",
            item: "close",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Main.open.title") + "@br@@us10@",
            item: "open",
            description: Settings.getLocalizedString("Main.open.description"),
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    Browsers.Selector.open(menu);
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Main.playback.title"),
            item: "playback",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    UI.Menus.switchCurrentMenu(Core.Menus.PlaybackMenu,menu);
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Main.chapters.title") +"@br@@us10@",
            item: "chapters",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    UI.Menus.switchCurrentMenu(Core.Menus.ChaptersMenu,menu);
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Main.preferences.title"),
            item: "options",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    UI.Menus.switchCurrentMenu(Core.Menus.SettingsMenu,menu);
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Main.quit.title"),
            hasUnderscore: false,
            item: "quit",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    quitCounter++;
                    if (!quitCounter.isOdd()) {
                        Utils.exitMpv();
                        menu.hideMenu();
                    } else {
                        quitTitle = UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Main.quit.title");
                        this.title =
                            UI.SSA.setColorRed() + Settings.getLocalizedString("Main.quitconfirm.title");
                        if (this.hasUnderscore) { this.title += "@br@@us10@"}
                        menu.redrawMenu();
                    }
                }
            }
        },
    ];

    if (Autoload.enabled)
    {
        MainMenuItems.splice(3,0,
            {
                title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Main.playlist.title"),
                item: "playlist",
                eventHandler: function(event, menu) {
                    if (event == "enter") {
                        UI.Menus.switchCurrentMenu(Core.Menus.PlaylistMenu,menu);
                    }
                }
            }
        );
    }

    /*
    // TODO: this needs to be moved to onFileLoad
    if (Number(mp.get_property("playlist-count")) > 1) {
        MainMenuItems.splice(2, 0, {
            title: "[Shuffle playlist]@br@",
            item: "shuffle",
            eventHandler: function(event, menu) {
                menu.hideMenu();
                mp.commandv("playlist-shuffle");
            }
        });
    }
    */
    Core.Menus.MainMenu = new UI.Menus.Menu(MainMenuSettings, MainMenuItems, undefined);
    var quitCounter = 0;
    var quitTitle = Core.Menus.MainMenu.getItemByName("quit").title;
    Core.Menus.MainMenu.eventHandler = function (event, action) {
        if (event == "help") {
            OS.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#main-menu", true);
            return;
        }
/*
            if (action == "show-playlist") {
                Core.Menus.MainMenu.hideMenu();
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
                mp.osd_message(UI.SSA.startSequence() + UI.SSA.setSize(8) + playlist, 3);
            }
*/
        if (event == "hide") {
            var quitItem = Core.Menus.MainMenu.getItemByName("quit");
            quitItem.title = quitTitle;
            if (quitItem.hasUnderscore) { quitItem.title += "@br@@us10@"; }
            quitCounter = 0;
            return;
        }
        if (event == "show") {
            if (Settings.Data.showHints)
            {
                hint = Settings.presets.hints[Math.floor(Math.random() * Settings.presets.hints.length)].replaceAll("@br@", "@br@" + UI.SSA.setColorYellow());
                Core.Menus.MainMenu.settings.description =
                    UI.SSA.setColorYellow() +
                    UI.SSA.insertSymbolFA(" ",21,21) + hint;
            }
            else
            {
                Core.Menus.MainMenu.settings.description = "@br@";
            }
            if (Utils.updateAvailable && notifyAboutUpdates) {
                notifyAboutUpdates = false;
                Utils.showAlert(
                    "info",
                    Settings.getLocalizedString("Alerts.updateavailable") +
                    Core.fancyCurrentVersion +
                    Settings.getLocalizedString("Alerts.updateavailable.newversion") + Settings.Data.newestVersion
                );
            }
            if (errorCounter != 0)
            {
                Core.Menus.MainMenu.setDescription(UI.SSA.setColorRed() + "Encountered "+errorCounter+" issue(s) during runtime!@br@Consider submitting a bug report!")
                Core.Menus.MainMenu.redrawMenu();
            }
            return;
        }
    };

    Core.Menus.PlaybackMenu = new UI.Menus.Menu(
        {
            title: UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("Playback.menu.title"),
            description: Settings.getLocalizedString("Playback.menu.description"),
            autoClose: 8
        },
        [
            {
                title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Playback.shaders.title"),
                item: "shaders",
                description: Settings.getLocalizedString("Playback.shaders.description"),
                eventHandler: function(event, menu) {
                    if (event == "enter") {
                        UI.Menus.switchCurrentMenu(Core.Menus.ShadersMenu,menu);
                    }
                }
            },
            {
                title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Playback.colors.title") +"@br@@us10@",
                item: "colors",
                description: Settings.getLocalizedString("Playback.colors.description"),
                eventHandler: function(event, menu) {
                    if (event == "enter") {
                        UI.Menus.switchCurrentMenu(Core.Menus.ColorsMenu,menu);
                    }
                }
            },
            {
                title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Playback.deinterlacing.title"),
                item: "deinterlace",
                eventHandler: function(event, menu) {
                    if (event == "left" || event == "right" || event == "enter")
                    {
                        this.description = Settings.getLocalizedString("Playback.deinterlacing.description")
                        if (mp.get_property("deinterlace") == "yes")
                        {
                            this.description += UI.SSA.setColorRed() + Settings.getLocalizedString("Global.disabled");
                            mp.set_property("deinterlace", "no");
                        }
                        else
                        {
                            this.description += UI.SSA.setColorGreen() +Settings.getLocalizedString("Global.enabled");
                            mp.set_property("deinterlace", "yes");
                        }
                        menu.redrawMenu();
                    }
                }
            },
            {
                title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Playback.framerate.title"),
                item: "fps",
                data_selection: 0,
                data_values: [
                    "native", "23.976", "24", "25", "29.97", "30", "59.94", "60", "120", "144"
                ],
                eventHandler: function(event, menu) {

                    if (event == "left" || event == "enter")
                    {
                        if (this.data_selection != 0)
                        {
                            this.data_selection = this.data_selection - 1;
                        }
                        else {this.data_selection = this.data_values.length-1;}
                    }
                    else if (event == "right")
                    {
                        if (this.data_selection < this.data_values.length-1)
                        {
                            this.data_selection = this.data_selection + 1;
                        }
                        else {this.data_selection = 0;}
                    }

                    if (this.data_values[this.data_selection] != "native")
                    {
                        Video.FPS.setFixedFPS(this.data_values[this.data_selection]);
                    }
                    else
                    {
                        Video.FPS.setFixedFPS();
                    }

                    this.description = Settings.getLocalizedString("Playback.framerate.description") + UI.SSA.setColorGreen() + this.data_values[this.data_selection] + " FPS";

                    menu.redrawMenu();
                }
            },
            {
                title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Playback.aspectratio.title") +"@br@@us10@",
                item: "aspectratio",
                data_selection: 0,
                data_keys: [
                    "native", "16:9", "4:3", "1.85:1", "2.39:1", "3:2", "1:1"
                ],
                data_values: [
                    "-1", "1.7777", "1.3333", "1.8500", "2.9000", "1.5000", "1.0000"
                ],
                eventHandler: function(event, menu) {
                    this.description = Settings.getLocalizedString("Playback.aspectratio.description");
                    if (event == "left" || event == "enter")
                    {
                        if (this.data_selection != 0)
                        {
                            this.data_selection = this.data_selection - 1;
                        }
                        else {this.data_selection = this.data_values.length-1;}
                    }
                    else if (event == "right")
                    {
                        if (this.data_selection < this.data_values.length-1)
                        {
                            this.data_selection = this.data_selection + 1;
                        }
                        else {this.data_selection = 0;}
                    }

                    this.description += UI.SSA.setColorGreen() + this.data_keys[this.data_selection];

                    menu.redrawMenu();
                }
            },
            {
                title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Playback.subtitlesize.title"),
                item: "subtitlesize",
                data_selection: 0,
                data_values: [
                    "0.5", "0.6", "0.7", "0.8", "0.9", "1.0", "1.1", "1.2", "1.3", "1.4", "1.5"
                ],
                eventHandler: function(event, menu) {
                    this.description = "";
                    if (event == "left" || event == "enter")
                    {
                        if (this.data_selection != 0)
                        {
                            this.data_selection = this.data_selection - 1;
                        }
                        else {this.data_selection = this.data_values.length-1;}
                    }
                    else if (event == "right")
                    {
                        if (this.data_selection < this.data_values.length-1)
                        {
                            this.data_selection = this.data_selection + 1;
                        }
                        else {this.data_selection = 0;}
                    }

                    this.description += Settings.getLocalizedString("Playback.subtitlesize.description") + UI.SSA.setColorGreen() + this.data_values[this.data_selection] + "x";
                    mp.set_property("sub-scale", this.data_values[this.data_selection]);
                    menu.redrawMenu();
                }
            },
            {
                title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Playback.subtitledelay.title") +"@br@@us10@",
                item: "subtitledelay",
                eventHandler: function(event, menu) {
                    if (event == "left" || event == "enter")
                    {
                        mp.commandv("add","sub-delay","-0.1");
                    }
                    else if (event == "right")
                    {
                        mp.commandv("add","sub-delay","+0.1");
                    }

                    var delay = mp.get_property("sub-delay");
                    if (delay.charAt(0) == "-")
                    {
                        this.description = Settings.getLocalizedString("Playback.subtitledelay.description") + UI.SSA.setColorGreen() + delay.slice(0,4) + "s";
                    }
                    else
                    {
                        this.description = Settings.getLocalizedString("Playback.subtitledelay.description") + UI.SSA.setColorGreen() + "+" + delay.slice(0,3) + "s";
                    }
                    menu.redrawMenu();
                }
            },
            {
                title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Playback.volume.title"),
                item: "audiovolume",
                eventHandler: function(event, menu) {
                    this.description = "";
                    var volume = Number(mp.get_property("volume"));
                    if (event == "left" || event == "enter")
                    {
                        if (volume != 0)
                        {
                            volume = volume - 1;
                        }
                        else {volume = 100;}
                    }
                    else if (event == "right")
                    {
                        if (volume < 100)
                        {
                            volume = volume + 1;
                        }
                        else {volume = 0;}
                    }

                    this.description += Settings.getLocalizedString("Playback.volume.description") + UI.SSA.setColorGreen() + volume  + "%";
                    mp.set_property("volume", volume);
                    menu.redrawMenu();
                }
            },
            {
                title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Playback.speed.title"),
                item: "speed",
                eventHandler: function(event, menu) {
                    this.description = "";
                    var speed = Number(mp.get_property("speed").trim().slice(0,3));


                    if (event == "left" || event == "enter")
                    {
                        if (speed != 0.1)
                        {
                            speed = speed - 0.1;
                        }
                        else {speed = 4.0;}
                    }
                    else if (event == "right")
                    {
                        if (speed < 4.0)
                        {
                            speed = speed + 0.1;
                        }
                        else {speed = 0.1;}
                    }

                    speed = String((Math.round(speed * 100) / 100)).replaceAll("\\.","").slice(0,2);
                    if (speed.length == 1) {speed = speed + "0"};
                    if (speed.length == 2) { speed = speed.slice(0,1) + "." + speed.slice(1,2)};

                    this.description += Settings.getLocalizedString("Playback.speed.description") + UI.SSA.setColorGreen() + speed  + "x";
                    mp.set_property("speed", speed);
                    menu.redrawMenu();
                }
            }
        ],
        Core.Menus.MainMenu
    );

    Core.Menus.PlaybackMenu.eventHandler = function(event, action)
    {
        if (event == "show")
        {
            var item_deinterlace = Core.Menus.PlaybackMenu.getItemByName("deinterlace");
            var item_fps = Core.Menus.PlaybackMenu.getItemByName("fps");
            var item_aspectratio = Core.Menus.PlaybackMenu.getItemByName("aspectratio");
            var item_subtitlesize = Core.Menus.PlaybackMenu.getItemByName("subtitlesize");
            var item_volume = Core.Menus.PlaybackMenu.getItemByName("audiovolume");
            var item_speed = Core.Menus.PlaybackMenu.getItemByName("speed");
            var item_subtitledelay = Core.Menus.PlaybackMenu.getItemByName("subtitledelay");

            item_deinterlace.description = Settings.getLocalizedString("Playback.deinterlacing.description")
            if (mp.get_property("deinterlace") == "yes")
            {
                item_deinterlace.description += UI.SSA.setColorGreen() + Settings.getLocalizedString("Global.enabled");
            }
            else
            {
                item_deinterlace.description += UI.SSA.setColorRed() + Settings.getLocalizedString("Global.disabled");
            }

            item_fps.data_selection = item_fps.data_values.indexOf(Video.FPS.getFixedFPS().trim());

            var aspect = mp.get_property("video-aspect-override").trim().slice(0,6);
            item_aspectratio.data_selection = item_aspectratio.data_values.indexOf(aspect);

            item_subtitlesize.data_selection = item_subtitlesize.data_values.indexOf(mp.get_property("sub-scale").trim().slice(0,3));

            if (item_fps.data_selection == -1) {item_fps.data_selection = 0;}
            if (item_aspectratio.data_selection == -1) {item_aspectratio.data_selection = 0;}
            if (item_subtitlesize.data_selection == -1) {item_subtitlesize.data_selection = 5;}

            item_fps.description = Settings.getLocalizedString("Playback.framerate.description") + UI.SSA.setColorGreen() + item_fps.data_values[item_fps.data_selection] + " FPS";
            item_subtitlesize.description = Settings.getLocalizedString("Playback.subtitlesize.description") + UI.SSA.setColorGreen() + item_subtitlesize.data_values[item_subtitlesize.data_selection]  + "x";
            item_aspectratio.description = Settings.getLocalizedString("Playback.aspectratio.description");
            item_aspectratio.description += UI.SSA.setColorGreen() + item_aspectratio.data_keys[item_aspectratio.data_selection];
            item_volume.description = Settings.getLocalizedString("Playback.volume.description") + UI.SSA.setColorGreen() + Math.floor(Number(mp.get_property("volume"))) + "%";
            item_speed.description = Settings.getLocalizedString("Playback.speed.description") + UI.SSA.setColorGreen() + mp.get_property("speed").slice(0,3) + "x";

            var delay = mp.get_property("sub-delay");
            if (delay.charAt(0) == "-")
            {
                item_subtitledelay.description = Settings.getLocalizedString("Playback.subtitledelay.description") + UI.SSA.setColorGreen() + delay.slice(0,4) + "s";
            }
            else
            {
                item_subtitledelay.description = Settings.getLocalizedString("Playback.subtitledelay.description") + UI.SSA.setColorGreen() + "+" + delay.slice(0,3) + "s";
            }

        }
        else if (event == "hide")
        {
            var item_aspectratio = Core.Menus.PlaybackMenu.getItemByName("aspectratio");
            mp.set_property("video-aspect-override",item_aspectratio.data_values[item_aspectratio.data_selection]);
        }
    }

    var playlistMenuDescription = Settings.getLocalizedString("Playlist.menu.description")

    Core.Menus.PlaylistMenu = new UI.Menus.Menu(
        {
            title: UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("Playlist.menu.title"),
            description: playlistMenuDescription,
            scrollingEnabled: true,
            customKeyEvents: [{key: "h", event: "help"}]
        },
        [],
        Core.Menus.MainMenu
    );

    Core.Menus.PlaylistMenu.mode = "select";
    Core.Menus.PlaylistMenu.itemCache = 0;

    playlistContextMenuItems = [
        {
            title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("Playlistcontext.moveto.title"),
            item: "move",
            eventHandler: function (action, menu)
            {
                if (action == "enter")
                {
                    Core.Menus.PlaylistMenu.mode = "move";
                    Core.Menus.PlaylistMenu.settings.description = Settings.getLocalizedString("Playlist.modemenu.description") + UI.SSA.setBold(true) + Autoload.playlist[Core.Menus.PlaylistMenu.itemCache].filename + UI.SSA.setBold(false) + Settings.getLocalizedString("Playlist.modemenu.description.suffix");
                    UI.Menus.switchCurrentMenu(Core.Menus.PlaylistMenu,menu);
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("Playlistcontext.remove.title"),
            item: "delete",
            eventHandler: function (action, menu)
            {
                if (action == "enter")
                {
                    var status = Autoload.removeAt(Core.Menus.PlaylistMenu.itemCache);
                    if (status)
                    {
                        Utils.showAlert(
                            "info",
                            Settings.getLocalizedString("Alerts.playlist.itemremoved")
                        );
                    }
                    else
                    {
                        Utils.showAlert(
                            "error",
                            Settings.getLocalizedString("Alerts.playlist.itemremovederror")
                        );
                    }
                    Autoload.buildPlaylist();
                    UI.Menus.switchCurrentMenu(Core.Menus.PlaylistMenu,menu);
                }
            }
        }
    ];

    var playlistContextMenu = new UI.Menus.Menu(
        {
            title: Settings.getLocalizedString("Playlistcontext.menu.title"),
            description: Settings.getLocalizedString("Playlistcontext.menu.description"),
        },
        playlistContextMenuItems,
        Core.Menus.PlaylistMenu
    )

    playlistContextMenu.eventHandler = function(event,action)
    {
        if (event == "show")
        {
            if (Autoload.playlist[Core.Menus.PlaylistMenu.itemCache].playing)
            {
                var backButton = playlistContextMenu.items[0];
                playlistContextMenu.items = [];
                playlistContextMenu.items.push(backButton);
                playlistContextMenu.settings.description = Settings.getLocalizedString("Playlistcontext.menu.description.invalid");
            }
        }
        if (event == "hide")
        {
            if (Autoload.playlist[Core.Menus.PlaylistMenu.itemCache].playing)
            {
                playlistContextMenu.items = playlistContextMenuItems;
                playlistContextMenu.settings.description = Settings.getLocalizedString("Playlistcontext.menu.description");
            }
        }
    }

    Core.Menus.PlaylistMenu.eventHandler = function (event, action)
    {
        if (event == "show")
        {
            Autoload.refresh();
            var backButton = this.items[0];
            this.items = [];
            this.items.push(backButton);

            // TODO: remove this later
            this.items.push(
                {
                    title: "REBUILD MPV PLAYLIST (workaround, will be removed)@br@@us10@",
                    item: "rebuild",
                    eventHandler: function (action, menu)
                    {
                        if (action == "enter")
                        {
                            Autoload.buildPlaylist();
                            menu.hideMenu();
                        }
                    }
                }
            );
            //
            for (var i = 0; i < Autoload.playlist.length; i++)
            {
                this.items.push(
                    {
                        title: UI.SSA.insertSymbolFA(Autoload.playlist[i].icon, 26, 30) + Autoload.playlist[i].filename,
                        item: i,
                        eventHandler: function (action, menu)
                        {
                            if (action == "enter")
                            {
                                if (menu.mode == "select")
                                {
                                    if (Autoload.playlist[this.item].playing)
                                    {
                                        return;
                                    }

                                    mp.commandv("playlist-play-index",this.item)
                                    menu.hideMenu();
                                    return;
                                }

                                if (menu.mode == "move")
                                {
                                    var status = Autoload.moveTo(menu.itemCache,this.item);
                                    if (status)
                                    {
                                        Utils.showAlert(
                                            "info",
                                            Settings.getLocalizedString("Alerts.playlist.itemmoved")
                                        );
                                    }
                                    else
                                    {
                                        Utils.showAlert(
                                            "error",
                                            Settings.getLocalizedString("Alerts.playlist.itemmovederror")
                                        );
                                    }

                                    Core.Menus.PlaylistMenu.mode = "select";
                                    Core.Menus.PlaylistMenu.settings.description = playlistMenuDescription;
                                    UI.Menus.switchCurrentMenu(menu, menu);
                                    Autoload.buildPlaylist();
                                    return;
                                }
                                return;
                            }
                            if (action == "right" && menu.mode == "select")
                            {
                                menu.itemCache = this.item;
                                UI.Menus.switchCurrentMenu(playlistContextMenu, menu);
                            }
                        }
                    }
                );
            }
            return;
        }
        if (event == "hide")
        {
            Core.Menus.PlaylistMenu.mode = "select";
            Core.Menus.PlaylistMenu.settings.description = playlistMenuDescription;
            //Core.Menus.PlaylistMenu.eventHandler("show", undefined);
        }
    }

    var ShadersMenuSettings = {
        title: UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("Shaders.menu.title"),
        description: descriptionShaders(
            Video.Shaders.name,
            Settings.Data.defaultShaderSet
        ),
        // image: "shaders",
        scrollingEnabled: true,
        customKeyEvents: [{key: "h", event: "help"}]
    };

    var ShadersMenuItems = [
        {
            title: UI.SSA.insertSymbolFA(" ",26,30) + Settings.getLocalizedString("Shaders.disable.title") + "@br@@us10@",
            item: "none",
        },
        {
            title: "Recommended All-Purpose Settings",
            item: "Automatic All-Purpose",
        },
        {
            title: "Recommended Anime4K Settings (Worse, but less demanding)",
            item: "Automatic Anime4K (Worse, but less demanding)",
        },
        {
            title: "Recommended Anime4K Settings (Better, but more demanding)@br@@us10@",
            item: "Automatic Anime4K (Better, but more demanding)",
        },
    ];

    for (var i = 0; i < Settings.presets.shadersets.length; i++) {
        ShadersMenuItems.push({
            title: Settings.presets.shadersets[i].name,
            item: Settings.presets.shadersets[i].name,
        });
    }

    for (var i = 0; i < Settings.presets.shadersetsUser.length; i++) {
        ShadersMenuItems.push({
            title: Settings.presets.shadersetsUser[i].name,
            item: Settings.presets.shadersetsUser[i].name,
        });
    }

    Core.Menus.ShadersMenu = new UI.Menus.Menu(
        ShadersMenuSettings,
        ShadersMenuItems,
        Core.Menus.PlaybackMenu
    );

    Core.Menus.ShadersMenu.eventHandler = function (event, action) {

        switch (event) {
            case "show":
                Core.Menus.ShadersMenu.setDescription(
                    descriptionShaders(Video.Shaders.name, Settings.Data.defaultShaderSet)
                );
                break;
            case "enter":
                Core.Menus.ShadersMenu.hideMenu();
                if (action != "@back@") {
                    Video.Shaders.apply(action);
                    Core.Menus.ShadersMenu.setDescription(
                        descriptionShaders(
                            Video.Shaders.name,
                            Settings.Data.defaultShaderSet
                        )
                    );
                    if (action == "none") {
                        Utils.showAlert(
                            "info",
                            Settings.getLocalizedString("Alerts.shaders.disabled")
                        );
                    } else {
                        Utils.showAlert(
                            "info",
                            Settings.getLocalizedString("Alerts.shaders.enabled") +
                            UI.SSA.setColorYellow() + Video.Shaders.name
                        );
                    }
                }
                break;
            case "right":
                if (action != "@back@" && action != "none") {
                    Video.Shaders.apply(action);
                    Core.Menus.ShadersMenu.setDescription(
                        descriptionShaders(
                            Video.Shaders.name,
                            Settings.Data.defaultShaderSet
                        )
                    );
                    Core.Menus.ShadersMenu.appendSuffixToCurrentItem();
                }
                break;
            case "left":
                if (action != "@back@") {
                    Settings.Data.defaultShaderSet = action;
                    Settings.save();
                    Utils.showAlert(
                        "info",
                        Settings.getLocalizedString("Alerts.shaderchanged") +
                        Settings.Data.defaultShaderSet
                    );
                    Core.Menus.ShadersMenu.setDescription(
                        descriptionShaders(
                            Video.Shaders.name,
                            Settings.Data.defaultShaderSet
                        )
                    );
                }
                break;
            case "help":
                OS.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#shaders-menu", true);
                break;
            default:
                break;
        }
    };

    var ChaptersMenuSettings = {
        // image: "chapters",
        title: UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("Chapters.menu.title"),
        description: Settings.getLocalizedString("Chapters.menu.description"),
        customKeyEvents: [{key: "h", event: "help"}],
    };

    var ChaptersMenuItems = [
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Chapters.mode.title"),
            item: "tmode",
            description: UI.SSA.setColorYellow() + Settings.getLocalizedString("Chapters.currentmode") + Chapters.mode,
            eventHandler: function(event, menu)
            {
                if (Chapters.mode == "skip") {
                    Chapters.mode = "slowdown";
                } else {
                    Chapters.mode = "skip";
                }
                this.description = UI.SSA.setColorYellow() + Settings.getLocalizedString("Chapters.currentmode") + Chapters.mode;
                menu.redrawMenu();
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Chapters.toggle.title"),
            item: "tstatus",
            description: UI.SSA.setColorYellow() + Settings.getLocalizedString("Chapters.status") + Chapters.status,
            eventHandler: function(event, menu)
            {
                if (Chapters.status == "disabled") {
                    Chapters.status = Settings.getLocalizedString("Global.enabled");
                } else {
                    Chapters.status = Settings.getLocalizedString("Global.disabled");
                }
                this.description = UI.SSA.setColorYellow() + Settings.getLocalizedString("Chapters.status") + Chapters.status;
                menu.redrawMenu();
            }
        },
    ];

    Core.Menus.ChaptersMenu = new UI.Menus.Menu(
        ChaptersMenuSettings,
        ChaptersMenuItems,
        Core.Menus.MainMenu
    );

    Core.Menus.ChaptersMenu.eventHandler = function (event, action) {
        if (event == "help")
        {
            OS.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#chapters-menu", true);
        }
    };

    var SettingsDevelopmentSubMenuItems = [
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Development.migrate.title"),
            item: "do_config_migration",
            eventHandler: function(event, menu) {
                if (event == "enter")
                {
                    menu.hideMenu();
                    Settings.migrate();
                    Settings.reload();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Development.firsttime.title") +"@br@@us10@",
            item: "do_config_migration",
            eventHandler: function(event, menu) {
                if (event == "enter")
                {
                    menu.hideMenu();
                    Settings.Data.isFirstLaunch = true;
                    Settings.save();
                    Core.doUnregistrations();
                    Core.startExecution();
                    //mp.commandv("script-message-to", "easympv", "__internal", "restart");
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Development.dumplog.title"),
            item: "create_log_file",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    UI.Input.OSDLog.writeLogToFile();
                    Utils.showAlert("info", Settings.getLocalizedString("Alerts.exportlog"));
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Development.onscreenlog.title"),
            item: "toggle_on_screen_log",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    if (UI.Input.OSDLog.OSD == undefined) {
                        UI.Input.OSDLog.show();
                        return;
                    }
                    UI.Input.OSDLog.hide();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Development.debugmode.title") +"@br@@us10@",
            item: "toggle_debug_mode",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    if (Settings.Data.debugMode)
                    {
                        Settings.Data.debugMode = false;
                        mp.enable_messages("info");
                        Utils.showAlert("info", Settings.getLocalizedString("Alerts.debugmode.disabled"));
                    }
                    else
                    {
                        Settings.Data.debugMode = true;
                        mp.enable_messages("debug");
                        Utils.showAlert("info", Settings.getLocalizedString("Alerts.debugmode.enabled"));
                    }
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Development.inputcommand.title"),
            item: "command_input",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    UI.Input.showInteractiveCommandInput();
                }
            }
        },
        {
            title: UI.SSA.setSize(26) + UI.SSA.setFont("Font Awesome 6 Free Brands") + "" + UI.SSA.setSize(35) + UI.SSA.setFont(Utils.commonFontName) + "  " + Settings.getLocalizedString("Development.inputjs.title") +"@br@@us10@",
            item: "javascript_input",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    UI.Input.showJavascriptInput();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Development.tests.title") + "@br@@us10@",
            item: "open_tests_menu",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    Core.Menus.TestsMenu.showMenu();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Development.restart.title"),
            item: "restart_mpv",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    Utils.restartMpv();
                }
            }
        }
    ];

    var SettingsMenuSettings = {
        autoClose: 0,
        // image: "settings",
        title: UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("Preferences.menu.title"),
        description: descriptionSettings(
            Utils.displayVersion,
            Utils.displayVersionMpv
        ),
        customKeyEvents: [{key: "h", event: "help"}]
    };

    var SettingsMenuItems = [
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Preferences.configuration.title"),
            item: "configuration",
            eventHandler: function (event, menu) {
                // pre-create the other menu and just open it here
                menu.hideMenu();
                Core.Menus.SettingsConfigurationSubMenu.showMenu();
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Preferences.updates.title"),
            item: "updates",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    var updateConfirmation = false;
                    var setDescription = function()
                    {
                        var d = Settings.getLocalizedString("Updates.menu.description.version") +
                        UI.SSA.setColorYellow() +
                        Core.fancyCurrentVersion;
                        if(!OS.isGit)
                        {
                            d += Settings.getLocalizedString("Updates.menu.description.latest") +
                            UI.SSA.setColorYellow() +
                            Settings.Data.newestVersion;
                        }
                        d += "@br@@br@" + Utils.latestUpdateData.changelog;
                        return d;
                    }
                    var umenu = new UI.Menus.Menu(
                        {
                            title: UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("Updates.menu.title"),
                            autoClose: "0",
                            description: setDescription(),
                        },
                        [],
                        Core.Menus.SettingsMenu
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
                                    UI.SSA.setColorRed() + Settings.getLocalizedString("Updates.confirm.title");
                                umenu.redrawMenu();
                                updateConfirmation = true;
                            }
                        } else if (event == "show") {
                            // there is a silly way to crash everything here, so try{} it is
                            try {
                                if(OS.isGit)
                                {
                                    if (umenu.items.length == 1) {
                                        umenu.items.push({
                                            title: Settings.getLocalizedString("Updates.pull.title"),
                                            item: "update",
                                        });
                                    }
                                }
                                if (Utils.updateAvailable && !OS.isGit)
                                {
                                    if (umenu.items.length == 1) {
                                        umenu.items.push({
                                            title:
                                            Settings.getLocalizedString("Updates.update.title") +
                                                UI.SSA.setColorYellow() +
                                                Settings.Data.newestVersion,
                                            item: "update",
                                        });
                                    }
                                }
                            } catch(x) {}
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
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Preferences.credits.title") +"@br@@us10@",
            item: "credits",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    var cmenu = new UI.Menus.Menu(
                        {
                            title: UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("Credits.menu.title"),
                            autoClose: "0",
                            description: Utils.getCredits().replaceAll("\n", "@br@"),
                        },
                        [],
                        Core.Menus.SettingsMenu
                    );
                    cmenu.eventHandler = function (event, action) {
                        if (event == "hide") {
                            cmenu = undefined;
                        }
                    };
                    cmenu.showMenu();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Preferences.toggleclock.title"),
            item: "toggle_clock",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    if (UI.Time.OSD == undefined)
                    {
                        UI.Time.show();
                    } else
                    {
                        UI.Time.hide();
                    }
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Preferences.toggleinfo.title") +"@br@@us10@",
            item: "toggle_information",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    mp.commandv("script-binding","stats/display-stats-toggle");
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Preferences.openfolder.title"),
            item: "open_config_folder",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    OS.openFile();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Preferences.reload.title"),
            item: "reload_config",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    UI.Image.hide("settings");
                    Settings.mpvConfig.reload();
                    Settings.inputConfig.reload();
                    Settings.presets.reload();
                    Settings.reload();
                    Utils.showAlert("info", Settings.getLocalizedString("Alerts.configreload"));
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Preferences.reinit.title") + "@br@@us10@",
            item: "reinitialize_plugin",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.settings.fadeOut = false;
                    menu.hideMenu();
                    Core.doUnregistrations();
                    Core.startExecution();
                    //mp.commandv("script-message-to", "easympv", "__internal", "restart");
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Preferences.development.title") +"@br@@us10@",
            item: "development_options",
            eventHandler: function (event, menu) {
                if (event == "enter")
                {
                    menu.hideMenu();
                    Core.Menus.SettingsDevelopmentSubMenu.showMenu();
                }
            }
        }
    ];

    if (OS.isWindows)
    {
        if (mp.utils.file_info(mp.utils.get_user_path("~~/uninstaller.exe")) != undefined) {
            SettingsMenuItems.push({
                title: UI.SSA.setColorRed() + UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Preferences.uninstall.title"),
                item: "uninstall",
                eventHandler: function (event, menu) {
                    if (event == "enter")
                    {
                        menu.hideMenu();
                        var uninstMenu = new UI.Menus.Menu(
                            {
                                title: UI.SSA.insertSymbolFA(" ") + Settings.getLocalizedString("Uninstall.menu.title"),
                                description: Settings.getLocalizedString("Uninstall.menu.description"),
                                autoClose: 0
                            },
                            [
                                {
                                    title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Uninstall.confirm.title"),
                                    item: "confirm",
                                    state: false,
                                    eventHandler: function (event, menu)
                                    {
                                        if (event == "enter")
                                        {
                                            if (this.state)
                                            {
                                                OS.unregisterMpv();
                                                mp.utils.write_file("file://~~/INSTALLER_UNINSTALL_DATA", Settings.Data.mpvLocation);
                                                Utils.showAlert("warn", Settings.getLocalizedString("Alerts.uninstall"));
                                                setTimeout(function(){
                                                    mp.commandv("run",mp.utils.get_user_path("~~/uninstaller.exe"));
                                                    mp.commandv("quit-watch-later");
                                                },15000);
                                                Utils.blockQuitButtons();

                                                menu.hideMenu();
                                            }
                                            else
                                            {
                                                this.state = true;
                                                this.title = UI.SSA.setColorRed() + UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Uninstall.areyousure.title");
                                                menu.redrawMenu();
                                            }
                                        }
                                    }
                                }
                            ],
                            Core.Menus.SettingsMenu
                        );
                        uninstMenu.eventHandler = function(event, action) {
                            if (event == "show")
                            {
                                var item = uninstMenu.getItemByName("confirm");
                                item.title = UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Uninstall.confirm.title");
                                item.state = false;
                                uninstMenu.redrawMenu();
                            }
                        };
                        uninstMenu.showMenu();
                    }
                }
            });
        }

    }

    Core.Menus.SettingsMenu = new UI.Menus.Menu(
        SettingsMenuSettings,
        SettingsMenuItems,
        Core.Menus.MainMenu
    );

    Core.Menus.SettingsDevelopmentSubMenu = new UI.Menus.Menu(
        {
            autoClose: 0,
            title: UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("Development.menu.title"),
            description: "ffmpeg " + Utils.ffmpegVersion + "@br@libass" + Utils.libassVersion
            //customKeyEvents: [{key: "h", event: "help"}]
        },
        SettingsDevelopmentSubMenuItems,
        Core.Menus.SettingsMenu
    );
    Core.Menus.SettingsDevelopmentSubMenu.eventHandler = function(){};

    var enabledText = Settings.getLocalizedString("Config.item.description.suffix") + UI.SSA.setColorGreen() + Settings.getLocalizedString("Global.enabled") + UI.SSA.insertSymbolFA(" ", 18, 28, Utils.commonFontName);
    var disabledText = Settings.getLocalizedString("Config.item.description.suffix") + UI.SSA.setColorRed() + Settings.getLocalizedString("Global.disabled") + UI.SSA.insertSymbolFA(" ", 18, 28, Utils.commonFontName);
    var languageChanged = false;
    var SettingsConfigurationSubMenuItems = [
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.item.back.title") + "@br@@us10@@br@",
            item: "save",
            color: "999999",
            eventHandler: function (event, menu) {
                if (event == "enter")
                {
                    Settings.save();
                    menu.hideMenu();
                    if (languageChanged)
                    {
                        Utils.restartMpv();
                    }
                    else
                    {
                        Utils.log("Restarting plugin to apply changes...","settings","info");
                        Core.doUnregistrations();
                        Core.startExecution();
                    }
                    //mp.commandv("script-message-to", "easympv", "__internal", "restart");
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.language.title"),
            item: "language",
            list: [],
            index: 0,
            descriptionPrefix: Settings.getLocalizedString("Config.language.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if (this.index < this.list.length-1)
                    {
                        this.index = this.index + 1
                    }
                    else
                    {
                        this.index = 0
                    }
                    Settings.Data.language = this.list[this.index].id;
                    this.description = this.descriptionPrefix + UI.SSA.setColorYellow() + this.list[this.index].name + "@br@"+ UI.SSA.setColorYellow() + "\"" + this.list[this.index].description + "\"@br@By " + UI.SSA.setColorYellow() + this.list[this.index].author;
                    menu.redrawMenu();
                    Settings.save();
                    languageChanged = true;
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.notifyupdates.title"),
            item: "notify_about_updates",
            descriptionPrefix: Settings.getLocalizedString("Config.notifyupdates.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if(Settings.Data.notifyAboutUpdates)
                    {
                        Settings.Data.notifyAboutUpdates = false;
                        this.description = this.descriptionPrefix + disabledText;
                    }
                    else
                    {
                        Settings.Data.notifyAboutUpdates = true;
                        this.description = this.descriptionPrefix + enabledText;
                    }
                    menu.redrawMenu();
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA("✏ ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.selectorcolor.title"),
            item: "selector_color",
            list: [
                {"title": Settings.getLocalizedString("Config.selectorcolor.color.custom"), "color": ""},
                {"title": Settings.getLocalizedString("Config.selectorcolor.color.green"), "color": "66ff66"},
                {"title": Settings.getLocalizedString("Config.selectorcolor.color.purple"), "color": "bb108d"},
                {"title": Settings.getLocalizedString("Config.selectorcolor.color.red"), "color": "eb4034"},
                {"title": Settings.getLocalizedString("Config.selectorcolor.color.yellow"), "color": "ffff33"},
                {"title": Settings.getLocalizedString("Config.selectorcolor.color.blue"), "color": "00ccff"},
                {"title": Settings.getLocalizedString("Config.selectorcolor.color.pink"), "color": "ff77ff"}
            ],
            index: 0,
            descriptionPrefix: Settings.getLocalizedString("Config.selectorcolor.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if (this.index == this.list.length-1)
                    {
                        this.index = 0;
                    }
                    else
                    {
                        this.index = this.index + 1;
                    }

                    this.description = this.descriptionPrefix + UI.SSA.setColorYellow() + this.list[this.index].title;

                    if (this.list[this.index].color != "")
                    {
                        Settings.Data.selectorColor = this.list[this.index].color;
                    }

                    menu.redrawMenu();
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.showhints.title"),
            item: "show_hints",
            descriptionPrefix: Settings.getLocalizedString("Config.showhints.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if(Settings.Data.showHints)
                    {
                        Settings.Data.showHints = false;
                        this.description = this.descriptionPrefix + disabledText;
                    }
                    else
                    {
                        Settings.Data.showHints = true;
                        this.description = this.descriptionPrefix + enabledText;
                    }
                    menu.redrawMenu();
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.showclock.title"),
            item: "show_clock",
            descriptionPrefix: Settings.getLocalizedString("Config.showclock.description"),
            description: "",
            eventHandler: function(event, menu) {
                if (event == "right") {
                    if(Settings.Data.showClock)
                    {
                        Settings.Data.showClock = false;
                        this.description = this.descriptionPrefix + disabledText;
                        UI.Time.hide();
                    }
                    else
                    {
                        Settings.Data.showClock = true;
                        this.description = this.descriptionPrefix + enabledText;
                        UI.Time.show();
                    }
                    menu.redrawMenu();
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.clockposition.title"),
            item: "clock_position",
            descriptionPrefix: Settings.getLocalizedString("Config.clockposition.description"),
            description: "",
            eventHandler: function(event, menu) {
                if (event == "right") {
                    if(Settings.Data.clockPosition == "top-left")
                    {
                        Settings.Data.clockPosition = "top-right";
                        this.description = this.descriptionPrefix + UI.SSA.setColorYellow() + "top-right";
                        UI.Time.hide();
                        if(Settings.Data.showClock)
                        {
                            UI.Time.show();
                        }
                        menu.redrawMenu();
                        Settings.save();
                        return;
                    }
                    if(Settings.Data.clockPosition == "top-right")
                    {
                        Settings.Data.clockPosition = "bottom-left";
                        this.description = this.descriptionPrefix + UI.SSA.setColorYellow() + "bottom-left";
                        UI.Time.hide();
                        if(Settings.Data.showClock)
                        {
                            UI.Time.show();
                        }
                        menu.redrawMenu();
                        Settings.save();
                        return;
                    }
                    if(Settings.Data.clockPosition == "bottom-left")
                    {
                        Settings.Data.clockPosition = "bottom-right";
                        this.description = this.descriptionPrefix + UI.SSA.setColorYellow() + "bottom-right";
                        UI.Time.hide();
                        if(Settings.Data.showClock)
                        {
                            UI.Time.show();
                        }
                        menu.redrawMenu();
                        Settings.save();
                        return;
                    }
                    if(Settings.Data.clockPosition == "bottom-right")
                    {
                        Settings.Data.clockPosition = "top-left";
                        this.description = this.descriptionPrefix + UI.SSA.setColorYellow() + "top-left";
                        UI.Time.hide();
                        if(Settings.Data.showClock)
                        {
                            UI.Time.show();
                        }
                        menu.redrawMenu();
                        Settings.save();
                        return;
                    }
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.fademenu.title"),
            item: "menu_fade_in_out",
            descriptionPrefix: Settings.getLocalizedString("Config.fademenu.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if(Settings.Data.fadeMenus)
                    {
                        Settings.Data.fadeMenus = false;
                        this.description = this.descriptionPrefix + disabledText;
                    }
                    else
                    {
                        Settings.Data.fadeMenus = true;
                        this.description = this.descriptionPrefix + enabledText;
                    }
                    menu.redrawMenu();
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.scrollalerts.title"),
            item: "scroll_alerts",
            descriptionPrefix: Settings.getLocalizedString("Config.scrollalerts.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if(Settings.Data.scrollAlerts)
                    {
                        Settings.Data.scrollAlerts = false;
                        this.description = this.descriptionPrefix + disabledText;
                    }
                    else
                    {
                        Settings.Data.scrollAlerts = true;
                        this.description = this.descriptionPrefix + enabledText;
                    }
                    menu.redrawMenu();
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.shortfilenames.title"),
            item: "short_file_names",
            descriptionPrefix: Settings.getLocalizedString("Config.shortfilenames.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if(Settings.Data.shortFileNames)
                    {
                        Settings.Data.shortFileNames = false;
                        this.description = this.descriptionPrefix + disabledText;
                    }
                    else
                    {
                        Settings.Data.shortFileNames = true;
                        this.description = this.descriptionPrefix + enabledText;
                    }
                    menu.redrawMenu();
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.showhiddenfiles.title"),
            item: "show_hidden_files",
            descriptionPrefix: Settings.getLocalizedString("Config.showhiddenfiles.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if(Settings.Data.showHiddenFiles)
                    {
                        Settings.Data.showHiddenFiles = false;
                        this.description = this.descriptionPrefix + disabledText;
                    }
                    else
                    {
                        Settings.Data.showHiddenFiles = true;
                        this.description = this.descriptionPrefix + enabledText;
                    }
                    menu.redrawMenu();
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.usetrash.title"),
            item: "use_trash",
            descriptionPrefix: Settings.getLocalizedString("Config.usetrash.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if(Settings.Data.useTrash)
                    {
                        Settings.Data.useTrash = false;
                        this.description = this.descriptionPrefix + disabledText;
                    }
                    else
                    {
                        Settings.Data.useTrash = true;
                        this.description = this.descriptionPrefix + enabledText;
                    }
                    menu.redrawMenu();
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.allowfolderdeletion.title"),
            item: "allow_deleting_folders",
            descriptionPrefix: Settings.getLocalizedString("Config.allowfolderdeletion.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if(Settings.Data.allowFolderDeletion)
                    {
                        Settings.Data.allowFolderDeletion = false;
                        this.description = this.descriptionPrefix + disabledText;
                    }
                    else
                    {
                        Settings.Data.allowFolderDeletion = true;
                        this.description = this.descriptionPrefix + enabledText;
                    }
                    menu.redrawMenu();
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.systemnotifications.title") + "@br@@us10@",
            item: "use_system_notifications",
            descriptionPrefix: Settings.getLocalizedString("Config.systemnotifications.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if(Settings.Data.useNativeNotifications)
                    {
                        Settings.Data.useNativeNotifications = false;
                        this.description = this.descriptionPrefix + disabledText;
                    }
                    else
                    {
                        Settings.Data.useNativeNotifications = true;
                        this.description = this.descriptionPrefix + enabledText;
                    }
                    menu.redrawMenu();
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.ipcserver.title"),
            item: "ipc_server",
            descriptionPrefix: Settings.getLocalizedString("Config.ipcserver.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if(Settings.Data.startIPCServer)
                    {
                        Settings.Data.startIPCServer = false;
                        this.description = this.descriptionPrefix + disabledText;
                    }
                    else
                    {
                        Settings.Data.startIPCServer = true;
                        this.description = this.descriptionPrefix + enabledText;
                    }
                    menu.redrawMenu();
                    Settings.save();
                }
            }
        },
        {
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Config.savefulllog.title"),
            item: "save_full_log",
            descriptionPrefix: Settings.getLocalizedString("Config.savefulllog.description"),
            description: "",
            eventHandler: function (event, menu) {
                if (event == "right")
                {
                    if(Settings.Data.saveFullLog)
                    {
                        Settings.Data.saveFullLog = false;
                        this.description = this.descriptionPrefix + disabledText;
                    }
                    else
                    {
                        Settings.Data.saveFullLog = true;
                        this.description = this.descriptionPrefix + enabledText;
                    }
                    menu.redrawMenu();
                    Settings.save();
                }
            }
        }
    ];

    Core.Menus.SettingsConfigurationSubMenu = new UI.Menus.Menu(
        {
            autoClose: 0,
            scrollingEnabled: true,
            title: UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("Config.menu.title"),
            description: Settings.getLocalizedString("Config.menu.description")
            //customKeyEvents: [{key: "h", event: "help"}]
        },
        SettingsConfigurationSubMenuItems,
        undefined
    );

    Core.Menus.SettingsConfigurationSubMenu.eventHandler = function(event, action) {
        if (event == "show")
        {
            UI.Menus.menuKeyDisabled = true;
            var item = undefined;

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("language")
            var locales = mp.utils.readdir(
                mp.utils.get_user_path("~~/scripts/easympv/locale/"),
                "files"
            );
            locales.sort();
            var json = {};
            for (var i = 0; i < locales.length; i++)
            {
                json = JSON.parse(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/locale/") + locales[i]));
                item.list.push(
                    {
                        id: locales[i].split(".")[0],
                        name: json["name"],
                        author: json["author"],
                        description: json["description"]
                    }
                )
            }
            for(var index = 0; index < item.list.length; index++)
            {
                if (Settings.Data.language == item.list[index].id)
                {
                    break;
                }
            }
            try
            {
                item.description = item.descriptionPrefix + UI.SSA.setColorYellow() + item.list[index].name + "@br@"+ UI.SSA.setColorYellow() + "\"" + item.list[index].description + "\"@br@By " + UI.SSA.setColorYellow() + item.list[index].author;
                item.index = index;
            }
            catch(e)
            {
                item.index = 0;
                index = 0;
                item.description = item.descriptionPrefix + UI.SSA.setColorYellow() + item.list[index].name + "@br@"+ UI.SSA.setColorYellow() + "\"" + item.list[index].description + "\"@br@By " + UI.SSA.setColorYellow() + item.list[index].author;
            }

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("notify_about_updates")
            if(Settings.Data.notifyAboutUpdates)
            {
                item.description = item.descriptionPrefix + enabledText;
            }
            else
            {
                item.description = item.descriptionPrefix + disabledText;
            }

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("selector_color")
            for (var cindex = 0; cindex < item.list.length;  cindex++)
            {
                if (Settings.Data.selectorColor == item.list[cindex].color)
                {
                    item.index = cindex;
                    break;
                }
            }
            item.description = item.descriptionPrefix + UI.SSA.setColorYellow() + item.list[item.index].title;

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("show_hints")
            if(Settings.Data.showHints)
            {
                item.description = item.descriptionPrefix + enabledText;
            }
            else
            {
                item.description = item.descriptionPrefix + disabledText;
            }

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("show_clock")
            if(Settings.Data.showClock)
            {
                item.description = item.descriptionPrefix + enabledText;
            }
            else
            {
                item.description = item.descriptionPrefix + disabledText;
            }

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("clock_position")
            item.description = item.descriptionPrefix + UI.SSA.setColorYellow() + Settings.Data.clockPosition;

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("menu_fade_in_out");
            if(Settings.Data.fadeMenus)
            {
                item.description = item.descriptionPrefix + enabledText;
            }
            else
            {
                item.description = item.descriptionPrefix + disabledText;
            }

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("scroll_alerts");
            if(Settings.Data.scrollAlerts)
            {
                item.description = item.descriptionPrefix + enabledText;
            }
            else
            {
                item.description = item.descriptionPrefix + disabledText;
            }

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("short_file_names");
            if(Settings.Data.shortFileNames)
            {
                item.description = item.descriptionPrefix + enabledText;
            }
            else
            {
                item.description = item.descriptionPrefix + disabledText;
            }

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("show_hidden_files");
            if(Settings.Data.showHiddenFiles)
            {
                item.description = item.descriptionPrefix + enabledText;
            }
            else
            {
                item.description = item.descriptionPrefix + disabledText;
            }

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("use_trash");
            if(Settings.Data.useTrash)
            {
                item.description = item.descriptionPrefix + enabledText;
            }
            else
            {
                item.description = item.descriptionPrefix + disabledText;
            }


            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("allow_deleting_folders");
            if(Settings.Data.allowFolderDeletion)
            {
                item.description = item.descriptionPrefix + enabledText;
            }
            else
            {
                item.description = item.descriptionPrefix + disabledText;
            }

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("use_system_notifications");
            if(Settings.Data.useNativeNotifications)
            {
                item.description = item.descriptionPrefix + enabledText;
            }
            else
            {
                item.description = item.descriptionPrefix + disabledText;
            }

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("ipc_server");
            if(Settings.Data.startIPCServer)
            {
                item.description = item.descriptionPrefix + enabledText;
            }
            else
            {
                item.description = item.descriptionPrefix + disabledText;
            }

            item = Core.Menus.SettingsConfigurationSubMenu.getItemByName("save_full_log");
            if(Settings.Data.saveFullLog)
            {
                item.description = item.descriptionPrefix + enabledText;
            }
            else
            {
                item.description = item.descriptionPrefix + disabledText;
            }
        }
        else if (event == "hide")
        {
            //Settings.save();
            UI.Menus.menuKeyDisabled = false;
        }
    };

    Core.Menus.SettingsMenu.eventHandler = function (event, action) {
            /*
            Core.Menus.SettingsMenu.hideMenu();
            if (action == "togglesofa") {
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
                        Utils.showAlert(
                            "info",
                            "Sofalizer:@br@" +
                            UI.SSA.setColorGreen() + "enabled"
                        );
                    } else {
                        Utils.showAlert(
                            "info",
                            "Sofalizer:@br@" +
                            UI.SSA.setColorRed() + "disabled"
                        );
                    }
                } else {
                    Utils.showAlert(
                        "warning",
                        "File not found:@br@" +
                        UI.SSA.setColorYellow() + "default.sofa"
                    );
                }
            }
            return;
            */
        if (event == "show") {
            Utils.setDisplayVersion();
            Core.Menus.SettingsMenu.setDescription(
                descriptionSettings(Utils.displayVersion, Utils.displayVersionMpv)
            );
            return;
        }
        if (event == "help") {
            OS.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#settings-menu", true);
            return;
        }
    };

    var ColorsMenuSettings = {
        // image: "colors",
        title:
            UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("Colors.menu.title"),
        description: descriptionColors(
            Video.Colors.name,
            Settings.Data.defaultColorProfile
        ),
        scrollingEnabled: true,
        customKeyEvents: [{key: "h", event: "help"}]
    };

    var ColorsMenuItems = [
        {
            title: UI.SSA.insertSymbolFA(" ",26,30) + Settings.getLocalizedString("Colors.disable.title") +"@br@@us10@",
            item: "none",
        },
    ];

    for (var i = 0; i < Settings.presets.colorpresets.length; i++) {
        ColorsMenuItems.push({
            title: Settings.presets.colorpresets[i].name,
            item: Settings.presets.colorpresets[i].name,
        });
    }

    for (var i = 0; i < Settings.presets.colorpresetsUser.length; i++) {
        ColorsMenuItems.push({
            title: Settings.presets.colorpresetsUser[i].name,
            item: Settings.presets.colorpresetsUser[i].name,
        });
    }

    Core.Menus.ColorsMenu = new UI.Menus.Menu(
        ColorsMenuSettings,
        ColorsMenuItems,
        Core.Menus.PlaybackMenu
    );

    Core.Menus.ColorsMenu.eventHandler = function (event, action) {
        switch (event) {
            case "show":
                Core.Menus.ColorsMenu.setDescription(
                    descriptionColors(
                        Video.Colors.name,
                        Settings.Data.defaultColorProfile
                    )
                );
                break;
            case "enter":
                Core.Menus.ColorsMenu.hideMenu();
                Video.Colors.apply(action);
                if (action == "none") {
                    Utils.showAlert(
                        "info",
                        Settings.getLocalizedString("Alerts.colors.disabled")
                    );
                } else {
                    Utils.showAlert(
                        "info",
                        Settings.getLocalizedString("Alerts.colors.enabled") +
                        UI.SSA.setColorYellow() + Video.Colors.name
                    );
                }

                break;
            case "right":
                if (action != "@back@") {
                    Video.Colors.apply(action);
                    Core.Menus.ColorsMenu.setDescription(
                        descriptionColors(
                            Video.Colors.name,
                            Settings.Data.defaultColorProfile
                        )
                    );
                    Core.Menus.ColorsMenu.appendSuffixToCurrentItem();
                }
                break;
            case "left":
                if (action != "@back@") {
                    Settings.Data.defaultColorProfile = action;
                    Core.Menus.ColorsMenu.setDescription(
                        descriptionColors(
                            Video.Colors.name,
                            Settings.Data.defaultColorProfile
                        )
                    );
                    Utils.showAlert(
                        "info",
                        Settings.getLocalizedString("Alerts.colorschanged") +
                        Settings.Data.defaultColorProfile
                    );
                    Settings.save();
                }
                break;
            case "help":
                OS.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#colors-menu", true);
                break;
            default:
                break;
        }
    };

    Core.Menus.TestsMenu = new UI.Menus.Menu({
        title: UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("Tests.menu.title"),
        description: Settings.getLocalizedString("Tests.menu.description"),
        autoClose: 0
    },[],undefined);

    var createItemList = function()
    {
        var testsMenuitems = [];
        testsMenuitems.push({
            title: "Close@br@@us10@",
            item: "",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    Core.Menus.TestsMenu.hideMenu();
                }
            }
        });

        for (var test in Tests.list) {
            var item = {
                title: test,
                item: test
            };
            if (Tests.list[test].description != undefined)
            {
                item.description = Tests.list[test].description;
            }
            testsMenuitems.push(item);
        }

        testsMenuitems.push({
            title: Settings.getLocalizedString("Tests.runall.title"),
            item: "",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    for (var i = 1; i < menu.items.length-2; i++)
                    {
                        menu._dispatchEvent("enter",menu.items[i]);
                    }
                }
            }
        });

        testsMenuitems.push({
            title: Settings.getLocalizedString("Tests.reset.title"),
            item: "",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    createItemList();
                    menu.redrawMenu();
                }
            }
        });

        Core.Menus.TestsMenu.items = testsMenuitems;
    }

    createItemList();

    Core.Menus.TestsMenu.setResultForItem = function(name, result)
    {
        var grade = UI.SSA.setColorRed() + "[FAIL]" + UI.SSA.setColorWhite();

        if (result == undefined)
        {
            grade = UI.SSA.setColorBlue() + "[DONE]" + UI.SSA.setColorWhite();
        }
        else
        {
            if (result)
            {
                grade = UI.SSA.setColorGreen() + "[PASS]" + UI.SSA.setColorWhite();
            }
        }

        for (var i = 0; i < Core.Menus.TestsMenu.items.length; i++) {
            if (Core.Menus.TestsMenu.items[i].title == name)
            {
                Core.Menus.TestsMenu.items[i].title = grade + " " + Core.Menus.TestsMenu.items[i].title;
                Core.Menus.TestsMenu.items[i].item = "ignore";
                break;
            }
        }
    }

    Core.Menus.TestsMenu.eventHandler = function(action, item) {
        if (action == "enter")
        {
            if (item == "ignore")
            {
                return;
            }
            Core.Menus.TestsMenu.setDescription(Settings.getLocalizedString("Tests.menu.description.running"));
            Core.Menus.TestsMenu.redrawMenu();
            Tests.run(item);
            Core.Menus.TestsMenu.setDescription(Settings.getLocalizedString("Tests.menu.description.finished"));
            Core.Menus.TestsMenu.redrawMenu();
        }
    };
}

Core.doFileChecks = function () {
    if (mp.utils.file_info(mp.utils.get_user_path("~~/easympvUtility.exe")) != undefined) {
        Utils.log("Task: delete old 1.x files","startup","info");
        OS.fileRemove("script-opts/colorbox.conf");
        OS.fileRemove("script-opts/easympv.conf");
        OS.fileRemove("shaders/");
        OS.fileRemove("images/");
        OS.fileRemove("scripts/easympv.js/");
        OS.fileRemove("easympvUtility.exe");
    }

    if (mp.utils.file_info(mp.utils.get_user_path("~~/easympv.conf")) == undefined) {
        Utils.log("Task: reset easympv.conf (file missing)","startup","info");
        Settings.migrate();
        resetOccured = true;
    }
    else
    {
        if (Settings.Data.doMigration) {
            Utils.log("Task: reset easympv.conf (user set)","startup","info");
            Settings.migrate();
            resetOccured = true;
        }
    }

    if (mp.utils.file_info(mp.utils.get_user_path("~~/mpv.conf")) == undefined) {
        Utils.log("Task: reset mpvConfig (file missing)","startup","info");
        Settings.mpvConfig.reset();
        resetOccured = true;
    }
    else
    {
        if (Settings.Data.resetMpvConfig) {
            Utils.log("Task: reset mpvConfig (user set)","startup","info");
            Settings.mpvConfig.reset();
            resetOccured = true;
        }
    }

    if (mp.utils.file_info(mp.utils.get_user_path("~~/input.conf")) == undefined) {
        Utils.log("Task: reset inputConfig (file missing)","startup","info");
        Settings.inputConfig.reset();
        resetOccured = true;
    }
    else
    {
        if (Settings.Data.resetInputConfig) {
            Utils.log("Task: reset inputConfig (user set)","startup","info");
            Settings.inputConfig.reset();
            resetOccured = true;
        }
    }

    if (Settings.Data.doMigration) {
        Utils.log("Migrating config","startup","info");
        Settings.migrate();
    }

    if (resetOccured) {
        Settings.reload();
        Settings.mpvConfig.reload();
        Settings.inputConfig.reload();
    };

    if (mp.utils.file_info(mp.utils.get_user_path("~~/scripts/autoload.lua")) != undefined)
    {
        Autoload.enabled = false;
        Utils.log("autoload.lua has been detected! Please remove/disable that script in order to use easympv's build-in playlist manager!","startup","warn");
    }

    if (mp.utils.file_info(mp.utils.get_user_path("~~/scripts/autosave.lua")) != undefined)
    {
        Core.enableSaveTimer = false;
        Utils.log("autosave.lua has been detected! Please remove/disable that script in order to use easympv's build-in automatic saving feature!","startup","warn");
    }

    if (mp.utils.file_info(mp.utils.get_user_path("~~/scripts/betterchapters.lua")) != undefined)
    {
        Core.enableChapterSeeking = false;
        Utils.log("betterchapters.lua has been detected! Please remove/disable that script in order to use easympv's build-in chapter seeking feature!","startup","warn");
    }

    if (mp.utils.file_info(mp.utils.get_user_path("~~/INSTALLER_DATA_REGISTER")) != undefined) {
        if (OS.isWindows)
        {
            Utils.log("User installed using installer, registering mpv...","startup","info");
            OS.fileRemove("INSTALLER_DATA_REGISTER");
            OS.registerMpv();
        }
    }
}

/**
 * The main function, called by main.js.
 */
Core.startExecution = function () {
    notifyAboutUpdates = Settings.Data.notifyAboutUpdates;

    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    Settings.Data.currentVersion = "2.0.0";
    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    if(Settings.Data.debugMode)
    {
        mp.enable_messages("debug");
    }
    else
    {
        mp.enable_messages("info");
    }
    mp.register_event("log-message", UI.Input.OSDLog.addToBuffer);
    OS.init();
    Core.fancyCurrentVersion = Settings.Data.currentVersion;

    if (OS.isGit)
    {
        if (OS.gitAvailable)
        {
            Core.fancyCurrentVersion = Core.fancyCurrentVersion + "-" + OS.gitCommit;
        }
        else
        {
            Core.fancyCurrentVersion = Core.fancyCurrentVersion + "-git";
        }
    }

    Utils.log("easympv " + Core.fancyCurrentVersion + " starting...","startup","info");

    Utils.log("Checking for updates...","startup","info");
    setTimeout(function() {
        Utils.getLatestUpdateData();
    },1000);

    Core.doFileChecks();

    if(Settings.Data.startIPCServer)
    {
        Utils.setIPCServer();
    }

    Utils.log("Reading files","startup","info");
    //Settings.presets.reload(); // already gets called in Setup
    Settings.cache.reload();

    if (Settings.Data.isFirstLaunch) {
        Utils.log("Task: initial setup","startup","info");
        Setup.Start();
    }

    if (Environment.BrowserWorkDir != undefined) {
	    mp.msg.warn("Browser override: " + Environment.BrowserWorkDir);
        Browsers.FileBrowser.currentLocation = Environment.BrowserWorkDir;
    }
    else
    {
        Browsers.FileBrowser.currentLocation = mp.get_property("working-directory");
    }

    Core.defineMenus();
    Core.doRegistrations();

    Video.Colors.name = Settings.Data.defaultColorProfile;
    Video.Colors.apply(Settings.Data.defaultColorProfile);

    Utils.log("Finished loading after " + (Date.now() - startTime) + "ms!","startup","info");
}