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

var SSA = require("./SSAHelper");
var OSD = require("./OSD");

var Windows = {};

Windows.Window = function (settings) {
	this.settings = {};
	if (settings.title != undefined) {
		this.settings.title = settings.title;
	} else {
		this.settings.title = undefined;
	}

	if (settings.item != undefined) {
		this.settings.item = settings.item;
	} else {
		this.settings.item = undefined;
	}

	if (settings.xPosition != undefined) {
		this.settings.xPosition = settings.xPosition;
	} else {
		this.settings.xPosition = undefined;
	}

	if (settings.yPosition != undefined) {
		this.settings.yPosition = settings.yPosition;
	} else {
		this.settings.yPosition = undefined;
	}

	if (settings.height != undefined) {
		this.settings.height = settings.height;
	} else {
		this.settings.height = undefined;
	}

	if (settings.width != undefined) {
		this.settings.width = settings.width;
	} else {
		this.settings.width = undefined;
	}

	if (settings.autoClose != undefined) {
		this.settings.autoClose = settings.autoClose;
	} else {
		this.settings.autoClose = 0;
	}

	if (settings.transparency != undefined) {
		this.settings.transparency = settings.transparency;
	} else {
		this.settings.transparency = "60";
	}

	if (settings.fadeOut != undefined) {
		this.settings.fadeOut = settings.fadeOut;
	} else {
		this.settings.fadeOut = true;
	}

	if (settings.fadeOutTime != undefined) {
		this.settings.fadeOutTime = settings.fadeOutTime;
	} else {
		this.settings.fadeOutTime = 50;
	}

	if (settings.drawBaseOSD != undefined) {
		this.settings.drawBaseOSD = settings.drawBaseOSD;
	} else {
		this.settings.drawBaseOSD = true;
	}

	if (settings.drawContentOSD != undefined) {
		this.settings.drawContentOSD = settings.drawContentOSD;
	} else {
		this.settings.drawContentOSD = true;
	}

	if (settings.drawEffectOSD != undefined) {
		this.settings.drawEffectOSD = settings.drawEffectOSD;
	} else {
		this.settings.drawEffectOSD = true;
	}

	if (settings.keybindOverrides != undefined) {
		this.settings.keybindOverrides = settings.keybindOverrides;
	} else {
		this.settings.keybindOverrides = [
			{
				key: "MBTN_LEFT",
				id: "window_key_mbtn_left",
				action: "click",
			},
		];
	}

	this.isWindowVisible = false;

	this.cachedWindowBaseText = "";
	this.cachedWindowContentText = "";
	this.cachedWindowEffectText = "";

	// For convienience
	this.x1 = this.settings.xPosition;
	this.y1 = this.settings.yPosition;
	this.x2 = this.settings.xPosition + this.settings.width;
	this.y2 = this.settings.yPosition + this.settings.height;

	this.titleOffset = 40;
	this.autoCloseStart = -1;
	this.zStart = 998;
};

Windows.Window.prototype._overrideKeybinds = function () {
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

Windows.Window.prototype._revertKeybinds = function () {
	for (var i = 0; i < this.settings.keybindOverrides.length; i++) {
		var currentKey = this.settings.keybindOverrides[i];

		mp.remove_key_binding(currentKey.id);
	}
};

Windows.Window.prototype._keyPressHandler = function (action) {
	if (!this.eventLocked) {
		this.eventLocked = true;
		if (action == "click") {
			var mousePosition = JSON.parse(mp.get_property("mouse-pos"));
			mp.msg.warn(
				"Click event - X:" + mousePosition.x + " Y: " + mousePosition.y
			);
			this._constructWindowBaseCache();
			this._constructWindowContentCache();
			this._draw();
			this.eventLocked = false;
		}
	}
};

Windows.Window.prototype._constructCaches = function () {

	this.cachedWindowBaseText = "";
	this.cachedWindowContentText = "";
	this.cachedWindowEffectText = "";

	this.cachedWindowBaseText += SSA.setTransparencyPercentage(this.settings.transparency);
	this.cachedWindowContentText += SSA.setTransparencyPercentage(this.settings.transparency);
	this.cachedWindowEffectText  += SSA.setTransparencyPercentage(this.settings.transparency);

	this.cachedWindowBaseText += SSA.setBorder(0);
	this.cachedWindowBaseText += SSA.setShadow(2);
	this.cachedWindowBaseText += SSA.setBorderColor("ffffff");
	this.cachedWindowBaseText += SSA.setShadowColor("000000");
	this.cachedWindowBaseText += SSA.setSecondaryColor("000000");

	// start draw mode
	this.cachedWindowBaseText += "{\\p1}";
	// draw box
	this.cachedWindowBaseText +=
		"m " +
		this.x1 + 
		" " +
		this.y1 +
		" l " +
		this.x2 +
		" " +
		this.y1 +
		" l " +
		this.x2 +
		" " +
		this.y2 +
		" l " +
		this.x1 +
		" " +
		this.y2;
	// end draw mode
	this.cachedWindowBaseText += "{\\p0}";


	// move to title
	if(this.settings.title != undefined)
	{ 
		this.cachedWindowContentText +=
		"{\\pos(" +
		(this.x1 + this.titleOffset) +
		"," +
		(this.y1 + this.titleOffset - 5) +
		")}";
		this.cachedWindowContentText +=
			SSA.setBorder(0) +
			SSA.setShadow(0) +
			SSA.setColorBlack() +
			this.settings.title;
	}
	if(this.settings.item != undefined)
	{
		if (this.settings.item.type == "text")
		{
			this.cachedWindowContentText += this.settings.item.data;
		}
		else if (this.settings.item.type == "alert")
		{
			this.cachedWindowEffectText += this.settings.item.image;
			this.cachedWindowContentText += this.settings.item.text.replaceAll("@br@","\n" + SSA.setTransparencyPercentage(this.settings.transparency));
		}
	}

	if(this.settings.title != undefined)
	{
		this.cachedWindowEffectText += SSA.setBorder(1) + SSA.setColorGreen() + SSA.drawLine(
			this.x1,
			this.y1+this.titleOffset,
			this.x2,
			this.y1+this.titleOffset);
	};

};

Windows.Window.prototype._fadeOut = function () {
	var x = this;
	this.transparencyBackup = this.settings.transparency.valueOf();
	this.fadeOutInterval = setInterval(function () {
		if(x.settings.transparency != 100)
		{
			x.settings.transparency = Number(x.settings.transparency) + 1;
			x._constructCaches();
			x._draw();
		}
		else
		{
			mp.commandv(
				"osd-overlay",
				x.baseOSD.id,
				"none",
				"",
				0,
				0,
				0,
				"no",
				"no"
			);
			mp.commandv(
				"osd-overlay",
				x.contentOSD.id,
				"none",
				"",
				0,
				0,
				0,
				"no",
				"no"
			);
			mp.commandv(
				"osd-overlay",
				x.effectOSD.id,
				"none",
				"",
				0,
				0,
				0,
				"no",
				"no"
			);
			x.baseOSD = undefined;
			x.contentOSD = undefined;
			x.effectOSD = undefined;
			x._revertKeybinds();
			x.isWindowVisible = false;
			x.settings.transparency = this.transparencyBackup;
			clearInterval(x.fadeOutInterval);
		}

	}, this.settings.fadeOutTime);
	this.fadeOutInterval.start
}

Windows.Window.prototype._draw = function () {
	if (this.baseOSD == undefined) {
		this.baseOSD = mp.create_osd_overlay("ass-events");
		// OSD is allowed entire window space
		this.baseOSD.res_y = mp.get_property("osd-height");
		this.baseOSD.res_x = mp.get_property("osd-width");
		this.baseOSD.z = this.zStart - 2;
	}

	if (this.contentOSD == undefined) {
		this.contentOSD = mp.create_osd_overlay("ass-events");
		// OSD is allowed entire window space
		this.contentOSD.res_y = mp.get_property("osd-height");
		this.contentOSD.res_x = mp.get_property("osd-width");
		this.contentOSD.z = this.zStart - 1;
	}

	if (this.effectOSD == undefined) {
		this.effectOSD = mp.create_osd_overlay("ass-events");
		// OSD is allowed entire window space
		this.effectOSD.res_y = mp.get_property("osd-height");
		this.effectOSD.res_x = mp.get_property("osd-width");
		this.effectOSD.z = this.zStart;
	}

	if(this.settings.drawBaseOSD)
	{
		this.baseOSD.data = this.cachedWindowBaseText;
		this.baseOSD.update();
	}
	if(this.settings.drawContentOSD)
	{
		this.contentOSD.data = this.cachedWindowContentText;
		this.contentOSD.update();
	}
	if(this.settings.drawEffectOSD)
	{
		this.effectOSD.data = this.cachedWindowEffectText;
		this.effectOSD.update();
	}

};

Windows.Window.prototype.show = function () {
	if (!this.isWindowVisible) {
		this._overrideKeybinds();
		this.isWindowVisible = true;
		this.autoCloseStart = mp.get_time();
		this._constructCaches();
		this._draw();
		this._startTimer();
	}
};

Windows.Window.prototype.onClose = function () {}

Windows.Window.prototype.hide = function () {
	if (this.isWindowVisible) {
		this._stopTimer();
		this.onClose();
		if(this.settings.fadeOut)
		{
			this._fadeOut();
		}
		else
		{
			mp.commandv(
				"osd-overlay",
				this.baseOSD.id,
				"none",
				"",
				0,
				0,
				0,
				"no",
				"no"
			);
			mp.commandv(
				"osd-overlay",
				this.contentOSD.id,
				"none",
				"",
				0,
				0,
				0,
				"no",
				"no"
			);
			mp.commandv(
				"osd-overlay",
				this.effectOSD.id,
				"none",
				"",
				0,
				0,
				0,
				"no",
				"no"
			);
			this.baseOSD = undefined;
			this.contentOSD = undefined;
			this.effectOSD = undefined;
			this._revertKeybinds();
			this.isWindowVisible = false;
		}
	}
};

Windows.Window.prototype._handleAutoClose = function () {
	if (this.settings.autoClose <= 0 || this.autoCloseStart <= -1) {
		return;
	}
	if (this.autoCloseStart <= mp.get_time() - this.settings.autoClose) {
		this.hide();
	}
};

Windows.Window.prototype._startTimer = function () {
	var x = this;
	if (this.windowInterval != undefined) {
		clearInterval(this.windowInterval);
	}
	this.windowInterval = setInterval(function () {
		x._handleAutoClose();
	}, 1000);
	
};

Windows.Window.prototype._stopTimer = function () {
	if (this.windowInterval != undefined) {
		clearInterval(this.windowInterval);
		this.windowInterval = undefined;
	}
};

Windows.Alerts = {};
Windows.Alerts.onScreen = [];
Windows.Alerts.show = function (type,line1,line2,line3) {

	var maxStringLength = 45;

	if(type == undefined) {
		type = "info";
	}
	if(line1 == undefined) {
		line1 = "";
	}
	if(line2 == undefined) {
		line2 = "";
	}
	if(line3 == undefined) {
		line3 = "";
	}

	if(line1.length >= maxStringLength) {
		line1 = line1.substring(0, maxStringLength) + "...";
	}
	if(line2.length >= maxStringLength) {
		line2 = line2.substring(0, maxStringLength) + "...";
	}
	if(line3.length >= maxStringLength) {
		line3 = line3.substring(0, maxStringLength) + "...";
	}

	var osdHeight = mp.get_property("osd-height");
	var osdWidth = mp.get_property("osd-width");
	//var xScale = 1 - Math.floor(osdWidth / 1920);
	//var yScale = 1 - Math.floor(osdHeight / 1080);

	var xOffset = 80;// * (Math.floor(osdWidth) / 1920) / 2);

	var width = 500;// * xScale;
	var height = 100;// * yScale;
	var yOffset = 10 + (height * Windows.Alerts.onScreen.length) + (10 * Windows.Alerts.onScreen.length);
	var message = "";
	var messageXPosition = osdWidth - (width + (xOffset + 100));

	message += SSA.setPosition(messageXPosition + 250,yOffset + 40) + SSA.setBorder(1) + SSA.setSize("33") + SSA.setFont("Overpass");
	message += line1 + "@br@";
	message += SSA.setPosition(messageXPosition + 250,yOffset + 67.5) + SSA.setBorder(1) + SSA.setSize("33") + SSA.setFont("Overpass");
	message += line2 + "@br@";
	message += SSA.setPosition(messageXPosition + 250,yOffset + 95) + SSA.setBorder(1) + SSA.setSize("33") + SSA.setFont("Overpass");
	message += line3;
	var image = "";

	if(type == "info")
	{
		image = SSA.setPosition(messageXPosition + 145,yOffset + 35) + SSA.setScale("200") + SSA.Images.info();
	}
	else if(type == "warning")
	{
		image = SSA.setPosition(messageXPosition + 150,yOffset + 45) + SSA.setScale("75") + SSA.Images.warning();
	}
	else if(type == "error")
	{
		image = SSA.setPosition(messageXPosition + 150,yOffset + 40) + SSA.setScale("33") + SSA.Images.error();
	}
	
	var window = new Windows.Window({
		xPosition: osdWidth - (width + (xOffset)),
		yPosition: yOffset,
		width: width,
		height: height,
		keybindOverrides: [],
		autoClose: 3,
		fadeOut: true,
		fadeOutTime: 35,
		transparency: "40",
		item: {
			type: "alert",
			image: image,
			text: message
		}
	});
	mp.observe_property("osd-height", undefined, function () {
		if(
			mp.get_property("osd-height") != osdHeight
			||
			mp.get_property("osd-width") != osdWidth
			)
		{
			window.settings.fadeOut = false;
			window.hide();
		}
	});

	mp.observe_property("osd-width", undefined, function () {
		if(
			mp.get_property("osd-height") != osdHeight
			||
			mp.get_property("osd-width") != osdWidth
			)
		{
			window.settings.fadeOut = false;
			window.hide();
		}
	});

	Windows.Alerts.onScreen.push(window);

	if(
		mp.get_property("osd-height") < 1090 && mp.get_property("osd-height") > 1070 &&
		mp.get_property("osd-width") < 1930 && mp.get_property("osd-width") > 1910
		)
	{
		window.settings.drawBaseOSD = true;
		window.settings.drawEffectOSD = true;
		window.settings.transparency = "40";
	}
	else
	{
		window.settings.drawBaseOSD = false;
		window.settings.drawEffectOSD = false;
		window.settings.transparency = "0";
	}

	window.show();
	window.onClose = function () {
		for(var i = 0; i <= Windows.Alerts.onScreen.length-1;i++)
		{
			if (Windows.Alerts.onScreen[i] == window)
			{
				Windows.Alerts.onScreen.splice(i,1);
			}
		}
	}
}

module.exports = Windows;
