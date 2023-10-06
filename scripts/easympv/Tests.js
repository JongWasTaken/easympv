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

/*
Tests.json = undefined;

Tests.runFromFile = function(name) {
    if (Tests.json == undefined)
    {
        Tests.json = JSON.parse(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Tests.json")));
        return;
    }

    if (name == "ignore")
    {
        return;
    }

    var test = Tests.json[name];
    if (test == undefined)
    {
        return;
    }

    Utils.log("Starting test: \"" + name + "\"","Tests","warn");

    if (test.variables != undefined)
    {
        Utils.log("Setting variables...","Tests","info");
        for (var i = 0; i < test.variables.length; i++) {
            eval("var " + test.variables[i] + ";");
        }
    }

    var evaluate = function(target, arguments, destination)
    {
        var output = {};

        // target
        var toEval = target + "(";

        // arguments
        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            if (typeof(arg) == "string" && arg.charAt(0) != "@")
            {
                if (arg.includes("~~"))
                {
                    arg = mp.utils.get_user_path(arg);
                }
                toEval += "\"" + arg + "\"";
            }
            else
            {
                toEval += arg.replaceAll("@","");
            }

            if ((i+1) != arguments.length)
            {
                toEval += ",";
            }
        }
        toEval += ");";
        Utils.log("Assembled eval string: " + toEval,"Tests","info");

        try {
            eval("output = " + toEval);
        } catch(e) {
            Utils.log("Eval execution crashed!","Tests","error");
            output = "*crashed*";
        }

        if(destination != undefined)
        {
            eval(destination + " = output;");
        }

        // expectedResult
        if (typeof(output) == "object")
        {
            output = JSON.stringify(output);
        }
        return output;
    }

    if (test.preparation != undefined)
    {
        Utils.log("Evaluating preparation functions...","Tests","info");
        for (var i = 0; i < test.preparation.length; i++) {
            var output = evaluate(test.preparation[i].target,test.preparation[i].arguments,test.preparation[i].destination);
            Utils.log("Preparation function returned \"" + output + "\"","Tests","info");
        }
    }

    Utils.log("Evaluating main function...","Tests","info");
    var output = evaluate(test.target,test.arguments);

    if (typeof(test.expectedResult) == "object")
    {
        test.expectedResult = JSON.stringify(test.expectedResult);
    }

    Utils.log("Test eval output: " + output,"Tests","info");
    Utils.log("Expected output: " + test.expectedResult,"Tests","info");

    // cleanup
    if (test.cleanup != undefined)
    {
        Utils.log("Cleaning up...","Tests","info")
        for (var i = 0; i < test.cleanup.length; i++) {
            var directive = test.cleanup[i];
            if (directive.type == "file")
            {
                var temp = directive.content;
                if (temp.includes("~~"))
                {
                    temp = mp.utils.get_user_path(temp);
                }
                OS.fileRemoveSystemwide(temp);
            }
        }
    }
    var finalResult = undefined;
    if (output == test.expectedResult)
    {
        Utils.log("Test \"" + name + "\" PASSED!","Tests","warn");
        finalResult = true;
    }
    else
    {
        Utils.log("Test \"" + name + "\" FAILED!","Tests","warn");
        finalResult = false;
    }

    Core.Menus.TestsMenu.setResultForItem(name,finalResult);
    Core.Menus.TestsMenu.redrawMenu();
};
*/

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
    mp.commandv("script-message-to","easympv","json",JSON.stringify(requestObj));
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
    mp.commandv("script-message-to","easympv","json",JSON.stringify(requestObj));
};

var Test_OS_GetImageInfo = function (name) {
    var output = OS.getImageInfo(mp.utils.get_user_path("~~/scripts/easympv/images/logo.bmp")).stdout;
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

var Test_UI_ShowAlert = function (name) {
    UI.Alerts.show("info", "Test Alert");
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
    "UI: show alert": { "target": Test_UI_ShowAlert, "description": "(Check for yourself)" },
};