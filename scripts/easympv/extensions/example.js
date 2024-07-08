// {"name": "Example Extension", "author": "Jong", "version": "1.0.0", "icon": "?", "description": "Reference for developers. Only runs in debug mode.@br@When enabled, locks the main menu until the \"j\" key is pressed!", "url": "https://github.com/JongWasTaken/easympv" }

/*
 * EXAMPLE.JS (PART OF EASYMPV)
 *
 * Author:                  Jong
 * URL:                     https://github.com/JongWasTaken/easympv
 * License:                 MIT License
 */

/*
    This is the example extension for easympv, which will hopefully explain how to write a working extension.
    As it is supposed to be a demonstration/explanation, it is disabled by default and only works when debug mode is enabled.

    The first line needs to be commented out valid json, containing strings named "name", "author", "version" and optionally "description" and "icon", like in this file.

    Extension code is eval'd early into the plugin lifecycle.
    Events are used to make sure that whatever your try to add/modify/remove actually exists.
    They can be hooked by calling Events.<EVENT_NAME>.register(<EXTENSION_NAME>, <CALLBACK>).

    PLEASE make sure that you use the same extension name as in the first line, in this case "Example Extension"!
    This allows for cleaner removal of extensions at runtime, should the user desire to do so.

    A list of possible entrypoints:
    - Events.earlyInit: Called first, before any file checks, OS detection, update checks and first time launch check.
        - Should not be used unless absolutely necessary!
    - Events.lateInit: Called after all checks, but before any menus have been constructed. Hotkeys are also not registered yet.
        - Recommended for most extensions.
    - Events.afterInit: Called last, everything has finished at this point.

    Other events exist as well, make sure to check the source code for a full list (Events.js)!

    Note that extension code is wrapped in a try/catch block, which will (hopefully) prevent easympv from crashing if an extension missbehaves.
    Please make sure to wrap risky calls as well, just in case.

    Finally, make sure to tie variables to an object instead of declaring them directly.
    Unfortunately there is no way to prevent collisions here, so choose a unique object name, ideally derived from the extension name.
*/

ExampleExtension = {};
ExampleExtension.name = "Example Extension";

Events.lateInit.register(ExampleExtension.name, function() {
    // easympv includes a wrapper around most of mpv's built-in functions, declared in "Preload.js"!
    mpv.printInfo("[Example Extension] Start!");

    // As said above, this plugin will only do something in debug mode, so we check for that.
    if (Settings.Data.debugMode)
    {
        // It is best practice to also use events for modifiying menus.
        // Use Events.beforeCreateMenu for that.
        // Other events could also be used for this purpose, but beforeCreateMenu is the easiest, as it receives the menus settings and items directly.
        Events.beforeCreateMenu.register(ExampleExtension.name, function(settings, items) {
            // Check what menu is being contructed right now.
            if (settings.menuId != "main-menu") return;

            // Modify last item to add a seperator.
            items[items.length - 1].title += UI.Menus.commonSeperator;

            // Add the new item.
            items.push(
                {
                    // If you want localization in your extension you will have to write something up yourself...
                    title: UI.SSA.insertSymbolFA("? ", 26, 35, Utils.commonFontName) + "Example Menu Item",
                    item: "example_extension_item",
                    description: "",
                    eventHandler: function(event, menu) {
                        if (event == "enter") {
                            menu.hideMenu();
                            UI.Alerts.push("Example Alert!", ExampleExtension.name, UI.Alerts.Urgencies.Normal);
                        }
                    }
                }
            );

            // Because we modified the menus items directly, nothing else needs to be done. Our changes will be present after the menu has been constructed.
        });

        // Some events can also cancel actions:
        Events.beforeShowMenu.register(ExampleExtension.name, function(menu) {
            if (menu.settings.menuId != "main-menu") return false;
            UI.Alerts.push("This menu is locked!", ExampleExtension.name, UI.Alerts.Urgencies.Warning);
            return true;
        });
        // The above event will prevent the main menu from opening.
        // Why you would want to do that is a whole different question...

        // Now, lets turn this into a lock of sorts:
        // Hook another event, this time for key registration.
        Events.duringRegistration.register(ExampleExtension.name, function() {
            // Force-Register the key "j", which will unhook Events.beforeShowMenu.
            mp.add_forced_key_binding("j", "example_extension_unlock_menu", function() {
                // Events have the "kick" prototype function, which can be used to remove a registrants callback.
                // For obvious reasons, please only use this function to remove your own callbacks...
                Events.beforeShowMenu.kick(ExampleExtension.name);
                UI.Alerts.push("Menu unlocked!", ExampleExtension.name, UI.Alerts.Urgencies.Warning);
            });
        });

        // If you hook Events.duringRegistration, please also make sure to hook Events.duringUnregistration for the inverse.
        Events.duringUnregistration.register(ExampleExtension.name, function() {
            mp.remove_key_binding("example_extension_unlock_menu");
        });

        // Now, when launching mpv, the main menu should not be openable until the "j" key is pressed!
        mpv.printInfo("[Example Extension] Loaded!");
    }
});

/*
    That is everything you need to know about events.

    For more general information, like how to create menus, please refer to the easympv source code, which should be commented (mostly (hopefully)).

    Good luck!
*/