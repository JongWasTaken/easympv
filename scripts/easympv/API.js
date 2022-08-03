/*
 * API.JS (MODULE)
 *
 * Author:					Jong
 * URL:						https://smto.pw/mpv
 * License:					MIT License
 */

"use strict";

/**
 * This module provides an API to be used by other plugins.
 * Documentation is available at https://github.com/JongWasTaken/easympv/wiki/API.
 */
var API = {};

var Menus = require("./MenuSystem");

API.foreignMenus = {};

var Impl_createmenu = function (json) {
    try {
        if (API.foreignMenus[json.context] == undefined) {
            var root = {};
            for (var i = 0; i < Menus.registeredMenus.length; i++)
            {
                if (Menus.registeredMenus[i].settings.image == "logo")
                {
                    root = Menus.registeredMenus[i];
                    break;
                }
            }
        
            root.items.splice(root.items.length-1, 0, {
                "title": json.arguments.menuName,
                "item": json.context,
                "description": "Added by " + json.sender
            });
        
            var menu = new Menus.Menu(json.arguments.menuSettings,json.arguments.menuItems,root);
    
            menu.foreign = {};
            menu.foreign.owner = json.sender;
            menu.foreign.context = json.context;
    
            API.foreignMenus[json.context] = menu;
    
            menu.eventHandler = function (event, action) {
                var res = {
                    "sender": "easympv",
                    "id": json.context,
                    "data": {
                        "event": event,
                        "action": action
                    }
                };
                API.sendJSON(json.sender,JSON.stringify(res));
            }
            return "{\"result\":\"success\",\"id\":"+json.context+"}";
        }
        return "{\"result\":\"error\",\"id\":"+json.context+"}";
    }
    catch (x) {
        mp.msg.warn(x);
        return "{\"result\":\"error\",\"id\":"+json.context+"}";
    }
}

API.openForeignMenu = function(action) {
    var current = Menus.getDisplayedMenu();
    if (current != undefined) { current.hideMenu(); }
    if(API.foreignMenus[action] != undefined) {
        API.foreignMenus[action].showMenu();
    }
}

var Impl_removemenu = function (json) { 
    try {
        var root = {};
        for (var i = 0; i < Menus.registeredMenus.length; i++)
        {
            if (Menus.registeredMenus[i].settings.image == "logo")
            {
                root = Menus.registeredMenus[i];
                break;
            }
        }
    
        var menu = API.foreignMenus[json.context];
        if (menu !== undefined)
        {
            if (menu.foreign.owner == json.sender)
            {
                API.foreignMenus[json.context] = undefined;
                for (var k = 0; k < root.items.length; k++)
                {
                    if (root.items[k].item == json.context)
                    {
                        root.items.splice(k,1);
                        break;
                    }
                }
            }
        }
    
        return "{\"result\":\"success\",\"id\":"+json.context+"}";
    }
    catch(z) {
        return "{\"result\":\"error\",\"id\":"+json.context+"}";
    }
}

API.Commands = {
    "createmenu":Impl_createmenu,
    "removemenu":Impl_removemenu,
}

API.handleIncomingJSON = function(json) {
    mp.msg.warn("Incoming JSON: " + json);
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
        API.sendJSON(json.sender,"{\"result\":\"error\",\"id\":"+json.context+"}");
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
    mp.commandv("script-message-to", target, "json", data);
}

module.exports = API;