/*
 * ASSFORMAT.JS (MODULE)
 *
 * Original Author:         VideoPlayerCode
 * Modified by:             Jong
 * URL:                     https://smto.pw/mpv
 * License:                 Apache License, Version 2.0
 */

"use strict";

var Utils = require("./Utils");
var Ass = {};

Ass.startSequence = function () {
	return mp.get_property_osd("osd-ass-cc/0");
};

Ass.endSequence = function () {
	return mp.get_property_osd("osd-ass-cc/1");
};

Ass.escape = function (str, escape) {
	if (escape === false)
		return str;		// Conveniently disable escaping via the same call.


	// Uses the same technique as mangle_ass() in mpv's osd_libass.c:
	// - Treat backslashes as literal by inserting a U+2060 WORD JOINER after
	//   them so libass can't interpret the next char as an escape sequence.
	// - Replace `{` with `\{` to avoid opening an ASS override block. There is
	//   no need to escape the `}` since it's printed literally when orphaned.
	// - See: https://github.com/libass/libass/issues/194#issuecomment-351902555
	return str.replace(/\\/g, "\\\u2060").replace(/\{/g, "\\{");
};

Ass.setSize = function (fontSize) {
	return "{\\fs" + fontSize + "}";
};

Ass.setScale = function (scalePercent) {
	return "{\\fscx" + scalePercent + "\\fscy" + scalePercent + "}";
};

Ass.convertPercentToHex = function (percent, invertValue) {
	// Tip: Use with "invertValue" to convert input range 0.0 (invisible) - 1.0
	// (fully visible) to hex range '00' (fully visible) - 'FF' (invisible), for
	// use with the alpha() function in a logical manner for end-users.
	if (typeof percent !== "number" || percent < 0 || percent > 1)
		throw "Invalid percentage value (must be 0.0 - 1.0)";
	return Utils.toHex(
		Math.floor(
			// Invert range (optionally), and make into a 0-255 value.
			255 * (invertValue ? 1 - percent : percent)
		),
		2 // Fixed-size: 2 bytes (00-FF), as needed for hex in ASS subtitles.
	);
};

Ass.setTransparency = function (transparencyHex) {
	return "{\\alpha&H" + transparencyHex + "&}";
};

Ass.drawRaw = function (commands)
{
	return "{\\p1}" + commands + "{\\p0}"
}

Ass.move = function (x, y)
{
	var s = "{\\p1} ";
	s += "m " + x + " " + y + "{\\p0}";
	return s;
}

Ass.drawRectangle = function (x1,y1,x2,y2)
{
	var s = "{\\p1} ";
	s += "m " + x1 + " " + y1 + " ";
	s += "l " + x2 + " " + y1 + " ";
	s += "l " + x2 + " " + y2 + " ";
	s += "l " + x1 + " " + y2 + "{\\p0}";
	return s;
}

Ass.drawLine = function (x1,y1,x2,y2)
{
	var s = "{\\p1} ";
	s += "m " + x1 + " " + y1 + " ";
	s += "l " + x2 + " " + y2 + "{\\p0}";
	return s;
}

Ass.setFont = function (font) {
	return "{\\fn" + font + "}"
}

Ass.setBorder = function (border) {
	return "{\\bord" + border + "}"
}

Ass.setShadow = function (depth) {
	return "{\\shad" + depth + "}"
}

Ass.insertSymbolFA = function (symbol, size, defaultSize) {

	var font = "Font Awesome 5 Free Solid";

	if(size != undefined && defaultSize != undefined)
	{
		return Ass.setSize(size) + Ass.setFont(font) + symbol + Ass.setFont("Roboto") + Ass.setSize(defaultSize);
	} 
	else 
	{
		return Ass.setFont(font) + symbol + Ass.setFont("Roboto");
	}
	
};

Ass.setColor = function (rgbHex) {
	return "{\\1c&H" +
				rgbHex.substring(4, 6) +
				rgbHex.substring(2, 4) +
				rgbHex.substring(0, 2) +
				"&}";
};

Ass.setSecondaryColor = function (rgbHex) {
	return "{\\2c&H" +
				rgbHex.substring(4, 6) +
				rgbHex.substring(2, 4) +
				rgbHex.substring(0, 2) +
				"&}";
};

Ass.setBorderColor = function (rgbHex) {
	return "{\\3c&H" +
				rgbHex.substring(4, 6) +
				rgbHex.substring(2, 4) +
				rgbHex.substring(0, 2) +
				"&}";
};

Ass.setShadowColor = function (rgbHex) {
	return "{\\4c&H" +
				rgbHex.substring(4, 6) +
				rgbHex.substring(2, 4) +
				rgbHex.substring(0, 2) +
				"&}";
};

Ass.reset = function () {
	return "{\\r}"
}

Ass.setColorWhite = function (output) {
	return Ass.setColor("FFFFFF", output);
};

Ass.setColorGray = function (output) {
	return Ass.setColor("909090", output);
};

Ass.setColorYellow = function (output) {
	return Ass.setColor("FFFF90", output);
};

Ass.setColorGreen = function (output) {
	return Ass.setColor("33ff33", output);
};

Ass.setColorDarkRed = function (output) {
	return Ass.setColor("EB4034", output);
};

Ass.setColorRed = function (output) {
	return Ass.setColor("FF3300", output);
};

Ass.setColorBlack = function (output) {
	return Ass.setColor("000000", output);
}

module.exports = Ass;
