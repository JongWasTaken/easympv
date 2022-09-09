/*
 * FIRSTTIMEWIZARD.JS (MODULE),
 *
 * Author:         Jong
 * URL:            https://smto.pw/mpv
 * License:        MIT License
 *
 * This module is very WIP and basically the last puzzle piece before this project can go stable.
 */

var MenuSystem = require("./MenuSystem");
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

Wizard.Menus.Page1 = new MenuSystem.Menu(
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
        },
        {
            title: "Continue",
            item: "continue",
        },
    ],
    undefined
);

Wizard.Menus.Page1.eventHandler = function (event, action) {
    if (action == "wiki") {
        Utils.openFile("https://github.com/JongWasTaken/easympv/wiki/Setup", true)
        Wizard.Menus.Page1.items.splice(0,1);
        Wizard.Menus.Page1.redrawMenu()
    }
    if (action == "continue") {
        Wizard.Menus.Page1.hideMenu();
        Wizard.Menus.Page2.showMenu();
    }
};

Wizard.Menus.Page2 = new MenuSystem.Menu(
    {
        title: "",
        description: "X",
        selectedItemColor: menuColor,
        autoClose: 0,
    },
    [
        {
            title: "Performance Preset@us10@@br@",
            item: "toggle-performance",
            description:
                "Laptop / integrated GPU@br@Choose this preset if you have no dedicated GPU, or you are not sure.@br@",
            data: 1,
        },
        {
            title: "Default Audio Language",
            item: "toggle-audio-language",
            description:
                'none@br@Set to "none" to use the default language specified by a video file.@br@',
            data: 1,
        },
        {
            title: "Default Subtitle Language@us10@@br@",
            item: "toggle-sub-language",
            description:
                'none@br@Set to "none" to not display subtitles by default.@br@',
            data: 1,
        },
        {
            title: "Continue",
            item: "continue",
        },
    ],
    Wizard.Menus.Page1
);

Wizard.Menus.Page2.eventHandler = function (event, action) {
    if (event == "enter") {
        var item;
        for (var i = 0; i < Wizard.Menus.Page2.items.length;i++)
        {
            if (Wizard.Menus.Page2.items[i].item == action)
            {item = Wizard.Menus.Page2.items[i]; break;}
        };
        if (action == "toggle-performance") {
            if (item.data == 0) {
                item.description =
                    "Laptop / integrated GPU";
                item.data = 1;
            } else if (item.data == 1) {
                item.description =
                    "Desktop / good dedicated GPU";
                item.data = 2;
            } else if (item.data == 2) {
                item.description =
                    'Lowest / "Potato"';
                item.data = 0;
            }
            item.description += "@br@Choose this if your PC is old.@br@At this point you should probably use your phone instead.@br@"
            Wizard.Menus.Page2.redrawMenu();
        } else if (action == "toggle-audio-language") {
            if (item.data == 0) {
                item.description =
                    'none';
                item.data = 1;
            } else if (item.data == 1) {
                item.description =
                    'Japanese';
                item.data = 2;
            } else if (item.data == 2) {
                item.description =
                    'English';
                item.data = 3;
            } else if (item.data == 3) {
                item.description =
                    'German';
                item.data = 0;
            }
            item.description += "@br@Set to \"none\" to use the default language specified by a video file.@br@";
            Wizard.Menus.Page2.redrawMenu();
        } else if (action == "toggle-sub-language") {
            if (item.data == 0) {
                item.description =
                    'none';
                item.data = 1;
            } else if (item.data == 1) {
                item.description =
                    'English';
                item.data = 2;
            } else if (item.data == 2) {
                item.description =
                    'German';
                item.data = 0;
            }
            item.description += "@br@Set to \"none\" to not display subtitles by default.@br@"
            Wizard.Menus.Page2.redrawMenu();
        } else if (action == "continue") {
            Wizard.Menus.Page2.hideMenu();
            //TODO: create Page3: a few words about usage, set firsttime, save settings on close, then unblock()
            //Wizard.Menus.Page3.showMenu();
            unblock();
        }
    }
};

Wizard.Start = function () {
    var pageTotal = Object.keys(Wizard.Menus).length;
    Wizard.Menus.Page1.settings.title = title(1,pageTotal);
    Wizard.Menus.Page2.settings.title = title(2,pageTotal);
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

