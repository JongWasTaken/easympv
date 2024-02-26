// {"name": "Example Extension", "author": "Jong", "version": "1.0.0", "target": "ExampleExtension"}
// The first line needs to be commented out valid json, containing strings named "name", "author", "version" and "target" like in this file.
// "target" should be the name of the class holding all functionality of the extension.
var ExampleExtension = {};

// Any code in <module>.onLoad will be executed during easympv initialisation.
// Scope: All, except "Core"
ExampleExtension.onLoad = function() {}
mpv.printInfo("[Example Extension] Start!");

if (Settings.Data.debugMode)
{
    UI.Menus.getMenuById("main").items.splice(
        {
            title: UI.SSA.insertSymbolFA("? ", 26, 35, Utils.commonFontName) + "Example Menu Item",
            item: "example_extension_item",
            description: "AAAA",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    UI.Alerts.show(undefined, "Example Alert!");
                }
            }
        }, 3, 0
    );
    mpv.printInfo("[Example Extension] Loaded!");
}




// Almost all easympv code is in scope here.