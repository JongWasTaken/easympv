/*
 * BROWSERS.JS (PART OF EASYMPV)
 *
 * Author:              Jong
 * URL:                 https://github.com/JongWasTaken/easympv
 * License:             MIT License
 *
 */

/*----------------------------------------------------------------
This file contains premade menus that act as browsers for
files, disc drives and devices.
There is a lot of spaghetti here, read at your own risk.
Comments are also missing.
----------------------------------------------------------------*/

/**
 * Module containing Browser menus for Files, Disc drives, Devices & URLs.
 */
var Browsers = {};
Browsers.alertCategory = "Browsers";
Browsers.modifyTitle = function (title)
{
    if(Settings.Data.shortFileNames)
    {
        var regex = /\([^()]*\)/g;
        title = title.replace(regex,"");

        regex = /\[.*?\]/g;
        title = title.replace(regex,"");

        regex = /_/g;
        title = title.replace(regex, " ");

        title = title.trim();

        if (title.substring(0,1) != ".")
        {
            var dot = title.split(".");
            if ((dot.length-1) != 0)
            {
                var ext = "";
                for (
                    var i = 0;
                    i < Settings.presets.fileextensions.length;
                    i++
                ) {
                    ext = Settings.presets.fileextensions[i].extension.substring(1);
                    if (dot[dot.length-1].includes(ext))
                    {
                        dot.pop();
                        title = dot.join(".").trim();
                        title = title + " (" + ext + ")";
                        break;
                    }
                }
            }
        }
    }

    //if (title.length >= 36) {
    //    title = title.substring(0, 50) + "...";
    //}
    return title;
}

Browsers.Selector = {};
Browsers.FileBrowser = {};
Browsers.DriveBrowser = {};
Browsers.DeviceBrowser = {};

Browsers.Selector.menu = undefined;
Browsers.Selector.menuSettings = {
    menuId: "browser-selector"
};
Browsers.Selector.cachedParentMenu = undefined;

Browsers.FileBrowser.currentLocation = undefined;
Browsers.FileBrowser.menu = undefined;
Browsers.FileBrowser.menuSettings = {
    menuId: "file-browser",
    autoClose: 0,
    scrollingEnabled: true,
    fadeOut: false,
    fadeIn: false
};
Browsers.FileBrowser.cachedParentMenu = undefined;

Browsers.DriveBrowser.menu = undefined;
Browsers.DriveBrowser.menuSettings = {
    menuId: "drive-browser",
    autoClose: 0,
    scrollingEnabled: true,
    scrollingPosition: 8,
    fadeOut: false,
    fadeIn: false
};
Browsers.DriveBrowser.cachedParentMenu = undefined;
Browsers.DriveBrowser.menuMode = "list";
Browsers.DriveBrowser.cachedDriveName = "";

Browsers.DeviceBrowser.menu = undefined;
Browsers.DeviceBrowser.menuSettings = {
    menuId: "device-browser",
    autoClose: 0,
    scrollingEnabled: true,
    scrollingPosition: 8,
    fadeOut: false,
    fadeIn: false
};
Browsers.DeviceBrowser.cachedParentMenu = undefined;

Browsers.Selector.menuEventHandler = function (event, item) {
    if (event == "enter") {
        Browsers.Selector.menu.hideMenu();
        Browsers.Selector.menu = undefined;

        if (item == "file") {
            Browsers.FileBrowser.loadCurrentDirectory(Browsers.Selector.cachedParentMenu);
        } else if (item == "disc") {
            Browsers.DriveBrowser.open(Browsers.Selector.cachedParentMenu);
        } else if (item == "device") {
            Browsers.DeviceBrowser.open(Browsers.Selector.cachedParentMenu);
        } else if (item == "url") {
            UI.Input.show(function (success, input) {
                if (success) {
                    if (input.includes("://")) {
                        mpv.command("write-watch-later-config");
                        if (input.includes("&list=")) {
                            mpv.commandv("loadlist", input);
                        } else {
                            mpv.commandv("loadfile", input);
                        }
                        UI.Alerts.push(Settings.getLocalizedString("alerts.url.loaded"), Browsers.alertCategory, UI.Alerts.Urgencies.Normal);
                    }
                    else
                    {
                        UI.Alerts.push(Settings.getLocalizedString("alerts.url.invalid"), Browsers.alertCategory, UI.Alerts.Urgencies.Normal);
                    }
                }
            }, "URL: ");
        }

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
        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("selector.menu.file"),
        item: "file",
        color: "ffffff",
    });
    items.push({
        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("selector.menu.disc"),
        item: "disc",
        color: "ffffff",
    });
    items.push({
        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("selector.menu.device"),
        item: "device",
        color: "ffffff",
    });
    items.push({
        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("selector.menu.url"),
        item: "url",
        color: "ffffff",
    });

    Browsers.Selector.menuSettings.title = UI.SSA.insertSymbolFA("?") + " " + Settings.getLocalizedString("selector.menu.title");
    Browsers.Selector.menuSettings.description = Settings.getLocalizedString("selector.menu.description");
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
            if (entry.type == "script") {
                OS.fileMoveSystemwide(Browsers.FileBrowser.currentLocation +
                    OS.directorySeperator +
                    entry.item,
                    mpv.getUserPath("~~/scripts/")
                );
                UI.Alerts.push(Settings.getLocalizedString("alerts.browser.installed") + entry.item, Browsers.alertCategory, UI.Alerts.Urgencies.Normal);

            } else {
                mpv.command("write-watch-later-config");
                UI.Alerts.push(Settings.getLocalizedString("alerts.browser.playing") + entry.item, Browsers.alertCategory, UI.Alerts.Urgencies.Normal);

                mpv.commandv(
                    "loadfile",
                    Browsers.FileBrowser.currentLocation +
                        OS.directorySeperator +
                        entry.item
                );
                if (Autoload.enabled)
                {
                    Autoload.loadFolder(true);
                }
            }
        }
        else
        {
            UI.Alerts.push(Settings.getLocalizedString("alerts.browser.loadsubs") + entry.item, Browsers.alertCategory, UI.Alerts.Urgencies.Normal);

            mpv.commandv(
                "sub-add",
                Browsers.FileBrowser.currentLocation +
                    OS.directorySeperator +
                    entry.item
            );
        }
    } else {
        mpv.command("write-watch-later-config");
        UI.Alerts.push(Settings.getLocalizedString("alerts.browser.playing.unsupported") + entry.item, Browsers.alertCategory, UI.Alerts.Urgencies.Normal);

        mpv.commandv(
            "loadfile",
            Browsers.FileBrowser.currentLocation +
                OS.directorySeperator +
                entry.item
        );
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
    Browsers.FileBrowser.loadCurrentDirectory();
};

Browsers.FileBrowser.openContextMenu = function(item) {

    var path = Browsers.FileBrowser.currentLocation + OS.directorySeperator + item;

    if (
        OS.isWindows &&
        Browsers.FileBrowser.currentLocation == "@DRIVESELECTOR@"
    ) {
        var isFolder = true;
    } else {
        var temp = mpv.fileInfo(
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

    var contextMenuTitle = UI.SSA.insertSymbolFA(" ") + Settings.getLocalizedString("context.menu.title");
    var contextMenuDescriptionIcon =  UI.SSA.setColor("ffffff") + UI.SSA.insertSymbolFA(icon, 26, 35, Utils.commonFontName) + UI.SSA.setBold(true) + item + UI.SSA.setBold(false);

    var items = [];

    items.push({
        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("global.back.title"), // "@br@@br@"
        color: "909090",
        hasSeperator: true,
        item: "",
        eventHandler: function(action, menu)
        {
            if (action != "enter")
            {
                return;
            }
            contextMenu.hideMenu();
            Browsers.FileBrowser.loadCurrentDirectory();
        }
    });

    if(isFolder)
    {
        items.push({
            title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("context.favorites.title"),
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
                    if (Settings.Data.fileBrowserFavorites.indexOf(path) == -1)
                    {
                        Settings.Data.fileBrowserFavorites.push(path);
                        //Browsers.FileBrowser.menu.appendSuffixToCurrentItem();
                        UI.Alerts.push(Settings.getLocalizedString("alerts.favorites.added"), Browsers.alertCategory, UI.Alerts.Urgencies.Normal);
                        Settings.save();
                        menu.hideMenu();
                        Browsers.FileBrowser.loadCurrentDirectory(Browsers.Selector.cachedParentMenu);
                        return;
                    }
                    UI.Alerts.push(Settings.getLocalizedString("alerts.favorites.added.error"), Browsers.alertCategory, UI.Alerts.Urgencies.Error);
                    return;
                }
            }
        });
    }

    items.push({
        title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("context.open.title"),
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
            title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("context.remove.title"),
            item: "",
            eventHandler: function(action, menu)
            {
                if (action != "enter")
                {
                    return;
                }

                if(isFolder && !Settings.Data.allowFolderDeletion)
                {
                    this.title = UI.SSA.setColorRed() + Settings.getLocalizedString("context.remove.disabled");
                    contextMenu.redrawMenu();
                    return;
                }

                if (deleteConfirm)
                {
                    var type = "file";
                    if (isFolder) { type = "folder"; };

                    var removeFile = function(path)
                    {
                        if (Settings.Data.useTrash)
                        {
                            return OS.fileTrashSystemwide(path);
                        }
                        return OS.fileRemoveSystemwide(path);
                    }

                    if (removeFile(path))
                    {

                        UI.Alerts.push(Settings.getLocalizedString("alerts.browser.fileremoved") + type + ": " + item, Browsers.alertCategory, UI.Alerts.Urgencies.Normal);
                    }
                    else
                    {
                        UI.Alerts.push(Settings.getLocalizedString("alerts.browser.fileremoved.error") + type + ": " + item, Browsers.alertCategory, UI.Alerts.Urgencies.Error);
                    }
                    contextMenu.hideMenu();
                    Browsers.FileBrowser.cachedFileBrowserPosition = Browsers.FileBrowser.cachedFileBrowserPosition - 1;
                    Browsers.FileBrowser.loadCurrentDirectory();
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
        contextMenuTitle = UI.SSA.insertSymbolFA(" ") + Settings.getLocalizedString("context.menu.title.folder");
        contextMenuDescriptionIcon =  UI.SSA.setColor("FFFF90") + UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + UI.SSA.setBold(true) + item + UI.SSA.setBold(false);
    }

    var deleteConfirm = false;

    var contextMenu = new UI.Menus.Menu({
        menuId: "file-browser-context-menu",
        title: contextMenuTitle,
        description: Settings.getLocalizedString("context.menu.description") + contextMenuDescriptionIcon + "@br@",
        autoClose: 0,
        fadeOut: false,
        fadeIn: false
    },items,
    Browsers.FileBrowser.menu);
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

    if (event == "show") {
        if (Browsers.FileBrowser.menu.items.length >= 6)
        {
            Browsers.FileBrowser.menu.selectedItemIndex = 5;
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
                var temp = mpv.fileInfo(
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

Browsers.FileBrowser.loadCurrentDirectory = function (parentMenu) {
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
        if (mpv.fileExists(Browsers.FileBrowser.currentLocation)) {
            var currentLocationContents = mpv.getDirectoryContents(
                Browsers.FileBrowser.currentLocation,
                "dirs"
            );
        } else {
            Browsers.FileBrowser.currentLocation = mpv.getProperty("working-directory");
            var currentLocationContents = mpv.getDirectoryContents(
                Browsers.FileBrowser.currentLocation,
                "dirs"
            );
        }

        var currentLocationFolders = [];
        currentLocationContents.sort();

        for (var i = 0; i < currentLocationContents.length; i++) {

            currentLocationFolders.push(
                {
                    name: currentLocationContents[i],
                    location: currentLocationContents[i]
                }
            );
            /*
            currentLocationFolders.push(
                {
                    name: Browsers.modifyTitle(currentLocationContents[i]),
                    location: currentLocationContents[i]
                }
            );
            */
        }
        currentLocationFolders.sort(function(a, b) {
            return a.name.localeCompare(b.name);
        });

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
            if (currentLocationFolders[i].location.charAt(0) == ".") {
                if (Settings.Data.showHiddenFiles) {
                    items.push({
                        title:
                            UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) +
                            currentLocationFolders[i].name +
                            OS.directorySeperator,
                        item:
                            currentLocationFolders[i].location +
                            OS.directorySeperator,
                        color: "FFFF90",
                        type: "folder",
                        supported: true
                    });
                }
            } else {
                items.push({
                    title:
                        UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) +
                        currentLocationFolders[i].name +
                        OS.directorySeperator,
                    item: currentLocationFolders[i].location + OS.directorySeperator,
                    color: "FFFF90",
                    type: "folder",
                    supported: true
                });
            }
        }
        var currentLocationContents = mpv.getDirectoryContents(
            Browsers.FileBrowser.currentLocation,
            "files"
        );

        var currentLocationFiles = [];
        currentLocationContents.sort();

        for (var i = 0; i < currentLocationContents.length; i++) {

            currentLocationFiles.push(
                {
                    name: Browsers.modifyTitle(currentLocationContents[i]),
                    location: currentLocationContents[i]
                }
            );

        }
        currentLocationFiles.sort(function(a, b) {
            return a.name.localeCompare(b.name);
        });

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
                    "." + currentLocationFiles[i].location.split('.').pop() == whitelist.extension
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

            if (currentLocationFiles[i].location.charAt(0) != "." || Settings.Data.showHiddenFiles) {
                items.push({
                    title: UI.SSA.insertSymbolFA(icon, 26, 35, Utils.commonFontName) + currentLocationFiles[i].name,
                    item: currentLocationFiles[i].location,
                    color: color,
                    type: type,
                    supported: supported
                });
            }
        }
    }

    Browsers.FileBrowser.menuSettings.title = UI.SSA.insertSymbolFA(" ") + Settings.getLocalizedString("browser.menu.title");
    Browsers.FileBrowser.menuSettings.description =
        UI.SSA.setColor("FFFF90") + UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + UI.SSA.setBold(true) +
        Browsers.FileBrowser.currentLocation.replaceAll(
            "@DRIVESELECTOR@",
            Settings.getLocalizedString("browser.driveselector.title")
        ) + " " + UI.SSA.setBold(false) + "@br@@br@" + Settings.getLocalizedString("browser.menu.description");
    Browsers.FileBrowser.menuSettings.backButtonTitle =
        UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("browser.back.title") +UI.Menus.commonSeperator;
    if (Browsers.FileBrowser.currentLocation != "@DRIVESELECTOR@")
    {
        items.unshift({
            title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("browser.openinexplorer.title") +UI.Menus.commonSeperator,
            color: "999999",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    OS.openFile(Browsers.FileBrowser.currentLocation,true);
                }
            }
        });
        items.unshift({
            title: UI.SSA.insertSymbolFA("? ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("browser.openrandom.title") +UI.Menus.commonSeperator,
            color: "999999",
            eventHandler: function(event, menu)
            {
                if (event == "enter")
                {
                    var list = [];
                    for(var k = 0; k < items.length; k++) {
                        if (items[k].type == "video" || items[k].type == "audio" || items[k].type == "image") {
                            list.push(items[k]);
                        }
                    }
                    Browsers.FileBrowser.menuEventHandler("enter",list[Math.floor(Math.random() * list.length)].item);
                }
            }
        });
    }

    items.unshift({
        title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("browser.refresh.title"),
        color: "999999",
        eventHandler: function(event, menu)
        {
            if (event == "enter")
            {
                menu.hideMenu();
                Browsers.FileBrowser.loadCurrentDirectory();
            }
        }
    });

    items.unshift({
        title: UI.SSA.insertSymbolFA(" ", 25, 35, Utils.commonFontName) + Settings.getLocalizedString("browser.favorites.title"),
        color: "999999",
        eventHandler: function(event, menu)
        {
            if (event == "enter")
            {
                var favItems = [];
                for (var i = 0; i < Settings.Data.fileBrowserFavorites.length; i++)
                {
                    favItems.push({
                        title: UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.Data.fileBrowserFavorites[i],
                        item: Settings.Data.fileBrowserFavorites[i],
                        color: "FFFF90"
                    });
                }

                var favMenu = new UI.Menus.Menu({
                    menuId: "favorites-menu",
                    fadeOut: false, // fixes issue where multiple menus could appear at the same time
                    autoClose: 0,
                    scrollingEnabled: true,
                    title: UI.SSA.insertSymbolFA(" ") + Settings.getLocalizedString("favorites.menu.title"),
                    description: Settings.getLocalizedString("favorites.menu.description")
                }, favItems, Browsers.FileBrowser.menu);

                favMenu.eventHandler = function(event,item) {
                    if(event == "enter")
                    {
                        Browsers.FileBrowser.currentLocation = item;
                        favMenu.hideMenu();
                        Browsers.FileBrowser.loadCurrentDirectory();
                        return;
                    }
                    if(event == "right")
                    {
                        var pos = Settings.Data.fileBrowserFavorites.indexOf(item);
                        if (pos != -1)
                        {
                            Settings.Data.fileBrowserFavorites.splice(pos,1);
                            favMenu.items.splice(pos+1,1);
                            favMenu.selectedItemIndex = 0;
                            Settings.save();
                            favMenu.redrawMenu();
                            UI.Alerts.push(Settings.getLocalizedString("alerts.favorites.removed"), Browsers.alertCategory, UI.Alerts.Urgencies.Normal);
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
    if (event == "enter" && Browsers.DriveBrowser.menuMode == "list") {
        Browsers.DriveBrowser.cachedDriveName = item;
        Browsers.DriveBrowser.menuMode = "ask";
        Browsers.DriveBrowser.menu.settings.description = Settings.getLocalizedString("drivebrowser.menu.description.disctype");
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
        mpv.command("write-watch-later-config");
        if (OS.isWindows) {
            mpv.commandv(
                "loadfile",
                item + "://longest/" + Browsers.DriveBrowser.cachedDriveName
            );
            UI.Alerts.push(Settings.getLocalizedString("alerts.discdrive.open") +
            Browsers.DriveBrowser.cachedDriveName +
            "...", Browsers.alertCategory, UI.Alerts.Urgencies.Normal);
        } else {
            mpv.commandv(
                "loadfile",
                item +
                    "://longest//dev/" +
                    Browsers.DriveBrowser.cachedDriveName
            );
            UI.Alerts.push(Settings.getLocalizedString("alerts.discdrive.open") +
            Browsers.DriveBrowser.cachedDriveName +
            "...", Browsers.alertCategory, UI.Alerts.Urgencies.Normal);
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
        var deviceList = mpv.getDirectoryContents("/dev/", "all");
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

    Browsers.DriveBrowser.menuSettings.description = Settings.getLocalizedString("drivebrowser.menu.description");
    if (items.length == 0)
    {
        Browsers.DriveBrowser.menuSettings.description += "@br@" + UI.SSA.setColorRed() + UI.SSA.insertSymbolFA(" ",20,20) + Settings.getLocalizedString("drivebrowser.menu.description.nodrives");
    }

    Browsers.DriveBrowser.menuMode = "list";
    Browsers.DriveBrowser.menuSettings.title = UI.SSA.insertSymbolFA("") + Settings.getLocalizedString("drivebrowser.menu.title");
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
    if (event == "enter") {
        //mpv.commandv("apply-profile", "low-latency");
        mpv.setProperty("file-local-options/profile", "low-latency"); // should only apply to currrent file

        if (OS.isWindows) {
            mpv.commandv("loadfile", "av://dshow:video=" + item);
        } else {
            mpv.commandv("loadfile", "av://v4l2:/dev/" + item);
        }

        UI.Alerts.push(Settings.getLocalizedString("alerts.device.open") + item, Browsers.alertCategory, UI.Alerts.Urgencies.Normal);

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
        var r = mpv.commandNative({
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            args: [
                mpv.getUserPath("~~/scripts/easympv/GetDevices.exe")
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
        var deviceList = mpv.getDirectoryContents("/dev/", "all");
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
    Browsers.DeviceBrowser.menuSettings.title = UI.SSA.insertSymbolFA("") + " " + Settings.getLocalizedString("devicebrowser.menu.title");
    Browsers.DeviceBrowser.menuSettings.description =
        Settings.getLocalizedString("devicebrowser.menu.description") + UI.SSA.setColorRed() + UI.SSA.insertSymbolFA(" ",20,20) + Settings.getLocalizedString("devicebrowser.menu.description.suffix");
    Browsers.DeviceBrowser.menu = new UI.Menus.Menu(
        Browsers.DeviceBrowser.menuSettings,
        items,
        parentMenu
    );
    Browsers.DeviceBrowser.menu.eventHandler =
        Browsers.DeviceBrowser.menuEventHandler;
    Browsers.DeviceBrowser.menu.showMenu();
};