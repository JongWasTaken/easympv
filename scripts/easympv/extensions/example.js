// {"name": "Example Extension", "author": "Jong", "version": "1.0.0"}
// The first line needs to be commented out valid json, containing strings named "name", "author" and "version", like in this file.
mpv.printInfo("[Example Extension] Start!");

// Pretty much all easympv code is in scope here, the sky is the limit
if (Settings.Data.debugMode)
{
    var menu = UI.Menus.getMenuById("browser-selector");
    dump(menu);
    menu.items[menu.items.length - 1].title += "@@us10@@";
    menu.appendItem(
        {
            title: UI.SSA.insertSymbolFA("? ", 26, 35, Utils.commonFontName) + "Example Menu Item",
            item: "example_extension_item",
            description: "",
            eventHandler: function(event, menu) {
                if (event == "enter") {
                    menu.hideMenu();
                    UI.Alerts.show(undefined, "Example Alert!");
                }
            }
        }
    );
    mpv.printInfo("[Example Extension] Loaded!");
}