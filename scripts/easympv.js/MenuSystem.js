/*
 * MENUSYSTEM.JS (MODULE)
 *
 * Author:              Jong
 * URL:                 https://smto.pw/mpv
 * License:             MIT License
 *
 * Special thanks to VideoPlayerCode.
 */



/*
TODO:

experiment: create a window manager with SSA, learn more SSA

Mouse support?
--> Calculate boundaries for each menuitem
--> Hook MouseClick mpv event, check if in any boundary, handle as 'open' event if yes

*/

/*----------------------------------------------------------------
How to use:

Create a new instance of MenuSystem.Menu(Settings,Items[,Parent])

Settings must be an object and can have the following properties:
    autoClose
    fontSize
    image
    title
    titleColor
    description
    descriptionColor
    itemPrefix
    itemSuffix
    itemColor
    selectedItemColor
    enableMouseSupport [unimplemented]
    borderSize
    displayMethod
    keybindOverrides
All of these have default values.

Items is an array of objects that can have the following properties:
    title
    item
    [description]
    [color]
title and item are required.

Parent is another instance of MenuSystem.Menu, if provided, a Back button
will appear as the first item of the Menu.

Then just assign a function the instance handler:
<MenuInstance>.handler = function (event, action) {};
where event is the pressed key (left,right or enter) and
action is the item value of the menu entry.

Optional: Change MenuSystem.displayMethod (default is "overlay", change to "message" for old way)
This will use mpv's osd-overlay system instead of just using the regular mp.osd_message().
The main benefit is that all other messages will appear below the menu,
making it "unbreakable". It also scales with the window size!
----------------------------------------------------------------*/

var Ass = require("./AssFormat");
var OSD = require("./OSD");

var Menus = {};

Menus.registeredMenus = [];

Menus.Menu = function (settings, items, parentMenu) // constructor
{
    this.settings = {};

    this.items = items;

    if (settings.autoClose != undefined)
    {
        this.settings.autoClose = settings.autoClose;
    } else { this.settings.autoClose = 5; }

    if (settings.image != undefined)
    {
        this.settings.image = settings.image;
    } else { this.settings.image = undefined; }

    if (settings.title != undefined)
    {
        this.settings.title = settings.title;
    } else { this.settings.title = "no title defined"; }

    if (settings.titleColor != undefined)
    {
        this.settings.titleColor = settings.titleColor;
    } else { this.settings.titleColor = "FFFFFF"; }

    if (settings.description != undefined)
    {
        this.settings.description = settings.description;
    } else { this.settings.description = undefined; }

    if (settings.descriptionColor != undefined)
    {
        this.settings.descriptionColor = settings.descriptionColor;
    } else { this.settings.descriptionColor = "FFFFFF"; }

    if (settings.itemPrefix != undefined)
    {
        this.settings.itemPrefix = settings.itemPrefix + " ";
    } else { this.settings.itemPrefix = Ass.insertSymbolFA(" "); } // "➤ "

    if (settings.itemColor != undefined)
    {
        this.settings.itemColor = settings.itemColor;
    } else { this.settings.itemColor = "FFFFFF"; }

    if (settings.selectedItemColor != undefined)
    {
        this.settings.selectedItemColor = settings.selectedItemColor;
    } else { this.settings.selectedItemColor = "740a58"} //"EB4034"

    if (settings.enableMouseSupport != undefined)
    {
        this.settings.enableMouseSupport = settings.enableMouseSupport;
    } else { this.settings.enableMouseSupport = false; }

    if (settings.borderSize != undefined)
    {
        this.settings.borderSize = settings.borderSize;
    } else { this.settings.borderSize = "3"; }

    if (settings.displayMethod != undefined)
    {
        this.settings.displayMethod = settings.displayMethod;
    } else { this.settings.displayMethod = "overlay"; }

    if (settings.fontSize != undefined)
    {
        this.settings.fontSize = settings.fontSize;
    } 
    else 
    { 
        if(this.settings.displayMethod == "message")
        {
            this.settings.fontSize = 11;
        }
        else if(this.settings.displayMethod == "overlay")
        {
            this.settings.fontSize = 35;
        }
    }

    if (settings.itemSuffix != undefined)
    {
        this.settings.itemSuffix = settings.itemSuffix;
    } else { this.settings.itemSuffix = Ass.insertSymbolFA(" ",this.settings.fontSize-2,this.settings.fontSize); } // ✓


    if (settings.keybindOverrides != undefined)
    {
        this.settings.keybindOverrides = settings.keybindOverrides;
    } 
    else 
    {
        this.settings.keybindOverrides = [
            // Normal
            {
                key: "up",
                id: "menu_key_up",
                action: "up"
            },
            {
                key: "down",
                id: "menu_key_down",
                action: "down"
            },
            {
                key: "left",
                id: "menu_key_left",
                action: "left"
            },
            {
                key: "right",
                id: "menu_key_right",
                action: "right"
            },
            {
                key: "enter",
                id: "menu_key_enter",
                action: "enter"
            },
        
            // WASD
            {
                key: "w",
                id: "menu_key_w",
                action: "up"
            },
            {
                key: "s",
                id: "menu_key_s",
                action: "down"
            },
            {
                key: "a",
                id: "menu_key_a",
                action: "left"
            },
            {
                key: "d",
                id: "menu_key_d",
                action: "right"
            },
            {
                key: "W",
                id: "menu_key_w_cap",
                action: "up"
            },
            {
                key: "S",
                id: "menu_key_s_cap",
                action: "down"
            },
            {
                key: "A",
                id: "menu_key_a_cap",
                action: "left"
            },
            {
                key: "S",
                id: "menu_key_d_cap",
                action: "right"
            },
            {
                key: "SPACE",
                id: "menu_key_space",
                action: "enter"
            },
        
            // Keypad
            {
                key: "KP8",
                id: "menu_key_kp8",
                action: "up"
            },
            {
                key: "KP2",
                id: "menu_key_kp2",
                action: "down"
            },
            {
                key: "KP4",
                id: "menu_key_kp4",
                action: "left"
            },
            {
                key: "KP6",
                id: "menu_key_kp6",
                action: "right"
            },
            {
                key: "KP0",
                id: "menu_key_kp0",
                action: "enter"
            },
            {
                key: "KP_ENTER",
                id: "menu_key_kp_enter",
                action: "enter"
            },
            {
                key: "KP_INS",
                id: "menu_key_kp_ins",
                action: "enter"
            },
            {
                key: "8",
                id: "menu_key_8",
                action: "up"
            },
            {
                key: "2",
                id: "menu_key_2",
                action: "down"
            },
            {
                key: "4",
                id: "menu_key_4",
                action: "left"
            },
            {
                key: "6",
                id: "menu_key_6",
                action: "right"
            },
            {
                key: "0",
                id: "menu_key_0",
                action: "enter"
            },
        
            // MOUSE Controls
            {
                key: "WHEEL_UP",
                id: "menu_key_wheel_up",
                action: "up"
            },
            {
                key: "WHEEL_DOWN",
                id: "menu_key_wheel_down",
                action: "down"
            },
            {
                // WHEEL_LEFT and WHEEL_RIGHT are uncommon on mice, but here it is, for those who have it
                key: "WHEEL_LEFT", 
                id: "menu_key_wheel_left",
                action: "left"
            },
            {
                key: "WHEEL_RIGHT",
                id: "menu_key_wheel_right",
                action: "right"
            },
            //{
            //    key: "MBTN_LEFT",
            //    id: "menu_key_mbtn_left",
            //    action: "left"
            //},
            {
                key: "MBTN_RIGHT",
                id: "menu_key_mbtn_right",
                action: "right"
            },
            {
                key: "MBTN_MID",
                id: "menu_key_mbtn_mid",
                action: "enter"
            }
        ];
    }

    if (parentMenu != undefined)
    {
        this.hasBackButton = true;
        this.parentMenu = parentMenu;
        this.items.unshift({
            title: Ass.insertSymbolFA("",this.settings.fontSize-3,this.settings.fontSize) +" Back        ", // ↑ 
            item: "@back@",
            color: "999999"
        });
    } else { this.hasBackButton = false; this.parentMenu = undefined; }

    this.cachedMenuText = "";
    this.isMenuVisible = false;
    this.suffixCacheIndex = -1;
    this.autoCloseStart = -1;
    this.eventLocked = false;

    Menus.registeredMenus.push(this);
}

Menus.Menu.prototype.setDescription = function (text) {
    this.settings.description = text;
}

Menus.Menu.prototype.redrawMenu = function () {
    this._constructMenuCache();
    this._drawMenu();
}

Menus.Menu.prototype._constructMenuCache = function ()
{
    /*
        Differences between displayMethods

        "message" displayMethod:
        + Easier to work with
        + Better line spacing
        - Automatic scaling is busted
            (there might be some universal offset to fix it)
        - Sizes do not translate 1:1
        - Will fight over display space (basically like zFighting in video games)

        "overlay" displayMethod:
        + Automatically scales to window size
        + More fine-grained sizings
        + will always be on top of every mp.osd_message (no z-fighting)

        Both _should_ look the same, but ensuring that is not easy.

        Documentation for SSA specification
        http://www.tcax.org/docs/ass-specs.htm
    */

    this.allowDrawImage = false;
    this.itemCount = 0;
    
    // Start
    this.cachedMenuText = "";
    if(this.settings.displayMethod == "message")
    {
        var border = Ass.setBorder(this.settings.borderSize-2);

        this.cachedMenuText += Ass.startSequence() + border;
        this.cachedMenuText += Ass.setFont("Roboto");
        this.cachedMenuText += Ass.setSize(this.settings.fontSize);

        // Title
        var title = this.settings.title;
        if(this.settings.image != undefined)
        {
            if(
                mp.get_property("osd-height") >= 1060 &&
                mp.get_property("osd-height") <= 1100 ||
                mp.get_property("osd-height") >= 1420 &&
                mp.get_property("osd-height") <= 1460 ||
                mp.get_property("osd-height") >= 2140 &&
                mp.get_property("osd-height") <= 2180
            )
            {
                title = "        ";
                this.allowDrawImage = true;
            }
        }
        this.cachedMenuText += Ass.setSize(this.settings.fontSize + 2) + Ass.setColor(this.settings.titleColor) + title + Ass.setSize(this.settings.fontSize) + "\n \n";

        // Description
        if(this.settings.description != undefined)
        {
            this.cachedMenuText += Ass.setSize(this.settings.fontSize - 3) + Ass.setColor(this.settings.descriptionColor) + this.settings.description.replaceAll("    ","\n") + Ass.setSize(this.settings.fontSize) + "\n \n";
        }

        // Items
        for (var i = 0; i < this.items.length; i++)
        {
            var currentItem = this.items[i];
            var title = currentItem.title.replaceAll("    ","\n");
            var color = "";
            var description = "";

            if (currentItem.color != undefined)
            {
                color = Ass.setColor(currentItem.color);
            } else { color = Ass.setColor(this.settings.itemColor); }

            if (currentItem.description != undefined)
            {
                description = Ass.setSize(this.settings.fontSize - 5) + color + " " + currentItem.description.replaceAll("    ","\n").replaceAll("\n","\n ") + Ass.setColorWhite() + Ass.setSize(this.settings.fontSize) + "\n";
            }

            if(this.selectedItemIndex == i)
            {
                color = Ass.setColor(this.settings.selectedItemColor);
                title = this.settings.itemPrefix + title;
            }

            if(i == this.suffixCacheIndex)
            {
                var count = (title.match(/\n/g) || []).length;
                if(count > 0)
                {
                    title = title.replaceAll("\n","") + this.settings.itemSuffix;
                    for(var j = 0; j < count; j++)
                    {
                        title = title + "\n";
                    }
                } 
                else
                {
                    title = title.replaceAll("\n","") + this.settings.itemSuffix;// + "\n";
                }
                
            }
        
            this.cachedMenuText += color + title + Ass.setSize(this.settings.fontSize) + Ass.setColorWhite() + "\n" + description;
        }

        // End
        this.cachedMenuText += Ass.endSequence();
    }

    if(this.settings.displayMethod == "overlay")
    {
        var scaleFactor = Math.floor(mp.get_property("osd-height")/10.8); // scale percentage
        var scale = Ass.setScale(scaleFactor);
        var border = Ass.setBorder(this.settings.borderSize);
        var font = Ass.setFont("Roboto");
        var fontSize = this.settings.fontSize;
        var descriptionSizeModifier = -10;
        var currentLinePosition = 0;

        var findLinePosition = function (size,custom)
        {
            // How this works:
            // https://www.md-subs.com/line-spacing-in-ssa (Method 5/Conclusion)

            var origin = "-2000000";
            var modifier = 0;
            if (size == undefined)
            {
                size = 1;
            }
            if (custom == undefined)
            {
                custom = 0;
            }
            switch (size)
            {
                case 0: modifier = 0.0005; break; // small
                case 1: modifier = 0.0009; break; // normal
                case 2: modifier = 0.0015; break; // big
                case 3: modifier = 0.0020; break; // huge
                case 4: modifier = custom; break; // custom
            }
            modifier = modifier * ( 0.01 * scaleFactor);
            currentLinePosition = currentLinePosition - modifier;
            return "{\\org("+origin+",0)\\fr"+currentLinePosition.toFixed(5)+"}";
        }

        var lineStart = function (positionType,fontSizeModifier,customPositionModifier) 
        {
            if(fontSizeModifier == undefined)
            {
                fontSizeModifier = 0;
            }
            if(customPositionModifier == undefined)
            {
                customPositionModifier = 0;
            }
            if(positionType == undefined)
            {
                positionType = 1;
            }
            var s = "";
            s += scale + findLinePosition(positionType,customPositionModifier) + border + font + Ass.setSize(fontSize + fontSizeModifier);
            return s;
        };

        var lineEnd = function() 
        {
            var s = "\n";
            return s; 
        }

        var lineBlank = function() 
        {
            var s;
            s = lineStart(4,0,0.0005) + lineEnd();
            return s; 
        }

        // Title
        var title = this.settings.title;
        if(this.settings.image != undefined)
        {
            if(
                mp.get_property("osd-height") >= 1060 &&
                mp.get_property("osd-height") <= 1100 ||
                mp.get_property("osd-height") >= 1420 &&
                mp.get_property("osd-height") <= 1460 ||
                mp.get_property("osd-height") >= 2140 &&
                mp.get_property("osd-height") <= 2180
            )
            {
                title = "        ";
                this.allowDrawImage = true;
            }
        }
        this.cachedMenuText += lineStart(0,2) + Ass.setColor(this.settings.titleColor) + title + lineEnd();

        // Description
        var mainDescription = "";
        if(this.settings.description != undefined)
        {
            var mdLines = this.settings.description.split("    "); // 4 spaces in description = line break
            mainDescription = lineStart(2,descriptionSizeModifier) + Ass.setColor(this.settings.descriptionColor) + mdLines[0] + lineEnd();
            for(var i = 1; i < mdLines.length; i++)
            {
                mainDescription += lineStart(0,descriptionSizeModifier) + Ass.setColor(this.settings.descriptionColor) + mdLines[i] + lineEnd();
            }
        }
        this.cachedMenuText += mainDescription;
        // Items
        for (var i = 0; i < this.items.length; i++)
        {
            var currentItem = this.items[i];
            
            var title = currentItem.title;
            var blankCount = (title.match(/    /g) || []).length;
            title = title.replaceAll("    ","") // for each 4 spaces in title = 1 blank line next

            var color = "";
            var description = "";

            if (currentItem.color != undefined)
            {
                color = Ass.setColor(currentItem.color);
            } else { color = Ass.setColor(this.settings.itemColor); }

            if(this.selectedItemIndex == i)
            {
                color = Ass.setColor(this.settings.selectedItemColor);
                title = this.settings.itemPrefix + title;
            }

            if(i == this.suffixCacheIndex)
            {
                title += this.settings.itemSuffix;
            }

            this.cachedMenuText += lineStart(1,0) + color + title + lineEnd();

            if (currentItem.description != undefined)
            {
                var dLines = currentItem.description.split("    "); // 4 spaces in description = line break
                description = lineStart(1,descriptionSizeModifier) + color + " " + dLines[0] + lineEnd();
                for(var l = 1; l < dLines.length; l++)
                {
                    description += lineStart(0,descriptionSizeModifier) + color + " " + dLines[i] + lineEnd();
                }
            }

            this.cachedMenuText += description;

            for(var q = 0; q != blankCount; q++)
            {
                this.cachedMenuText += lineBlank();
            }

        }
        //this.cachedMenuText += Ass.drawRectangle(800,800,400,400);
        //mp.msg.warn(this.cachedMenuText);
    }
}

Menus.Menu.prototype._handleAutoClose = function () {
    if (this.settings.autoClose <= 0 || this.autoCloseStart <= -1) { return; }
    if (this.autoCloseStart <= mp.get_time() - this.settings.autoClose) { this.hideMenu(); }
};

Menus.Menu.prototype.AppendSuffixToCurrentItem = function () {
    this.suffixCacheIndex = this.selectedItemIndex;
    this._constructMenuCache();
    this._drawMenu();
}

Menus.Menu.prototype.RemoveSuffix = function () {
    this.suffixCacheIndex = -1;
    //this._constructMenuCache();
    //this._drawMenu();
}

Menus.Menu.prototype.getSelectedItem = function () {
    return this.items[this.selectedItemIndex];
}

Menus.Menu.prototype.getDisplayedMenu = function () {
    var cMenu = undefined;
    for(var i = 0; i < Menus.registeredMenus.length; i++) 
    {
        if (Menus.registeredMenus[i].isMenuVisible)
        {
            cMenu = Menus.registeredMenus[i];
            break;
        }
    }
    return cMenu;
}

Menus.Menu.prototype._overrideKeybinds = function () 
{
    var tempFunction = function (x, action) {
        return function () {
          x._keyPressHandler(action);
        };
      };

    for(var i = 0; i < this.settings.keybindOverrides.length; i++)
    {
        var currentKey = this.settings.keybindOverrides[i];

        mp.add_forced_key_binding(
            currentKey.key,
            currentKey.id,
            tempFunction(this, currentKey.action),
            { repeatable: true }
          );
    }
}

Menus.Menu.prototype._revertKeybinds = function () 
{
    for(var i = 0; i < this.settings.keybindOverrides.length; i++)
    {
        var currentKey = this.settings.keybindOverrides[i];

        mp.remove_key_binding(
            currentKey.id
          );
    }
}

Menus.Menu.prototype._keyPressHandler = function (action) 
{
    this.autoCloseStart = mp.get_time();
    if(!this.eventLocked)
    {
        this.eventLocked = true;
        if (action == "up")
        {
            if(this.selectedItemIndex != 0) {this.selectedItemIndex = this.selectedItemIndex - 1;}
            this._constructMenuCache();
            this._drawMenu();
            this.eventLocked = false;
        }
        else if (action == "down")
        {
            if(this.selectedItemIndex != this.items.length - 1) {this.selectedItemIndex += 1;}
            this._constructMenuCache();
            this._drawMenu();
            this.eventLocked = false;
        }
        else
        {
            var item = this.items[this.selectedItemIndex].item
            if(item == "@back@")
            {
                this.toggleMenu();
                this.parentMenu.toggleMenu();
                this.eventLocked = false;
            } 
            else 
            {
                this.handler(action,item);
                if (action != "enter")
                {
                    this._constructMenuCache();
                    this._drawMenu();
                    this.eventLocked = false;
                }
                this.eventLocked = false;
            }
        }

    }


}

Menus.Menu.prototype._initOSD = function () {
    if(this.settings.displayMethod == "overlay")
    {
        if (this.OSD == undefined)
        {
            this.OSD = mp.create_osd_overlay("ass-events");
            // OSD is allowed entire window space
            this.OSD.res_y = mp.get_property("osd-height");
            this.OSD.res_x = mp.get_property("osd-width");
            this.z = 99;
        }
    }
}

Menus.Menu.prototype._drawMenu = function () {

    if(this.settings.displayMethod == "message")
    {
        mp.osd_message(this.cachedMenuText, 1000);
        // seem to be the same
        //mp.commandv("show-text",this.cachedMenuText,1000)
    }

    if(this.settings.displayMethod == "overlay")
    {
        this._initOSD()
        this.OSD.data = this.cachedMenuText;
        this.OSD.update();
    }
}

Menus.Menu.prototype._startTimer = function () {
    if(this.settings.displayMethod == "message") 
    {
        var x = this;
        if (this.menuInterval != undefined) { clearInterval(this.menuInterval); }
        this.menuInterval = setInterval(function () {
            x._constructMenuCache();
            x._drawMenu();
            x._handleAutoClose();
        }, 1000);
    }
    else if (this.settings.displayMethod == "overlay")
    {
        var x = this;
        if (this.menuInterval != undefined) { clearInterval(this.menuInterval); }
        this.menuInterval = setInterval(function () {
            x._handleAutoClose();
        }, 1000);
    }
}

Menus.Menu.prototype._stopTimer = function () {
    if (this.menuInterval != undefined)
    {
        clearInterval(this.menuInterval);
        this.menuInterval = undefined;
    }

}

Menus.Menu.prototype.showMenu = function ()
{
    if(!this.isMenuVisible)
    {
        this.autoCloseStart = mp.get_time();
        this._overrideKeybinds();
        this.selectedItemIndex = 0;
        this.isMenuVisible = true;
        this._constructMenuCache();
        this._drawMenu();
        this._startTimer();
        if(this.allowDrawImage)
        {
            OSD.show(this.settings.image,25,25);
        }
    }
}
Menus.Menu.prototype.hideMenu = function ()
{
    if(this.settings.displayMethod == "message")
    {        
        mp.osd_message("");
        if(this.isMenuVisible)
        {
            this._stopTimer();
            this._revertKeybinds();
            this.isMenuVisible = false;
            this.RemoveSuffix();
            if(this.allowDrawImage)
            {
                OSD.hide(this.settings.image)
            };
        }
        mp.osd_message("");
    }

    if(this.settings.displayMethod == "overlay")
    {
        if(this.isMenuVisible)
        {
            this._stopTimer();
            mp.commandv("osd-overlay",this.OSD.id,"none","",0,0,0,"no","no");
            this._revertKeybinds();
            this.isMenuVisible = false;
            this.RemoveSuffix();
            if(this.allowDrawImage)
            {
                OSD.hide(this.settings.image)
            };
            this.OSD = undefined;
        }
    }
    OSD.hideAll(); // fix
}

Menus.Menu.prototype.toggleMenu = function ()
{
    if(!this.isMenuVisible)
    {
        this.showMenu();
    }
    else 
    {
        this.hideMenu();
    }
}

Menus.Menu.prototype.handler = undefined;

module.exports = Menus;