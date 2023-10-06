/*
 * API.JS (PART OF EASYMPV)
 *
 * Author:                  Jong
 * URL:                     https://github.com/JongWasTaken/easympv
 * License:                 MIT License
 */

/**
 * This module provides an API to be used by other plugins.
 * Documentation is available at https://github.com/JongWasTaken/easympv/wiki/API.
 */
var API = {};


API.foreignMenus = {};

var Impl_createmenu = function (json) {
    try {
        if (API.foreignMenus[json.context] == undefined) {
            var root = {};
            for (var i = 0; i < UI.Menus.registeredMenus.length; i++)
            {
                if (UI.Menus.registeredMenus[i].settings.image == "logo")
                {
                    root = UI.Menus.registeredMenus[i];
                    break;
                }
            }
            if (json.arguments.menuDescription != undefined)
            {
                json.arguments.menuDescription = json.arguments.menuDescription + "@br@" + "Added by " + json.sender;
            }
            else
            {
                json.arguments.menuDescription = "Added by " + json.sender;
            }
            root.items.splice(root.items.length, 0, {
                "title": json.arguments.menuName,
                "item": json.context,
                "description": json.arguments.menuDescription,
                "eventHandler": function (event, menu) { if (event == "enter") { API.openForeignMenu(this.item); } }
            });
            Core.Menus.MainMenu.getItemByName("quit").hasUnderscore = true;
            Core.Menus.MainMenu._dispatchEvent("hide");
            var menu = new UI.Menus.Menu(json.arguments.menuSettings,json.arguments.menuItems,root);

            menu.foreign = {};
            menu.foreign.owner = json.sender;
            menu.foreign.context = json.context;

            API.foreignMenus[json.context] = menu;

            menu.eventHandler = function (event, action) {
                var res = {
                    "sender": "easympv",
                    "context": json.context,
                    "data": {
                        "event": event,
                        "action": action
                    }
                };
                API.sendJSON(json.sender,JSON.stringify(res));
            }
            return "{\"result\":\"success\",\"context\":\""+json.context+"\"}";
        }
        return "{\"result\":\"error\",\"context\":\""+json.context+"\"}";
    }
    catch (x) {
        Utils.log(x,"API","error");
        return "{\"result\":\"error\",\"context\":\""+json.context+"\"}";
    }
}

API.openForeignMenu = function(action) {
    var current = UI.Menus.getDisplayedMenu();
    if (current != undefined) { current.hideMenu(); }
    if(API.foreignMenus[action] != undefined) {
        API.foreignMenus[action].showMenu();
    }
}

var Impl_removemenu = function (json) {
    try {
        var root = {};
        for (var i = 0; i < UI.Menus.registeredMenus.length; i++)
        {
            if (UI.Menus.registeredMenus[i].settings.image == "logo")
            {
                root = UI.Menus.registeredMenus[i];
                break;
            }
        }

        var menu = API.foreignMenus[json.context];
        if (menu !== undefined)
        {
            if (menu.foreign.owner == json.sender)
            {
                delete API.foreignMenus[json.context];
                for (var k = 0; k < root.items.length; k++)
                {
                    if (root.items[k].item == json.context)
                    {
                        root.items.splice(k,1);
                        break;
                    }
                }
            }

            if (Object.keys(API.foreignMenus).length == 0)
            {
                Core.Menus.MainMenu.getItemByName("quit").hasUnderscore = false;
                Core.Menus.MainMenu._dispatchEvent("hide");
            }

            return "{\"result\":\"success\",\"context\":\""+json.context+"\"}";
        }
        else
        {
            return "{\"result\":\"error\",\"context\":\""+json.context+"\"}";
        }
    }
    catch(z) {
        return "{\"result\":\"error\",\"context\":\""+json.context+"\"}";
    }
}

API.Commands = {
    "createmenu":Impl_createmenu,
    "removemenu":Impl_removemenu,
}

API.handleIncomingJSON = function(json) {
    //mp.msg.warn("Incoming JSON: " + json);
    if(json == undefined) {
        return;
    }
    try{
        json = JSON.parse(json);
    }
    catch(e) {
        json = {}
    }

    if(json.sender == undefined || json.context == undefined || json.command == undefined) {
        API.sendJSON(json.sender,"{\"result\":\"error\",\"context\":\""+json.context+"\"}");
        return;
    }

    var status = API.Commands[json.command](json);
    API.sendJSON(json.sender,status);
    return;
}

API.sendJSON = function(target,data) {
    if(target == undefined)
        return;
    if(data == undefined)
        return;
    mp.commandv("script-message-to", target, "easympv-response", data);
}