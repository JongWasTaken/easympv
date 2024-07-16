/*
 * TESTS.JS (PART OF EASYMPV)
 *
 * Author:                     Jong
 * URL:                        https://github.com/JongWasTaken/easympv
 * License:                    MIT License
 */

var Tests = {};

Tests.run = function (name)
{
    if (name == undefined || Tests.list[name] == undefined)
    {
        if (Tests.json != undefined)
        {
            return Tests.runFromFile(name);
        }
        return false;
    }

    return Tests.list[name].target(name);
}

var Test_API_CreateMenu = function (name) {
    var success = undefined;
    mp.register_script_message("easympv-response", function (res) {
        var p = JSON.parse(res);
        if (p.result == "success"){
            success = true;
        } else { success = false; }

        Core.Menus.TestsMenu.setResultForItem(name,success);
        Core.Menus.TestsMenu.redrawMenu();

        mp.unregister_script_message("easympv-response");
    });

    var requestObj = {
        'sender': 'easympv',
        'context': 'API_Test_Menu',
        'command': 'createmenu',
        'arguments': {
            'menuName': 'TestMenu',
            'menuSettings': {
                'title': 'TestMenu',
                'description': '',
                'autoClose': 0
            },
            'menuItems': [
                {'title': 'Option 1', 'item': 'option1'}
            ]
        }
    }
    mpv.commandv("script-message-to","easympv","json",JSON.stringify(requestObj));
};

var Test_API_RemoveMenu = function (name) {
    var success = undefined;
    mp.register_script_message("easympv-response", function (res) {
        var p = JSON.parse(res);
        if (p.result == "success") {
            success = true;
        } else { success = false; }

        Core.Menus.TestsMenu.setResultForItem(name,success);
        Core.Menus.TestsMenu.redrawMenu();

        mp.unregister_script_message("easympv-response");
    });

    var requestObj = {
        'sender': 'easympv',
        'context': 'API_Test_Menu',
        'command': 'removemenu',
        'arguments': {}
    }
    mpv.commandv("script-message-to","easympv","json",JSON.stringify(requestObj));
};

var Test_OS_GetImageInfo = function (name) {
    var output = OS.getImageInfo(mpv.getUserPath("~~/scripts/easympv/images/logo.bmp")).stdout;
    var success = false;
    if (OS.isWindows)
    {
        success = (output == "200|60"); // TODO: what does this return on windows again lmao
    }
    else
    {
        success = (output == "PC bitmap, Windows 3.x format, 200 x -60 x 32, image size 48000, resolution 3780 x 3780 px/m, cbSize 48054, bits offset 54\n");
    }

    Core.Menus.TestsMenu.setResultForItem(name,success);
    Core.Menus.TestsMenu.redrawMenu();
}

var Test_OS_ShowMessage = function (name) {
    OS.showMessage("Test Message",true);
    Core.Menus.TestsMenu.setResultForItem(name,undefined);
    Core.Menus.TestsMenu.redrawMenu();
}

var Test_OS_ShowNotification = function (name) {
    var output = OS.showNotification("Test Notification");
    Core.Menus.TestsMenu.setResultForItem(name,output);
    Core.Menus.TestsMenu.redrawMenu();
}

var Test_OS_GetWindowsDriveInfo = function (name) {
    var output = undefined;
    if (OS.isWindows) { output = (OS.getWindowsDriveInfo(3) != ""); }
    Core.Menus.TestsMenu.setResultForItem(name,output);
    Core.Menus.TestsMenu.redrawMenu();
}

var Test_UI_ShowAlertInfo = function (name) {
    UI.Alerts.push("Test Info Alert", "Tests", UI.Alerts.Urgencies.Normal);
    Core.Menus.TestsMenu.setResultForItem(name,undefined);
    Core.Menus.TestsMenu.redrawMenu();
}
var Test_UI_ShowAlertWarn = function (name) {
    UI.Alerts.push("Test Warn Alert", "Tests", UI.Alerts.Urgencies.Warning);
    Core.Menus.TestsMenu.setResultForItem(name,undefined);
    Core.Menus.TestsMenu.redrawMenu();
}
var Test_UI_ShowAlertError = function (name) {
    UI.Alerts.push("Test Error Alert", "Tests", UI.Alerts.Urgencies.Error);
    Core.Menus.TestsMenu.setResultForItem(name,undefined);
    Core.Menus.TestsMenu.redrawMenu();
}

Tests.list = {
    "API: create menu": { "target": Test_API_CreateMenu },
    "API: remove menu": { "target": Test_API_RemoveMenu, "description": "Run \"API: create menu\" first!" },
    "OS: get image info": { "target": Test_OS_GetImageInfo },
    "OS: show message": { "target": Test_OS_ShowMessage, "description": "(Check for yourself)" },
    "OS: show notification": { "target": Test_OS_ShowNotification },
    "OS: get windows drive info": { "target": Test_OS_GetWindowsDriveInfo, "description": "(Only runs on Windows)" },
    "UI: show info alert": { "target": Test_UI_ShowAlertInfo, "description": "(Check for yourself)" },
    "UI: show warn alert": { "target": Test_UI_ShowAlertWarn, "description": "(Check for yourself)" },
    "UI: show error alert": { "target": Test_UI_ShowAlertError, "description": "(Check for yourself)" }

};