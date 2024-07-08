// {"name": "Chapters Extension", "author": "Jong", "version": "2.0.0", "icon": "", "description": "Adds auto-skipping and auto-slowdown for certain chapters in a file, like openings and endings.@br@Replaces previous built-in module."}

/*
 * CHAPTERS.JS (PART OF EASYMPV)
 *
 * Author:         Jong
 * URL:            https://github.com/JongWasTaken/easympv
 * License:        MIT License
 */

var ChaptersExtension = {};

ChaptersExtension.name = "Chapters Extension";

ChaptersExtension.total = 0;
ChaptersExtension.current = 0;
ChaptersExtension.type = "unknown";
ChaptersExtension.cspeed = 1;
ChaptersExtension.mode = "skip";
ChaptersExtension.status = "disabled";

ChaptersExtension.handler = function () {
    // Called on every chapter change

    ChaptersExtension.current = mpv.getProperty("chapter"); // Which chapter is currently playing
    ChaptersExtension.total = Number(mpv.getProperty("chapters")) - 1; // Total number of chapters in video file

    // Try to identify type by comparing data to common patterns
    // Even though this seems janky, it works suprisingly well
    if (ChaptersExtension.total >= 5) {
        ChaptersExtension.type = "modern";
    } else if (ChaptersExtension.total == 4) {
        ChaptersExtension.type = "classic";
    } else if (ChaptersExtension.total == 3) {
        ChaptersExtension.type = "modernalt";
    } else {
        ChaptersExtension.type = "unknown";
    }

    // Do the actual operation
    if (ChaptersExtension.status == "enabled") {
        if (ChaptersExtension.mode == "skip") {
            if (ChaptersExtension.type == "modern") {
                if (
                    ChaptersExtension.current == 1 ||
                    ChaptersExtension.current == 4 ||
                    ChaptersExtension.current == 5
                ) {
                    mpv.command("no-osd add chapter 1");
                }
            } else if (ChaptersExtension.type == "classic") {
                if (
                    ChaptersExtension.current == 0 ||
                    ChaptersExtension.current == 3 ||
                    ChaptersExtension.current == 4
                ) {
                    mpv.command("no-osd add chapter 1");
                }
            } else if (ChaptersExtension.type == "modernalt") {
                if (
                    ChaptersExtension.current == 0 ||
                    ChaptersExtension.current == 2 ||
                    ChaptersExtension.current == 3
                ) {
                    mpv.command("no-osd add chapter 1");
                }
            }
        } else if (ChaptersExtension.mode == "slowdown") {
            if (ChaptersExtension.type == "modern") {
                if (ChaptersExtension.current == 1 || ChaptersExtension.current == 4) {
                    ChaptersExtension.cspeed = mpv.getProperty("speed");
                    mpv.setProperty("speed", 1);
                }
                if (ChaptersExtension.current == 2 || ChaptersExtension.current == 5) {
                    mpv.setProperty("speed", ChaptersExtension.cspeed);
                }
            } else if (ChaptersExtension.type == "classic") {
                if (ChaptersExtension.current == 0 || ChaptersExtension.current == 3) {
                    ChaptersExtension.cspeed = mpv.getProperty("speed");
                    mpv.setProperty("speed", 1);
                }
                if (ChaptersExtension.current == 1 || ChaptersExtension.current == 4) {
                    mpv.setProperty("speed", ChaptersExtension.cspeed);
                }
            } else if (ChaptersExtension.type == "modernalt") {
                if (ChaptersExtension.current == 0 || ChaptersExtension.current == 2) {
                    ChaptersExtension.cspeed = mpv.getProperty("speed");
                    mpv.setProperty("speed", 1);
                }
                if (ChaptersExtension.current == 1 || ChaptersExtension.current == 3) {
                    mpv.setProperty("speed", ChaptersExtension.cspeed);
                }
            }
        }
    }
};

// Our menu gets created after init, otherwise Core.Menus.MainMenu is undefined and the back button will not appear!
ChaptersExtension.ChaptersMenu = undefined;
Events.afterInit.register(ChaptersExtension.name, function() {
    ChaptersExtension.ChaptersMenu = new UI.Menus.Menu(
        {
            menuId: "chapters-menu",
            title: UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("chapters.menu.title"),
            description: Settings.getLocalizedString("chapters.menu.description")
        },
        [
            {
                title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("chapters.mode.title"),
                item: "tmode",
                description: UI.SSA.setColorYellow() + Settings.getLocalizedString("chapters.currentmode") + ChaptersExtension.mode,
                eventHandler: function(event, menu)
                {
                    if (ChaptersExtension.mode == "skip") {
                        ChaptersExtension.mode = "slowdown";
                    } else {
                        ChaptersExtension.mode = "skip";
                    }
                    this.description = UI.SSA.setColorYellow() + Settings.getLocalizedString("chapters.currentmode") + ChaptersExtension.mode;
                    menu.redrawMenu();
                }
            },
            {
                title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("chapters.toggle.title"),
                item: "tstatus",
                description: UI.SSA.setColorYellow() + Settings.getLocalizedString("chapters.status") + ChaptersExtension.status,
                eventHandler: function(event, menu)
                {
                    if (ChaptersExtension.status == "disabled") {
                        ChaptersExtension.status = Settings.getLocalizedString("global.enabled");
                    } else {
                        ChaptersExtension.status = Settings.getLocalizedString("global.disabled");
                    }
                    this.description = UI.SSA.setColorYellow() + Settings.getLocalizedString("chapters.status") + ChaptersExtension.status;
                    menu.redrawMenu();
                }
            },
        ],
        Core.Menus.MainMenu
    );
});

Events.duringRegistration.register(ChaptersExtension.name, function() {
    mp.observe_property(
        "chapter-metadata/by-key/title",
        undefined,
        ChaptersExtension.handler
    );
});

Events.duringUnregistration.register(ChaptersExtension.name, function() {
    mp.unobserve_property(ChaptersExtension.handler);
});

Events.beforeCreateMenu.register(ChaptersExtension.name, function(settings, items) {
    if (settings.menuId != "main-menu") return;

    UI.Menus.Menu.getItemByIdStaticDirect("playback", items).hasSeperator = false;
    UI.Menus.Menu.insertAfterItemStaticDirect("playback",
    {
        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("main.chapters.title"),
        item: "chapters",
        hasSeperator: true,
        eventHandler: function(event, menu) {
            if (event == "enter") {
                UI.Menus.switchCurrentMenu(ChaptersExtension.ChaptersMenu,menu);
            }
        }
    }, items);
})