/*
 * WINDOWSYSTEM.JS (MODULE)
 *
 * Author:              Jong
 * URL:                 https://smto.pw/mpv
 * License:             MIT License
 *
 */

/*
    TODO    

 - "Widgets"
    -> Labels?
    -> Text Input?
    -> spinBoxes?
    -> Buttons?
    -> bound calculation for click event

 - Storing "widgets" and displaying them properly
    -> Zones - Top/Middle/Bottom:
        -> Top is Label by default, displaying window title, maybe (x) Button
        -> Middle is undefined by default
        -> Bottom is an OK button

 - Window customizations
    -> Colors, borders, scaling, etc
*/


var Ass = require("./AssFormat");

var Windows = {};

Windows.Window = function (settings)
{
    this.settings = {};
    if (settings.title != undefined) {
        this.settings.title = settings.title;
    } else { this.settings.title = undefined; }

    if (settings.item != undefined) {
        this.settings.item = settings.item;
    } else { this.settings.item = undefined; }

    if (settings.xPosition != undefined) {
        this.settings.xPosition = settings.xPosition;
    } else { this.settings.xPosition = undefined; }

    if (settings.yPosition != undefined) {
        this.settings.yPosition = settings.yPosition;
    } else { this.settings.yPosition = undefined; }

    if (settings.height != undefined) {
        this.settings.height = settings.height;
    } else { this.settings.height = undefined; }

    if (settings.width != undefined) {
        this.settings.width = settings.width;
    } else { this.settings.width = undefined; }

    if (settings.X != undefined) {
        this.settings.X = settings.X;
    } else { this.settings.X = undefined; }

    if (settings.keybindOverrides != undefined)
    {
        this.settings.keybindOverrides = settings.keybindOverrides;
    } 
    else 
    {
        this.settings.keybindOverrides = [
            {
                key: "MBTN_LEFT",
                id: "window_key_mbtn_left",
                action: "click"
            }
        ];
    }

    this.isWindowVisible = false;
    this.cachedWindowText = "";
}

Windows.Window.prototype._overrideKeybinds = function ()
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

Windows.Window.prototype._revertKeybinds = function ()
{
    for(var i = 0; i < this.settings.keybindOverrides.length; i++)
    {
        var currentKey = this.settings.keybindOverrides[i];

        mp.remove_key_binding(
            currentKey.id
          );
    }
}

Windows.Window.prototype._keyPressHandler = function (action)
{
    if(!this.eventLocked)
    {
        this.eventLocked = true;
        if (action == "click")
        {
            var mousePosition = JSON.parse(mp.get_property("mouse-pos"));
            mp.msg.warn("Click event - X:" + mousePosition.x + " Y: " + mousePosition.y)

            this._constructWindowBaseCache();
            this._constructWindowContentCache();
            this._draw();
            this.eventLocked = false;
        }
    }
}

Windows.Window.prototype._constructWindowBaseCache = function ()
{
    var x1 = this.settings.xPosition;
    var y1 = this.settings.yPosition;
    var x2 = this.settings.xPosition + this.settings.width;
    var y2 = this.settings.yPosition + this.settings.height;

    this.cachedWindowBaseText = "";
    this.cachedWindowBaseText += Ass.setShadow(0);
    this.cachedWindowBaseText += Ass.setBorder(1);

    this.cachedWindowBaseText += "{\\p1}";

    this.cachedWindowBaseText += "m " + x1 + " " + y1 + " l " + x2 + " " + y1 + " l " + x2 + " " + y2 + " l " + x1 + " " + y2;
    this.cachedWindowBaseText += "";
    this.cachedWindowBaseText += "m " + x1 + " " + y1 + " l " + x2 + " " + y1;
    this.cachedWindowBaseText += "{\\p0}";

}

Windows.Window.prototype._constructWindowContentCache = function ()
{
    var x2 = this.settings.xPosition + this.settings.width;
    var y2 = this.settings.yPosition + this.settings.height;

    var titleOffset = 45;

    this.cachedWindowContentText = "";

    /*
    this.cachedWindowContentText += Ass.move(
        this.settings.xPosition + titleOffset, 
        this.settings.yPosition + titleOffset
    );
    */

    this.cachedWindowContentText += "{\\pos(" + (this.settings.xPosition+titleOffset) + "," + (this.settings.yPosition+titleOffset-5) + ")}";
    this.cachedWindowContentText += Ass.setBorder(0) + Ass.setShadow(0) + Ass.setColorBlack() + this.settings.title;
    /*
    this.cachedWindowContentText += Ass.setBorder(1) + Ass.drawLine(
        this.settings.xPosition-110,
        this.settings.yPosition-45,
        x2-125,
        this.settings.yPosition-45);
    */
}

Windows.Window.prototype._draw = function ()
{
    if (this.baseOSD == undefined)
    {
        this.baseOSD = mp.create_osd_overlay("ass-events");
        // OSD is allowed entire window space
        this.baseOSD.res_y = mp.get_property("osd-height");
        this.baseOSD.res_x = mp.get_property("osd-width");
        this.z = 97;
    }

    if (this.contentOSD == undefined)
    {
        this.contentOSD = mp.create_osd_overlay("ass-events");
        // OSD is allowed entire window space
        this.contentOSD.res_y = mp.get_property("osd-height");
        this.contentOSD.res_x = mp.get_property("osd-width");
        this.z = 98;
    }

    this.baseOSD.data = this.cachedWindowBaseText;
    this.contentOSD.data = this.cachedWindowContentText;
    this.baseOSD.update();
    this.contentOSD.update();
}

Windows.Window.prototype.show = function ()
{
    if(!this.isWindowVisible)
    {
        this._overrideKeybinds();
        this.isWindowVisible = true;
        this._constructWindowBaseCache();
        this._constructWindowContentCache();
        this._draw();
    }
}

Windows.Window.prototype.hide = function ()
{
    if(this.isWindowVisible)
    {
        mp.commandv("osd-overlay",this.baseOSD.id,"none","",0,0,0,"no","no");
        mp.commandv("osd-overlay",this.contentOSD.id,"none","",0,0,0,"no","no");
        this._revertKeybinds();
        this.isWindowVisible = false;
    }
}

module.exports = Windows;