// {"name": "Chapter Utilities", "author": "Jong", "version": "2.0.0", "icon": "", "description": "Adds auto-skipping and auto-slowdown for certain chapters in a file, like openings and endings.@br@Replaces previous built-in module."}

/*
 * CHAPTERS.JS (PART OF EASYMPV)
 *
 * Author:         Jong
 * URL:            https://github.com/JongWasTaken/easympv
 * License:        MIT License
 */

$self.name = "Chapter Utilities";

$self.total = 0;
$self.current = 0;
$self.type = "unknown";
$self.cspeed = 1;
$self.mode = "skip";
$self.status = "disabled";

$self.handler = function () {
    // Called on every chapter change

    $self.current = mpv.getProperty("chapter"); // Which chapter is currently playing
    $self.total = Number(mpv.getProperty("chapters")) - 1; // Total number of chapters in video file

    // Try to identify type by comparing data to common patterns
    // Even though this seems completly arbitrary, it works suprisingly well
    if ($self.total >= 5) {
        $self.type = "modern";
    } else if ($self.total == 4) {
        $self.type = "classic";
    } else if ($self.total == 3) {
        $self.type = "modernalt";
    } else {
        $self.type = "unknown";
    }

    // Do the actual operation
    if ($self.status == "enabled") {
        if ($self.mode == "skip") {
            if ($self.type == "modern") {
                if (
                    $self.current == 1 ||
                    $self.current == 4 ||
                    $self.current == 5
                ) {
                    mpv.command("no-osd add chapter 1");
                }
            } else if ($self.type == "classic") {
                if (
                    $self.current == 0 ||
                    $self.current == 3 ||
                    $self.current == 4
                ) {
                    mpv.command("no-osd add chapter 1");
                }
            } else if ($self.type == "modernalt") {
                if (
                    $self.current == 0 ||
                    $self.current == 2 ||
                    $self.current == 3
                ) {
                    mpv.command("no-osd add chapter 1");
                }
            }
        } else if ($self.mode == "slowdown") {
            if ($self.type == "modern") {
                if (
                    $self.current == 1 ||
                    $self.current == 4
                ) {
                    $self.cspeed = mpv.getProperty("speed");
                    mpv.setProperty("speed", 1);
                }
                if (
                    $self.current == 2 ||
                    $self.current == 5
                ) {
                    mpv.setProperty("speed", $self.cspeed);
                }
            } else if ($self.type == "classic") {
                if (
                    $self.current == 0 ||
                    $self.current == 3
                ) {
                    $self.cspeed = mpv.getProperty("speed");
                    mpv.setProperty("speed", 1);
                }
                if (
                    $self.current == 1 ||
                    $self.current == 4
                ) {
                    mpv.setProperty("speed", $self.cspeed);
                }
            } else if ($self.type == "modernalt") {
                if (
                    $self.current == 0 ||
                    $self.current == 2
                ) {
                    $self.cspeed = mpv.getProperty("speed");
                    mpv.setProperty("speed", 1);
                }
                if (
                    $self.current == 1 ||
                    $self.current == 3
                ) {
                    mpv.setProperty("speed", $self.cspeed);
                }
            }
        }
    }
};

// Our menu gets created after init, otherwise Core.Menus.MainMenu is undefined and the back button will not appear!
$self.ChaptersMenu = undefined;
Events.afterInit.$register(function () {
    $self.ChaptersMenu = new UI.Menus.Menu(
        {
            menuId: "chapters-menu",
            title:
                UI.SSA.insertSymbolFA("") +
                " " +
                Settings.getLocalizedString("chapters.menu.title"),
            description: Settings.getLocalizedString(
                "chapters.menu.description"
            ),
        },
        [
            {
                title:
                    UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) +
                    Settings.getLocalizedString("chapters.mode.title"),
                item: "tmode",
                description:
                    UI.SSA.setColorYellow() +
                    Settings.getLocalizedString("chapters.currentmode") +
                    $self.mode,
                eventHandler: function (event, menu) {
                    if ($self.mode == "skip") {
                        $self.mode = "slowdown";
                    } else {
                        $self.mode = "skip";
                    }
                    this.description =
                        UI.SSA.setColorYellow() +
                        Settings.getLocalizedString("chapters.currentmode") +
                        $self.mode;
                    menu.redrawMenu();
                },
            },
            {
                title:
                    UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) +
                    Settings.getLocalizedString("chapters.toggle.title"),
                item: "tstatus",
                description:
                    UI.SSA.setColorYellow() +
                    Settings.getLocalizedString("chapters.status") +
                    $self.status,
                eventHandler: function (event, menu) {
                    if ($self.status == "disabled") {
                        $self.status =
                            Settings.getLocalizedString("global.enabled");
                    } else {
                        $self.status =
                            Settings.getLocalizedString("global.disabled");
                    }
                    this.description =
                        UI.SSA.setColorYellow() +
                        Settings.getLocalizedString("chapters.status") +
                        $self.status;
                    menu.redrawMenu();
                },
            },
        ],
        Core.Menus.MainMenu
    );
});

Events.duringRegistration.$register(function () {
    mp.observe_property(
        "chapter-metadata/by-key/title",
        undefined,
        $self.handler
    );
});

Events.duringUnregistration.$register(function () {
    mp.unobserve_property($self.handler);
});

Events.beforeCreateMenu.$register(
    function (settings, items) {
        if (settings.menuId != "main-menu") return;

        UI.Menus.Menu.getItemByIdStaticDirect(
            "playback",
            items
        ).hasSeperator = false;
        UI.Menus.Menu.insertAfterItemStaticDirect(
            "playback",
            {
                title:
                    UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) +
                    Settings.getLocalizedString("main.chapters.title"),
                item: "chapters",
                hasSeperator: true,
                eventHandler: function (event, menu) {
                    if (event == "enter") {
                        UI.Menus.switchCurrentMenu(
                            $self.ChaptersMenu,
                            menu
                        );
                    }
                },
            },
            items
        );
    }
);
