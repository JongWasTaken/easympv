/*
 * FIRSTTIMEWIZARD.JS (MODULE),
 *
 * Author:         Jong
 * URL:            https://smto.pw/mpv
 * License:        MIT License
 *
 * This module is very WIP and basically the last puzzle piece before this project can go stable.
 */

var Settings = require("./Settings");
var UI = require("./UI");
var Utils = require("./Utils");

var Wizard = {};
Wizard.idsToUnblock = [];
Wizard.Menus = {};

/*
TODO:

Add options for:

These depend on implementing a mpv.conf serializer/deserializer first
- Subtitle Language: "English" or "none", maybe more?
- Audio Language: "Japanese" or "English", maybe more?

Check if input.conf exists, ask if the user prefers the mpv defaults or empv defaults, generate.

*/

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

Wizard.Menus.Page1 = new UI.Menu(
    {
        title: "",
        description:
            "Thank you for trying out easympv!@br@" +
            "Since this is the first time easympv has been loaded, we will have to set a few settings.@br@" +
            "You can navigate menus like this one using the mousewheel or arrow keys and enter.@br@" +
            "For more information visit the wiki: https://github.com/JongWasTaken/easympv/wiki/Setup",
        selectedItemColor: menuColor,
        autoClose: 0,
    },
    [
        {
            title: "Open Wiki",
            item: "wiki",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    Utils.openFile("https://github.com/JongWasTaken/easympv/wiki/Setup", true)
                    Wizard.Menus.Page1.items.splice(0,1);
                    Wizard.Menus.Page1.redrawMenu();
                }
            }
        },
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

Wizard.Menus.Page1.eventHandler = function (event, action) {};

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
    SubLanguageNames: [ "none", "English", "German" ],
    SubLanguageDescription: "@br@Set to \"none\" to not display subtitles by default.@br@"
};

Wizard.Menus.Page2 = new UI.Menu(
    {
        title: "",
        description: "(IMPORTANT: These options do not actually work yet. Please edit config files manually for now!)@br@Use the left/right arrow key to change an option.",
        selectedItemColor: menuColor,
        autoClose: 0,
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

Wizard.Menus.Page2.eventHandler = function (event, action) {};

Wizard.Menus.Page3 = new UI.Menu(
    {
        title: "",
        description: "Placeholder: Closing this menu will set \"isFirstLaunch\" to \"false\".",
        selectedItemColor: menuColor,
        autoClose: 0,
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
                    //TODO: save settings

                    Settings.Data["isFirstLaunch"] = false;

                    //Wizard.Menus.Page2.items[1].data; // performance preset
                    //Wizard.Menus.Page2.items[2].data; // audio language
                    //Wizard.Menus.Page2.items[3].data; // sub language

                    Settings.save();
                    unblock();
                }
            }
        },
    ],
    Wizard.Menus.Page2
);

Wizard.Menus.Page3.eventHandler = function (event, action) {};

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

