// {"name": "Example Extension", "author": "Jong", "version": "1.0.0", "icon": "", "description": "Reference for developers. Only runs in debug mode.@br@When enabled, locks the main menu until the \"j\" key is pressed!", "url": "https://github.com/JongWasTaken/easympv" }

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
    You can access that data using the $metadata macro object, e.g. "$metadata.version" will be your declared version.

    Extension code is eval'd early into the plugin lifecycle.
    Events are used to make sure that whatever your try to add/modify/remove actually exists.
    They can be hooked by calling Events.<EVENT_NAME>.$register(<CALLBACK>).

    Note that there is a difference between Events.<EVENT_NAME>.$register(<CALLBACK>) and Events.<EVENT_NAME>.register(<NAME>, <CALLBACK>).
    The former is actually a macro for the latter, which removes the necessity to pass in a name, greatly simplifying code.
    Similarly, use Events.<EVENT_NAME>.$unregister() instead of Events.<EVENT_NAME>.kick(<NAME>).
    All macros are prefixed with a dollar sign, and get replaced with their real values before the extension actually gets eval'd.

    Now a list of suggested entrypoints:
    - Events.earlyInit: Called first, before any file checks, OS detection, update checks and first time launch check.
        - Should not be used unless absolutely necessary!
    - Events.lateInit: Called after all checks, but before any menus have been constructed. Hotkeys are also not registered yet.
        - Recommended for most extensions.
    - Events.afterInit: Called last, everything has finished at this point.

    Other events exist as well, make sure to check the source code for a full list (Events.js)!

    Note that extension code is wrapped in a try/catch block, which will (hopefully) prevent easympv from crashing if an extension misbehaves.
    Please make sure to wrap risky calls as well.

    Finally, make sure to tie variables to the $self object instead of declaring them directly.
    So instead of "var myVariable = true", do "$self.mvVariable = true" instead!
    $self gets preprocessed to an unique identifier, giving you a safe namespace and preventing collisions between extensions.
*/

Events.lateInit.$register(function () {
    // easympv includes wrappers around a lot of mpv's built-in functions, declared in "Preload.js"!
    mpv.printInfo("[Example Extension] Start!");

    // As said above, this plugin will only do something in debug mode, so we check for that.
    // It is worth noting that you could also skip hooking Events.lateInit and just hook all the other events directly.
    // The way it is done here is only necessary because of the debug mode check below.
    if (Settings.Data.debugMode) {
        // It is best practice to also use events for modifiying menus.
        // Use Events.beforeCreateMenu for that.
        // Other events could also be used for this purpose, but beforeCreateMenu is the easiest, as it receives the menus settings and items directly.
        Events.beforeCreateMenu.$register(
            function (settings, items) {
                // Check what menu is being contructed right now.
                if (settings.menuId != "main-menu") return;

                // Modify last item to add a seperator.
                items[items.length - 1].title += UI.Menus.commonSeperator;

                // Add the new item.
                items.push({
                    // If you want localization in your extension you will have to come up with a solution by yourself, though maybe some kind of API for that would be possible...
                    title:
                        UI.SSA.insertSymbolFA(
                            "? ",
                            26,
                            35,
                            Utils.commonFontName
                        ) + "Example Menu Item",
                    item: "example_extension_item",
                    description: "",
                    eventHandler: function (event, menu) {
                        if (event == "enter") {
                            menu.hideMenu();
                            UI.Alerts.push(
                                "Example Alert!",
                                $metadata.name,
                                UI.Alerts.Urgencies.Normal
                            );
                        }
                    },
                });

                // Because we modified the menus items directly, nothing else needs to be done. Our changes will be present after the menu has been constructed.
            }
        );

        // Some events can also cancel actions:
        Events.beforeShowMenu.$register(function (menu) {
            if (menu.settings.menuId != "main-menu") return false;
            UI.Alerts.push(
                "This menu is locked!",
                $metadata.name,
                UI.Alerts.Urgencies.Warning
            );
            return true;
        });
        // The above event will prevent the main menu from opening.
        // Why you would want to do that is a whole different question...

        // Now, lets turn this into a lock of sorts:
        // Hook another event, this time for key registration.
        Events.duringRegistration.$register(function () {
            // Force-Register the key "j", which will unhook Events.beforeShowMenu.
            mp.add_forced_key_binding(
                "j",
                "example_extension_unlock_menu",
                function () {
                    // Use the $unregister() macro on an event to remove your listener.
                    Events.beforeShowMenu.$unregister();
                    UI.Alerts.push(
                        "Menu unlocked!",
                        $metadata.name,
                        UI.Alerts.Urgencies.Warning
                    );
                }
            );
        });

        // If you hook Events.duringRegistration, please also make sure to hook Events.duringUnregistration for the inverse.
        Events.duringUnregistration.$register(
            function () {
                mp.remove_key_binding("example_extension_unlock_menu");
            }
        );

        // Now, when launching mpv, the main menu should not be openable until the "j" key is pressed!
        mpv.printInfo("[Example Extension] Loaded!");
    }
});

/*
    That is everything you need to know about events.

    For more general information, like how to create menus, please refer to the easympv source code, which should be commented (mostly (hopefully)).

    Finally, here are some general guidelines you should keep in mind:
    - DO NOT MODIFY OR SAVE EASYMPV SETTINGS IN ANY WAY!
        - Seriously. It is very easy to completely wipe that data by accident.
        - For example, trying to save the config before it got initialized will completely wipe it.
        - You are however allowed to read them, e.g. Settings.Data.debugMode, just don't modify them.
    - Try to not block the thread.
        - Unfortunately mpv does not give us much to work with here.
            - We are stuck on ES5 (a rather quirky implementation of it), so we don't have promises and all that.
            - mpv does not expose any multi-threading capabilities.
            - Most built-in mpv functions do not allow for callbacks.
        - But even with all those limitations, we can still write code that does not suck:
            - Obviously, use callbacks when possible.
            - setTimeout has some properties that we can (ab)use for this, check the MDN page for it.
            - Just don't do anything that could block the thread for a long time in the first place. There are usually better ways of doing whatever needs to be done.
    - Use try/catch. This was already touched on before.
        - If an extension crashes, it will take easympv with it.
    - If you encounter unexplainable bugs, you can try adding "debug": true to the metadata json object in line 1.
        - This will print out your extension code after preprocessing, which might prove helpful for troubleshooting.

    Good luck!
*/
