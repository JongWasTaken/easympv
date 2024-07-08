/*
 * SETUP.JS (PART OF EASYMPV),
 *
 * Author:         Jong
 * URL:            https://github.com/JongWasTaken/easympv
 * License:        MIT License
 *
 */
Settings.load();
Settings.presets.reload();

var Setup = {};
Setup.idsToUnblock = [];
Setup.Menus = {};

var menuColor = "#77dd11";
// temp
var unblock = function () {
    if (Setup.idsToUnblock.length == 0) {
        return;
    }

    // Unblock quit keys
    for (i = 0; i < Setup.idsToUnblock.length; i++) {
        mp.remove_key_binding(Setup.idsToUnblock[i]);
    }
};

var title = function (n1,n2) {
    return Settings.getLocalizedString("ftw.menu.title") + n1 + "/" + n2;
}
Setup.Menus.Page1 = new UI.Menus.Menu(
    {
        menuId: "ftw-menu-1",
        helpTarget: "introduction",
        title: "",
        description: Settings.getLocalizedString("ftw.page1.description"),
        selectedItemColor: menuColor,
        autoClose: 0,
        fadeIn: false,
        fadeOut: false
    },
    [
        {
            title: Settings.getLocalizedString("ftw.continue.title"),
            item: "continue",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    Setup.Menus.Page1.hideMenu();
                    Setup.Menus.Page2.showMenu();
                }
            }
        },
    ],
    undefined
);

Setup.Menus.Page2Options = {
    PerformanceName: [
        Settings.getLocalizedString("ftw.performance.first.title"),
        Settings.getLocalizedString("ftw.performance.second.title"),
        Settings.getLocalizedString("ftw.performance.third.title")
    ],
    PerformanceDescription: [
        Settings.getLocalizedString("ftw.performance.first.description"),
        Settings.getLocalizedString("ftw.performance.second.description"),
        Settings.getLocalizedString("ftw.performance.third.description")
    ],
    AudioLanguageNames: [ "none", "Japanese", "English", "German" ],
    AudioLanguageDescription: Settings.getLocalizedString("ftw.audiolanguage.description"),
    SubLanguageNames: [ "none", "English", "German", "Japanese" ],
    SubLanguageDescription: Settings.getLocalizedString("ftw.sublanguage.description")
};

Setup.Menus.Page2 = new UI.Menus.Menu(
    {
        menuId: "ftw-menu-2",
        helpTarget: "choosing-default-settings",
        title: "",
        description: Settings.getLocalizedString("ftw.page2.description"),
        selectedItemColor: menuColor,
        autoClose: 0,
        fadeIn: false,
        fadeOut: false
    },
    [
        {
            title: Settings.getLocalizedString("ftw.performance.title") + "@us10@@br@",
            item: "toggle-performance",
            description: Setup.Menus.Page2Options.PerformanceName[1] + Setup.Menus.Page2Options.PerformanceDescription[1],
            data: 1,
            eventHandler: function(event,menu)
            {
                if (event == "enter") return;
                if (event == "left" && this.data != 0)
                {
                    this.data = this.data - 1;
                }
                if (event == "right" && this.data != Setup.Menus.Page2Options.PerformanceName.length-1)
                {
                    this.data = this.data + 1;
                }
                this.description = Setup.Menus.Page2Options.PerformanceName[this.data];
                this.description += Setup.Menus.Page2Options.PerformanceDescription[this.data];
                Setup.Menus.Page2.redrawMenu();
            }
        },
        {
            title: Settings.getLocalizedString("ftw.audiolanguage.title"),
            item: "toggle-audio-language",
            description: Setup.Menus.Page2Options.AudioLanguageNames[1] + Setup.Menus.Page2Options.AudioLanguageDescription,
            data: 1,
            eventHandler: function(event,menu)
            {
                if (event == "enter") return;
                if (event == "left" && this.data != 0)
                {
                    this.data = this.data - 1;
                }
                if (event == "right" && this.data != Setup.Menus.Page2Options.AudioLanguageNames.length-1)
                {
                    this.data = this.data + 1;
                }
                this.description = Setup.Menus.Page2Options.AudioLanguageNames[this.data];
                this.description += Setup.Menus.Page2Options.AudioLanguageDescription;
                Setup.Menus.Page2.redrawMenu();
            }
        },
        {
            title: Settings.getLocalizedString("ftw.sublanguage.title") + "@us10@@br@",
            item: "toggle-sub-language",
            description: Setup.Menus.Page2Options.SubLanguageNames[1] + Setup.Menus.Page2Options.SubLanguageDescription,
            data: 1,
            eventHandler: function(event,menu)
            {
                if (event == "enter") return;
                if (event == "left" && this.data != 0)
                {
                    this.data = this.data - 1;
                }
                if (event == "right" && this.data != Setup.Menus.Page2Options.SubLanguageNames.length-1)
                {
                    this.data = this.data + 1;
                }
                this.description = Setup.Menus.Page2Options.SubLanguageNames[this.data];
                this.description += Setup.Menus.Page2Options.SubLanguageDescription;
                Setup.Menus.Page2.redrawMenu();
            }
        },
        {
            title: Settings.getLocalizedString("ftw.continue.title"),
            item: "continue",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    Setup.Menus.Page2.hideMenu();
                    Setup.Menus.Page3.showMenu();
                }
            }
        },
    ],
    Setup.Menus.Page1
);

Setup.Menus.Page3 = new UI.Menus.Menu(
    {
        menuId: "ftw-menu-3",
        helpTarget: "finishing-up",
        title: "",
        description: Settings.getLocalizedString("ftw.page3.description"),
        selectedItemColor: menuColor,
        autoClose: 0,
        fadeIn: false,
        fadeOut: false
    },
    [
        {
            title: Settings.getLocalizedString("ftw.finish.title"),
            item: "finish",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    Setup.Menus.Page3.hideMenu();

                    Settings.mpvConfig.load();

                    var ppreset = Setup.Menus.Page2Options.PerformanceName[Setup.Menus.Page2.items[1].data];
                    if (ppreset == Settings.getLocalizedString("ftw.performance.first.title"))
                    {
                        Settings.mpvConfig.Data.scale = "bilinear";
                        Settings.mpvConfig.Data.cscale = "bilinear";
                        Settings.mpvConfig.Data.dscale = "bilinear";
                        Settings.mpvConfig.Data.tscale = "oversample";
                        Settings.mpvConfig.Data.deband = "no";
                        Settings.mpvConfig.Data.demuxer_mkv_subtitle_preroll = "no";
                        Settings.mpvConfig.Data.sigmoid_upscaling = "no";
                        Settings.mpvConfig.Data.correct_downscaling = "no";
                        Settings.mpvConfig.Data.video_sync = "audio";
                    }
                    else if (ppreset == Settings.getLocalizedString("ftw.performance.second.title"))
                    {
                        Settings.mpvConfig.Data.scale = "spline36";
                        Settings.mpvConfig.Data.cscale = "spline36";
                        Settings.mpvConfig.Data.dscale = "spline36";
                        Settings.mpvConfig.Data.tscale = "linear";
                        Settings.mpvConfig.Data.deband = "yes";
                        Settings.mpvConfig.Data.demuxer_mkv_subtitle_preroll = "no";
                        Settings.mpvConfig.Data.sigmoid_upscaling = "yes";
                        Settings.mpvConfig.Data.correct_downscaling = "no";
                        Settings.mpvConfig.Data.video_sync = "audio";
                    }
                    else if (ppreset == Settings.getLocalizedString("ftw.performance.third.title"))
                    {
                        Settings.mpvConfig.Data.scale = "ewa_lanczossharp";
                        Settings.mpvConfig.Data.cscale = "ewa_lanczossharp";
                        Settings.mpvConfig.Data.dscale = "mitchell";
                        Settings.mpvConfig.Data.tscale = "mitchell";
                        Settings.mpvConfig.Data.deband = "yes";
                        Settings.mpvConfig.Data.demuxer_mkv_subtitle_preroll = "yes";
                        Settings.mpvConfig.Data.sigmoid_upscaling = "yes";
                        Settings.mpvConfig.Data.correct_downscaling = "yes";
                        Settings.mpvConfig.Data.video_sync = "display-resample";
                    }

                    var alang = Setup.Menus.Page2Options.AudioLanguageNames[Setup.Menus.Page2.items[2].data];
                    if (alang == "Japanese")
                    {
                        Settings.mpvConfig.Data.alang = "Japanese,ja,jap,jpn,日本,日本語";
                    } else if (alang == "German")
                    {
                        Settings.mpvConfig.Data.alang = "German,ger,Deutsch,deu,de";
                    } else if (alang == "English")
                    {
                        Settings.mpvConfig.Data.alang = "English,eng,en";
                    } else { Settings.mpvConfig.Data.alang= ""; }

                    var slang = Setup.Menus.Page2Options.SubLanguageNames[Setup.Menus.Page2.items[3].data];
                    if (slang == "Japanese")
                    {
                        Settings.mpvConfig.Data.slang = "Japanese,ja,jap,jpn,日本,日本語";
                    } else if (slang == "German")
                    {
                        Settings.mpvConfig.Data.slang = "German,ger,Deutsch,deu,de";
                    } else if (slang == "English")
                    {
                        Settings.mpvConfig.Data.slang = "Full,English,eng,en,Subtitles";
                    } else { Settings.mpvConfig.Data.slang= ""; }

                    Settings.mpvConfig.save();

                    Settings.Data.isFirstLaunch = false;
                    Settings.save();
                    unblock();
                }
            }
        },
    ],
    Setup.Menus.Page2
);

Setup.Start = function () {
    Settings.load();
    var pageTotal = Object.keys(Setup.Menus).length-1;
    Setup.Menus.Page1.settings.title = title(1,pageTotal);
    Setup.Menus.Page2.settings.title = title(2,pageTotal);
    Setup.Menus.Page3.settings.title = title(3,pageTotal);
    // disable all menus keys
    var bindings = JSON.parse(mpv.getProperty("input-bindings"));
    var keysToBlock = [];
    Setup.idsToUnblock = [];
    for (i = 0; i < bindings.length; i++) {
        if (bindings[i].cmd.includes("script_binding easympv")) {
            keysToBlock.push(bindings[i]);
        }
    }
    for (i = 0; i < keysToBlock.length; i++) {
        mp.add_forced_key_binding(
            keysToBlock[i].key,
            "prevent_menu_" + i,
            function () {}
        );
        Setup.idsToUnblock.push("prevent_menu_" + i);
    }
    // open page1
    Setup.Menus.Page1.showMenu();
};
