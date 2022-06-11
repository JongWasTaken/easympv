/*
 * MENUSYSTEM.JS (MODULE)
 *
 * Author:              Jong
 * URL:                 https://smto.pw/mpv
 * License:             MIT License
 *
 * Inspired (but not containing code from) SELECTIONMENU.JS by VideoPlayerCode.
 */

/*
Possible TODO
Mouse support?
--> Calculate boundaries for each menuitem
--> Hook MouseClick mpv event, check if in any boundary, handle as 'open' event if yes
*/

/*----------------------------------------------------------------
The MenuSystem.js module

This module implements a menu system similar to VideoPlayerCode's SelectionMenu.js.
I decided to create my own implementation instead of using SelectionMenu.js because
it was hard to read and felt a bit overengineered at times, while not having many
customization options.
This module puts customization first and should be easy to modifiy to suit your needs.

-

How to use:

Create a new instance of MenuSystem.Menu(Settings,Items[,Parent])

Settings can be an object with the following properties:
    "autoClose"             Number, how many to wait after the last input before closing the menu
                            Set to 0 to disable
    "fontSize"              Number, default font size
                            Different displayMethods use this value differently
                            overlay displayMethod default value is 11, where as
                            message displayMethod default value is 35
    "image"                 String, name of indexed image object
                            Requires OSD.js, as well as 3 versions of the image in different scales
							(It is probably better to to just load custom fonts for things like logos)
    "title"                 String, title gets displayed when no image or impossible to draw image
    "titleColor"            Hex string, name of font
    "titleFont"             String, color of title
    "description"           String, supports special substrings (see below)
    "descriptionColor"      Hex string, color of description
    "itemPrefix"            String, gets prepended to selected item
							Used as selector
    "itemSuffix"            String, gets added to selected item
							Used to show activation of item (feedback)
    "itemColor"             Hex string, default color of all items
    "selectedItemColor"     Hex string, color of selected item
    "transparency"          Percentage, 0 -> solid, 100 -> invisible, default is 0
                            (Does not apply to the image)
    "scrollingEnabled"      Boolean, whether to scroll when items overflow, default is false
    "scrollingPosition"     Number, where to "freeze" the cursor on screen, default is 1
                            0 -> 10 are allowed, lower number is higher on screen
    "borderSize"            Number, thickness of border
    "borderColor"           Hex string, color of border
    "displayMethod"         String, either "overlay" or "message", check below for explanation
                            "message" displayMethod is intended as a fallback only, it is not really maintained
    "zIndex"                Number, on which zIndex to show this menu on, default is 999
	"maxTitleLength"		Number, number of characters before a title gets cut off
							set to 0 to disable (default)
							! It is recommended to cut strings manually instead of using this,
							  as SSA tags could be cut as well, which will break the menu. !
    "keybindOverrides"      Object Array, each object has 3 properties: 
                            "key"    - Name of the key, same as input.conf
                            "id"     - A unique identifier for this keybind
                            "action" - Which event to fire when it gets pressed
All of these have default values.
Alternatively leave Settings undefined to use all default values.

Items is an array of objects that can have the following properties:
    "title"                 String, gets displayed, supports special substrings (see below)
    "item"                  String, internal name of item, gets passed to eventHandler
    ["description"]         String, optional description of the item
    ["color"]               Hex string, optionally override default item color for this item only
"title" and "item" are required.

"title" and "description" can include these special substrings:
    @br@ - Insert blank line after item
    (title only) @us1@ - Insert line after item , replace 1 with amount of line characters

Parent is another instance of MenuSystem.Menu, if provided, a Back button
will appear as the first item of the Menu.

Then just assign a function to the instances eventHandler:
<MenuInstance>.eventHandler = function (event, action) {};

Possible events:
    "show"      Executed before drawing the menu to the screen
                "action" is undefined
    "hide"      Executed before removing the menu from the screen
                "action" is undefined
    "enter"     User pressed enter(or equivalent) on an item
                "action" will be the selected items "item" property
    "left"      User pressed left(or equivalent) on an item
                "action" will be the selected items "item" property
    "right"     User pressed right(or equivalent) on an item
                "action" will be the selected items "item" property

If you previously used VideoPlayerCode's menu implementation, the following might be of interest:
By default we use mpv's new osd-overlay system instead of just using the regular mp.osd_message().
The main benefit is that all other messages will appear below the menu,
making it "unbreakable". It will also scale with the window size (1080p is 100%).
Change MenuSystem.displayMethod (default is "overlay", change to "message" for old way).

The definition of Menus.Menu.prototype._constructMenuCache has even more information.
----------------------------------------------------------------*/

var SSA = require("./SSAHelper");
var ImageOSD = require("./ImageOSD");
var Utils = require("./Utils");

var Menus = {};

Menus.registeredMenus = [];

Menus.Menu = function (settings, items, parentMenu) {
	if (settings == undefined) {
		settings = {};
	}

	this.settings = {};

	if (items != undefined) {
		this.items = items;
	} else {
		this.items = [];
	}

	if (settings.autoClose != undefined) {
		this.settings.autoClose = settings.autoClose;
	} else {
		this.settings.autoClose = 5;
	}

	if (settings.image != undefined) {
		this.settings.image = settings.image;
	} else {
		this.settings.image = undefined;
	}

	if (settings.title != undefined) {
		this.settings.title = settings.title;
	} else {
		this.settings.title = "no title defined";
	}

	if (settings.titleColor != undefined) {
		this.settings.titleColor = settings.titleColor;
	} else {
		this.settings.titleColor = "FFFFFF";
	}

	if (settings.titleFont != undefined) {
		this.settings.titleFont = settings.titleFont;
	} else {
		this.settings.titleFont = "Roboto";
	}

	if (settings.description != undefined) {
		this.settings.description = settings.description;
	} else {
		this.settings.description = undefined;
	}

	if (settings.descriptionColor != undefined) {
		this.settings.descriptionColor = settings.descriptionColor;
	} else {
		this.settings.descriptionColor = "FFFFFF";
	}

	if (settings.itemColor != undefined) {
		this.settings.itemColor = settings.itemColor;
	} else {
		this.settings.itemColor = "FFFFFF";
	}

	if (settings.selectedItemColor != undefined) {
		this.settings.selectedItemColor = settings.selectedItemColor;
	} else {
		this.settings.selectedItemColor = "ba0f8d"; //"740A58";
	} //"EB4034"

	if (settings.scrollingEnabled != undefined) {
		this.settings.scrollingEnabled = settings.scrollingEnabled;
	} else {
		this.settings.scrollingEnabled = false;
	}

	if (settings.scrollingPosition != undefined) {
		this.settings.scrollingPosition = settings.scrollingPosition;
	} else {
		this.settings.scrollingPosition = 1;
	}

	if (settings.transparency != undefined) {
		this.settings.transparency = settings.transparency;
	} else {
		this.settings.transparency = "0";
	}

	if (settings.borderSize != undefined) {
		this.settings.borderSize = settings.borderSize;
	} else {
		this.settings.borderSize = "3";
	}

	if (settings.borderColor != undefined) {
		this.settings.borderColor = settings.borderColor;
	} else {
		this.settings.borderColor = "2F2C28";
	}

	if (settings.displayMethod != undefined) {
		this.settings.displayMethod = settings.displayMethod;
	} else {
		if (Utils.mpvComparableVersion < 33) {
			mp.msg.warn(
				"Your mpv version is too old for overlays. Falling back to messages..."
			);
			this.settings.displayMethod = "message";
		} else {
			this.settings.displayMethod = "overlay";
		}
	}

	if (settings.fontSize != undefined) {
		this.settings.fontSize = settings.fontSize;
	} else {
		if (this.settings.displayMethod == "message") {
			this.settings.fontSize = 11;
		} else if (this.settings.displayMethod == "overlay") {
			this.settings.fontSize = 35;
		}
	}

	if (settings.fontName != undefined) {
		this.settings.fontName = settings.fontName;
	} else {
		this.settings.fontName = Utils.commonFontName;
	}

	if (settings.itemPrefix != undefined) {
		this.settings.itemPrefix = settings.itemPrefix + " ";
	} else {
		this.settings.itemPrefix = SSA.insertSymbolFA(
			" ",
			this.settings.fontSize - 2,
			this.settings.fontSize,
			this.settings.fontName
		);
	} // "➤ "

	if (settings.zIndex != undefined) {
		this.settings.zIndex = settings.zIndex;
	} else {
		this.settings.zIndex = 999;
	}

	if (settings.maxTitleLength != undefined) {
		this.settings.maxTitleLength = settings.maxTitleLength;
	} else {
		this.settings.maxTitleLength = 0;
	}

	if (settings.itemSuffix != undefined) {
		this.settings.itemSuffix = settings.itemSuffix;
	} else {
		this.settings.itemSuffix = SSA.insertSymbolFA(
			" ",
			this.settings.fontSize - 2,
			this.settings.fontSize
		);
	} // ✓

	if (settings.keybindOverrides != undefined) {
		this.settings.keybindOverrides = settings.keybindOverrides;
	} else {
		this.settings.keybindOverrides = [
			// Normal
			{
				key: "up",
				id: "menu_key_up",
				action: "up",
			},
			{
				key: "down",
				id: "menu_key_down",
				action: "down",
			},
			{
				key: "left",
				id: "menu_key_left",
				action: "left",
			},
			{
				key: "right",
				id: "menu_key_right",
				action: "right",
			},
			{
				key: "enter",
				id: "menu_key_enter",
				action: "enter",
			},

			// WASD
			{
				key: "w",
				id: "menu_key_w",
				action: "up",
			},
			{
				key: "s",
				id: "menu_key_s",
				action: "down",
			},
			{
				key: "a",
				id: "menu_key_a",
				action: "left",
			},
			{
				key: "d",
				id: "menu_key_d",
				action: "right",
			},
			{
				key: "W",
				id: "menu_key_w_cap",
				action: "up",
			},
			{
				key: "S",
				id: "menu_key_s_cap",
				action: "down",
			},
			{
				key: "A",
				id: "menu_key_a_cap",
				action: "left",
			},
			{
				key: "S",
				id: "menu_key_d_cap",
				action: "right",
			},
			{
				key: "SPACE",
				id: "menu_key_space",
				action: "enter",
			},

			// Keypad
			{
				key: "KP8",
				id: "menu_key_kp8",
				action: "up",
			},
			{
				key: "KP2",
				id: "menu_key_kp2",
				action: "down",
			},
			{
				key: "KP4",
				id: "menu_key_kp4",
				action: "left",
			},
			{
				key: "KP6",
				id: "menu_key_kp6",
				action: "right",
			},
			{
				key: "KP0",
				id: "menu_key_kp0",
				action: "enter",
			},
			{
				key: "KP_ENTER",
				id: "menu_key_kp_enter",
				action: "enter",
			},
			{
				key: "KP_INS",
				id: "menu_key_kp_ins",
				action: "enter",
			},
			{
				key: "8",
				id: "menu_key_8",
				action: "up",
			},
			{
				key: "2",
				id: "menu_key_2",
				action: "down",
			},
			{
				key: "4",
				id: "menu_key_4",
				action: "left",
			},
			{
				key: "6",
				id: "menu_key_6",
				action: "right",
			},
			{
				key: "0",
				id: "menu_key_0",
				action: "enter",
			},

			// MOUSE Controls
			{
				key: "WHEEL_UP",
				id: "menu_key_wheel_up",
				action: "up",
			},
			{
				key: "WHEEL_DOWN",
				id: "menu_key_wheel_down",
				action: "down",
			},
			{
				// WHEEL_LEFT and WHEEL_RIGHT are uncommon on mice, but here it is, for those who have it
				key: "WHEEL_LEFT",
				id: "menu_key_wheel_left",
				action: "left",
			},
			{
				key: "WHEEL_RIGHT",
				id: "menu_key_wheel_right",
				action: "right",
			},
			//{
			//    key: "MBTN_LEFT",
			//    id: "menu_key_mbtn_left",
			//    action: "left"
			//},
			{
				key: "MBTN_RIGHT",
				id: "menu_key_mbtn_right",
				action: "right",
			},
			{
				key: "MBTN_MID",
				id: "menu_key_mbtn_mid",
				action: "enter",
			},
		];
	}

	if (parentMenu != undefined) {
		this.hasBackButton = true;
		this.parentMenu = parentMenu;
		this.items.unshift({
			title:
				SSA.insertSymbolFA(
					"",
					this.settings.fontSize - 3,
					this.settings.fontSize
				) +
				SSA.setFont(this.settings.fontName) +
				" Back@br@@br@", // ↑
			item: "@back@",
			color: "999999",
		});
	} else {
		this.hasBackButton = false;
		this.parentMenu = undefined;
	}

	if (this.settings.maxTitleLength != 0) {
		for (var i = 0; i < this.items.length; i++) {
			if (this.items[i].title.length >= this.settings.maxTitleLength) {
				this.items[i].title =
					this.items[i].title.substring(
						0,
						this.settings.maxTitleLength
					) + "...";
			}
		}
	}

	this.cachedMenuText = "";
	this.isMenuVisible = false;
	this.suffixCacheIndex = -1;
	this.autoCloseStart = -1;
	this.eventLocked = false;

	Menus.registeredMenus.push(this);
};

Menus.Menu.prototype.setImage = function (name) {
	this.settings.image = name;
};

Menus.Menu.prototype.setDescription = function (text) {
	this.settings.description = text;
};

Menus.Menu.prototype.redrawMenu = function () {
	this._constructMenuCache();
	this._drawMenu();
};

Menus.Menu.prototype._constructMenuCache = function () {
	/*
        Differences between displayMethods

        "message" displayMethod:
        +  Easier to work with internally
        +- Line spacing works by default, but cannot be changed
        -  Automatic scaling is busted
            (there might be some universal offset to fix it)
        -  Sizes do not translate 1:1 
            (default font size has to be 35 intead of 11 to look similar to "overlay" displayMethod)
        -  Will fight over display space (basically like Z-fighting)
        -  Deprecated, not maintained

        "overlay" displayMethod:
        +  Automatically scales to window size
        +  More fine-grained sizings (fontSize is just height in pixels)
        +  will always be on top of every mp.osd_message (no Z-fighting)
        -  A pain to program, but the work is already done and works well
        ?  Requires at least mpv v0.33.0

        Both _should_ look the same (they don't), but ensuring that is not easy.

        Documentation for SSA specification
        http://www.tcax.org/docs/ass-specs.htm

		The code below is quite messy, sorry.
    */

	this.allowDrawImage = false;
	this.itemCount = 0;

	// Start
	this.cachedMenuText = "";
	if (this.settings.displayMethod == "message") {
		var border =
			SSA.setBorderColor(this.settings.borderColor) +
			SSA.setBorder(this.settings.borderSize - 2);

		this.cachedMenuText +=
			SSA.startSequence() +
			SSA.setTransparencyPercentage(this.settings.transparency) +
			border;
		this.cachedMenuText += SSA.setFont(this.settings.fontName);
		this.cachedMenuText += SSA.setSize(this.settings.fontSize);

		// Title
		var title = this.settings.title;
		if (this.settings.image != undefined) {
			if (
				(mp.get_property("osd-height") >= 1060 &&
					mp.get_property("osd-height") <= 1100) ||
				(mp.get_property("osd-height") >= 1420 &&
					mp.get_property("osd-height") <= 1460) ||
				(mp.get_property("osd-height") >= 2140 &&
					mp.get_property("osd-height") <= 2180)
			) {
				title = "        ";
				this.allowDrawImage = true;
			}
		}
		this.cachedMenuText +=
			SSA.setSize(this.settings.fontSize + 2) +
			SSA.setColor(this.settings.titleColor) +
			SSA.setFont(this.settings.titleFont) +
			title +
			SSA.setSize(this.settings.fontSize) +
			"\n \n";

		// Description
		if (this.settings.description != undefined) {
			this.cachedMenuText +=
				SSA.setSize(this.settings.fontSize - 3) +
				SSA.setColor(this.settings.descriptionColor) +
				this.settings.description.replaceAll("@br@", "\n") +
				SSA.setSize(this.settings.fontSize) +
				"\n \n";
		}

		// Items
		if (this.settings.scrollingEnabled) {
			var drawItems = [];
			var allowedItemCount =
				Math.floor(
					mp.get_property("osd-height") / this.settings.fontSize
				) + 5;

			var startItem =
				this.selectedItemIndex -
				Math.percentage(
					this.settings.scrollingPosition,
					allowedItemCount
				);
			while (startItem < 0) {
				startItem++;
			}

			var endItem = this.selectedItemIndex + allowedItemCount;
			while (endItem > this.items.length) {
				endItem = endItem - 1;
			}

			for (var r = startItem; r < endItem; r++) {
				drawItems.push(this.items[r]);
			}
		} else {
			var drawItems = this.items;
			var startItem = 0;
			var endItem = 0;
		}
		for (var i = 0; i < drawItems.length; i++) {
			var currentItem = drawItems[i];
			var title = currentItem.title;

			var postItemActions = [""];
			if (
				title.includes("@") &&
				!(title.match(/@/g) || []).length.isOdd()
			) {
				postItemActions = title.match(/\@(.*?)\@/g);
				title = title.replace(/\@(.*?)\@/g, "");
			}

			var color = "";
			var description = "";

			if (currentItem.color != undefined) {
				color = SSA.setColor(currentItem.color);
			} else {
				color = SSA.setColor(this.settings.itemColor);
			}

			if (currentItem.description != undefined) {
				description =
					SSA.setSize(this.settings.fontSize - 5) +
					color +
					" " +
					currentItem.description
						.replaceAll("@br@", "\n")
						.replaceAll("\n", "\n ") +
					SSA.setColorWhite() +
					SSA.setSize(this.settings.fontSize) +
					"\n";
			}

			if (this.selectedItemIndex - startItem == i) {
				color = SSA.setColor(this.settings.selectedItemColor);
				title = this.settings.itemPrefix + title;
			}

			if (this.suffixCacheIndex - startItem == i) {
				var count = (title.match(/\n/g) || []).length;
				if (count > 0) {
					title =
						title.replaceAll("\n", "") + this.settings.itemSuffix;
					for (var j = 0; j < count; j++) {
						title = title + "\n";
					}
				} else {
					title =
						title.replaceAll("\n", "") + this.settings.itemSuffix; // + "\n";
				}
			}

			this.cachedMenuText +=
				color +
				title +
				SSA.setSize(this.settings.fontSize) +
				SSA.setColorWhite() +
				"\n" +
				description;
			for (var q = 0; q != postItemActions.length; q++) {
				if (postItemActions[q] == "@br@") {
					this.cachedMenuText += "\n";
				}
				if (postItemActions[q].includes("@us")) {
					for (
						var h = 0;
						h !=
						Number(
							postItemActions[q].replaceAll("@", "").substring(2)
						);
						h++
					) {
						this.cachedMenuText += "─";
					}
					this.cachedMenuText += "\n";
				}
				if (postItemActions[q].includes("@t")) {
					this.cachedMenuText += postItemActions[q]
						.replaceAll("@t", "")
						.replaceAll("@", "");
					this.cachedMenuText += "\n";
				}
			}
		}

		// End
		this.cachedMenuText += SSA.endSequence();
	}

	if (this.settings.displayMethod == "overlay") {
		/*
		 Known issues:

		 	- Description Text Lines might overlap on low windows resolutions.
				-> Not really a concern
		 */
		var scaleFactor = Math.floor(mp.get_property("osd-height") / 10.8); // scale percentage
		var transparency = this.settings.transparency;
		var scale = SSA.setScale(scaleFactor);
		var border =
			SSA.setBorderColor(this.settings.borderColor) +
			SSA.setBorder(this.settings.borderSize);
		var font = SSA.setFont(this.settings.fontName);
		var fontSize = this.settings.fontSize;
		var descriptionSizeModifier = -10;
		var currentLinePosition = 0;

		var findLinePosition = function (size, custom) {
			// How this works:
			// https://www.md-subs.com/line-spacing-in-ssa (Method 5/Conclusion)

			var origin = "-2000000";
			var modifier = 0;
			if (size == undefined) {
				size = 1;
			}
			if (custom == undefined) {
				custom = 0;
			}
			switch (size) {
				// These numbers define the line spacings
				case 0:
					modifier = 0.0007;
					break; // small
				case 1:
					modifier = 0.0009;
					break; // normal
				case 2:
					modifier = 0.0015;
					break; // big
				case 3:
					modifier = 0.002;
					break; // huge
				case 4:
					modifier = custom;
					break; // custom
			}
			modifier = modifier * (0.01 * scaleFactor);
			currentLinePosition = currentLinePosition - modifier;
			return (
				"{\\org(" +
				origin +
				",0)\\fr" +
				currentLinePosition.toFixed(5) +
				"}"
			);
		};

		var lineStart = function (
			positionType,
			fontSizeModifier,
			customPositionModifier
		) {
			if (fontSizeModifier == undefined) {
				fontSizeModifier = 0;
			}
			if (customPositionModifier == undefined) {
				customPositionModifier = 0;
			}
			if (positionType == undefined) {
				positionType = 1;
			}
			var s = "";
			s +=
				scale +
				findLinePosition(positionType, customPositionModifier) +
				border +
				font +
				SSA.setTransparencyPercentage(transparency) +
				SSA.setSize(fontSize + fontSizeModifier);
			return s;
		};

		var lineEnd = function () {
			var s = "\n";
			return s;
		};

		var lineBlank = function () {
			var s;
			s = lineStart(4, 0, 0.0005) + lineEnd();
			return s;
		};

		// Title
		var title = this.settings.title;
		if (this.settings.image != undefined) {
			if (
				(mp.get_property("osd-height") >= 1060 &&
					mp.get_property("osd-height") <= 1100) ||
				(mp.get_property("osd-height") >= 1420 &&
					mp.get_property("osd-height") <= 1460) ||
				(mp.get_property("osd-height") >= 2140 &&
					mp.get_property("osd-height") <= 2180)
			) {
				title = "        ";
				this.allowDrawImage = true;
			}
		}

		this.cachedMenuText +=
			lineStart(0, 2) +
			SSA.setColor(this.settings.titleColor) +
			SSA.setFont(this.settings.titleFont) +
			title +
			lineEnd();

		// Description
		var mainDescription = "";
		if (this.settings.description != undefined) {
			var mdLines = this.settings.description.split("@br@");
			mainDescription =
				lineStart(2, descriptionSizeModifier) +
				SSA.setColor(this.settings.descriptionColor) +
				mdLines[0] +
				lineEnd();
			for (var i = 1; i < mdLines.length; i++) {
				mainDescription +=
					lineStart(0, descriptionSizeModifier) +
					SSA.setColor(this.settings.descriptionColor) +
					mdLines[i] +
					lineEnd();
			}
		}
		this.cachedMenuText += mainDescription;

		// Items
		if (this.settings.scrollingEnabled) {
			var drawItems = [];
			var allowedItemCount =
				Math.floor(
					mp.get_property("osd-height") / this.settings.fontSize
				) + 5;

			var startItem =
				this.selectedItemIndex -
				Math.percentage(
					this.settings.scrollingPosition,
					allowedItemCount
				);
			while (startItem < 0) {
				startItem++;
			}

			var endItem = this.selectedItemIndex + allowedItemCount;
			while (endItem > this.items.length) {
				endItem = endItem - 1;
			}

			for (var r = startItem; r < endItem; r++) {
				drawItems.push(this.items[r]);
			}
		} else {
			var drawItems = this.items;
			var startItem = 0;
			var endItem = 0;
		}

		for (var i = 0; i < drawItems.length; i++) {
			var currentItem = drawItems[i];
			var title = currentItem.title;
			var postItemActions = [""];
			if (
				title.includes("@") &&
				!(title.match(/@/g) || []).length.isOdd()
			) {
				postItemActions = title.match(/\@(.*?)\@/g);
				title = title.replace(/\@(.*?)\@/g, "");
			}
			var color = "";
			var description = "";

			if (currentItem.color != undefined) {
				color = SSA.setColor(currentItem.color);
			} else {
				color = SSA.setColor(this.settings.itemColor);
			}

			if (this.selectedItemIndex - startItem == i) {
				color = SSA.setColor(this.settings.selectedItemColor);
				title = this.settings.itemPrefix + title;
			}

			if (this.suffixCacheIndex - startItem == i) {
				title += this.settings.itemSuffix;
			}

			this.cachedMenuText += lineStart(1, 0) + color + title + lineEnd();

			if (currentItem.description != undefined) {
				var dLines = currentItem.description.split("@br@");
				description =
					lineStart(1, descriptionSizeModifier) +
					color +
					" " +
					dLines[0] +
					lineEnd();
				for (var l = 1; l < dLines.length; l++) {
					description +=
						lineStart(0, descriptionSizeModifier) +
						color +
						" " +
						dLines[l] +
						lineEnd();
				}
			}

			this.cachedMenuText += description;

			for (var q = 0; q != postItemActions.length; q++) {
				if (postItemActions[q] == "@br@") {
					this.cachedMenuText += lineBlank();
				}
				if (postItemActions[q].includes("@us")) {
					this.cachedMenuText += lineStart(4, 0, 0.0003);

					for (
						var h = 0;
						h !=
						Number(
							postItemActions[q].replaceAll("@", "").substring(2)
						);
						h++
					) {
						this.cachedMenuText += "─";
					}
					this.cachedMenuText += lineEnd();
				}
				if (postItemActions[q].includes("@t")) {
					this.cachedMenuText += lineStart(4, 0, 0.0005);
					this.cachedMenuText +=
						SSA.setSize(this.settings.fontSize - 9) +
						postItemActions[q]
							.replaceAll("@t", "")
							.replaceAll("@", "");
					this.cachedMenuText += lineEnd();
				}
			}
		}
		//this.cachedMenuText += SSA.drawRectangle(800,800,400,400);
		//mp.msg.warn(this.cachedMenuText);
	}
};

Menus.Menu.prototype._handleAutoClose = function () {
	if (this.settings.autoClose <= 0 || this.autoCloseStart <= -1) {
		return;
	}
	if (this.autoCloseStart <= mp.get_time() - this.settings.autoClose) {
		this.hideMenu();
	}
};

Menus.Menu.prototype.fireEvent = function (name) {
	this._keyPressHandler(name);
};

Menus.Menu.prototype.appendSuffixToCurrentItem = function () {
	this.suffixCacheIndex = this.selectedItemIndex;
	this._constructMenuCache();
	this._drawMenu();
};

Menus.Menu.prototype.removeSuffix = function () {
	this.suffixCacheIndex = -1;
	//this._constructMenuCache();
	//this._drawMenu();
};

Menus.Menu.prototype.getSelectedItem = function () {
	return this.items[this.selectedItemIndex];
};

Menus.getDisplayedMenu = function () {
	var cMenu = undefined;
	for (var i = 0; i < Menus.registeredMenus.length; i++) {
		if (Menus.registeredMenus[i].isMenuVisible) {
			cMenu = Menus.registeredMenus[i];
			break;
		}
	}
	return cMenu;
};

Menus.Menu.prototype._overrideKeybinds = function () {
	var tempFunction = function (x, action) {
		return function () {
			x._keyPressHandler(action);
		};
	};

	for (var i = 0; i < this.settings.keybindOverrides.length; i++) {
		var currentKey = this.settings.keybindOverrides[i];

		mp.add_forced_key_binding(
			currentKey.key,
			currentKey.id,
			tempFunction(this, currentKey.action),
			{ repeatable: true }
		);
	}
};

Menus.Menu.prototype._revertKeybinds = function () {
	for (var i = 0; i < this.settings.keybindOverrides.length; i++) {
		var currentKey = this.settings.keybindOverrides[i];

		mp.remove_key_binding(currentKey.id);
	}
};

Menus.Menu.prototype._keyPressHandler = function (action) {
	this.autoCloseStart = mp.get_time();
	if (!this.eventLocked) {
		this.eventLocked = true;
		if (action == "up") {
			if (this.selectedItemIndex != 0) {
				this.selectedItemIndex = this.selectedItemIndex - 1;
			}
			this._constructMenuCache();
			this._drawMenu();
			this.eventLocked = false;
		} else if (action == "down") {
			if (this.selectedItemIndex < this.items.length - 1) {
				this.selectedItemIndex += 1;
			}
			this._constructMenuCache();
			this._drawMenu();
			this.eventLocked = false;
		} else {
			var item = this.items[this.selectedItemIndex].item;
			if (item == "@back@") {
				this.toggleMenu();
				this.parentMenu.toggleMenu();
				this.eventLocked = false;
			} else {
				this.eventHandler(action, item);
				if (action != "enter") {
					this._constructMenuCache();
					this._drawMenu();
					this.eventLocked = false;
				}
				this.eventLocked = false;
			}
		}
	}
};

Menus.Menu.prototype._initOSD = function () {
	if (this.settings.displayMethod == "overlay") {
		if (this.OSD == undefined) {
			this.OSD = mp.create_osd_overlay("ass-events");
			// OSD is allowed entire window space
			this.OSD.res_y = mp.get_property("osd-height");
			this.OSD.res_x = mp.get_property("osd-width");
			this.OSD.z = this.settings.zIndex;
		}
	}
};

Menus.Menu.prototype._drawMenu = function () {
	if (this.settings.displayMethod == "message") {
		mp.osd_message(this.cachedMenuText, 1000);
		// seem to be the same
		//mp.commandv("show-text",this.cachedMenuText,1000)
	}

	if (this.settings.displayMethod == "overlay") {
		this._initOSD();
		this.OSD.data = this.cachedMenuText;
		this.OSD.update();
	}
};

Menus.Menu.prototype._startTimer = function () {
	if (this.settings.displayMethod == "message") {
		var x = this;
		if (this.menuInterval != undefined) {
			clearInterval(this.menuInterval);
		}
		this.menuInterval = setInterval(function () {
			x._constructMenuCache();
			x._drawMenu();
			x._handleAutoClose();
		}, 1000);
	} else if (this.settings.displayMethod == "overlay") {
		var x = this;
		if (this.menuInterval != undefined) {
			clearInterval(this.menuInterval);
		}
		this.menuInterval = setInterval(function () {
			x._handleAutoClose();
		}, 1000);
	}
};

Menus.Menu.prototype._stopTimer = function () {
	if (this.menuInterval != undefined) {
		clearInterval(this.menuInterval);
		this.menuInterval = undefined;
	}
};

Menus.Menu.prototype.showMenu = function () {
	if (!this.isMenuVisible) {
		this.eventHandler("show", undefined);
		this.autoCloseStart = mp.get_time();
		this._overrideKeybinds();
		this.selectedItemIndex = 0;
		this.isMenuVisible = true;
		this._constructMenuCache();
		this._drawMenu();
		this._startTimer();
		if (this.allowDrawImage) {
			ImageOSD.show(this.settings.image, 25, 25);
		}
	}
};
Menus.Menu.prototype.hideMenu = function () {
	this.eventHandler("hide", undefined);
	if (this.settings.displayMethod == "message") {
		mp.osd_message("");
		if (this.isMenuVisible) {
			this._stopTimer();
			this._revertKeybinds();
			this.isMenuVisible = false;
			this.removeSuffix();
			//if (this.allowDrawImage) {
			//	OSD.hide(this.settings.image);
			//}
		}
		mp.osd_message("");
	}

	if (this.settings.displayMethod == "overlay") {
		if (this.isMenuVisible) {
			this._stopTimer();
			mp.commandv(
				"osd-overlay",
				this.OSD.id,
				"none",
				"",
				0,
				0,
				0,
				"no",
				"no"
			);
			this._revertKeybinds();
			this.isMenuVisible = false;
			this.removeSuffix();
			//if (this.allowDrawImage) {
			//	OSD.hide(this.settings.image);
			//}
			this.OSD = undefined;
		}
	}
	ImageOSD.hide(this.settings.image);
	//OSD.hideAll();
};

Menus.Menu.prototype.toggleMenu = function () {
	if (!this.isMenuVisible) {
		this.showMenu();
	} else {
		this.hideMenu();
	}
};

Menus.Menu.prototype.eventHandler = function () {
	mp.msg.warn('Menu "' + this.settings.title + '" has no event handler!');
};

module.exports = Menus;
