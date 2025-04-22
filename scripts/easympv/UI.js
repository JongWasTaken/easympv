/*
 * UI.JS (PART OF EASYMPV)
 *
 * Author:                  Jong
 * URL:                     https://github.com/JongWasTaken/easympv
 * License:                 MIT License
 */
var UI = {};

/** Provides common SSA tags. */
UI.SSA = {};

/** Starts a SSA sequence.
 * @returns {string} SSA tag sequence
*/
UI.SSA.startSequence = function () {
    return mpv.getPropertyOfOsd("osd-ass-cc/0");
};

/** Stops a SSA sequence.
 * @returns {string} SSA tag sequence
*/
UI.SSA.endSequence = function () {
    return mpv.getPropertyOfOsd("osd-ass-cc/1");
};

/** Sets or unsets SSA bold tag.
 * @param {boolean} bold - Whether bold should be enabled or disabled
 * @returns {string} SSA tag sequence
*/
UI.SSA.setBold = function (bold) {
    if (bold)
    {
        return "{\\b1}";
    }
    return "\{\\b0}";
}

/** Sets or unsets SSA italic tag.
 * @param {boolean} italic - Whether italic should be enabled or disabled
 * @returns {string} SSA tag sequence
*/
UI.SSA.setItalic = function (italic) {
    if (italic)
    {
        return "{\\i1}";
    }
    return "\{\\i0}";
}

/** Sets SSA font size tag.
 * @param {number} fontSize - Desired font size
 * @returns {string} SSA tag sequence
*/
UI.SSA.setSize = function (fontSize) {
    return "{\\fs" + fontSize + "}";
};

/** Sets SSA text allignment tag.
 * @param {number} type - Desired allignment: Number on the numpad (e.g. 1 is bottom-left, 9 is top-right)
 * @returns {string} SSA tag sequence
*/
UI.SSA.setAllignment = function (type) {
    // based on number pad (eg. 1 is bottom-left, 5 is dead center, 9 is top-right)
    return "{\\an" + type + "}";
};

/** Sets SSA text scale tag.
 * @param {number} scalePercent - Desired scale as percentage
 * @returns {string} SSA tag sequence
*/
UI.SSA.setScale = function (scalePercent) {
    if (scalePercent == undefined) scalePercent = UI.SSA.findIdealScale();
    return "{\\fscx" + scalePercent + "\\fscy" + scalePercent + "}";
};

/** Sets SSA text transparancy tag from HEX value.
 * @param {string} transparencyHex - Desired scale as HEX value (without #)
 * @returns {string} SSA tag sequence
*/
UI.SSA.setTransparency = function (transparencyHex) {
    return "{\\alpha&H" + transparencyHex + "&}";
};

/** Sets SSA text transparancy tag from percentage.
 * @param {number} transparencyPercentage - Desired scale as percentage
 * @returns {string} SSA tag sequence
*/
UI.SSA.setTransparencyPercentage = function (transparencyPercentage) {
    var transparencyHex = Math.floor(
        (transparencyPercentage / 100) * 255
    ).toString(16);
    return "{\\alpha&H" + transparencyHex + "&}";
};

/** Encapsulates given SSA draw commands.
 * @param {string} commands - SSA draw commands
 * @returns {string} SSA tag sequence
*/
UI.SSA.drawRaw = function (commands) {
    return "{\\p1}" + commands + "{\\p0}";
};

/** Sets SSA text position. 0,0 corresponds to top-left.
 * @param {number} x - Desired x position
 * @param {number} y - Desired y position
 * @returns {string} SSA tag sequence
*/
UI.SSA.setPosition = function (x, y) {
    var s = "{\\pos(" + x + "," + y + ")}";
    return s;
};

/** Sets SSA text position by percentage of screen size. 0% ,0% corresponds to top-left.
 * @param {number} x - Desired x position percentage
 * @param {number} y - Desired y position percentage
 * @param {string} origin - Desired origin screen corner (e.g. top-left)
 * @returns {string} SSA tag sequence
*/
UI.SSA.setPositionAbsolutePercentage = function (x, y, origin) {
    if (origin == undefined)
    {
        origin = "top-left";
    }

    var width = Number(mpv.getProperty("osd-width"));
    var height = Number(mpv.getProperty("osd-height"));

    if (origin == "top-left")
    {
        x = width * (x / 100);
        y = height * (y / 100);
        return UI.SSA.setPosition(x,y);
    }
    if (origin == "top-right")
    {
        x = width - (width * (x / 100));
        y = height * (y / 100);
        return UI.SSA.setPosition(x,y);
    }
    if (origin == "bottom-left")
    {
        x = width * (x / 100);
        y = height - (height * (y / 100));
        return UI.SSA.setPosition(x,y);
    }
    if (origin == "bottom-right")
    {
        x = width - (width * (x / 100));
        y = height - (height * (y / 100));
        return UI.SSA.setPosition(x,y);
    }
};

/** Sets SSA text position to offset from screen edges.
 * @param {string} corner - Desired origin screen corner (e.g. top-left)
 * @param {number} offset - Desired offset from screen edge
 * @returns {string} SSA tag sequence
*/
UI.SSA.setPositionScreenCorner = function(corner, offset)
{
    if (corner == undefined)
    {
        corner = "top-left";
    }

    var width = Number(mpv.getProperty("osd-width"));
    var height = Number(mpv.getProperty("osd-height"));

    if ((width / 16) > (height / 9))
    {
        height = (width / 16) * 9;
    }
    else
    {
        width = (height / 9) * 16;
    }

    var x = offset;
    var y = offset;

    if (corner == "top-left")
    {
        x = width * (x / 100);
        y = height * (y / 100);
        return UI.SSA.setPosition(x,y);
    }
    if (corner == "top-right")
    {
        x = width - (width * (x / 100));
        y = height * (y / 100);
        return UI.SSA.setPosition(x,y);
    }
    if (corner == "bottom-left")
    {
        x = width * (x / 100);
        y = height - (height * (y / 100));
        return UI.SSA.setPosition(x,y);
    }
    if (corner == "bottom-right")
    {
        x = width - (width * (x / 100));
        y = height - (height * (y / 100));
        return UI.SSA.setPosition(x,y);
    }

}

/** Computes ideal scale for current window resolution, where 100% corresponds to 1080p.
 * @returns {number} scale percentage
*/
UI.SSA.findIdealScale = function ()
{
    var width = Number(mpv.getProperty("osd-width"));
    var height = Number(mpv.getProperty("osd-height"));

    var scaleFactor = 0;

    if (width > height)
    {
        height = (width / 16) * 9;
        scaleFactor = Math.floor(height / 10.8);
    }
    else
    {
        width = (height / 9) * 16;
        scaleFactor = Math.floor(width / 19.2);
    }

    return scaleFactor;
}

/** Returns SSA move draw command.
 * @param {number} x - Desired x position
 * @param {number} y - Desired y position
 * @returns {string} SSA move draw command
*/
UI.SSA.move = function (x, y) {
    var s = "{\\p1} ";
    s += "m " + x + " " + y + "{\\p0}";
    return s;
};

/** Returns SSA rectangle draw command.
 * @param {number} x1 - First Rectangle corner position
 * @param {number} x2 - Second Rectangle corner position
 * @param {number} y1 - Third Rectangle corner position
 * @param {number} y2 - Fourth Rectangle corner position
 * @returns {string} SSA draw command
*/
UI.SSA.drawRectangle = function (x1, y1, x2, y2) {
    var s = "{\\p1} ";
    s += "m " + x1 + " " + y1 + " ";
    s += "l " + x2 + " " + y1 + " ";
    s += "l " + x2 + " " + y2 + " ";
    s += "l " + x1 + " " + y2 + "{\\p0}";
    return s;
};

/** Returns SSA line draw command.
 * @param {number} x1 - Line start x coordinate
 * @param {number} y1 - Line start y coordinate
 * @param {number} x2 - Line end x coordinate
 * @param {number} y2 - Line end y coordinate
 * @returns {string} SSA draw command
*/
UI.SSA.drawLine = function (x1, y1, x2, y2) {
    var s = "{\\p1} ";
    s += "m " + x1 + " " + y1 + " ";
    s += "l " + x2 + " " + y2 + "{\\p0}";
    return s;
};

/** Sets SSA text font tag.
 * @param {string} font - Font name
 * @returns {string} SSA tag sequence
*/
UI.SSA.setFont = function (font) {
    return "{\\fn" + font + "}";
};

/** Sets SSA text border tag.
 * @param {number} size - Border size
 * @returns {string} SSA tag sequence
*/
UI.SSA.setBorder = function (size) {
    return "{\\bord" + size + "}";
};

/** Sets SSA text shadow tag.
 * @param {number} depth - Shadow depth
 * @returns {string} SSA tag sequence
*/
UI.SSA.setShadow = function (depth) {
    return "{\\shad" + depth + "}";
};

/** Inserts given Font Awesome symbol with given size, then sets font back to Roboto.
 * @param {string} symbol - Font Awesome unicode symbol
 * @param {number} size - Desired size for the symbol
 * @param {number} defaultSize - Size to return to after symbol insertion
 * @param {string} fontNameAfter - Font name to return to after symbol insertion
 * @returns {string} SSA tag sequence
 * */
UI.SSA.insertSymbolFA = function (symbol, size, defaultSize, fontNameAfter) {
    var font = "Font Awesome 6 Free Solid";

    if (fontNameAfter == undefined) {
        fontNameAfter = "Roboto";
    }

    if (Settings.Data.compatibilityMode)
    {
        size = Math.floor(size / 3);
        defaultSize = Math.floor(defaultSize / 3);
    }


    if (size != undefined && defaultSize != undefined) {
        return (
            UI.SSA.setSize(size) +
            UI.SSA.setFont(font) +
            symbol +
            UI.SSA.setFont(fontNameAfter) +
            UI.SSA.setSize(defaultSize)
        );
    } else {
        return (
            UI.SSA.setFont(font) + symbol + UI.SSA.setFont(fontNameAfter)
        );
    }
};

/** Sets SSA text primary color tag.
 * @param {string} hex - Web hex color (without #)
 * @returns {string} SSA tag sequence
*/
UI.SSA.setColor = function (hex) {
    return (
        "{\\1c&H" +
        hex.substring(4, 6) +
        hex.substring(2, 4) +
        hex.substring(0, 2) +
        "&}"
    );
};

/** Sets SSA text secondary color tag.
 * @param {string} hex - Web hex color (without #)
 * @returns {string} SSA tag sequence
*/
UI.SSA.setSecondaryColor = function (hex) {
    return (
        "{\\2c&H" +
        hex.substring(4, 6) +
        hex.substring(2, 4) +
        hex.substring(0, 2) +
        "&}"
    );
};

/** Sets SSA text border color tag.
 * @param {number} hex - Web hex color (without #)
 * @returns {string} SSA tag sequence
*/
UI.SSA.setBorderColor = function (hex) {
    return (
        "{\\3c&H" +
        hex.substring(4, 6) +
        hex.substring(2, 4) +
        hex.substring(0, 2) +
        "&}"
    );
};

/** Sets SSA text shadow color tag.
 * @param {number} hex - Web hex color (without #)
 * @returns {string} SSA tag sequence
*/
UI.SSA.setShadowColor = function (hex) {
    return (
        "{\\4c&H" +
        hex.substring(4, 6) +
        hex.substring(2, 4) +
        hex.substring(0, 2) +
        "&}"
    );
};

/** Resets SSA tags to default settings.
 * @returns {string} SSA tag sequence
*/
UI.SSA.reset = function () {
    return "{\\r}";
};

/** Convenience method to set primary color to white.
 * @returns {string} SSA tag sequence
*/
UI.SSA.setColorWhite = function () {
    return UI.SSA.setColor("FFFFFF");
};

/** Convenience method to set primary color to gray.
 * @returns {string} SSA tag sequence
*/
UI.SSA.setColorGray = function () {
    return UI.SSA.setColor("909090");
};

/** Convenience method to set primary color to yellow.
 * @returns {string} SSA tag sequence
*/
UI.SSA.setColorYellow = function () {
    return UI.SSA.setColor("FFFF90");
};

/** Convenience method to set primary color to green.
 * @returns {string} SSA tag sequence
*/
UI.SSA.setColorGreen = function () {
    return UI.SSA.setColor("33ff33");
};

/** Convenience method to set primary color to dark red.
 * @returns {string} SSA tag sequence
*/
UI.SSA.setColorDarkRed = function () {
    return UI.SSA.setColor("EB4034");
};

/** Convenience method to set primary color to red.
 * @returns {string} SSA tag sequence
*/
UI.SSA.setColorRed = function () {
    return UI.SSA.setColor("FF3300");
};

/** Convenience method to set primary color to black.
 * @returns {string} SSA tag sequence
*/
UI.SSA.setColorBlack = function () {
    return UI.SSA.setColor("000000");
};

/** Convenience method to set primary color to blue.
 * @returns {string} SSA tag sequence
*/
UI.SSA.setColorBlue = function () {
    return UI.SSA.setColor("0096FF");
};

/**
 * Using https://qgustavor.github.io/svg2ass-gui/ , any svg file can
 * be displayed. However mpv has a quirk with this, files that consist
 * of multiple shapes will be missaligned. Those same lines will look
 * perfect in AegiSub.
 * This is why all images here are a single shape/SSA draw command.
 */
UI.SSA.Images = {};

/** Blue round info symbol.
 * @returns {string} SSA tag sequence
*/
UI.SSA.Images.info = function () {
    var symbol = "";
    symbol +=
        "{\\an7\\1c&HF39621&\\bord2\\shad0\\p1}m 24 4 b 13 4 4 13 4 24 b 4 35 13 44 24 44 b 35 44 44 35 44 24 b 44 13 35 4 24 4 ";
    symbol +=
        "m 24 14 b 25.4 14 26.5 15.1 26.5 16.5 b 26.5 17.9 25.4 19 24 19 b 22.6 19 21.5 17.9 21.5 16.5 b 21.5 15.1 22.6 14 24 14 ";
    symbol += "m 22 22 l 26 22 l 26 33 l 22 33 l 22 22 {\\p0}";
    return symbol + UI.SSA.reset();
};

/** Yellow triangular warning symbol.
 * @returns {string} SSA tag sequence
*/
UI.SSA.Images.warning = function () {
    var symbol = "";
    symbol +=
        "{\\an7\\1c&H1CEEFD&\\bord2\\shad0\\p1}m 58.1 0.3 b 56.2 0.6 54.6 1.7 53.6 3.3 l 1 94.5 b -0.1 96.4 -0.1 98.8 1 100.8 ";
    symbol +=
        "b 2.1 102.7 4.2 103.9 6.5 103.9 l 111.7 103.9 b 114 103.9 116.1 102.7 117.2 100.8 b 118.3 98.8 118.3 96.4 117.2 94.5 ";
    symbol += "l 64.5 3.3 b 63.2 1.1 60.7 -0.1 58.1 0.3 ";
    symbol +=
        "m 58.6 2.9 b 57.6 3 56.7 3.6 56.2 4.5 l 3.2 96.3 b 2.7 97.3 2.7 98.6 3.2 99.6 b 3.8 100.6 4.9 101.3 6.1 101.3 l 112.1 101.3 b ";
    symbol +=
        "113.3 101.3 114.4 100.6 115 99.6 b 115.6 98.6 115.6 97.3 115 96.3 l 62 4.5 b 61.3 3.3 60 2.7 58.6 2.9 m 59.1 13.4 l 104.1 92.7 l 14 92.7 l 59.1 13.4 ";
    symbol +=
        "m 62.6 83 b 62.6 85.6 60.5 87.7 57.9 87.7 b 55.3 87.7 53.2 85.6 53.2 83 b 53.2 80.4 55.3 78.3 57.9 78.3 b 60.5 78.3 62.6 80.4 62.6 83 ";
    symbol +=
        "m 56.1 39.1 l 59.8 39.1 b 61.7 39.1 63.2 41.4 63.2 44.3 l 61.6 67.9 b 61.6 70.8 60.1 73.1 58.2 73.1 l 57.7 73.1 ";
    symbol +=
        "b 55.8 73.1 54.3 70.8 54.3 67.9 l 52.7 44.3 b 52.7 41.4 54.2 39.1 56.1 39.1 {\\p0}";
    return symbol + UI.SSA.reset();
};

/** Red round error symbol.
 * @returns {string} SSA tag sequence
*/
UI.SSA.Images.error = function () {
    var symbol = "";
    symbol +=
        "{\\an7\\1c&H0000EC&\\bord2.8\\shad0\\p1}m 128 2 b 58.5 2 2 58.5 2 128 b 2 197.5 58.5 254 128 254 b 197.5 254 254 197.5 254 128 ";
    symbol +=
        "b 254 58.5 197.5 2 128 2 m 82.9 68.9 b 86.5 68.9 90.1 70.3 92.8 73 l 128 108.2 l 163.2 73 b 165.9 70.3 169.5 68.9 173.1 68.9 b 176.7 68.9 180.3 70.3 183 73 ";
    symbol +=
        "b 188.5 78.5 188.5 87.3 183 92.8 l 147.8 128 l 183 163.2 b 188.5 168.7 188.5 177.5 183 183 ";
    symbol +=
        "b 180.3 185.7 176.7 187.1 173.1 187.1 b 169.5 187.1 165.9 185.7 163.2 183 l 128 147.8 l 92.8 183 ";
    symbol +=
        "b 90.1 185.7 86.5 187.1 82.9 187.1 b 79.3 187.1 75.7 185.7 73 183 b 67.5 177.5 67.5 168.7 73 163.2 ";
    symbol +=
        "l 108.2 128 l 73 92.8 b 67.5 87.3 67.5 78.5 73 73 b 75.7 70.3 79.3 68.9 82.9 68.9 {\\p0}";
    return symbol + UI.SSA.reset();
};

/*----------------------------------------------------------------
CLASS: UI.Image
DESCRIPTION:
    This static class provides helpers for displaying BMP images.
USAGE:
    (TODO)
----------------------------------------------------------------*/

/**
 * Provides helpers for displaying BMP images.
 */
UI.Image = {};

/**
 * Uses system provided tools to get image metadata.
 * Falls back to parsing .info files, otherwise assumes default values.
 * Defaults: H 60px x W 200px.
 * @param {string} file - File path
 * @returns {object} Object, with properties: h,w,offset
 */
UI.Image.getImageInfo = function (file) {
    file = mpv.getUserPath(file);
    var h, w, offset;
    // try using system tools to get image metadata
    var r = OS.getImageInfo(file);
    if (r.status == "0") {
        var input = r.stdout.trim();
        if (OS.isWindows) {
            var data = input.split("|");
            w = data[0];
            h = data[1];
            offset =
            mpv.fileInfo(file).size - 4 * w * h;
        } else {
            var data = input.split(",");
            var dataDimensions;
            var dataOffset;
            if (data[0] == "PC bitmap") {
                // fields are different depending on the bmp type,
                // this way we dont need to check for that
                for (var i = 0; i < data.length; i++) {
                    if (
                        data[i].includes(" x 32") ||
                        data[i].includes(" x 16")
                    ) {
                        dataDimensions = data[i];
                    }
                    if (data[i].includes("bits offset")) {
                        dataOffset = data[i];
                    }
                }

                var dim = dataDimensions.split(" x ");
                w = Number(dim[0]);
                h = Number(dim[1].substring(1));
                offset = Number(dataOffset.split(" ")[3]);
            }
        }
    }
    // otherwise try to use old way (parsing a .info file)
    else {
        filex = file + ".info";
        if (mpv.fileExists(filex)) {
            var data = mpv.readFile(filex).split(";");
            for (var i = 0; i < data.length; i++) {
                var pair = data[i].split("=");
                if (pair[0] == "h") {
                    h = Number(pair[1]);
                } else if (pair[0] == "w") {
                    w = Number(pair[1]);
                }
            }
        } else {
            // if everything else fails, assume default
            h = 60;
            w = 200;
        }
        offset = mpv.fileInfo(file).size - 4 * w * h;
    }

    return (result = { h: h, w: w, offset: offset });
};

UI.Image.__getFilebyName = function (name) {
    for (i = 0; i < Settings.presets.images.length; i++) {
        if (Settings.presets.images[i].name == name) {
            return Settings.presets.images[i];
        }
    }
};

/**
 * Represents an image.
 * You probably want to call OSD.addImage() instead.
 * @constructor
 */
UI.Image.Image = function (active, id, file, width, height, offset, x, y) {
    return {
        id: id,
        file: mpv.getUserPath("~~/scripts/easympv/images/") + file,
        width: width,
        height: height,
        x: x,
        y: y,
        offset: offset,
        active: active
    };
};

/**
 * Adds an image file to the internal file array.
 * Place the correctly formated image file in ~~/scripts/easympv/images/.
 * @param {string} name internal name for image file, used when drawing/removing overlay
 * @param {string} file file name with extension

UI.Image.addImage = function (name, file) {
    var imgdata = __getImageInfo(file);
    var height = imgdata.h;
    var width = imgdata.w;
    var offset = imgdata.offset;
    var image = {
        name: name,
        data: new UI.Image.Image(
            false,
            Files.length,
            file,
            width,
            height,
            offset,
            0,
            0
        ),
    };
    Files.push(image);
};
 */

/**
 * Check if image is currently being displayed.
 * @param {string} name internal name of image
 * @return {Boolean} true if image is currently on screen
 */
UI.Image.status = function (name) {
    var image = UI.Image.__getFilebyName(name);
    return image.active;
};

/**
 * Get the required scale for current window size.
 * @return {String} "", "2" or "4"
 */
UI.Image.getScale = function () {
    var scale = "";
    var height = mpv.getProperty("osd-height");
    if (height == 0) {
        height = mpv.getProperty("height");
    }

    if (height < 1090) {
        scale = "";
    } else if (height <= 1450 && height >= 1080) {
        scale = "2";
    } else if (height <= 2170 && height >= 1440) {
        scale = "4";
    }
    return scale;
};

/**
 * Draws image to screen at specified coordinates. 0,0 corresponds to top-left.
 * @param {string} name - internal name of image
 * @param {string} x - x Position
 * @param {string} y - y Position
 */
UI.Image.show = function (name, x, y) {
    if (name != undefined && x != undefined && y != undefined) {
        var scale = UI.Image.getScale();
        var image = UI.Image.__getFilebyName(scale + name);

        image.x = x;
        image.y = y;
        if (!image.active) {
            mpv.commandv(
                "overlay-add",
                image.id,
                image.x,
                image.y,
                mpv.getUserPath(image.file),
                image.offset,
                "bgra",
                image.width,
                image.height,
                image.width * 4
            );
            image.active = true;
        }
    }
};

/**
 * Draws or hides image to/from screen at specified coordinates. 0,0 corresponds to top-left.
 * @param {string} name - internal name of image
 * @param {string} x - x Position
 * @param {string} y - y Position
 */
UI.Image.toggle = function (name, x, y) {
    var scale = "";
    var height = mpv.getProperty("osd-height");
    if (height == 0) {
        height = mpv.getProperty("height");
    }

    if (height < 1090) {
        scale = "";
    } else if (height <= 1450 && height >= 1080) {
        scale = "2";
    } else if (height <= 2170 && height >= 1440) {
        scale = "4";
    }

    var image = UI.Image.__getFilebyName(scale + name);
    if (!image.active) {
        UI.Image.show(image.name, x, y);
    } else {
        mpv.commandv("overlay-remove", image.id);
        image.active = false;
    }
};

/**
 * Removes image from screen.
 * @param {string} name internal name of image
 */
UI.Image.hide = function (name) {
    if (name != null) {
        var image;
        //var scale = "";
        var height = mpv.getProperty("osd-height");
        if (height == 0) {
            height = mpv.getProperty("height");
        }

        /*
        if (height < 1090) {
            scale = "";
        } else if (height <= 1450 && height >= 1080) {
            scale = "2";
        } else if (height <= 2170 && height >= 1440) {
            scale = "4";
        }
        */

        image = UI.Image.__getFilebyName(name);
        if (image.active) {
            mpv.commandv("overlay-remove", image.id);
            image.active = false;
        }

        image = UI.Image.__getFilebyName("2" + name);
        if (image.active) {
            mpv.commandv("overlay-remove", image.id);
            image.active = false;
        }

        image = UI.Image.__getFilebyName("4" + name);
        if (image.active) {
            mpv.commandv("overlay-remove", image.id);
            image.active = false;
        }
    }
};

/**
 * Removes all images from screen.
 */
UI.Image.hideAll = function () {
    for (i = 0; i < Settings.presets.images.length; i++) {
        if (Settings.presets.images[i].active == true) {
            UI.Image.hide(Settings.presets.images[i].name);
        }
    }
};

/** Handles drawing the clock. */
UI.Time = {};


UI.Time.OSD = undefined;
UI.Time.Timer = undefined;
UI.Time.xLocation = 1;
UI.Time.yLocation = 1;
UI.Time.Allignment = 4;

UI.Time.observer = function()
{
    UI.Time._hide();
    UI.Time._show();
}

UI.Time.assembleContent = function()
{
    var content = "";
    content += UI.SSA.setScale(UI.SSA.findIdealScale()) + UI.SSA.setTransparencyPercentage(50) + UI.SSA.setBorder(1);
    content += UI.SSA.setPositionAbsolutePercentage(UI.Time.xLocation, UI.Time.yLocation, Settings.Data.clockPosition);
    //content += UI.SSA.setPositionScreenCorner(Settings.Data.clockPosition,UI.Time.xLocation);
    content += UI.SSA.setAllignment(UI.Time.Allignment);
    content += UI.SSA.insertSymbolFA(" ", 20, 32, Utils.commonFontName);
    content += Utils.getCurrentTime();
    return content;
}

UI.Time._startTimer = function() {
    UI.Time.Timer = setInterval(function () {
        UI.Time.OSD.data = UI.Time.assembleContent();
        UI.Time.OSD.update();
    }, 1000);
};

UI.Time._stopTimer = function () {
    if (UI.Time.Timer != undefined) {
        clearInterval(UI.Time.Timer);
        UI.Time.Timer = undefined;
    }
};

UI.Time.show = function()
{
    if (UI.Time.OSD != undefined) {
        return;
    }

    mp.observe_property(
        "osd-width",
        undefined,
        UI.Time.observer
    );

    UI.Time._show();
}

UI.Time._show = function()
{
    if (Settings.Data.clockPosition == "bottom-right")
    {
        UI.Time.xLocation = 6;
        UI.Time.yLocation = 1;
        UI.Time.Allignment = 4;
    }
    else if (Settings.Data.clockPosition == "bottom-left")
    {
        UI.Time.xLocation = 6;
        UI.Time.yLocation = 1;
        UI.Time.Allignment = 6;
    }
    else if (Settings.Data.clockPosition == "top-right")
    {
        UI.Time.xLocation = 6;
        UI.Time.yLocation = 3;
        UI.Time.Allignment = 4
    }
    else // top-left
    {
        UI.Time.xLocation = 6;
        UI.Time.yLocation = 3;
        UI.Time.Allignment = 6;
    }

    // create overlay

    UI.Time.OSD = mp.create_osd_overlay("ass-events");
    // OSD is allowed entire window space
    UI.Time.OSD.res_y = mpv.getProperty("osd-height");
    UI.Time.OSD.res_x = mpv.getProperty("osd-width");
    UI.Time.OSD.z = 1;

    UI.Time.OSD.data = UI.Time.assembleContent();
    UI.Time.OSD.update();
    UI.Time._startTimer();

}

UI.Time.hide = function()
{
    if (UI.Time.OSD == undefined) {
        return;
    }

    mp.unobserve_property(UI.Time.observer);

    UI.Time._hide();
}

UI.Time._hide = function()
{
    UI.Time._stopTimer();
    if (UI.Time.OSD != undefined) {
        mpv.commandv(
            "osd-overlay",
            UI.Time.OSD.id,
            "none",
            "",
            0,
            0,
            0,
            "no",
            "no"
        );
        UI.Time.OSD = undefined;
    }
}

/*----------------------------------------------------------------
CLASS: UI.Menus
DESCRIPTION:
    This class implements a menu system similar to VideoPlayerCode's SelectionMenu.js.
    I decided to create my own implementation instead of using SelectionMenu.js because
    it was not offering enough customization options.
    This implementation puts customization first and should be easy to modifiy to suit your needs.
USAGE:
    Create a new instance of UI.Menus.Menu(Settings,Items[,ParentMenuInstance])
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
        "titleColor"            Hex string, color of title
        "titleFont"             String, name of font
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
        "menuId"                String, unique id for this menu
                                Defaults to random number (there is not much point in setting this)
        "fadeIn"                Boolean, whether to fade in the menu (possible performance penalty)
        "fadeOut"               Boolean, whether to fade out the menu (possible performance penalty)
        "scrollingEnabled"      Boolean, whether to scroll when items overflow, default is false
        "scrollingPosition"     Number, where to "freeze" the cursor on screen, default is 1
                                0 -> 10 are allowed, lower number is higher on screen
        "borderSize"            Number, thickness of border
        "borderColor"           Hex string, color of border
        "backButtonTitle"       String, name of the back button entry if parentMenu is set
        "backButtonColor"       Hex string, color of the back button entry if parentMenu is set
        "displayMethod"         String, either "overlay" or "message", check the end of this text block for explanation
                                "message" displayMethod is intended as a fallback only, it is not really maintained
        "zIndex"                Number, on which zIndex to show this menu on, default is 1000 (mpv pseudo gui seems to use 999)
        "maxTitleLength"        Number, number of characters before a title gets cut off
                                set to 0 to disable (default)
                                ! It is recommended to cut strings manually instead of using this,
                                as SSA tags could be cut as well, which will break the menu. !
        "keybindOverrides"      Object Array, each object represents a key which gets force bound when the menu is on screen, has 3 properties:
                                "key"    - Name of the key, same as input.conf
                                "id"     - A unique identifier for this keybind
                                "action" - Which event to fire when it gets pressed
        "customKeyEvents"       Object Array, similar to keybindOverrides, id gets derived from key/event, each object has 2 properties:
                                "key"    - Name of the key, same as input.conf
                                "event" - Custom event to fire when it gets pressed
                                Use this to add custom hotkeys, like h for help
    All of these have default values.
    Alternatively leave Settings undefined to use all default values.

    Items is an array of objects that can have the following properties:
        "title"                 String, gets displayed, supports special substrings (see below)
        "item"                  String, internal name of item, gets passed to eventHandler
        ["description"]         String, optional description of the item
        ["color"]               Hex string, optionally override default item color for this item only
        ["eventHandler"]        Function, gets called instead of <menu>.eventHandler if it exists
                                Two arguments get passed to this function:
                                "event" - String, see below
                                "menu" - Object, the menu calling this function
    "title" and "item" are required, though "item" can be left empty if the menuitem is only used with its own eventHandler.

    "title" and "description" can include these special substrings:
        @br@ - Insert blank line after item
        (title only) @us1@ - Insert line after item , replace 1 with amount of line characters

    Parent is another instance of UI.Menus.Menu, if provided, a Back button
    will appear as the first item of the Menu.

    Then just assign a function to the instances eventHandler:
    <MenuInstance>.eventHandler = function (event, action) {};

    Possible events:
        "show"      Executed before drawing the menu to the screen
                    "action" is undefined
        "hide"      Executed before removing the menu from the screen
                    "action" is undefined
        "draw"      Executed while the menu gets (re)drawn.
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
    This can be changed with MenuSystem.displayMethod (default is "overlay", change to "message" for old way).
    "message" is unmaintained and is probably broken at this point.

    The definition of UI.Menus.Menu.prototype._constructMenuCache has even more information.
----------------------------------------------------------------*/

/**
 * This implements a menu system similar to VideoPlayerCode's SelectionMenu.js.
 * I decided to create my own implementation instead of using SelectionMenu.js because
 * it was not offering enough customization options.
 * This implementation puts customization first and should be easy to modifiy to suit your needs.
 */
UI.Menus = {};

UI.Menus.commonSeperator = "@br@@us10@";

/** List of registered menus. */
UI.Menus.registeredMenus = [];

/** Create an instance of this class to create a menu.
 * @param {object} settings - Initial settings for this menu. See source code for possible options.
 * @param {Array} items - List of inital items. Each item should be an object, see source code for structure.
 * @param {object|string} parentMenu - If this menu is accessed via another menu, pass the parent menu here to automatically add a back button. You may also pass the menuId of the parent instead.
 * @returns {object} Instance of UI.Menus.Menu
 */
UI.Menus.Menu = function (settings, items, parentMenu) {
    if (settings == undefined) {
        settings = {};
    }

    this.settings = {};

    if (items != undefined) {
        this.items = items;
    } else {
        this.items = [];
    }

    Events.beforeCreateMenu.invoke(settings, items);

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
        this.settings.selectedItemColor = Settings.Data.selectorColor;
        // #66ff66, previously: "#ba0f8d" , "#740A58", "#EB4034"
    }

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

    this.settings.transparencyBackup = this.settings.transparency;

    if (settings.menuId != undefined) {
        this.settings.menuId = settings.menuId;
    } else {
        this.settings.menuId = String(Math.floor(Math.random()*90) + 10);
    }

    if (settings.helpTarget != undefined) {
        this.settings.helpTarget = settings.helpTarget;
    } else {
        this.settings.helpTarget = this.settings.menuId;
    }

    if (settings.fadeIn != undefined) {
        this.settings.fadeIn = settings.fadeIn;
    } else {
        this.settings.fadeIn = Settings.Data.fadeMenus;
    }

    if (settings.fadeOut != undefined) {
        this.settings.fadeOut = settings.fadeOut;
    } else {
        this.settings.fadeOut = Settings.Data.fadeMenus;
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

    if (settings.backButtonTitle != undefined) {
        this.settings.backButtonTitle = settings.backButtonTitle;
    } else {
        this.settings.backButtonTitle = UI.SSA.insertSymbolFA(" ", 26, 35, Utils.commonFontName) + Settings.getLocalizedString("global.back.title") + UI.Menus.commonSeperator;
        /*
        UI.SSA.insertSymbolFA(
            "",
            this.settings.fontSize - 4,
            this.settings.fontSize
        ) +
        UI.SSA.setFont(this.settings.fontName) +
        " Back@br@@br@";*/
    }

    if (settings.backButtonColor != undefined) {
        this.settings.backButtonColor = settings.backButtonColor;
    } else {
        this.settings.backButtonColor = "999999";
    }

    if (settings.displayMethod != undefined) {
        this.settings.displayMethod = settings.displayMethod;
    } else {

        if (Settings.Data.compatibilityMode) {
            this.settings.displayMethod = "message";
        }
        else
        {
            if (Utils.mpvComparableVersion <= 32) {
                Utils.log(
                    "!!! Your mpv version is too old for overlays. You must update mpv to use easympv. !!!","menusystem","error"
                );
                this.settings.displayMethod = "message";
            } else {
                this.settings.displayMethod = "overlay";
            }
        }
    }

    if (settings.fontSize != undefined) {
        this.settings.fontSize = settings.fontSize;
    } else {
        this.settings.fontSize = 35;
        if (this.settings.displayMethod == "message") {
            this.settings.fontSize = Math.floor(this.settings.fontSize / 3);
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
        this.settings.itemPrefix = UI.SSA.insertSymbolFA(
            " ",
            26,
            35,
            this.settings.fontName
        );
    } // "➤ "

    if (settings.zIndex != undefined) {
        this.settings.zIndex = settings.zIndex;
    } else {
        this.settings.zIndex = 1000;
    }

    if (settings.maxTitleLength != undefined) {
        this.settings.maxTitleLength = settings.maxTitleLength;
    } else {
        this.settings.maxTitleLength = 0;
    }

    if (settings.itemSuffix != undefined) {
        this.settings.itemSuffix = settings.itemSuffix;
    } else {
        this.settings.itemSuffix = UI.SSA.insertSymbolFA(
            " ",
            26,
            35
        );
    } // ✓

    if (settings.doubleScrollWorkaround != undefined) {
        this.settings.doubleScrollWorkaround = settings.doubleScrollWorkaround;
    } else {
        if (mpv.getEnv("XDG_CURRENT_DESKTOP") == "GNOME") {
            this.settings.doubleScrollWorkaround = true;
        } else {
            this.settings.doubleScrollWorkaround = false;
        }
    }

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
            {
                key: "HOME",
                id: "menu_key_goto_top",
                action: "top",
            },
            {
                key: "END",
                id: "menu_key_goto_bottom",
                action: "bottom",
            },
            {
                key: "PGUP",
                id: "menu_key_page_up",
                action: "page_up",
            },
            {
                key: "PGDWN",
                id: "menu_key_page_down",
                action: "page_down",
            },
            {
                key: "h",
                id: "menu_key_help",
                action: "help"
            }
        ];
    }
    if (settings.customKeyEvents != undefined) {
        this.settings.customKeyEvents = settings.customKeyEvents;
        for(var i = 0; i < this.settings.customKeyEvents.length; i++)
        {
            ckeItem = this.settings.customKeyEvents[i];
            this.settings.keybindOverrides.push(
                {
                    key:ckeItem.key,
                    id: "menu_key_customevent_" + ckeItem.key + "_" + ckeItem.event,
                    action: ckeItem.event
                }
            );
        }
    } else {
        this.settings.customKeyEvents = undefined;
    }

    if (parentMenu != undefined) {
        this.hasBackButton = true;
        if (typeof(parentMenu) == "object") {
            this.parentMenu = parentMenu.settings.menuId;
        } else this.parentMenu = parentMenu;
        this.items.unshift({
            title: this.settings.backButtonTitle,
            item: "@back@",
            color: this.settings.backButtonColor,
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
    Events.afterCreateMenu.invoke(this);
    UI.Menus.registeredMenus.push(this);
};

/** Convenience method to set associated image.
 * @param {string} name - Name of image
 */
UI.Menus.Menu.prototype.setImage = function (name) {
    this.settings.image = name;
};

/** Convenience method to set menu description.
 * @param {string} text - New description text
 */
UI.Menus.Menu.prototype.setDescription = function (text) {
    this.settings.description = text;
};

/** Convenience method to redraw the menu.
 * This is useful to update values.
 */
UI.Menus.Menu.prototype.redrawMenu = function () {
    this._constructMenuCache();
    this._drawMenu();
};

/** Updates the menus SSA string using current settings.
 * You should probably call redrawMenu instead.
 */
UI.Menus.Menu.prototype._constructMenuCache = function () {
    /*
        Differences between displayMethods

        "message" displayMethod:
        +  Easier to work with internally
        +- Line spacing works by default, but cannot be changed
        -  Automatic scaling is busted
            (there might be some universal offset to fix it)
        -  Sizes do not translate 1:1
            (default font size has to be 35 instead of 11 to look similar to "overlay" displayMethod)
        -  Will fight over display space (basically like Z-fighting)
        -  Deprecated, not maintained

        "overlay" displayMethod:
        +  Automatically scales to window size
        +  More fine-grained font sizings
        +  will always be on top of every mp.osd_message (no Z-fighting)
        -  A pain to program, but the work is already done and works well
        ?  Requires at least mpv v0.33.0

        Both _should_ look the same (they don't), but ensuring that is not easy.

        Documentation for SSA specification
        http://www.tcax.org/docs/ass-specs.htm

        The code below is quite messy, sorry.
    */

    //this.allowDrawImage = false;
    this.itemCount = 0;

    // Start
    this.cachedMenuText = "";
    if (this.settings.displayMethod == "message") {
        var border =
            UI.SSA.setBorderColor(this.settings.borderColor) +
            UI.SSA.setBorder(this.settings.borderSize - 2);

        this.cachedMenuText +=
            UI.SSA.startSequence() +
            UI.SSA.setTransparencyPercentage(this.settings.transparency) +
            border;
        this.cachedMenuText += UI.SSA.setFont(this.settings.fontName);
        this.cachedMenuText += UI.SSA.setSize(this.settings.fontSize);

        // draw event
        this._dispatchEvent("draw");

        // Title
        var title = this.settings.title;
        if (this.settings.image != undefined) {
            if (
                (mpv.getProperty("osd-height") >= 1060 &&
                    mpv.getProperty("osd-height") <= 1100) ||
                (mpv.getProperty("osd-height") >= 1420 &&
                    mpv.getProperty("osd-height") <= 1460) ||
                (mpv.getProperty("osd-height") >= 2140 &&
                    mpv.getProperty("osd-height") <= 2180)
            ) {
                title = "        ";
                this.allowDrawImage = true;
            }
        }
        this.cachedMenuText +=
            UI.SSA.setSize(this.settings.fontSize + 2) +
            UI.SSA.setColor(this.settings.titleColor) +
            UI.SSA.setFont(this.settings.titleFont) +
            title +
            UI.SSA.setSize(this.settings.fontSize) +
            "\n \n";

        // Description
        if (this.settings.description != undefined) {
            this.cachedMenuText +=
                UI.SSA.setSize(this.settings.fontSize - 3) +
                UI.SSA.setColor(this.settings.descriptionColor) +
                this.settings.description.replaceAll("@br@", "\n") +
                UI.SSA.setSize(this.settings.fontSize) +
                "\n \n";
        }

        // Items
        if (this.settings.scrollingEnabled) {
            var drawItems = [];
            var allowedItemCount =
                Math.floor(
                    mpv.getProperty("osd-height") / this.settings.fontSize
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
                color = UI.SSA.setColor(currentItem.color);
            } else {
                color = UI.SSA.setColor(this.settings.itemColor);
            }

            if (currentItem.description != undefined) {
                description =
                    UI.SSA.setSize(this.settings.fontSize - 5) +
                    color +
                    " " +
                    currentItem.description
                        .replaceAll("@br@", "\n")
                        .replaceAll("\n", "\n ") +
                    UI.SSA.setColorWhite() +
                    UI.SSA.setSize(this.settings.fontSize) +
                    "\n";
            }

            if (this.selectedItemIndex - startItem == i) {
                color = UI.SSA.setColor(this.settings.selectedItemColor);
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
                UI.SSA.setSize(this.settings.fontSize) +
                UI.SSA.setColorWhite() +
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
        this.cachedMenuText += UI.SSA.endSequence();
    }

    if (this.settings.displayMethod == "overlay") {
        /*
         Known issues:

             - Description Text Lines might overlap on low window resolutions.
                -> Not really a concern
         */
        var scaleFactor = UI.SSA.findIdealScale();
        var transparency = this.settings.transparency;
        var scale = UI.SSA.setScale(scaleFactor);
        var border =
            UI.SSA.setBorderColor(this.settings.borderColor) +
            UI.SSA.setBorder(this.settings.borderSize);
        var font = UI.SSA.setFont(this.settings.fontName);
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
                UI.SSA.setTransparencyPercentage(transparency) +
                UI.SSA.setSize(fontSize + fontSizeModifier);
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

        // draw event
        this._dispatchEvent("draw");

        // Title
        var title = this.settings.title;
        if (this.settings.image != undefined) {
            if (
                (mpv.getProperty("osd-height") >= 1060 &&
                    mpv.getProperty("osd-height") <= 1100) ||
                (mpv.getProperty("osd-height") >= 1420 &&
                    mpv.getProperty("osd-height") <= 1460) ||
                (mpv.getProperty("osd-height") >= 2140 &&
                    mpv.getProperty("osd-height") <= 2180)
            ) {
                title = "        ";
                this.allowDrawImage = true;
            }
        }

        this.cachedMenuText +=
            lineStart(0, 2) +
            UI.SSA.setColor(this.settings.titleColor) +
            UI.SSA.setFont(this.settings.titleFont) +
            title +
            lineEnd();

        // Description
        var mainDescription = "";
        if (this.settings.description != undefined) {
            var mdLines = this.settings.description.split("@br@");
            mainDescription =
                lineStart(2, descriptionSizeModifier) +
                UI.SSA.setColor(this.settings.descriptionColor) +
                mdLines[0] +
                lineEnd();
            for (var i = 1; i < mdLines.length; i++) {
                mainDescription +=
                    lineStart(0, descriptionSizeModifier) +
                    UI.SSA.setColor(this.settings.descriptionColor) +
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
                    mpv.getProperty("osd-height") / this.settings.fontSize
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
            if (currentItem.hasSeperator != undefined) {
                if (currentItem.hasSeperator) {
                    title += UI.Menus.commonSeperator;
                }
            }
            var postItemActions = [""];
            try {
                if (
                    title.includes("@") &&
                    !(title.match(/@/g) || []).length.isOdd()
                ) {
                    postItemActions = title.match(/\@(.*?)\@/g);
                    title = title.replace(/\@(.*?)\@/g, "");
                }
            }
            catch(e) {
                mpv.printWarn("[UI] Menu with id \"" + this.settings.menuId + "\" contains a broken item at position " + i + " of the \"items\" array, which caused this error: " + e);
            }

            var color = "";
            var description = "";

            if (currentItem.color != undefined) {
                color = UI.SSA.setColor(currentItem.color);
            } else {
                color = UI.SSA.setColor(this.settings.itemColor);
            }

            if (this.selectedItemIndex - startItem == i) {
                color = UI.SSA.setColor(this.settings.selectedItemColor);
                // + UI.SSA.setShadowColor("ffffff") + UI.SSA.setShadow(0.25);
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
                        UI.SSA.setSize(this.settings.fontSize - 9) +
                        postItemActions[q]
                            .replaceAll("@t", "")
                            .replaceAll("@", "");
                    this.cachedMenuText += lineEnd();
                }
            }
        }
    }
};

/** Internal method used to automatically close the menu after a set time period.
 * Do not call this method directly!
 */
UI.Menus.Menu.prototype._handleAutoClose = function () {
    if (this.settings.autoClose <= 0 || this.autoCloseStart <= -1) {
        return;
    }
    if (this.autoCloseStart <= mp.get_time() - this.settings.autoClose) {
        this.hideMenu();
    }
};

/** Convenience method to fire an event.
 * @param {string} name - Name of the event to fire
 */
UI.Menus.Menu.prototype.fireEvent = function (name) {
    this._keyPressHandler(name);
};

/** Convenience method to add the set suffix to the currently selected item.
 */
UI.Menus.Menu.prototype.appendSuffixToCurrentItem = function () {
    this.suffixCacheIndex = this.selectedItemIndex;
    this._constructMenuCache();
    this._drawMenu();
};

/** Convenience method to remove a previously set suffix for the currently selected item.
 */
UI.Menus.Menu.prototype.removeSuffix = function () {
    this.suffixCacheIndex = -1;
    //this._constructMenuCache();
    //this._drawMenu();
};

/** Convenience method to return currently selected item.
 * @returns {object} - Object of currently selected item
 */
UI.Menus.Menu.prototype.getSelectedItem = function () {
    return this.items[this.selectedItemIndex];
};

/** Internal method to claim keybinds for menu movement. */
UI.Menus.Menu.prototype._overrideKeybinds = function () {
    var tempFunction = function (x, action, key) {
        return function () {
            x._keyPressHandler(action, key);
        };
    };

    for (var i = 0; i < this.settings.keybindOverrides.length; i++) {
        var currentKey = this.settings.keybindOverrides[i];

        mp.add_forced_key_binding(
            currentKey.key,
            currentKey.id + "_menu_id_" + this.settings.menuId,
            tempFunction(this, currentKey.action, currentKey.key),
            { repeatable: true }
        );
    }
};

/** Internal method to return keybinds for menu movement. */
UI.Menus.Menu.prototype._revertKeybinds = function () {
    for (var i = 0; i < this.settings.keybindOverrides.length; i++) {
        var currentKey = this.settings.keybindOverrides[i];

        mp.remove_key_binding(currentKey.id  + "_menu_id_" + this.settings.menuId);
    }
};

/** Whether the double-scroll workaround is enabled. */
UI.Menus.Menu.prototype.scrollWorkaroundState = false;

/** Internal method to handle keypresses. */
UI.Menus.Menu.prototype._keyPressHandler = function (action, key) {
    if (this.settings.doubleScrollWorkaround)
    {
        if (key == "WHEEL_UP" || key == "WHEEL_DOWN")
        {
            if (this.scrollWorkaroundState)
            {
                this.scrollWorkaroundState = false;
                return;
            }
            else { this.scrollWorkaroundState = true; }
        }
    }
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
        } else if (action == "top") {
            this.selectedItemIndex = 0;
            this._constructMenuCache();
            this._drawMenu();
            this.eventLocked = false;
        } else if (action == "bottom") {
            this.selectedItemIndex = this.items.length - 1;
            this._constructMenuCache();
            this._drawMenu();
            this.eventLocked = false;
        } else if (action == "page_up") {
            var temp = this.selectedItemIndex - 10;
            if (temp < 0) {
                temp = 0;
            }
            this.selectedItemIndex = temp;
            this._constructMenuCache();
            this._drawMenu();
            this.eventLocked = false;
        } else if (action == "page_down") {
            var temp = this.selectedItemIndex + 10;
            if (temp > (this.items.length - 1)) {
                temp = this.items.length - 1;
            }
            this.selectedItemIndex = temp;
            this._constructMenuCache();
            this._drawMenu();
            this.eventLocked = false;
        } else {
            var item = this.items[this.selectedItemIndex];
            if (item.item == "@back@" && action == "enter" && this.parentMenu != undefined) {
                this.toggleMenu();
                var menu = UI.Menus.getMenuById(this.parentMenu);
                if (menu != undefined) {
                    menu.toggleMenu();
                } else this.hideMenu();
                //this.parentMenu.toggleMenu();
                this.eventLocked = false;
            } else {
                this._dispatchEvent(action, item);
                this.eventLocked = false;
            }
        }
    }
};

/** Internal method to intialize the overlay the menu will use. */
UI.Menus.Menu.prototype._initOSD = function () {
    if (this.settings.displayMethod == "overlay") {
        if (this.OSD == undefined) {
            this.OSD = mp.create_osd_overlay("ass-events");
            // OSD is allowed entire window space
            //this.OSD.res_y = mpv.getProperty("osd-height");
            //this.OSD.res_x = mpv.getProperty("osd-width");
            this.OSD.res_y = mpv.getProperty("osd-height");
            this.OSD.res_x = mpv.getProperty("osd-width");
            this.OSD.z = this.settings.zIndex;
        }
    }
};

/** Internal method to draw the cached menu text to the screen.
 * To redraw the menu, call redrawMenu instead.
*/
UI.Menus.Menu.prototype._drawMenu = function () {
    if (this.settings.displayMethod == "message") {
        mp.osd_message(this.cachedMenuText, 1000);
        // seem to be the same
        //mpv.commandv("show-text",this.cachedMenuText,1000)
    }

    if (this.settings.displayMethod == "overlay") {
        this._initOSD();
        this.OSD.data = this.cachedMenuText;
        this.OSD.update();
    }
};

/** Internal method to start the timer for automatically hiding the menu. */
UI.Menus.Menu.prototype._startTimer = function () {
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

/** Internal method to stop the timer for automatically hiding the menu.*/
UI.Menus.Menu.prototype._stopTimer = function () {
    if (this.menuInterval != undefined) {
        clearInterval(this.menuInterval);
        this.menuInterval = undefined;
    }
};

/** Internal method to fade the menu in.*/
UI.Menus.Menu.prototype._fadeIn = function () {
    var x = this;
    this.settings.transparency = 100;
    this.fadeInInterval = setInterval(function () {
        if (x.settings.transparency != x.settings.transparencyBackup) {
            x.settings.transparency = Number(x.settings.transparency) - 5;
            x._constructMenuCache();
            x._drawMenu();
        } else {
            clearInterval(x.fadeInInterval);
        }
    }, 5);
    this.fadeInInterval.start;
};

/** Internal method to fade the menu out.*/
UI.Menus.Menu.prototype._fadeOut = function () {
    var x = this;
    this.fadeOutInterval = setInterval(function () {
        if (x.settings.transparency != 100) {
            x.settings.transparency = Number(x.settings.transparency) + 5;
            x._constructMenuCache();
            x._drawMenu();
        } else {
            mpv.commandv(
                "osd-overlay",
                x.OSD.id,
                "none",
                "",
                0,
                0,
                0,
                "no",
                "no"
            );
            x._revertKeybinds();
            x.isMenuVisible = false;
            x.removeSuffix();
            x.OSD = undefined;
            x.settings.transparency = x.settings.transparencyBackup;
            clearInterval(x.fadeOutInterval);
            UI.Image.hide(x.settings.image);
        }
    }, 5);
    this.fadeOutInterval.start;
};

/** Convenience method to get an item by its id.
 * @deprecated Use getItemById() instead!
 * @param {string} id - ID of the item
 * @returns {object} desired item, if found (otherwise undefined)
*/
UI.Menus.Menu.prototype.getItemByName = function (id) {
    return this.getItemById(id);
}

/** Convenience method to get an item by its ID.
 * @param {string} id - ID of the item
 * @returns {object} desired item, if found (otherwise undefined)
*/
UI.Menus.Menu.prototype.getItemById = function (id) {
    for(var i = 0; i < this.items.length; i++)
    {
        if (this.items[i].item == id)
        return this.items[i];
    }
    return undefined;
}

/** Convenience method to get an item by its ID.
 * @param {string} id - ID of the item
 * @param {object} menu - Target menu
 * @returns {object} desired item, if found (otherwise undefined)
*/
UI.Menus.Menu.getItemByIdStatic = function (id, menu) {
    for(var i = 0; i < menu.items.length; i++)
    {
        if (menu.items[i].item == id)
        return menu.items[i];
    }
    return undefined;
}

/** Convenience method to get an item by its ID.
 * @param {string} id - ID of the item
 * @param {array} items - Target items array
 * @returns {object} desired item, if found (otherwise undefined)
*/
UI.Menus.Menu.getItemByIdStaticDirect = function (id, items) {
    for(var i = 0; i < items.length; i++)
    {
        if (items[i].item == id)
        return items[i];
    }
    return undefined;
}

/** Method to show the menu on screen.
 * This will call all the required prerequisite functions.
*/
UI.Menus.Menu.prototype.showMenu = function () {
    if (!this.isMenuVisible) {
        if (Events.beforeShowMenu.invoke(this)) return;
        this.allowDrawImage = false;
        this.autoCloseStart = mp.get_time();
        this._overrideKeybinds();
        this.selectedItemIndex = 0;
        this.isMenuVisible = true;
        this._dispatchEvent("show");
        if(this.settings.fadeIn)
        {
            // workaround for allowDrawImage race condition
            this.settings.transparency = 100;
            this._constructMenuCache();

            this._fadeIn();
        }
        else
        {
            this._constructMenuCache();
            this._drawMenu();
        }
        this._startTimer();
        if (this.allowDrawImage) {
            UI.Image.show(this.settings.image, 25, 25);
        }
        Events.afterShowMenu.invoke(this);
    }
};

/** Method to hide the menu on screen.
 * This will call all the required prerequisite functions.
*/
UI.Menus.Menu.prototype.hideMenu = function () {
    this._dispatchEvent("hide");
    if (Events.beforeHideMenu.invoke(this)) return;
    if (this.settings.displayMethod == "message") {
        mp.osd_message("");
        if (this.isMenuVisible) {
            this._stopTimer();
            this._revertKeybinds();
            this.isMenuVisible = false;
            this.removeSuffix();
            //if (this.allowDrawImage) {
            //    OSD.hide(this.settings.image);
            //}
        }
        mp.osd_message("");
        UI.Image.hide(this.settings.image);
    }
    if (this.settings.displayMethod == "overlay") {
        if (this.isMenuVisible) {
            this._stopTimer();
            if (this.settings.fadeOut)
            {
                this._fadeOut();
            }
            else
            {
                mpv.commandv(
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
                this.OSD = undefined;
                UI.Image.hide(this.settings.image);
            }
        }
    }
    Events.afterHideMenu.invoke(this);
};

/** Convenience method to toggle the menu on screen.*/
UI.Menus.Menu.prototype.toggleMenu = function () {
    if (!this.isMenuVisible) {
        this.showMenu();
    } else {
        this.hideMenu();
    }
};

/** Internal method to dispatch an event.
 * @param {string} event - Event to be dispatched
 * @param {object} item - Selected item
*/
UI.Menus.Menu.prototype._dispatchEvent = function (event, item) {
    if (item == undefined)
    {
       item = { title: undefined, item: undefined, eventHandler: undefined };
    }

    if (this.settings.customKeyEvents != undefined)
    {
        for (var i = 0; i < this.settings.customKeyEvents.length; i++)
        {
            if (event == this.settings.customKeyEvents[i].event)
            {
                item.eventHandler = undefined;
                break;
            }
        }
    }

    if (item.eventHandler != undefined)
    {
        item.eventHandler(event, this)
        return;
    }

    if (event == "help") {
        OS.openFile("https://github.com/JongWasTaken/easympv/wiki/Help#" + this.settings.helpTarget, true);
    }

    this.eventHandler(event, item.item);
}

/** Appends an item to the menu.
 * @param {object} item - New item
*/
UI.Menus.Menu.prototype.appendItem = function (item) {
    if (item == undefined)
    {
       item = { title: undefined, item: undefined, eventHandler: undefined };
    }

    this.items.push(item);
}

/** Inserts an item after another item in this menu.
 * @param {string} id - Item ID to append after
 * @param {object} item - New item
*/
UI.Menus.Menu.prototype.insertAfterItem = function (id, item) {
    if (item == undefined)
    {
       item = { title: undefined, item: undefined, eventHandler: undefined };
    }

    for(var i = 0; i < this.items.length; i++)
    {
        if (this.items[i].item == id) break;
    }
    if (i == this.items.length) return;

    this.items.splice(i+1, 0, item);
}

/** This method should be overwritten with your own implementation.
 * @param {string} event - Name of the event that got dispatched
 * @param {string} action - Name of the action that dispatched the event
*/
UI.Menus.Menu.prototype.eventHandler = function (event, action) {
};

/** If enabled, the menu key will not work to close the currently active menu. */
UI.Menus.menuKeyDisabled = false;

/** Inserts an item after another item in a menu.
 * @param {string} id - Item ID to append after
 * @param {object} item - New item
 * @param {object} menu - Target menu
*/
UI.Menus.Menu.insertAfterItemStatic = function (id, item, menu) {
    UI.Menus.Menu.insertAfterItemStaticDirect(id, item, menu.items);
    /*
    if (item == undefined)
    {
       item = { title: undefined, item: undefined, eventHandler: undefined };
    }

    for(var i = 0; i < menu.items.length; i++)
    {
        if (menu.items[i].item == id) break;
    }
    if (i == menu.items.length) return;

    menu.items.splice(i+1, 0, item);
    */
}

/** Inserts an item after another item directly.
 * @param {string} id - Item ID to append after
 * @param {object} item - New item
 * @param {array} items - Items array of a menu
*/
UI.Menus.Menu.insertAfterItemStaticDirect = function (id, item, items) {
    if (item == undefined)
    {
       item = { title: undefined, item: undefined, eventHandler: undefined };
    }

    for(var i = 0; i < items.length; i++)
    {
        if (items[i].item == id) break;
    }
    if (i == items.length) return;

    items.splice(i + 1, 0, item);
}

/** Convenience method to get the currently displayed menu.
 * @returns {object} Displayed menu, otherwise undefined
 */
UI.Menus.getDisplayedMenu = function () {
    var cMenu = undefined;
    for (var i = 0; i < UI.Menus.registeredMenus.length; i++) {
        if (UI.Menus.registeredMenus[i].isMenuVisible) {
            cMenu = UI.Menus.registeredMenus[i];
            break;
        }
    }
    return cMenu;
};

/** Convenience method to switch out the currently displayed menu with a new one.
 * @param {object} newMenu - Menu to be displayed
 * @param {object} currentMenu - Current menu. Will call getDisplayedMenu if undefined
 */
UI.Menus.switchCurrentMenu = function (newMenu, currentMenu) {
    if (currentMenu == undefined)
    {
        currentMenu = UI.Menus.getDisplayedMenu();
    }

    currentMenu.hideMenu();
    if (!newMenu.isMenuVisible) {
        newMenu.showMenu();
    } else {
        newMenu.hideMenu();
    }
};

/** Convenience method to get a menu by its ID. Returns undefined if no menu with the given ID exists.
 * @param {string} name - id of the menu
 */
UI.Menus.getMenuById = function(name) {
    var menu = undefined;
    for (var i = 0; i < UI.Menus.registeredMenus.length; i++) {
        if (UI.Menus.registeredMenus[i].settings.menuId == name)
        {
            menu = UI.Menus.registeredMenus[i];
            break;
        }
    }
    return menu;
}

/** Convenience method to get a menu by a substring of its ID. Returns undefined if no menu with the given ID exists.
 * If possible, use `getMenuById()` instead!
 * @param {string} name - substring of an id of the menu
 */
UI.Menus.findMenuById = function(name) {
    var menu = undefined;
    for (var i = 0; i < UI.Menus.registeredMenus.length; i++) {
        if (UI.Menus.registeredMenus[i].settings.menuId.includes(name))
        {
            menu = UI.Menus.registeredMenus[i];
            break;
        }
    }
    mpv.printWarn("Found menu id for substring \""+ name +"\": " + menu.settings.menuId);
    return menu;
}



UI.Alerts = {};
UI.Alerts.Urgencies = {};
UI.Alerts.Urgencies.Normal = {"icon": "", "color": "FFFFFF"};
UI.Alerts.Urgencies.Info = UI.Alerts.Urgencies.Normal;
UI.Alerts.Urgencies.Warning = {"icon": "", "color": "FFC12B"};
UI.Alerts.Urgencies.Error = {"icon": "", "color": "FF612B"};

UI.Alerts.OSD = undefined;

UI.Alerts.Interval = 1000;
UI.Alerts.Buffer = [];
UI.Alerts.initialized = false;

/**
 * Initializes the new alerts system. Used internally. Called after `Events.lateInit`.
 */
UI.Alerts._init = function () {
    if (UI.Alerts.initialized) return;
    UI.Alerts.OSD = mp.create_osd_overlay("ass-events");
    UI.Alerts.OSD.res_y = mpv.getProperty("osd-height");
    UI.Alerts.OSD.res_x = mpv.getProperty("osd-width");
    UI.Alerts.OSD.z = 1;

    UI.Alerts.OSD.data = "";
    UI.Alerts.OSD.update();
    UI.Alerts._loop();
    UI.Alerts.initialized = true;
}

/**
 * Shows an alert/notification to the user.
 *   
 * @param {string} content - Alert content
 * @param {string} category - From where this alert originates, e.g. an extension name, module name, etc.
 * @param {object} urgency - One of the pseudo-enumerators in `UI.Alerts.Urgencies` (defaults to `Normal`).  
 * Will change color and icon of this alert.  
 * You may also pass your own, by creating an object with two keys: `{"icon": "<FONT_AWESOME_ICON_GOES_HERE>", "color": "FFFFFF"}`.
 */
UI.Alerts.push = function(content, category, urgency)
{
    UI.Alerts.Interval = 100;

    var notification = {};
    notification.content = content;

    if (urgency == undefined || typeof(urgency) == "string") {
        urgency = UI.Alerts.Urgencies.Normal;
    }
    notification.urgency = urgency;
    if (category == undefined || category == "") category = "easympv";
    notification.category = category;
    notification.startTime = mp.get_time();
    notification.fancyTime = Utils.getCurrentTime();

    UI.Alerts.Buffer.push(notification);


    //if (!UI.Alerts.initialized) {
    //    UI.Alerts._init();
    //}
}

/**
 * @deprecated
 * This method exists solely for compatibility reasons.  
 * Please use `UI.Alerts.push();` instead!  
 *   
 * Before the alerts rewrite you would show an alert like this: `UI.Alerts.show(<level>, <content>);`.  
 * The new alerts system is more verbose and requires more information, for which this method provides default values.
 * @param {undefined} _ignored - the new alerts system does not use this value
 * @param {string} content - Alert content
 */
UI.Alerts.show = function (_ignored, content) {
    if (false) {
        return UI.oldAlerts._show(line.replaceAll("@br@", " "));
    }
    mpv.printWarn("Received legacy alert: " + content);
    mpv.printWarn("Please use UI.Alerts.push() directly!");
    return UI.Alerts.push(content.replaceAll("@br@", " "), undefined, UI.Alerts.Urgencies.Normal);
};

UI.Alerts._loop = function () {
    UI.Alerts.OSD.res_y = mpv.getProperty("osd-height");
    UI.Alerts.OSD.res_x = mpv.getProperty("osd-width");

    for (var i = 0; i < UI.Alerts.Buffer.length; i++) {
        if (UI.Alerts.Buffer[i].startTime + 3 < mp.get_time()) {
            UI.Alerts.Buffer.splice(i, 1);
        }
    }

    if (UI.Alerts.Buffer.length == 0) {
        UI.Alerts.OSD.data = "";
        UI.Alerts.Interval = 1000;
        //UI.Alerts.OSD = undefined;
        //UI.Alerts.initialized = false;
        //return;
    } else {
        UI.Alerts.OSD.data = UI.Alerts._build();
        UI.Alerts.Interval = 100;
    }

    UI.Alerts.OSD.update();
    setTimeout(UI.Alerts._loop, UI.Alerts.Interval);
}

UI.Alerts._build = function () {
    var content = "";

    var transparency = 0;
    var scaleFactor = UI.SSA.findIdealScale();
    var scale = UI.SSA.setScale(scaleFactor);
    var border = UI.SSA.setBorder(1);
    var font = UI.SSA.setFont(Utils.commonFontName);
    var fontSize = 32;
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
            UI.SSA.setAllignment(5) +
            UI.SSA.setPositionAbsolutePercentage(50, 0) +
            scale + findLinePosition(positionType, customPositionModifier) +
            border + font +
            UI.SSA.setTransparencyPercentage(transparency) +
            UI.SSA.setSize(fontSize + fontSizeModifier);
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

    for (var i = 0; i < UI.Alerts.Buffer.length; i++) {
        content += lineStart(2, -10) +
            UI.SSA.setColor(UI.Alerts.Buffer[i].urgency.color) + UI.SSA.insertSymbolFA(UI.Alerts.Buffer[i].urgency.icon, fontSize-16, fontSize-10) +
            UI.SSA.setItalic(1) + " in " + UI.SSA.setItalic(0) + UI.SSA.setBold(1) + UI.Alerts.Buffer[i].category + UI.SSA.setBold(0) + UI.SSA.setItalic(1) +
            " at " + UI.SSA.setItalic(0) +
            UI.SSA.setBold(1) + UI.Alerts.Buffer[i].fancyTime + UI.SSA.setBold(0) +
            ":" +
            lineEnd();
        content += lineStart(0, 0) + UI.Alerts.Buffer[i].content + lineEnd();
    }

    return content;
}

UI.oldAlerts = {};

UI.oldAlerts.OSD = undefined;
UI.oldAlerts.Timer = undefined;
UI.oldAlerts.startTime = undefined;
UI.oldAlerts.content = undefined;
UI.oldAlerts.isVisible = false;

UI.oldAlerts._startTimer = function() {
    UI.oldAlerts.Timer = setInterval(function () {
        if (3 <= 0 || UI.oldAlerts.startTime <= -1) {
            return;
        }
        if (UI.oldAlerts.startTime <= mp.get_time() - 3) {
            UI.oldAlerts._stopTimer();
            UI.oldAlerts._hide();
        }
    }, 1000);
};

UI.oldAlerts._stopTimer = function () {
    if (UI.oldAlerts.Timer != undefined) {
        clearInterval(UI.oldAlerts.Timer);
        UI.oldAlerts.Timer = undefined;
    }
};

UI.oldAlerts._assembleContent = function (xpos,ypos) {
    return UI.SSA.setPositionAbsolutePercentage(xpos,ypos) +
    UI.SSA.setBorder(1) +
    UI.SSA.setSize("36") +
    UI.SSA.setFont(Utils.commonFontName) + UI.oldAlerts.content;
}

UI.oldAlerts._show = function(content)
{
    UI.oldAlerts.content = content;
    UI.oldAlerts.startTime = mp.get_time();

    if (!UI.oldAlerts.isVisible) {
        UI.oldAlerts.isVisible = true;
        if (UI.oldAlerts.OSD == undefined) {
            UI.oldAlerts.OSD = mp.create_osd_overlay("ass-events");
            UI.oldAlerts.OSD.res_y = mpv.getProperty("osd-height");
            UI.oldAlerts.OSD.res_x = mpv.getProperty("osd-width");
            UI.oldAlerts.OSD.z = 1;
        }

        if(Settings.Data.scrollAlerts)
        {
            var target = 110;
            var pos = -50;
            var interval = setInterval(function () {
                if (pos < target)
                {
                    pos = pos + 0.2;
                    UI.oldAlerts.OSD.data = UI.oldAlerts._assembleContent(pos,1);
                    UI.oldAlerts.OSD.update();
                }
                else
                {
                    clearInterval(interval);
                    UI.oldAlerts._hide();
                }
            }, 10);
        }
        else
        {
            UI.oldAlerts.OSD.data = UI.oldAlerts._assembleContent(33,1);
            UI.oldAlerts.OSD.update();
            UI.oldAlerts._startTimer();
        }
    }
}

UI.oldAlerts._hide = function()
{
    UI.oldAlerts.isVisible = false;
    UI.oldAlerts.startTime = undefined;
    if (UI.oldAlerts.OSD != undefined) {
        mpv.commandv(
            "osd-overlay",
            UI.oldAlerts.OSD.id,
            "none",
            "",
            0,
            0,
            0,
            "no",
            "no"
        );
        UI.oldAlerts.OSD = undefined;
    }
}


/*----------------------------------------------------------------
CLASS: UI.Input
DESCRIPTION:
    This static class is used to capture user inputs.
    This is currently used in 3 different parts of the plugin,
    which in my opinion is not enough the warrant making this
    non-static.
USAGE:
    Call UI.Input.show(callback,prefix_description), where:
    callback should be function(success, result):
        success is a boolean, indicates whether input has been sent
        result is the actual input string
    prefix_description -> the text in front of the input field
        example: "Command: "
    Simple stuff.
----------------------------------------------------------------*/

UI.Input = {};
UI.Input.Memory = [];
UI.Input.MemoryPosition = 0;
UI.Input.Callback = undefined;
UI.Input.isShown = false;
UI.Input.Buffer = "";
UI.Input.Position = 0;
UI.Input.OSD = undefined;
UI.Input.TextSettings = UI.SSA.setBorder(2) + UI.SSA.setFont("Roboto");
UI.Input.InputPrefix = "";
UI.Input.Prefix = "";

UI.Input.keybindOverrides = [
    { key: "ESC", id: "empv_input_esc" },

    { key: "KP_ENTER", id: "empv_input_kp_enter" },
    { key: "ENTER", id: "empv_input_enter" },
    { key: "SPACE", id: "empv_input_space" },

    { key: "INS", id: "empv_input_insert" },
    { key: "DEL", id: "empv_input_delete" },

    { key: "~", id: "empv_input_tilde" },
    { key: "`", id: "empv_input_backtick" },
    { key: "1", id: "empv_input_one" },
    { key: "!", id: "empv_input_exclamation" },
    { key: "2", id: "empv_input_two" },
    { key: "@", id: "empv_input_at" },
    { key: "3", id: "empv_input_three" },
    { key: "SHARP", id: "empv_input_hash" },
    { key: "4", id: "empv_input_four" },
    { key: "$", id: "empv_input_dollar" },
    { key: "5", id: "empv_input_five" },
    { key: "%", id: "empv_input_percent" },
    { key: "6", id: "empv_input_six" },
    { key: "^", id: "empv_input_caret" },
    { key: "7", id: "empv_input_seven" },
    { key: "&", id: "empv_input_ampersand" },
    { key: "8", id: "empv_input_eight" },
    { key: "*", id: "empv_input_star" },
    { key: "9", id: "empv_input_nine" },
    { key: "(", id: "empv_input_bracket_opened" },
    { key: "0", id: "empv_input_zero" },
    { key: ")", id: "empv_input_bracket_closed" },
    { key: "-", id: "empv_input_minus" },
    { key: "_", id: "empv_input_underscore" },
    { key: "=", id: "empv_input_equals" },
    { key: "+", id: "empv_input_plus" },
    { key: "BS", id: "empv_input_bs" },

    { key: "q", id: "empv_input_q" },
    { key: "w", id: "empv_input_w" },
    { key: "e", id: "empv_input_e" },
    { key: "r", id: "empv_input_r" },
    { key: "t", id: "empv_input_t" },
    { key: "y", id: "empv_input_y" },
    { key: "u", id: "empv_input_u" },
    { key: "i", id: "empv_input_i" },
    { key: "o", id: "empv_input_o" },
    { key: "p", id: "empv_input_p" },
    { key: "a", id: "empv_input_a" },
    { key: "s", id: "empv_input_s" },
    { key: "d", id: "empv_input_d" },
    { key: "f", id: "empv_input_f" },
    { key: "g", id: "empv_input_g" },
    { key: "h", id: "empv_input_h" },
    { key: "j", id: "empv_input_j" },
    { key: "k", id: "empv_input_k" },
    { key: "l", id: "empv_input_l" },
    { key: "z", id: "empv_input_z" },
    { key: "x", id: "empv_input_x" },
    { key: "c", id: "empv_input_c" },
    { key: "v", id: "empv_input_v" },
    { key: "b", id: "empv_input_b" },
    { key: "n", id: "empv_input_n" },
    { key: "m", id: "empv_input_m" },

    { key: "Q", id: "empv_input_q_uppercase" },
    { key: "W", id: "empv_input_w_uppercase" },
    { key: "E", id: "empv_input_e_uppercase" },
    { key: "R", id: "empv_input_r_uppercase" },
    { key: "T", id: "empv_input_t_uppercase" },
    { key: "Y", id: "empv_input_y_uppercase" },
    { key: "U", id: "empv_input_u_uppercase" },
    { key: "I", id: "empv_input_i_uppercase" },
    { key: "O", id: "empv_input_o_uppercase" },
    { key: "P", id: "empv_input_p_uppercase" },
    { key: "A", id: "empv_input_a_uppercase" },
    { key: "S", id: "empv_input_s_uppercase" },
    { key: "D", id: "empv_input_d_uppercase" },
    { key: "F", id: "empv_input_f_uppercase" },
    { key: "G", id: "empv_input_g_uppercase" },
    { key: "H", id: "empv_input_h_uppercase" },
    { key: "J", id: "empv_input_j_uppercase" },
    { key: "K", id: "empv_input_k_uppercase" },
    { key: "L", id: "empv_input_l_uppercase" },
    { key: "Z", id: "empv_input_z_uppercase" },
    { key: "X", id: "empv_input_x_uppercase" },
    { key: "C", id: "empv_input_c_uppercase" },
    { key: "V", id: "empv_input_v_uppercase" },
    { key: "B", id: "empv_input_b_uppercase" },
    { key: "N", id: "empv_input_n_uppercase" },
    { key: "M", id: "empv_input_m_uppercase" },

    { key: "{", id: "empv_input_curly_bracket_opened" },
    { key: "}", id: "empv_input_curly_bracket_closed" },
    { key: "[", id: "empv_input_square_bracket_opened" },
    { key: "]", id: "empv_input_square_bracket_closed" },
    { key: "\\", id: "empv_input_backslash" },
    { key: "|", id: "empv_input_pipe" },
    { key: ";", id: "empv_input_semicolon" },
    { key: ":", id: "empv_input_colon" },
    { key: "'", id: "empv_input_apostrophe" },
    { key: "\"", id: "empv_input_quotation" },
    { key: ",", id: "empv_input_comma" },
    { key: "<", id: "empv_input_lessthan" },
    { key: ".", id: "empv_input_dot" },
    { key: ">", id: "empv_input_greaterthan" },
    { key: "/", id: "empv_input_slash" },
    { key: "?", id: "empv_input_question" },

    { key: "UP", id: "empv_input_up" },
    { key: "DOWN", id: "empv_input_down" },
    { key: "LEFT", id: "empv_input_left" },
    { key: "RIGHT", id: "empv_input_right" },

    { key: "MBTN_LEFT", id: "empv_input_mbtn_left" },
    { key: "MBTN_RIGHT", id: "empv_input_mbtn_right" },
    { key: "MBTN_MID", id: "empv_input_mbtn_mid" },
    { key: "WHEEL_UP", id: "empv_input_mbtn_up" },
    { key: "WHEEL_DOWN", id: "empv_input_mbtn_down" },

    { key: "Ctrl+a", id: "empv_input_ctrl_a" },
    { key: "Ctrl+v", id: "empv_input_ctrl_v" },
    { key: "Ctrl+c", id: "empv_input_ctrl_c" },
];

UI.Input.returnBufferInserted = function(insert)
{
    return UI.Input.Buffer.slice(0,UI.Input.Buffer.length-UI.Input.Position) + insert + UI.Input.Buffer.slice(UI.Input.Buffer.length-UI.Input.Position);
}

UI.Input.handleKeyPress = function (key)
{
    if(key == "Ctrl+v" || key == "INS" || key == "MBTN_MID") {
        UI.Input.Buffer = UI.Input.returnBufferInserted(OS.getClipboard().replace(/\{/g,'\{').replace(/\}/g,'\}'));
    }
    else if (key == "Ctrl+a")
    {
        UI.Input.Buffer = "";
        UI.Input.Position = 0;
    }
    else if (key == "BS" || key == "DEL")
    {
        var partA = UI.Input.Buffer.slice(0,UI.Input.Buffer.length-UI.Input.Position);
        UI.Input.Buffer = partA.substring(0,partA.length-1) + UI.Input.Buffer.slice(UI.Input.Buffer.length-UI.Input.Position);

    }
    else if (key == "SPACE")
    {
        UI.Input.Buffer = UI.Input.returnBufferInserted(" ");
    }
    else if (key == "ESC" || key == "MBTN_LEFT" || key == "Ctrl+c")
    {
        UI.Input.hide(false);
        return;
    }
    else if (key == "ENTER" || key == "KP_ENTER" || key == "MBTN_RIGHT")
    {
        UI.Input.hide(true);
        return;
    }
    else if (key == "SHARP")
    {
        UI.Input.Buffer = UI.Input.returnBufferInserted("#");
    }
    else if (key == "UP")
    {
        if(UI.Input.Memory[UI.Input.MemoryPosition] != undefined)
        {
            UI.Input.Position = 0;
            UI.Input.Buffer = UI.Input.Memory[UI.Input.MemoryPosition];
            UI.Input.MemoryPosition = UI.Input.MemoryPosition + 1;
        }
    }
    else if (key == "DOWN")
    {
        if(UI.Input.Memory[UI.Input.MemoryPosition-1] != undefined)
        {
            UI.Input.Position = 0;
            UI.Input.Buffer = UI.Input.Memory[UI.Input.MemoryPosition-1];
            UI.Input.MemoryPosition = UI.Input.MemoryPosition - 1;
        }
    }
    else if (key == "LEFT")
    {
        if (UI.Input.Position < UI.Input.Buffer.length)
        {
            UI.Input.Position = UI.Input.Position + 1;
        }
    }
    else if (key == "RIGHT")
    {
        if (UI.Input.Position > 0)
        {
            UI.Input.Position = UI.Input.Position - 1;
        }
    }
    else if (key == "WHEEL_UP" || key == "WHEEL_DOWN")
    {}
    else
    {
        UI.Input.Buffer = UI.Input.returnBufferInserted(key);
    }
    UI.Input.OSD.data = UI.Input.Prefix + UI.Input.returnBufferInserted("|");
    UI.Input.OSD.update();
}

UI.Input.show = function (callback, prefix) {
    if(callback == undefined)
    {
        return;
    }

    mpv.commandv("set","pause","yes");

    if(prefix != undefined)
    {
        UI.Input.InputPrefix = prefix;
    }
    else
    {
        UI.Input.InputPrefix = "Input: ";
    }

    UI.Input.InputPrefix = UI.SSA.setBold(true) + UI.Input.InputPrefix + UI.Input.TextSettings + UI.SSA.setBold(false);

    UI.Input.Prefix =
        UI.SSA.setSize("24") + UI.Input.TextSettings +
        Settings.getLocalizedString("input.first") +
        UI.SSA.setSize("24") + UI.Input.TextSettings +
        Settings.getLocalizedString("input.second") +
        UI.SSA.setSize("32") + UI.Input.TextSettings;

    if(UI.Input.isShown)
    {
        return;
    }
    UI.Input.isShown = true;

    UI.Input.Buffer = "";
    UI.Input.Position = 0;
    UI.Input.MemoryPosition = 0;

    var tempFunction = function (x, key) {
        return function () {
            x.handleKeyPress(key);
        };
    };

    for (var i = 0; i < UI.Input.keybindOverrides.length; i++) {
        var currentKey = UI.Input.keybindOverrides[i];
        mp.add_forced_key_binding(
            currentKey.key,
            currentKey.id,
            tempFunction(this,currentKey.key),
            { repeatable: true }
        );
    }

    UI.Input.OSD = mp.create_osd_overlay("ass-events");
    UI.Input.OSD.res_y = mpv.getProperty("osd-height");
    UI.Input.OSD.res_x = mpv.getProperty("osd-width");
    UI.Input.OSD.z = 1000;

    UI.Input.Prefix += UI.Input.InputPrefix;
    UI.Input.OSD.data = UI.Input.Prefix + "|";
    UI.Input.OSD.update();
    UI.Input.Callback = callback;
}

UI.Input.hide = function (success) {
    if(!UI.Input.isShown)
    {
        return;
    }
    UI.Input.isShown = false;

    for (var i = 0; i < UI.Input.keybindOverrides.length; i++) {
        var currentKey = UI.Input.keybindOverrides[i];
        mp.remove_key_binding(currentKey.id);
    }

    mpv.commandv(
        "osd-overlay",
        UI.Input.OSD.id,
        "none",
        "",
        0,
        0,
        0,
        "no",
        "no"
    );
    UI.Input.OSD = undefined;
    if(success)
    {
        UI.Input.Memory.unshift(UI.Input.Buffer);
    }
    UI.Input.Callback(success,UI.Input.Buffer.slice().replace(/\\/g,''));
    UI.Input.Buffer = "";
    UI.Input.Position = 0;
    UI.Input.MemoryPosition = 0;

    UI.Input.InputPrefix = "";
    UI.Input.Prefix = "";
}

UI.Input.OSDLog = {};
UI.Input.OSDLog.Buffer = [];
UI.Input.OSDLog.show = function () {

    UI.Input.OSDLog.OSD = mp.create_osd_overlay("ass-events");
    UI.Input.OSDLog.OSD.res_y = mpv.getProperty("osd-height");
    UI.Input.OSDLog.OSD.res_x = mpv.getProperty("osd-width"); // TODO: 101?
    UI.Input.OSDLog.OSD.z = 1;

    UI.Input.OSDLog.Timer = setInterval(function () {
        var data = "";
        var temp = UI.Input.OSDLog.Buffer.slice(-50); // only show last 50 entries, might reduce this further for perf

        for (var i = 0; i < temp.length; i++)
        {
            data +=  UI.SSA.setFont("Roboto") + UI.SSA.setTransparency("3f") + temp[i].color + UI.SSA.setSize(16) + UI.SSA.setBorder(0) + UI.SSA.setBold(true) +
            "[" + temp[i].time + "] [" + temp[i].prefix + "] " + temp[i].text;
        }

        UI.Input.OSDLog.OSD.data = data;
        data = undefined;
        temp = undefined;
        UI.Input.OSDLog.OSD.update();
    }, 200);
}

UI.Input.OSDLog.addToBuffer = function (msg) {
    var color = "";
    if (msg.level == "debug")
    {
        color = UI.SSA.setColorGray();
    }
    if (msg.level == "info")
    {
        color = UI.SSA.setColorWhite();
    }
    if (msg.level == "warn")
    {
        color = UI.SSA.setColorYellow();
    }
    if (msg.level == "error")
    {
        color = UI.SSA.setColorRed();
    }

    if (UI.Input.OSDLog.Buffer.length > 4000 && !Settings.Data.saveFullLog) // might reduce further in the future, lets see how this runs for now
    {
        UI.Input.OSDLog.Buffer.splice(1000,2000,{prefix: "easympv", level: "warn", time: "invalid", color: UI.SSA.setColorYellow(), text: "!!! 2000 lines have been removed here to reduce memory usage !!!\n"});
    }

    UI.Input.OSDLog.Buffer.push({prefix: msg.prefix, level: msg.level, time: Date.now(), color: color, text: msg.text});
};

UI.Input.OSDLog.writeLogToFile = function ()
{
    var data = "";
    for (var i = 0; i < UI.Input.OSDLog.Buffer.length; i++)
    {
        data += "[" + UI.Input.OSDLog.Buffer[i].time + "] [" + UI.Input.OSDLog.Buffer[i].prefix + "] " + UI.Input.OSDLog.Buffer[i].text;
    }

    mpv.writeFile(
        mpv.getUserPath("~~desktop/easympv.log"),
        data
    );

    data = undefined;
    return;
}

UI.Input.OSDLog.hide = function () {
    clearInterval(UI.Input.OSDLog.Timer);
    mpv.commandv(
        "osd-overlay",
        UI.Input.OSDLog.OSD.id,
        "none",
        "",
        0,
        0,
        0,
        "no",
        "no"
    );
    UI.Input.OSDLog.OSD = undefined;
}

UI.Input.showInteractiveCommandInput = function () {
    var readCommand = function (success, result) {
        if (success) {
            mpv.command(result);
            UI.Alerts.push("Command executed!" , UI.Input.alertCategory, UI.Alerts.Urgencies.Normal);
        }
    };
    UI.Input.show(readCommand,"Command: ");
}

UI.Input.alertCategory = "Text Input";

UI.Input.showJavascriptInput = function () {
        var readCommand = function (success, result) {
            if (success) {
                try{
                    var print = function (object) { mpv.printWarn(JSON.stringify(object,undefined,4)); };
                    var clearOSD = function(id) {
                        mp.osd_message("");
                        if (id == undefined){
                            UI.Alerts.push("Force-removing all overlays: you might see error messages!", UI.Input.alertCategory, UI.Alerts.Urgencies.Warning);
                            mpv.printWarn("Force-removing all overlays: you might see error messages!");
                            for (var i = 0; i < 10000; i++)
                            {
                                mpv.commandv(
                                    "osd-overlay",
                                    i,
                                    "none",
                                    "",
                                    0,
                                    0,
                                    0,
                                    "no",
                                    "no"
                                );
                            }
                        }
                        else
                        {
                            mpv.commandv(
                                "osd-overlay",
                                id,
                                "none",
                                "",
                                0,
                                0,
                                0,
                                "no",
                                "no"
                            );
                        }
                    }
                    var cmd = function (cmd) {
                        print(OS._call(cmd));
                    }
                    var crash = function() {
                        mpv.printWarn("CRASH FORCED: LOG IS INVALID!");
                        UI.Input = {};
                    }
                    var help = function () {
                        if (UI.Input.OSDLog.OSD == undefined) {
                            UI.Input.OSDLog.show();
                        }
                        mpv.printWarn("help() output:\nList of helper functions:\n"+
                        "print(obj) -> shorthand for mpv.printWarn(JSON.stringify(obj))\n"+
                        "cmd(command) -> execute shell command\n"+
                        "clearOSD() -> force-removes ALL OSDs and messages on screen\n" +
                        "crash() -> force-crashes easympv"
                        );
                    };
                    eval(result);
                    UI.Alerts.push("Expression evaluated! Check log for more info." , UI.Input.alertCategory, UI.Alerts.Urgencies.Normal);
                }
                catch(e)
                {
                    UI.Alerts.push("Invalid Expression! Error: " + e, UI.Input.alertCategory, UI.Alerts.Urgencies.Error);
                }
            }
        };
        UI.Input.show(readCommand,"JavaScript expression (use help() for more info): ");
}