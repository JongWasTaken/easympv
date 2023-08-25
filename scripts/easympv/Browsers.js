/*
 * BROWSERS.JS (MODULE)
 *
 * Author:              Jong
 * URL:                 https://github.com/JongWasTaken/easympv
 * License:             MIT License
 *
 */


/*----------------------------------------------------------------
The Browsers.js module

This file contains premade menus that act as browsers for
files, disc drives and devices.
There is a lot of spaghetti here, read at your own risk.
Comments are also missing.
----------------------------------------------------------------*/


/**
 * Module containing Browser menus for Files, Disc drives, Devices & URLs.
 */
var Browsers = {};

Browsers.Selector = {};
Browsers.FileBrowser = {};
Browsers.DriveBrowser = {};
Browsers.DeviceBrowser = {};

Browsers.Selector.menu = undefined;
Browsers.Selector.menuSettings = {
    customKeyEvents: [{key: "h", event: "help"}]
};
Browsers.Selector.cachedParentMenu = undefined;

Browsers.FileBrowser.currentLocation = undefined;
Browsers.FileBrowser.menu = undefined;
Browsers.FileBrowser.menuSettings = {
    autoClose: 0,
    scrollingEnabled: true,
    fadeOut: false,
    fadeIn: false,
    customKeyEvents: [{key: "h", event: "help"}]
};
Browsers.FileBrowser.cachedParentMenu = undefined;

Browsers.DriveBrowser.menu = undefined;
Browsers.DriveBrowser.menuSettings = {
    autoClose: 0,
    scrollingEnabled: true,
    scrollingPosition: 8,
    fadeOut: false,
    fadeIn: false,
    customKeyEvents: [{key: "h", event: "help"}]
};
Browsers.DriveBrowser.cachedParentMenu = undefined;
Browsers.DriveBrowser.menuMode = "list";
Browsers.DriveBrowser.cachedDriveName = "";

Browsers.DeviceBrowser.menu = undefined;
Browsers.DeviceBrowser.menuSettings = {
    autoClose: 0,
    scrollingEnabled: true,
    scrollingPosition: 8,
    fadeOut: false,
    fadeIn: false,
    customKeyEvents: [{key: "h", event: "help"}]
};
Browsers.DeviceBrowser.cachedParentMenu = undefined;

Browsers.Selector.menuEventHandler = function (event, item) {
    if (event == "enter") {
        Browsers.Selector.menu.hideMenu();
        Browsers.Selector.menu = undefined;

        if (item == "file") {
            Browsers.FileBrowser.open(Browsers.Selector.cachedParentMenu);
        } else if (item == "disc") {
            Browsers.DriveBrowser.open(Browsers.Selector.cachedParentMenu);
        } else if (item == "device") {
            Browsers.DeviceBrowser.open(Browsers.Selector.cachedParentMenu);
        } else if (item == "url") {
            UI.Input.show(function (success, input) {
                if (success) {
                    if (input.includes("://")) {
                        if (input.includes("&list=")) {
                            mp.commandv("loadlist", input);
                        } else {
                            mp.commandv("loadfile", input);
                        }
                        Utils.showAlert("info", Settings.getLocalizedString("Alerts.url.loaded"));
                    }
                    else
                    {
                        Utils.showAlert("info", Settings.getLocalizedString("Alerts.url.invalid"));
                    }
                }
            },"URL: ");
        }
        return;
    }
    if (event == "help") {
        OS.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#selector-menu", true);
        return;
    }
};

Browsers.Selector.open = function (parentMenu) {
    if (parentMenu == undefined) {
        parentMenu = Browsers.Selector.cachedParentMenu;
    } else {
        Browsers.Selector.cachedParentMenu = parentMenu;
    }

    var items = [];

    items.push({
        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Selector.menu.file"),
        item: "file",
        color: "ffffff",
    });
    items.push({
        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Selector.menu.disc"),
        item: "disc",
        color: "ffffff",
    });
    items.push({
        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Selector.menu.device"),
        item: "device",
        color: "ffffff",
    });
    items.push({
        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Selector.menu.url"),
        item: "url",
        color: "ffffff",
    });

    Browsers.Selector.menuSettings.title = UI.SSA.insertSymbolFA("?") + " " + Settings.getLocalizedString("Selector.menu.title");
    Browsers.Selector.menuSettings.description = Settings.getLocalizedString("Selector.menu.description");
    Browsers.Selector.menu = new UI.Menus.Menu(
        Browsers.Selector.menuSettings,
        items,
        parentMenu
    );
    Browsers.Selector.menu.eventHandler = Browsers.Selector.menuEventHandler;
    Browsers.Selector.menu.showMenu();
};

Browsers.FileBrowser.openFileSafe = function (entry) {
    if (entry == undefined)
    {
        return;
    }
    if(entry.supported)
    {
        if (entry.type != "subtitle")
        {
            Utils.showAlert(
                "info",
                Settings.getLocalizedString("Alerts.browser.playing") + entry.item
            );
            mp.commandv(
                "loadfile",
                Browsers.FileBrowser.currentLocation +
                    OS.directorySeperator +
                    entry.item
            );
        }
        else
        {
            Utils.showAlert(
                "info",
                Settings.getLocalizedString("Alerts.browser.loadsubs") + entry.item
            );
            mp.commandv(
                "sub-add",
                Browsers.FileBrowser.currentLocation +
                    OS.directorySeperator +
                    entry.item
            );
        }
    }
};

Browsers.FileBrowser.getParentDirectory = function () {
    var newDir = "";
    var workDir = Browsers.FileBrowser.currentLocation;
    if (workDir.charAt(workDir.length - 1) == OS.directorySeperator) {
        workDir = workDir.substring(0, workDir.length - 1);
    }
    var workDirTree = workDir.split(OS.directorySeperator);

    if (!OS.isWindows && workDirTree.length < 3) {
        workDirTree[0] = "/";
    }

    for (var i = 0; i < workDirTree.length - 1; i++) {
        if (i == 0) {
            newDir = workDirTree[0];
        } else {
            newDir = newDir + OS.directorySeperator + workDirTree[i];
        }
    }

    if (newDir.charAt(newDir.length - 1) == ":") {
        newDir += OS.directorySeperator;
    }

    return newDir;
};

Browsers.FileBrowser.gotoParentDirectory = function () {
    Browsers.FileBrowser.currentLocation = Browsers.FileBrowser.getParentDirectory();
}

Browsers.FileBrowser.changeDirectory = function (directory) {
    Browsers.FileBrowser.currentLocation = directory.replaceAll(
        OS.directorySeperator + OS.directorySeperator,
        OS.directorySeperator
    );
    try {
        Browsers.FileBrowser.menu.hideMenu();
        Browsers.FileBrowser.menu = undefined;
    }
    catch(e) {} // ignore that
    Browsers.FileBrowser.open();
};

Browsers.FileBrowser.openContextMenu = function(item) {

    var path = Browsers.FileBrowser.currentLocation + OS.directorySeperator + item;

    if (
        OS.isWindows &&
        Browsers.FileBrowser.currentLocation == "@DRIVESELECTOR@"
    ) {
        var isFolder = true;
    } else {
        var temp = mp.utils.file_info(
            Browsers.FileBrowser.currentLocation +
                OS.directorySeperator +
                item
        );
        if (temp != undefined) {
            var isFolder = temp.is_dir;
        } else {
            var isFolder = true;
        }
    }

    var icon = " ";

    if(!isFolder){
        for (
            var j = 0;
            j < Settings.presets.fileextensions.length;
            j++
        ) {
            var whitelist = Settings.presets.fileextensions[j];
            if (
                item.includes(whitelist.extension)
            ) {
                if (whitelist.type == "video")
                {
                    icon = " ";
                }
                else if (whitelist.type == "audio")
                {
                    icon = " ";
                }
                else if (whitelist.type == "image")
                {
                    icon = " ";
                }
                else if (whitelist.type == "subtitle")
                {
                    icon = " ";
                }
                break;
            }
        }
    }

    var contextMenuTitle = UI.SSA.insertSymbolFA(" ") + Settings.getLocalizedString("Context.menu.title");
    var contextMenuDescriptionIcon =  UI.SSA.setColor("ffffff") + UI.SSA.insertSymbolFA(icon, 26, 35, Utils.commonFontName) + UI.SSA.setBold(true) + item + UI.SSA.setBold(false);

    var items = [];

    items.push({
        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Global.back.title") + "@br@@br@",
        color: "909090",
        item: "",
        eventHandler: function(action, menu)
        {
            if (action != "enter")
            {
                return;
            }
            contextMenu.hideMenu();
            Browsers.FileBrowser.open();
        }
    });

    if(isFolder)
    {
        items.push({
            title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("Context.favorites.title"),
            item: "",
            eventHandler: function(action, menu)
            {
                if (action != "enter")
                {
                    return;
                }

                if (isFolder) {
                    contextMenu.hideMenu();
                    path = path.replaceAll("\/\/","\/");
                    if (Settings.Data["fileBrowserFavorites"].locations.indexOf(path) == -1)
                    {
                        Settings.Data["fileBrowserFavorites"].locations.push(path);
                        //Browsers.FileBrowser.menu.appendSuffixToCurrentItem();
                        Utils.showAlert("info",Settings.getLocalizedString("Alerts.favorites.added"));
                        Settings.save();
                        menu.hideMenu();
                        Browsers.FileBrowser.open(Browsers.Selector.cachedParentMenu);
                        return;
                    }
                    Utils.showAlert("error",Settings.getLocalizedString("Alerts.favorites.added.error"));
                    return;
                }
            }
        });
    }

    items.push({
        title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("Context.open.title"),
        item: "",
        eventHandler: function(action, menu)
        {
            Browsers.FileBrowser.cachedFileBrowserPosition = undefined;
            if (action != "enter")
            {
                return;
            }
            contextMenu.hideMenu();
            if(isFolder)
            {
                Browsers.FileBrowser.changeDirectory(
                    Browsers.FileBrowser.currentLocation +
                        OS.directorySeperator +
                        item
                );
            }
            else
            {
                Browsers.FileBrowser.openFileSafe(menu.getItemByName(item));
            }
        }
    });

    if (!isFolder || Settings.Data.allowFolderDeletion)
    {
        items.push({
            title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("Context.remove.title"),
            item: "",
            eventHandler: function(action, menu)
            {
                if (action != "enter")
                {
                    return;
                }

                if(isFolder && !Settings.Data.allowFolderDeletion)
                {
                    this.title = UI.SSA.setColorRed() + Settings.getLocalizedString("Context.remove.disabled");
                    contextMenu.redrawMenu();
                    return;
                }

                if (deleteConfirm)
                {
                    var type = "file";
                    if (isFolder) { type = "folder"; };

                    if (OS.fileRemoveSystemwide(path))
                    {
                        Utils.showAlert(
                            "info",
                            Settings.getLocalizedString("Alerts.browser.fileremoved") + type + ": " + item
                        );
                    }
                    else
                    {
                        Utils.showAlert(
                            "error",
                            Settings.getLocalizedString("Alerts.browser.fileremoved.error") + type + ": " + item
                        );
                    }
                    contextMenu.hideMenu();
                    Browsers.FileBrowser.cachedFileBrowserPosition = Browsers.FileBrowser.cachedFileBrowserPosition - 1;
                    Browsers.FileBrowser.open();
                } else {
                    this.title = UI.SSA.setColorRed() + "Are you sure?";
                    deleteConfirm = true;
                    contextMenu.redrawMenu();
                }
            }
        });
    };

    if (isFolder)
    {
        contextMenuTitle = UI.SSA.insertSymbolFA(" ") + Settings.getLocalizedString("Context.menu.title.folder");
        contextMenuDescriptionIcon =  UI.SSA.setColor("FFFF90") + UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + UI.SSA.setBold(true) + item + UI.SSA.setBold(false);
    }

    var deleteConfirm = false;

    var contextMenu = new UI.Menus.Menu({
        title: contextMenuTitle,
        description: Settings.getLocalizedString("Context.menu.description") + contextMenuDescriptionIcon + "@br@",
        autoClose: 0,
        fadeOut: false,
        fadeIn: false
    },items,
    Browsers.FileBrowser.menu);
    contextMenu.eventHandler = function(){};
    contextMenu.showMenu();
};

Browsers.FileBrowser.menuEventHandler = function (event, item) {

    if (event == "draw")
    {
        if (Browsers.FileBrowser.cachedFileBrowserPosition != undefined)
        {
            Browsers.FileBrowser.menu.selectedItemIndex = Browsers.FileBrowser.cachedFileBrowserPosition;
            Browsers.FileBrowser.cachedFileBrowserPosition = undefined;
        }
        return;
    }

    if (event == "help") {
        OS.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#file-browser", true);
        return;
    }

    if (event == "show") {
        if (Browsers.FileBrowser.menu.items.length >= 5)
        {
            Browsers.FileBrowser.menu.selectedItemIndex = 4;
        }
        Browsers.FileBrowser.menu.redrawMenu();
        return;
    }

    if (event == "right") {

        if (item == ".." + OS.directorySeperator) {
            return;
        }

        if (item == "@back@") {
            return;
        }

        Browsers.FileBrowser.cachedFileBrowserPosition = Browsers.FileBrowser.menu.selectedItemIndex;
        Browsers.FileBrowser.menu.hideMenu();
        Browsers.FileBrowser.menu = undefined;
        Browsers.FileBrowser.openContextMenu(item);
        return;
    }

    if (event == "enter") {
        if (item == ".." + OS.directorySeperator) {
            Browsers.FileBrowser.cachedFileBrowserPosition = undefined;
            if (
                OS.isWindows &&
                Browsers.FileBrowser.currentLocation.charAt(
                    Browsers.FileBrowser.currentLocation.length - 2
                ) == ":"
            ) {
                Browsers.FileBrowser.changeDirectory("@DRIVESELECTOR@");
            } else {
                Browsers.FileBrowser.changeDirectory(
                    Browsers.FileBrowser.getParentDirectory()
                );
            }
        } else {
            if (
                OS.isWindows &&
                Browsers.FileBrowser.currentLocation == "@DRIVESELECTOR@"
            ) {
                var isFolder = true;
            } else {
                // turns out mp.file_info can return undefined in rare edgecases
                // this fixes a bug where opening a mount folder of an unmounted drive would crash everything
                var temp = mp.utils.file_info(
                    Browsers.FileBrowser.currentLocation +
                        OS.directorySeperator +
                        item
                );
                if (temp != undefined) {
                    var isFolder = temp.is_dir;
                } else {
                    var isFolder = true;
                }
            }

            if (isFolder) {
                if (
                    OS.isWindows &&
                    Browsers.FileBrowser.currentLocation == "@DRIVESELECTOR@"
                ) {
                    Browsers.FileBrowser.changeDirectory(item);
                } else {
                    Browsers.FileBrowser.changeDirectory(
                        Browsers.FileBrowser.currentLocation +
                            OS.directorySeperator +
                            item
                    );
                }
            } else {
                item = Browsers.FileBrowser.menu.getItemByName(item);
                if (item.supported)
                {
                    Browsers.FileBrowser.openFileSafe(item);
                    Browsers.FileBrowser.menu.hideMenu();
                    Browsers.FileBrowser.menu = undefined;
                }
            }
        }
        return;
    }
};

Browsers.FileBrowser.open = function (parentMenu) {
    if (parentMenu == undefined) {
        parentMenu = Browsers.FileBrowser.cachedParentMenu;
    } else {
        Browsers.FileBrowser.cachedParentMenu = parentMenu;
    }

    var items = [];

    if (
        OS.isWindows &&
        Browsers.FileBrowser.currentLocation == "@DRIVESELECTOR@"
    ) {
        // local drives
        drives = OS.getWindowsDriveInfo(3).split("|");
        if (drives[0].trim() != "") {
            drives.sort();
            for (var i = 0; i < drives.length; i++) {
                if(drives[i] != "")
                {
                    items.push({
                        title:
                            UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) +
                            drives[i].trim() +
                            "\\",
                        item: drives[i].trim() + "\\",
                        color: "ffffff",
                    });
                }
            }
        }

        // usb drives
        drives = OS.getWindowsDriveInfo(2).split("|");
        if (drives[0].trim() != "") {
            drives.sort();
            for (var i = 0; i < drives.length; i++) {
                if(drives[i] != "")
                {
                    items.push({
                        title:
                            UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) +
                            drives[i].trim() +
                            "\\",
                        item: drives[i].trim() + "\\",
                        color: "ffffff",
                    });
                }
            }
        }

        // network drives
        drives = OS.getWindowsDriveInfo(4).split("|");
        if (drives[0].trim() != "") {
            drives.sort();
            for (var i = 0; i < drives.length; i++) {
                if(drives[i] != "")
                {
                    items.push({
                        title:
                            UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) +
                            drives[i].trim() +
                            "\\",
                        item: drives[i].trim() + "\\",
                        color: "ffffff",
                    });
                }
            }
        }
    } else {
        if (mp.utils.file_info(Browsers.FileBrowser.currentLocation) != undefined) {
            var currentLocationFolders = mp.utils.readdir(
                Browsers.FileBrowser.currentLocation,
                "dirs"
            );
        } else {
            Browsers.FileBrowser.currentLocation = mp.get_property("working-directory");
            var currentLocationFolders = mp.utils.readdir(
                Browsers.FileBrowser.currentLocation,
                "dirs"
            );
        }
        // Possible TODO: improve sort
        //currentLocationFolders.sort(function(a,b) {
        //    return Utils.naturalCompare(a.name, b.name)
        //});
        currentLocationFolders.sort();


        if (!OS.isWindows && Browsers.FileBrowser.currentLocation == "/") {
        } else {
            items.push({
                title:
                    UI.SSA.insertSymbolFA(" ", 30, 35, Utils.commonFontName) +
                    ".." +
                    OS.directorySeperator,
                item: ".." + OS.directorySeperator,
                color: "909090",
            });
        }
        for (var i = 0; i < currentLocationFolders.length; i++) {
            if (currentLocationFolders[i].charAt(0) == ".") {
                if (Settings.Data.showHiddenFiles) {
                    var title = currentLocationFolders[i];
                    if (title.length >= 32) {
                        title = title.substring(0, 50) + "...";
                    }

                    items.push({
                        title:
                            UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) +
                            title +
                            OS.directorySeperator,
                        item:
                            currentLocationFolders[i] +
                            OS.directorySeperator,
                        color: "FFFF90",
                        type: "folder",
                        supported: true
                    });
                }
            } else {
                var title = currentLocationFolders[i];
                if (title.length >= 32) {
                    title = title.substring(0, 50) + "...";
                }

                items.push({
                    title:
                        UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) +
                        title +
                        OS.directorySeperator,
                    item: currentLocationFolders[i] + OS.directorySeperator,
                    color: "FFFF90",
                    type: "folder",
                    supported: true
                });
            }
        }
        var currentLocationFiles = mp.utils.readdir(
            Browsers.FileBrowser.currentLocation,
            "files"
        );
        currentLocationFiles.sort();
        for (var i = 0; i < currentLocationFiles.length; i++) {
            var color = "909090";
            var icon = " ";
            var type = "other";
            var supported = false;

            for (
                var j = 0;
                j < Settings.presets.fileextensions.length;
                j++
            ) {
                var whitelist = Settings.presets.fileextensions[j];
                if (
                    "." + currentLocationFiles[i].split('.').pop() == whitelist.extension
                ) {

                    if (whitelist.type == "video")
                    {
                        icon = " ";
                    }
                    else if (whitelist.type == "audio")
                    {
                        icon = " ";
                    }
                    else if (whitelist.type == "image")
                    {
                        icon = " ";
                    }
                    else if (whitelist.type == "subtitle")
                    {
                        icon = " ";
                    }
                    type = whitelist.type;
                    color = "ffffff";
                    supported = true;
                    break;
                }
            }

            var title = currentLocationFiles[i];
            if (title.length >= 36) {
                title = title.substring(0, 50) + "...";
            }

            if (currentLocationFiles[i].charAt(0) != "." || Settings.Data.showHiddenFiles) {
                items.push({
                    title: UI.SSA.insertSymbolFA(icon, 26, 35, Utils.commonFontName) + title,
                    item: currentLocationFiles[i],
                    color: color,
                    type: type,
                    supported: supported
                });
            }
        }
    }

    Browsers.FileBrowser.menuSettings.title = UI.SSA.insertSymbolFA(" ") + Settings.getLocalizedString("Browser.menu.title");
    Browsers.FileBrowser.menuSettings.description =
        UI.SSA.setColor("FFFF90") + UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + UI.SSA.setBold(true) +
        Browsers.FileBrowser.currentLocation.replaceAll(
            "@DRIVESELECTOR@",
            Settings.getLocalizedString("Browser.driveselector.title")
        ) + " " + UI.SSA.setBold(false) + "@br@@br@" + Settings.getLocalizedString("Browser.menu.description");
    Browsers.FileBrowser.menuSettings.backButtonTitle =
        UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("Browser.back.title") +"@br@@us10@";
    if (Browsers.FileBrowser.currentLocation != "@DRIVESELECTOR@")
    {
        items.unshift({
            title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("Browser.openinexplorer.title") +"@br@@us10@",
            color: "999999",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    OS.openFile(Browsers.FileBrowser.currentLocation,true);
                }
            }
        });
    }

    items.unshift({
        title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("Browser.refresh.title"),
        color: "999999",
        eventHandler: function(event, menu)
        {
            if (event == "enter")
            {
                menu.hideMenu();
                Browsers.FileBrowser.open();
            }
        }
    });

    items.unshift({
        title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("Browser.favorites.title"),
        color: "999999",
        eventHandler: function(event, menu)
        {
            if (event == "enter")
            {
                var favItems = [];
                for (var i = 0; i < Settings.Data["fileBrowserFavorites"].locations.length; i++)
                {
                    favItems.push({
                        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.Data["fileBrowserFavorites"].locations[i],
                        item: Settings.Data["fileBrowserFavorites"].locations[i],
                        color: "FFFF90"
                    });
                }

                var favMenu = new UI.Menus.Menu({
                    autoClose: 0,
                    title: UI.SSA.insertSymbolFA(" ") + Settings.getLocalizedString("Favorites.menu.title"),
                    description: Settings.getLocalizedString("Favorites.menu.description")
                }, favItems, Browsers.FileBrowser.menu);

                favMenu.eventHandler = function(event,item) {
                    if(event == "enter")
                    {
                        Browsers.FileBrowser.currentLocation = item;
                        favMenu.hideMenu();
                        Browsers.FileBrowser.open();
                        return;
                    }
                    if(event == "right")
                    {
                        var pos = Settings.Data["fileBrowserFavorites"].locations.indexOf(item);
                        if (pos != -1)
                        {
                            Settings.Data["fileBrowserFavorites"].locations.splice(pos,1);
                            favMenu.items.splice(pos+1,1);
                            favMenu.selectedItemIndex = 0;
                            Settings.save();
                            favMenu.redrawMenu();
                            Utils.showAlert("info",Settings.getLocalizedString("Alerts.favorites.removed"))
                        }
                        return;
                    }
                };

                Browsers.FileBrowser.menu.hideMenu();
                favMenu.showMenu();
            }
        }
    });

    Browsers.FileBrowser.menu = new UI.Menus.Menu(
        Browsers.FileBrowser.menuSettings,
        items,
        parentMenu
    );
    Browsers.FileBrowser.menu.eventHandler =
        Browsers.FileBrowser.menuEventHandler;
    Browsers.FileBrowser.menu.showMenu();
    /*
    if (Browsers.FileBrowser.cachedFileBrowserPosition != undefined)
    {
        Browsers.FileBrowser.menu.selectedItemIndex = Browsers.FileBrowser.cachedFileBrowserPosition;
        Browsers.FileBrowser.cachedFileBrowserPosition = undefined;
        Browsers.FileBrowser.menu.redrawMenu();
    }*/
};

Browsers.DriveBrowser.menuEventHandler = function (event, item) {
    if (event == "help") {
        OS.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#drive-browser", true);
        return;
    }

    if (event == "enter" && Browsers.DriveBrowser.menuMode == "list") {
        Browsers.DriveBrowser.cachedDriveName = item;
        Browsers.DriveBrowser.menuMode = "ask";
        Browsers.DriveBrowser.menu.settings.description = Settings.getLocalizedString("Drivebrowser.menu.description.disctype");
        var temp = Browsers.DriveBrowser.menu.items[0];
        Browsers.DriveBrowser.menu.items = [];
        Browsers.DriveBrowser.menu.items.push(temp);
        Browsers.DriveBrowser.menu.items.push({
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + "CD",
            item: "ccda",
            color: "ffffff",
        });
        Browsers.DriveBrowser.menu.items.push({
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + "DVD",
            item: "dvd",
            color: "ffffff",
        });
        Browsers.DriveBrowser.menu.items.push({
            title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + "BluRay",
            item: "bd",
            color: "ffffff",
        });
        Browsers.DriveBrowser.menu.redrawMenu();
    } else if (event == "enter" && Browsers.DriveBrowser.menuMode == "ask") {
        if (OS.isWindows) {
            mp.commandv(
                "loadfile",
                item + "://longest/" + Browsers.DriveBrowser.cachedDriveName
            );
            Utils.showAlert(
                "info",
                Settings.getLocalizedString("Alerts.discdrive.open") +
                    Browsers.DriveBrowser.cachedDriveName +
                    "..."
            );
        } else {
            mp.commandv(
                "loadfile",
                item +
                    "://longest//dev/" +
                    Browsers.DriveBrowser.cachedDriveName
            );
            Utils.showAlert(
                "info",
                Settings.getLocalizedString("Alerts.discdrive.open") +
                    Browsers.DriveBrowser.cachedDriveName +
                    "..."
            );
        }
        Browsers.DriveBrowser.cachedDriveName = "";
        Browsers.DriveBrowser.menuMode = "list";
        Browsers.DriveBrowser.menu.hideMenu();
        Browsers.DriveBrowser.menu = undefined;
    }
};

Browsers.DriveBrowser.open = function (parentMenu) {
    var items = [];
    if (parentMenu == undefined) {
        parentMenu = Browsers.DriveBrowser.cachedParentMenu;
    } else {
        Browsers.DriveBrowser.cachedParentMenu = parentMenu;
    }
    if (OS.isWindows) {
        drives = OS.getWindowsDriveInfo(5).split("|");
        drives.sort();
        for (var i = 0; i < drives.length; i++) {
            if(drives[i] != "")
            {
                items.push({
                    title:
                        UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) +
                        drives[i].trim() +
                        "\\",
                    item: drives[i].trim() + "\\",
                    color: "ffffff",
                });
            }
        }
    } else {
        var deviceList = mp.utils.readdir("/dev/", "all");
        deviceList.sort();
        for (var i = 0; i < deviceList.length; i++) {
            if (deviceList[i].includes("sr")) {
                items.push({
                    title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + deviceList[i],
                    item: deviceList[i],
                    color: "ffffff",
                });
            }
        }
    }

    Browsers.DriveBrowser.menuSettings.description = Settings.getLocalizedString("Drivebrowser.menu.description");
    if (items.length == 0)
    {
        Browsers.DriveBrowser.menuSettings.description += "@br@" + UI.SSA.setColorRed() + UI.SSA.insertSymbolFA(" ",20,20) + Settings.getLocalizedString("Drivebrowser.menu.description.nodrives");
    }

    Browsers.DriveBrowser.menuMode = "list";
    Browsers.DriveBrowser.menuSettings.title = UI.SSA.insertSymbolFA("") + Settings.getLocalizedString("Drivebrowser.menu.title");
    Browsers.DriveBrowser.menu = new UI.Menus.Menu(
        Browsers.DriveBrowser.menuSettings,
        items,
        parentMenu
    );
    Browsers.DriveBrowser.menu.eventHandler =
        Browsers.DriveBrowser.menuEventHandler;
    Browsers.DriveBrowser.menu.showMenu();
};

Browsers.DeviceBrowser.menuEventHandler = function (event, item) {
    if (event == "help") {
        OS.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#device-browser", true);
        return;
    }

    if (event == "enter") {
        //mp.commandv("apply-profile", "low-latency");
        mp.set_property("file-local-options/profile", "low-latency"); // should only apply to currrent file

        if (OS.isWindows) {
            mp.commandv("loadfile", "av://dshow:video=" + item);
        } else {
            mp.commandv("loadfile", "av://v4l2:/dev/" + item);
        }
        Utils.showAlert(
            "info",
            Settings.getLocalizedString("Alerts.device.open") + item
        );
        Browsers.DeviceBrowser.menu.hideMenu();
        Browsers.DeviceBrowser.menu = undefined;
    }
};

Browsers.DeviceBrowser.open = function (parentMenu) {
    var items = [];
    if (parentMenu == undefined) {
        parentMenu = Browsers.DeviceBrowser.cachedParentMenu;
    } else {
        Browsers.DeviceBrowser.cachedParentMenu = parentMenu;
    }
    if (OS.isWindows) {
        var r = mp.command_native({
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            args: [
                mp.utils
                    .get_user_path("~~/scripts/easympv/GetDevices.exe")
                    .replaceAll("/", "\\"),
            ],
        });

        if (r.status == "0") {
            devices = r.stdout.split("|");
            for (var i = 0; i < devices.length - 1; i++) {
                items.push({
                    title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + devices[i].trim(),
                    item: devices[i].trim(),
                    color: "ffffff",
                });
            }
        }
    } else {
        var deviceList = mp.utils.readdir("/dev/", "all");
        deviceList.sort();
        for (var i = 0; i < deviceList.length; i++) {
            if (deviceList[i].includes("video")) {
                var title = UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + deviceList[i];
                title +=
                    " - " +
                    OS._call("cat /sys/class/video4linux/" + deviceList[i] + "/name",false,undefined).stdout.split(": ")[0];
                items.push({
                    title: title,
                    item: deviceList[i],
                    color: "ffffff",
                });
            }
        }
    }
    Browsers.DeviceBrowser.menuSettings.title = UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("Devicebrowser.menu.title");
    Browsers.DeviceBrowser.menuSettings.description =
        Settings.getLocalizedString("Devicebrowser.menu.description") + UI.SSA.setColorRed() + UI.SSA.insertSymbolFA(" ",20,20) + Settings.getLocalizedString("Devicebrowser.menu.description.suffix");
    Browsers.DeviceBrowser.menu = new UI.Menus.Menu(
        Browsers.DeviceBrowser.menuSettings,
        items,
        parentMenu
    );
    Browsers.DeviceBrowser.menu.eventHandler =
        Browsers.DeviceBrowser.menuEventHandler;
    Browsers.DeviceBrowser.menu.showMenu();
};

module.exports = Browsers;
