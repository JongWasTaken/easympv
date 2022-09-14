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
//TODO: clean up
/**
 * The main function, called by main.js.
 */
Core.startExecution = function () {

    var isFirstFile = true;
    var sofaEnabled = false;

    // Setup
    Settings.load();

    if(Settings.Data.debugMode)
    {
        mp.enable_messages("debug");
    }
    else
    {
        mp.enable_messages("info");
    }

    mp.register_event("log-message", Utils.OSDLog.addToBuffer);

    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    Settings.Data.currentVersion = "2.0.0";
    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    Utils.log("easympv " + Settings.Data.currentVersion + " starting...","startup","info");

    Utils.determineOS();
    Utils.checkInternetConnection();

    var resetOccured = false;

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
        //Utils.showSystemMessagebox("mpv has been restarted to reload its configuration.");
        //Utils.restartMpv();
    };

    if(Settings.Data.startIPCServer)
    { 
        Utils.setIPCServer();
    }

    var notifyAboutUpdates = Settings.Data.notifyAboutUpdates;

    Utils.log("Reading presets","startup","info");
    Settings.presets.reload();

    Settings.Data.newestVersion = "0.0.0";
    Utils.WL.createCache();

    if (Settings.Data.isFirstLaunch) {
        Utils.log("startupTask: start Wizard","startup","info");
        Wizard.Start();
    }
    else
    {
        Utils.log("Settings.save","startup","info");
        Settings.save();
    }

    Browsers.FileBrowser.currentLocation = mp.get_property("working-directory");

    var onFileLoad = function () {

        var wld = Utils.WL.getData();
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

        if (wld != undefined) {
            Utils.log(
                "Please ignore \"Error parsing option x (option not found)\" errors. These are expected.","startup","warn"
            );
            if (wld.shader != undefined && !Shaders.manualSelection) {
                Shaders.apply(wld.shader);
            }
            if (wld.color != undefined) {
                // We don't Colors.apply this, because mpv already does that by itself.
                // Instead we just set Colors.name, achieving the same result.
                Colors.name = wld.color;
            }
        }

        // mpv does not provide a good way to get the current filename, so we need to get creative
        // (stream-open-filename does not work with relative paths and URLs!)
        var cFile;
        for (i = 0; i < Number(mp.get_property("playlist/count")); i++) {
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
            Browsers.FileBrowser.currentLocation = cFile;
            Browsers.FileBrowser.currentLocation =
                Browsers.FileBrowser.getParentDirectory();
        }


    };

    var onShutdown = function () {
        // This is not ideal, as data will only be saved when mpv is being closed.
        // Ideally, this would be in the on_startup block, before a file change.
        Utils.log("Writing data to watch_later...","shutdown","info");
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
                API.openForeignMenu(action);
            }
        } else if (event == "hide") {
            MainMenu.items[MainMenu.items.length - 1].title = quitTitle;
            quitCounter = 0;
        } else if (event == "show") {
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
                MainMenu.setDescription(SSA.setColorRed() + "Encountered "+errorCounter+" issue(s) during runtime!@br@Consider submitting a bug report!")
                MainMenu.redrawMenu();
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
        scrollingEnabled: true
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
                    if (action == "none") {
                        Utils.showAlert(
                            "info",
                            "Shaders have been disabled."
                        );
                    } else {
                        Utils.showAlert(
                            "info",
                            "Shader has been enabled:@br@" +
                            SSA.setColorYellow() + Shaders.name
                        );
                    }
                }
                break;
            case "right":
                if (action != "@back@" && action != "none") {
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
                    Utils.showAlert(
                        "info",
                        "Default shader changed to:@br@" +
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
            title: "Toggle Discord RPC@br@@us10@@br@",
            item: "discord",
        },
        {
            title: "Check for updates",
            item: "updater",
        },
        {
            title: "Credits@br@@us10@@br@",
            item: "credits",
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
            title: "Reload config",
            item: "reload",
        },
        {
            title: "Open config folder@br@@us10@@br@",
            item: "config",
        },
        {
            title: "Create Log File",
            item: "log.export",
        },
        {
            title: "Toggle On-Screen Log",
            item: "log.osd",
        },
        {
            title: "Toggle Debug Mode",
            item: "debugmode",
        },
        {
            title: "Input a command",
            item: "command",
        },
    ];

    /*
        {
            title: "Clear watchlater data",
            item: "clearwld",
        },
    */

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
                return;
            }
            if (action == "debugmode") {
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
                return;
            }
            if (action == "log.osd") {
                if (Utils.OSDLog.OSD == undefined) {
                    Utils.OSDLog.show();
                }
                else
                { 
                    Utils.OSDLog.hide();
                }
                return;
            }
            if (action == "log.export") {
                mp.utils.write_file(
                    "file://" + mp.utils.get_user_path("~~desktop/easympv.log"),
                    Utils.OSDLog.Buffer.replace(/\{(.+?)\}/g,'')
                );
                Utils.showAlert("info", "Log exported to Desktop!");
                return;
            }
            if (action == "discord") {
                mp.commandv("script-binding", "drpc_toggle");
                return;
            }
            if (action == "easympvconf") {
                Utils.openFile("easympv.conf");
                return;
            }
            if (action == "mpvconf") {
                Utils.openFile("mpv.conf");
                return;
            }
            if (action == "inputconf") {
                Utils.openFile("input.conf");
                return;
            }
            if (action == "updater") {
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
                return;
            }
            if (action == "config") {
                Utils.openFile("");
                return;
            }
            if (action == "clearwld") {
                Utils.WL.clear();
                return;
            }
            if (action == "command") {
                Utils.showInteractiveCommandInput();
                return;
            }
            if (action == "credits") {
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
                return;
            }
            if (action == "reload") {
                Settings.reload();
                Settings.mpvConfig.reload();
                Settings.inputConfig.reload();
                Settings.presets.reload();
                Utils.showAlert("info", "Configuration reloaded.");
                return;
            }
            if (action == "remote") {
                Settings.Data.useRandomPipeName = false;
                Utils.setIPCServer(Settings.Data.useRandomPipeName);
                Settings.save();
                return;
            }
            return;
        } else if (event == "show") {

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
        scrollingEnabled: true
    };

    var ColorsMenuItems = [
        {
            title: "[Disable All Presets]@br@@us10@@br@",
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
                    Utils.showAlert(
                        "info",
                        "Color profile has been disabled."
                    );
                } else {
                    Utils.showAlert(
                        "info",
                        "Color profile has been enabled:@br@" +
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
                    Utils.showAlert(
                        "info",
                        "Default color profile changed to:@br@" +
                        Settings.Data.defaultColorProfile
                    );
                    Settings.save();
                }
                break;
        }
    };

    ////////////////////////////////////////////////////////////////////////

    // Add menu key binding and its logic

    var handleMenuKeypress = function () {
        Utils.log("Menu key pressed!");

        var currentmenu = MenuSystem.getDisplayedMenu();
        
        if (currentmenu != undefined) {
            currentmenu.hideMenu();
        } 
        else
        {
            MainMenu.showMenu();
        }
    };

    mp.add_key_binding(null, "easympv", handleMenuKeypress);
    if (Settings.Data.forcedMenuKey != "disabled")
    {
        mp.add_forced_key_binding(Settings.Data.forcedMenuKey, "easympv-forced-menu", handleMenuKeypress);
        /*
        mp.add_forced_key_binding(Settings.Data.forcedMenuKey, "easympv-forced-menu", function() {

            var x = {
                "sender": "easympv",
                "context": "deez",
                "command": "createmenu",
                "arguments": {
                    "menuName": "My Awesome Menu",
                    "menuSettings": {
                        "title": "My Awesome Title",
                        "description": "My Awesome Description",
                        "descriptionColor": "ff0000"
                    },
                    "menuItems": [
                        {
                            "title": "Option 1",
                            "item": "option1"
                        },
                        {
                            "title": "Option 2",
                            "item": "option2"
                        }
                    ]
                }
            };

            mp.commandv("script-message-to","easympv","json",JSON.stringify(x));
        });
        */
    }

    //mp.add_forced_key_binding(",", "testkey", function () {});

    mp.add_forced_key_binding("Ctrl+`", "empv_command_hotkey", Utils.showInteractiveCommandInput);
    mp.add_forced_key_binding("Ctrl+Alt+`", "empv_log_hotkey", function () {
        if (Utils.OSDLog.OSD == undefined)
        {
            Utils.OSDLog.show();
        return;
        }
        Utils.OSDLog.hide();
    });
    mp.add_forced_key_binding("Ctrl+~", "empv_eval_hotkey", function() {
        var readCommand = function (success, result) {
            if (success) {
                try{
                    eval(result);
                    Utils.showAlert(
                        "info",
                        "Expression evaluated!"
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
        Utils.Input.show(readCommand,"JavaScript expression: ");
    });

    mp.add_key_binding("n", "empv_toggle_sofa", function () {
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
                    SSA.setColorGreen() + "enabled"
                );
            } else {
                Utils.showAlert(
                    "info",
                    "Sofalizer:@br@" +
                    SSA.setColorRed() + "disabled"
                );
            }
        } else {
            Utils.showAlert(
                "warning",
                "File not found:@br@" +
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
        Chapters.handler
    );

    mp.register_script_message("json",API.handleIncomingJSON);

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
}

module.exports = Core;