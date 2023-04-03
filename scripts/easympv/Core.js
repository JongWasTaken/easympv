/*
 * CORE.JS (MODULE)
 *
 * Author:                  Jong
 * URL:                     http://smto.pw/mpv
 * License:                 MIT License
 */

/*----------------------------------------------------------------
The Core.js module

This module used to be main.js, but it was split to make
things like soft-restarts possible.
----------------------------------------------------------------*/

var Core = {};

var isFirstFile = true;
//var sofaEnabled = false;
var resetOccured = false;
var notifyAboutUpdates = false;

var cFile;

//TODO: clean up

Core.Menus = {};

Core.onFileLoad = function () {
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
            if (Utils.OSisWindows)
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
        Shaders.apply(Settings.Data.defaultShaderSet);
        isFirstFile = false;
    }

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
            !Utils.OSisWindows &&
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
    //Autoload.loadedFile = cFile;
    Browsers.FileBrowser.currentLocation = cFile;
    Browsers.FileBrowser.gotoParentDirectory();

    for (var i = 0; i < Settings.cache.perFileSaves.length; i++) {
        if (Settings.cache.perFileSaves[i].file == cFile){
            Shaders.apply(Settings.cache.perFileSaves[i].shaderset)
            Colors.apply(Settings.cache.perFileSaves[i].colorpreset);
            Settings.cache.perFileSaves.splice(i, 1);
            break;
        }
    }
};

Core.onShutdown = function () {
    if (cFile != undefined && cFile != "")
    {
        Utils.log("Saving per-file settings...","shutdown","info");
        Settings.cache.perFileSaves.push({file: cFile, shaderset: Shaders.name, colorpreset: Colors.name, timestamp: Date.now()});
        Settings.cache.save();
    }
};

var redrawMenus = function () {
    var currentmenu = UI.Menus.getDisplayedMenu();
    if (currentmenu != undefined) {
        currentmenu.hideMenu();
        currentmenu.showMenu();
    }
};

Core.doRegistrations = function () {
    var handleMenuKeypress = function () {
        Utils.log("Menu key pressed!");
        var currentmenu = UI.Menus.getDisplayedMenu();
        if (currentmenu != undefined) {
            currentmenu.hideMenu();
            return;
        }
        Core.Menus.MainMenu.showMenu();
    };

    var checkVRR = function (){
        var double = "";
        if (Number(mp.get_property("container-fps")) < (Settings.Data.refreshRate / 2) && mp.get_property("speed") == 1) {
            double = String(Number(mp.get_property("container-fps")) * 2);
            if (double < 48) { double = double * 2};
            mp.set_property("override-display-fps",double)
            mp.commandv(
                "vf",
                "set",
                "fps=fps=" + double
            );
        } else {
            mp.set_property("override-display-fps",Settings.Data.refreshRate);
            mp.commandv(
                "vf",
                "set",
                "fps=fps=" + String(mp.get_property("container-fps"))
            );
        }
    }

    mp.add_key_binding(null, "easympv", handleMenuKeypress);
    if (Settings.Data.forcedMenuKey != "disabled")
    {
        mp.add_forced_key_binding(Settings.Data.forcedMenuKey, "easympv-forced-menu", handleMenuKeypress);
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
        });

        mp.add_forced_key_binding("Ctrl+~", "empv_eval_hotkey", function() {
            var readCommand = function (success, result) {
                if (success) {
                    try{
                        var print = function (object) { mp.msg.warn(JSON.stringify(object,undefined,4)); };
                        var clearOSD = function(id) {
                            mp.osd_message("");
                            if (id == undefined){
                                mp.msg.warn("Force-removing all overlays: you might see error messages!");
                                for (var i = 0; i < 1000; i++)
                                {
                                    mp.commandv(
                                        "osd-overlay",
                                        i,
                                        "none",
                                        "",
                                        0,
                                        0,
                                        0,
                                        "no",
                                        "no"
                                    );
                                }
                            }
                            else
                            {
                                mp.commandv(
                                    "osd-overlay",
                                    id,
                                    "none",
                                    "",
                                    0,
                                    0,
                                    0,
                                    "no",
                                    "no"
                                );
                            }
                        }
                        var cmd = function (cmd) {
                            print(OS._call(cmd));
                        }
                        var help = function () {
                            if (UI.Input.OSDLog.OSD == undefined) {
                                UI.Input.OSDLog.show();
                            }
                            //UI.Input.OSDLog.hide();
                            mp.msg.warn("help() output:\nList of helper functions:\n"+
                            "print(obj) -> shorthand for mp.msg.warn(JSON.stringify(obj))\n"+
                            "cmd(command) -> execute shell command\n"+
                            "clearOSD() -> force-removes ALL OSDs and messages on screen"
                            );
                        };
                        eval(result);
                        Utils.showAlert(
                            "info",
                            "Expression evaluated! Check log for more info."
                        );
                    }
                    catch(e)
                    {
                        Utils.showAlert(
                            "error",
                            "Invalid Expression! Error: " + e
                        );
                    }
                }
            };
            UI.Input.show(readCommand,"JavaScript expression (use help() for more info): ");
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

    // Registering an observer to check for chapter changes (Chapters.js)
    mp.observe_property(
        "chapter-metadata/by-key/title",
        undefined,
        Chapters.handler
    );

    if(Settings.Data.simpleVRR)
    {
        mp.observe_property("speed",undefined,checkVRR);
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
}

Core.defineMenus = function () {
    var descriptionShaders = function (a, b) {
        return (
            "Shaders post-process video to improve image quality.@br@" +
            "Use the right arrow key to preview a profile.@br@Use the left arrow key to set it as default.@br@Use Enter to confirm.@br@" +
            "Current default Shaders: " +
            UI.SSA.setColorYellow() +
            b +
            "@br@" +
            "Currently enabled Shaders: " +
            UI.SSA.setColorYellow() +
            a
        );
    };
    var descriptionColors = function (a, b) {
        return (
            "Use the right arrow key to preview a profile.@br@Use the left arrow key to set it as default.@br@Use Enter to confirm.@br@" +
            "Current default Profile: " +
            UI.SSA.setColorYellow() +
            b +
            "@br@" +
            "Current Profile: " +
            UI.SSA.setColorYellow() +
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
        title: UI.SSA.insertSymbolFA("") + "{\\1c&H782B78&}easy{\\1c&Hffffff&}mpv",
        description: "",
        image: "logo",
        customKeyEvents: [{key: "h", event: "help"}]
    };

    var MainMenuItems = [
        {
            title: "Close@br@@br@",
            item: "close",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                }
            }
        },
        {
            title: "Open...",
            item: "open",
            description: "Files, Discs, Devices & URLs",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    Browsers.Selector.open(menu);
                }
            }
        },
        {
            title: "Shaders",
            item: "shaders",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    //UI.Menus.switchCurrentMenu(scope.Menus.ShadersMenu,menu);
                    UI.Menus.switchCurrentMenu(Core.Menus.ShadersMenu,menu);
                }
            }
        },
        {
            title: "Colors",
            item: "colors",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    UI.Menus.switchCurrentMenu(Core.Menus.ColorsMenu,menu);
                }
            }
        },
        {
            title: "Chapters@br@",
            item: "chapters",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    UI.Menus.switchCurrentMenu(Core.Menus.ChaptersMenu,menu);
                }
            }
        },
        {
            title: "Preferences@br@@us10@@br@",
            item: "options",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    UI.Menus.switchCurrentMenu(Core.Menus.SettingsMenu,menu);
                }
            }
        },
        {
            title: "Quit mpv",
            item: "quit",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    quitCounter++;
                    if (!quitCounter.isOdd()) {
                        Utils.exitMpv();
                        menu.hideMenu();
                    } else {
                        quitTitle = this.title;
                        this.title =
                            UI.SSA.setColorRed() + "Are you sure?";
                        menu.redrawMenu();
                    }
                }
            }
        },
    ];

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
    var quitTitle = Core.Menus.MainMenu.items[Core.Menus.MainMenu.items.length - 1].title;
    Core.Menus.MainMenu.eventHandler = function (event, action) {
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
        if (event == "enter") {
            API.openForeignMenu(action);
            return;
        }
        if (event == "hide") {
            Core.Menus.MainMenu.items[Core.Menus.MainMenu.items.length - 1].title = quitTitle;
            quitCounter = 0;
            return;
        }
        if (event == "show") {
            hint = Settings.presets.hints[Math.floor(Math.random() * Settings.presets.hints.length)].replaceAll("@br@", "@br@" + UI.SSA.setColorYellow());
            Core.Menus.MainMenu.settings.description =
                UI.SSA.setColorYellow() +
                UI.SSA.insertSymbolFA(" ",21,21) + hint;

            if (Utils.updateAvailable && notifyAboutUpdates) {
                notifyAboutUpdates = false;
                Utils.showAlert(
                    "info",
                    "An update is available.@br@" +
                    "Current Version: " + Settings.Data.currentVersion +
                    "@br@New Version: " + Settings.Data.newestVersion
                );
            }
            if (errorCounter != 0)
            {
                Core.Menus.MainMenu.setDescription(UI.SSA.setColorRed() + "Encountered "+errorCounter+" issue(s) during runtime!@br@Consider submitting a bug report!")
                Core.Menus.MainMenu.redrawMenu();
            }
            return;
        }
        if (event == "help") {
            Utils.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#main-menu", true);
            return;
        }
    };

    var ShadersMenuSettings = {
        title:
            "{\\1c&H782B78&}" +
            UI.SSA.insertSymbolFA("") +
            UI.SSA.setColorWhite() +
            "Shaders",
        description: descriptionShaders(
            Shaders.name,
            Settings.Data.defaultShaderSet
        ),
        image: "shaders",
        scrollingEnabled: true,
        customKeyEvents: [{key: "h", event: "help"}]
    };

    var ShadersMenuItems = [
        {
            title: UI.SSA.insertSymbolFA(" ",26,30) + "Disable All Shaders@br@@us10@@br@",
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
            title: "Recommended Anime4K Settings (Better, but more demanding)@br@@us10@@br@",
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
        Core.Menus.MainMenu
    );

    Core.Menus.ShadersMenu.eventHandler = function (event, action) {

        switch (event) {
            case "show":
                Core.Menus.ShadersMenu.setDescription(
                    descriptionShaders(Shaders.name, Settings.Data.defaultShaderSet)
                );
                break;
            case "enter":
                Core.Menus.ShadersMenu.hideMenu();
                if (action != "@back@") {
                    Shaders.apply(action);
                    Core.Menus.ShadersMenu.setDescription(
                        descriptionShaders(
                            Shaders.name,
                            Settings.Data.defaultShaderSet
                        )
                    );
                    if (action == "none") {
                        Utils.showAlert(
                            "info",
                            "Shaders have been disabled."
                        );
                    } else {
                        Utils.showAlert(
                            "info",
                            "Shader has been enabled:@br@" +
                            UI.SSA.setColorYellow() + Shaders.name
                        );
                    }
                }
                break;
            case "right":
                if (action != "@back@" && action != "none") {
                    Shaders.apply(action);
                    Core.Menus.ShadersMenu.setDescription(
                        descriptionShaders(
                            Shaders.name,
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
                        "Default shader changed to:@br@" +
                        Settings.Data.defaultShaderSet
                    );
                    Core.Menus.ShadersMenu.setDescription(
                        descriptionShaders(
                            Shaders.name,
                            Settings.Data.defaultShaderSet
                        )
                    );
                }
                break;
            case "help":
                Utils.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#shaders-menu", true);
                break;
            default:
                break;
        }
    };

    var ChaptersMenuSettings = {
        image: "chapters",
        title:
            "{\\1c&H782B78&}" +
            UI.SSA.insertSymbolFA("") +
            UI.SSA.setColorWhite() +
            "Chapters",
        description: "This will autodetect Openings, Endings and Previews and then either \"skip\" or \"slowdown\" them.@br@",
        customKeyEvents: [{key: "h", event: "help"}],
    };

    var ChaptersMenuItems = [
        {
            title: "Change Mode",
            item: "tmode",
            description: UI.SSA.setColorYellow() + "Current mode: " + Chapters.mode,
            eventHandler: function(event, menu)
            {
                if (Chapters.mode == "skip") {
                    Chapters.mode = "slowdown";
                } else {
                    Chapters.mode = "skip";
                }
                this.description = UI.SSA.setColorYellow() + "Current mode: " + Chapters.mode;
                menu.redrawMenu();
            }
        },
        {
            title: "Toggle",
            item: "tstatus",
            description: UI.SSA.setColorYellow() + "Currently " + Chapters.status,
            eventHandler: function(event, menu)
            {
                if (Chapters.status == "disabled") {
                    Chapters.status = "enabled";
                } else {
                    Chapters.status = "disabled";
                }
                this.description = UI.SSA.setColorYellow() + "Currently " + Chapters.status;
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
            Utils.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#chapters-menu", true);
        }
    };

    var SettingsMenuSettings = {
        image: "settings",
        title:
            "{\\1c&H782B78&}" +
            UI.SSA.insertSymbolFA("") +
            UI.SSA.setColorWhite() +
            "Settings",
        description: descriptionSettings(
            Utils.displayVersion,
            Utils.displayVersionMpv
        ),
        customKeyEvents: [{key: "h", event: "help"}]
    };

    var SettingsMenuItems = [
        {
            title: "Toggle Discord RPC@br@@us10@@br@",
            item: "discord",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    mp.commandv("script-binding", "drpc_toggle");
                }
            }
        },
        {
            title: "Check for updates",
            item: "updater",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    var isGit = mp.utils.file_info(mp.utils.get_user_path("~~/.git/")) != undefined ? true : false;
                    menu.hideMenu();
                    var updateConfirmation = false;

                    var setDescription = function()
                    {
                        var d = "You are on version " +
                        UI.SSA.setColorYellow() +
                        Settings.Data.currentVersion;
                        if(isGit) { d += "-git"; }
                        if(!isGit)
                        {
                            d += "@br@The latest available version is " +
                            UI.SSA.setColorYellow() +
                            Settings.Data.newestVersion;
                        }
                        d += "@br@@br@" + Utils.latestUpdateData.changelog;
                        return d;
                    }

                    var umenu = new UI.Menus.Menu(
                        {
                            title: "Update",
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
                                    UI.SSA.setColorRed() + "Are you sure?";
                                umenu.redrawMenu();
                                updateConfirmation = true;
                            }
                        } else if (event == "show") {

                            if(isGit)
                            {
                                if (umenu.items.length == 1) {
                                    umenu.items.push({
                                        title:
                                            "Pull latest changes",
                                        item: "update",
                                    });
                                }
                            }

                            if (Utils.updateAvailable && !isGit)
                            {
                                if (umenu.items.length == 1) {
                                    umenu.items.push({
                                        title:
                                            "Update to version " +
                                            UI.SSA.setColorYellow() +
                                            Settings.Data.newestVersion,
                                        item: "update",
                                    });
                                }
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
                }
            }
        },
        {
            title: "Credits@br@@us10@@br@",
            item: "credits",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    var cmenu = new UI.Menus.Menu(
                        {
                            title: "Credits",
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
            title: "Edit easympv.conf",
            item: "easympvconf",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    Utils.openFile("easympv.conf");
                }
            }
        },
        {
            title: "Edit mpv.conf",
            item: "mpvconf",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    Utils.openFile("mpv.conf");
                }
            }
        },
        {
            title: "Edit input.conf",
            item: "inputconf",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    Utils.openFile("input.conf");
                }
            }
        },
        {
            title: "Reload config",
            item: "reload",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    Settings.reload();
                    Settings.mpvConfig.reload();
                    Settings.inputConfig.reload();
                    Settings.presets.reload();
                    Utils.showAlert("info", "Configuration reloaded.");
                }
            }
        },
        {
            title: "Restart plugin",
            item: "restart",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    mp.commandv("script-message-to", "easympv", "__internal", "restart");
                }
            }
        },
        {
            title: "Open config folder@br@@us10@@br@",
            item: "config",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    Utils.openFile();
                }
            }
        },
        {
            title: "Create Log File",
            item: "log.export",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    var buffer = UI.Input.OSDLog.Buffer.replace(/\{(.+?)\}/g,'').split("\n\n");
                    buffer.reverse();
                    mp.utils.write_file(
                        "file://" + mp.utils.get_user_path("~~desktop/easympv.log"),
                        buffer.join("\n")
                    );
                    Utils.showAlert("info", "Log exported to Desktop!");
                }
            }
        },
        {
            title: "Toggle On-Screen Log",
            item: "log.osd",
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
            title: "Toggle Debug Mode",
            item: "debugmode",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    if (Settings.Data.debugMode)
                    {
                        Settings.Data.debugMode = false;
                        mp.enable_messages("info");
                        Utils.showAlert("info", "Debug mode has been disabled!");
                    }
                    else
                    {
                        Settings.Data.debugMode = true;
                        mp.enable_messages("debug");
                        Utils.showAlert("info", "Debug mode has been enabled!");
                    }
                    Settings.save();
                }
            }
        },
        {
            title: "Input a command",
            item: "command",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    UI.Input.showInteractiveCommandInput();
                }
            }
        },
    ];

    Core.Menus.SettingsMenu = new UI.Menus.Menu(
        SettingsMenuSettings,
        SettingsMenuItems,
        Core.Menus.MainMenu
    );

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
            if (action == "clearwld") {
                Utils.clearWL();
                return;
            }
            if (action == "remote") {
                Settings.Data.useRandomPipeName = false;
                Utils.setIPCServer(Settings.Data.useRandomPipeName);
                Settings.save();
                return;
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
            Utils.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#settings-menu", true);
            return;
        }
    };

    var ColorsMenuSettings = {
        image: "colors",
        title:
            UI.SSA.insertSymbolFA("") +
            "{\\1c&H375AFC&}C{\\1c&H46AEFF&}o{\\1c&H17E8FF&}l{\\1c&H70BF47&}o{\\1c&HFFD948&}r{\\1c&HE6A673&}s",
        description: descriptionColors(
            Colors.name,
            Settings.Data.defaultColorProfile
        ),
        scrollingEnabled: true,
        customKeyEvents: [{key: "h", event: "help"}]
    };

    var ColorsMenuItems = [
        {
            title: UI.SSA.insertSymbolFA(" ",26,30) + "Disable all profiles@br@@us10@@br@",
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
        Core.Menus.MainMenu
    );

    Core.Menus.ColorsMenu.eventHandler = function (event, action) {
        switch (event) {
            case "show":
                Core.Menus.ColorsMenu.setDescription(
                    descriptionColors(
                        Colors.name,
                        Settings.Data.defaultColorProfile
                    )
                );
                break;
            case "enter":
                Core.Menus.ColorsMenu.hideMenu();
                Colors.apply(action);
                if (action == "none") {
                    Utils.showAlert(
                        "info",
                        "Color profile has been disabled."
                    );
                } else {
                    Utils.showAlert(
                        "info",
                        "Color profile has been enabled:@br@" +
                        UI.SSA.setColorYellow() + Colors.name
                    );
                }

                break;
            case "right":
                if (action != "@back@") {
                    Colors.apply(action);
                    Core.Menus.ColorsMenu.setDescription(
                        descriptionColors(
                            Colors.name,
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
                            Colors.name,
                            Settings.Data.defaultColorProfile
                        )
                    );
                    Utils.showAlert(
                        "info",
                        "Default color profile changed to:@br@" +
                        Settings.Data.defaultColorProfile
                    );
                    Settings.save();
                }
                break;
            case "help":
                Utils.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#colors-menu", true);
                break;
            default:
                break;
        }
    };

    var testsMenuitems = [];

    testsMenuitems.push({
        title: "Close@br@@us10@@br@",
        item: "",
        eventHandler: function(event, menu)
        {
            if (event == "enter")
            {
                Core.Menus.TestsMenu.hideMenu();
            }
        }
    });
    for (var test in Tests.json) {
        testsMenuitems.push({
            title: test,
            item: test,
            description: Tests.json[test].description
        });
    }
    testsMenuitems.push({
        title: "[RUN ALL TESTS ABOVE]",
        item: "",
        eventHandler: function(event, menu)
        {
            if (event == "enter")
            {
                for (var i = 1; i < menu.items.length-1; i++)
                {
                    menu._dispatchEvent("enter",menu.items[i]);
                }
            }
        }
    });
    Core.Menus.TestsMenu = new UI.Menus.Menu({
        title: "Tests",
        description: "This menu lets you launch tests.",
        autoClose: 0
    },testsMenuitems,undefined);
    Core.Menus.TestsMenu.eventHandler = function(action, item) {
        if (action == "enter")
        {
            if (item == "ignore")
            {
                return;
            }
            Core.Menus.TestsMenu.setDescription("Test in progress!@br@(DO NOT CLOSE THIS MENU!)");
            Core.Menus.TestsMenu.redrawMenu();
            var result = Tests.run(item);
            var grade = UI.SSA.setColorRed() + "[FAIL]" + UI.SSA.setColorWhite();

            if (result)
            {
                grade = UI.SSA.setColorGreen() + "[PASS]" + UI.SSA.setColorWhite();
            }

            for (var i = 0; i < Core.Menus.TestsMenu.items.length; i++) {
                if (Core.Menus.TestsMenu.items[i].item == item)
                {
                    Core.Menus.TestsMenu.items[i].title = grade + " " + Core.Menus.TestsMenu.items[i].title;
                    Core.Menus.TestsMenu.items[i].item = "ignore";
                }
            }
            Core.Menus.TestsMenu.setDescription("Tests finished.");
            Core.Menus.TestsMenu.redrawMenu();
        }
    };
}

Core.doFileChecks = function () {
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
}

/**
 * The main function, called by main.js.
 */
Core.startExecution = function () {
    Settings.load();
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

    Utils.log("easympv " + Settings.Data.currentVersion + " starting...","startup","info");

    OS.init();
    Tests.init();
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
    Settings.presets.reload();
    Settings.cache.reload();

    if (Settings.Data.isFirstLaunch) {
        Utils.log("startupTask: start Wizard","startup","info");
        Wizard.Start();
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

    Colors.name = Settings.Data.defaultColorProfile;
    Colors.apply(Settings.Data.defaultColorProfile);
}

module.exports = Core;
