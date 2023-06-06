/*
 * FIRSTTIMEWIZARD.JS (MODULE),
 *
 * Author:         Jong
 * URL:            https://smto.pw/mpv
 * License:        MIT License
 *
 */

var Settings = require("./Settings");
var UI = require("./UI");
var Utils = require("./Utils");

var Wizard = {};
Wizard.idsToUnblock = [];
Wizard.Menus = {};

var menuColor = "#77dd11";

// temp
var unblock = function () {
    if (Wizard.idsToUnblock.length == 0) {
        return;
    }

    // Unblock quit keys
    for (i = 0; i < Wizard.idsToUnblock.length; i++) {
        mp.remove_key_binding(Wizard.idsToUnblock[i]);
    }
};

var title = function (n1,n2) {
    return "easympv Initial Setup - Page " + n1 + "/" + n2;
}

Wizard.Menus.Page1 = new UI.Menus.Menu(
    {
        title: "",
        description:
            "Thank you for trying out easympv!@br@" +
            "Since this is the first time easympv has been loaded, we will have to set a few settings.@br@" +
            "You can navigate menus like this one using the mousewheel or arrow keys and enter.@br@" +
            "Press \"h\" while any menu is shown to get more information.",
        selectedItemColor: menuColor,
        autoClose: 0,
        customKeyEvents: [{key: "h", event: "help"}],
        fadeIn: false,
        fadeOut: false
    },
    [
        {
            title: "Continue",
            item: "continue",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    Wizard.Menus.Page1.hideMenu();
                    Wizard.Menus.Page2.showMenu();
                }
            }
        },
    ],
    undefined
);

Wizard.Menus.Page1.eventHandler = function (event, action) {
    if (event == "help") {Utils.openFile("https://github.com/JongWasTaken/easympv/wiki/Setup#introduction", true);}
};

Wizard.Menus.Page2Options = {
    PerformanceName: [
        "Lowest / \"Potato\"",
        "Laptop / integrated GPU",
        "Desktop / good dedicated GPU"
    ],
    PerformanceDescription: [
        "@br@Choose this if your PC is old.@br@At this point you should probably use your phone instead.@br@",
        "@br@Choose this preset if you have no dedicated GPU, or you are not sure.@br@@br@",
        "@br@Choose this preset if your PC can play videogames well.@br@@br@"
    ],
    AudioLanguageNames: [ "none", "Japanese", "English", "German" ],
    AudioLanguageDescription: "@br@Set to \"none\" to use the default language specified by a video file.@br@",
    SubLanguageNames: [ "none", "English", "German", "Japanese" ],
    SubLanguageDescription: "@br@Set to \"none\" to not display subtitles by default.@br@"
};

Wizard.Menus.Page2 = new UI.Menus.Menu(
    {
        title: "",
        description: "Use the left/right arrow key to change an option.",
        selectedItemColor: menuColor,
        autoClose: 0,
        customKeyEvents: [{key: "h", event: "help"}],
        fadeIn: false,
        fadeOut: false
    },
    [
        {
            title: "Performance Preset@us10@@br@",
            item: "toggle-performance",
            description: Wizard.Menus.Page2Options.PerformanceName[1] + Wizard.Menus.Page2Options.PerformanceDescription[1],
            data: 1,
            eventHandler: function(event,menu)
            {
                if (event == "enter") return;
                if (event == "left" && this.data != 0)
                {
                    this.data = this.data - 1;
                }
                if (event == "right" && this.data != Wizard.Menus.Page2Options.PerformanceName.length-1)
                {
                    this.data = this.data + 1;
                }
                this.description = Wizard.Menus.Page2Options.PerformanceName[this.data];
                this.description += Wizard.Menus.Page2Options.PerformanceDescription[this.data];
                Wizard.Menus.Page2.redrawMenu();
            }
        },
        {
            title: "Default Audio Language",
            item: "toggle-audio-language",
            description: Wizard.Menus.Page2Options.AudioLanguageNames[1] + Wizard.Menus.Page2Options.AudioLanguageDescription,
            data: 1,
            eventHandler: function(event,menu)
            {
                if (event == "enter") return;
                if (event == "left" && this.data != 0)
                {
                    this.data = this.data - 1;
                }
                if (event == "right" && this.data != Wizard.Menus.Page2Options.AudioLanguageNames.length-1)
                {
                    this.data = this.data + 1;
                }
                this.description = Wizard.Menus.Page2Options.AudioLanguageNames[this.data];
                this.description += Wizard.Menus.Page2Options.AudioLanguageDescription;
                Wizard.Menus.Page2.redrawMenu();
            }
        },
        {
            title: "Default Subtitle Language@us10@@br@",
            item: "toggle-sub-language",
            description: Wizard.Menus.Page2Options.SubLanguageNames[1] + Wizard.Menus.Page2Options.SubLanguageDescription,
            data: 1,
            eventHandler: function(event,menu)
            {
                if (event == "enter") return;
                if (event == "left" && this.data != 0)
                {
                    this.data = this.data - 1;
                }
                if (event == "right" && this.data != Wizard.Menus.Page2Options.SubLanguageNames.length-1)
                {
                    this.data = this.data + 1;
                }
                this.description = Wizard.Menus.Page2Options.SubLanguageNames[this.data];
                this.description += Wizard.Menus.Page2Options.SubLanguageDescription;
                Wizard.Menus.Page2.redrawMenu();
            }
        },
        {
            title: "Continue",
            item: "continue",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    Wizard.Menus.Page2.hideMenu();
                    Wizard.Menus.Page3.showMenu();
                }
            }
        },
    ],
    Wizard.Menus.Page1
);

Wizard.Menus.Page2.eventHandler = function (event, action) {
    if (event == "help") {Utils.openFile("https://github.com/JongWasTaken/easympv/wiki/Setup#choosing-default-settings", true);}
};

Wizard.Menus.Page3 = new UI.Menus.Menu(
    {
        title: "",
        description: "And that is it!@br@Select \"Finish\" to apply your changes.@br@IMPORTANT: Changes are not actually applied in this commit!",
        selectedItemColor: menuColor,
        autoClose: 0,
        customKeyEvents: [{key: "h", event: "help"}],
        fadeIn: false,
        fadeOut: false
    },
    [
        {
            title: "Finish",
            item: "finish",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    Wizard.Menus.Page3.hideMenu();

                    Settings.Data.isFirstLaunch = false;
                    Settings.save();
                    unblock();
                    return;

                    // below works, but there are some issues with the Settings module, so its disabled for now
                    Settings.mpvConfig.load();

                    var ppreset = Wizard.Menus.Page2Options.PerformanceName[Wizard.Menus.Page2.items[1].data];
                    if (ppreset == "Lowest / \"Potato\"")
                    {
                        Settings.mpvConfig.Data.scale = "bilinear";
                        Settings.mpvConfig.Data.cscale = "bilinear";
                        Settings.mpvConfig.Data.dscale = "bilinear";
                        Settings.mpvConfig.Data.tscale = "oversample";
                        Settings.mpvConfig.Data.hwdec = "auto-safe";
                        Settings.mpvConfig.Data.deband = "no";
                        Settings.mpvConfig.Data.demuxer_mkv_subtitle_preroll = "no";
                        Settings.mpvConfig.Data.sigmoid_upscaling = "no";
                        Settings.mpvConfig.Data.correct_downscaling = "no";
                        Settings.mpvConfig.Data.video_sync = "audio";
                    }
                    else if (ppreset == "Laptop / integrated GPU")
                    {
                        Settings.mpvConfig.Data.scale = "spline36";
                        Settings.mpvConfig.Data.cscale = "spline36";
                        Settings.mpvConfig.Data.dscale = "spline36";
                        Settings.mpvConfig.Data.tscale = "linear";
                        Settings.mpvConfig.Data.hwdec = "auto-safe";
                        Settings.mpvConfig.Data.deband = "yes";
                        Settings.mpvConfig.Data.demuxer_mkv_subtitle_preroll = "no";
                        Settings.mpvConfig.Data.sigmoid_upscaling = "yes";
                        Settings.mpvConfig.Data.correct_downscaling = "no";
                        Settings.mpvConfig.Data.video_sync = "audio";
                    }
                    else if (ppreset == "Desktop / good dedicated GPU")
                    {
                        Settings.mpvConfig.Data.scale = "ewa_lanczossharp";
                        Settings.mpvConfig.Data.cscale = "ewa_lanczossharp";
                        Settings.mpvConfig.Data.dscale = "mitchell";
                        Settings.mpvConfig.Data.tscale = "mitchell";
                        Settings.mpvConfig.Data.hwdec = "auto-safe";
                        Settings.mpvConfig.Data.deband = "yes";
                        Settings.mpvConfig.Data.demuxer_mkv_subtitle_preroll = "yes";
                        Settings.mpvConfig.Data.sigmoid_upscaling = "yes";
                        Settings.mpvConfig.Data.correct_downscaling = "yes";
                        Settings.mpvConfig.Data.video_sync = "display-resample";
                    }

                    var alang = Wizard.Menus.Page2Options.AudioLanguageNames[Wizard.Menus.Page2.items[2].data];
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

                    var slang = Wizard.Menus.Page2Options.SubLanguageNames[Wizard.Menus.Page2.items[3].data];
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
    Wizard.Menus.Page2
);

Wizard.Menus.Page3.eventHandler = function (event, action) {
    if (event == "help") {Utils.openFile("https://github.com/JongWasTaken/easympv/wiki/Setup#finishing-up", true);}
};

Wizard.Start = function () {
    Settings.load();
    var pageTotal = Object.keys(Wizard.Menus).length-1;
    Wizard.Menus.Page1.settings.title = title(1,pageTotal);
    Wizard.Menus.Page2.settings.title = title(2,pageTotal);
    Wizard.Menus.Page3.settings.title = title(3,pageTotal);
    // disable all menus keys
    var bindings = JSON.parse(mp.get_property("input-bindings"));
    var keysToBlock = [];
    Wizard.idsToUnblock = [];
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
        Wizard.idsToUnblock.push("prevent_menu_" + i);
    }
    // open page1
    Wizard.Menus.Page1.showMenu();
};

module.exports = Wizard;

