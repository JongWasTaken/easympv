/*
 * SSAHelper.JS (MODULE)
 *
 * Author:                     Jong
 * URL:                     https://smto.pw/mpv
 * License:                 MIT License
 */

/*----------------------------------------------------------------
The SSAHelper.js module

This file contains helper functions for making working with 
SSA/ASS easier, such as basic text formatting, setting colors
and a few hardcoded SSA images.
----------------------------------------------------------------*/

"use strict";

/**
 * This module consists of helper functions for making working with
 * SSA/ASS easier.
 */
var SSAHelper = {};

SSAHelper.startSequence = function () {
    return mp.get_property_osd("osd-ass-cc/0");
};

SSAHelper.endSequence = function () {
    return mp.get_property_osd("osd-ass-cc/1");
};

SSAHelper.setSize = function (fontSize) {
    return "{\\fs" + fontSize + "}";
};

SSAHelper.setScale = function (scalePercent) {
    return "{\\fscx" + scalePercent + "\\fscy" + scalePercent + "}";
};

SSAHelper.setTransparency = function (transparencyHex) {
    return "{\\alpha&H" + transparencyHex + "&}";
};

SSAHelper.setTransparencyPercentage = function (transparencyPercentage) {
    var transparencyHex = Math.floor(
        (transparencyPercentage / 100) * 255
    ).toString(16);
    return "{\\alpha&H" + transparencyHex + "&}";
};

SSAHelper.drawRaw = function (commands) {
    return "{\\p1}" + commands + "{\\p0}";
};

SSAHelper.setPosition = function (x, y) {
    var s = "{\\pos(" + x + "," + y + ")}";
    return s;
};

SSAHelper.move = function (x, y) {
    var s = "{\\p1} ";
    s += "m " + x + " " + y + "{\\p0}";
    return s;
};

SSAHelper.drawRectangle = function (x1, y1, x2, y2) {
    var s = "{\\p1} ";
    s += "m " + x1 + " " + y1 + " ";
    s += "l " + x2 + " " + y1 + " ";
    s += "l " + x2 + " " + y2 + " ";
    s += "l " + x1 + " " + y2 + "{\\p0}";
    return s;
};

SSAHelper.drawLine = function (x1, y1, x2, y2) {
    var s = "{\\p1} ";
    s += "m " + x1 + " " + y1 + " ";
    s += "l " + x2 + " " + y2 + "{\\p0}";
    return s;
};

SSAHelper.setFont = function (font) {
    return "{\\fn" + font + "}";
};

SSAHelper.setBorder = function (border) {
    return "{\\bord" + border + "}";
};

SSAHelper.setShadow = function (depth) {
    return "{\\shad" + depth + "}";
};

/** Inserts given Font Awesome symbol with given size, then sets font back to Roboto.
 * @returns {string} SSA string
 * */
SSAHelper.insertSymbolFA = function (symbol, size, defaultSize, fontNameAfter) {
    var font = "Font Awesome 6 Free Solid";

    if (fontNameAfter == undefined) {
        fontNameAfter = "Roboto";
    }

    if (size != undefined && defaultSize != undefined) {
        return (
            SSAHelper.setSize(size) +
            SSAHelper.setFont(font) +
            symbol +
            SSAHelper.setFont(fontNameAfter) +
            SSAHelper.setSize(defaultSize)
        );
    } else {
        return (
            SSAHelper.setFont(font) + symbol + SSAHelper.setFont(fontNameAfter)
        );
    }
};

SSAHelper.setColor = function (hex) {
    return (
        "{\\1c&H" +
        hex.substring(4, 6) +
        hex.substring(2, 4) +
        hex.substring(0, 2) +
        "&}"
    );
};

SSAHelper.setSecondaryColor = function (hex) {
    return (
        "{\\2c&H" +
        hex.substring(4, 6) +
        hex.substring(2, 4) +
        hex.substring(0, 2) +
        "&}"
    );
};

SSAHelper.setBorderColor = function (hex) {
    return (
        "{\\3c&H" +
        hex.substring(4, 6) +
        hex.substring(2, 4) +
        hex.substring(0, 2) +
        "&}"
    );
};

SSAHelper.setShadowColor = function (hex) {
    return (
        "{\\4c&H" +
        hex.substring(4, 6) +
        hex.substring(2, 4) +
        hex.substring(0, 2) +
        "&}"
    );
};

SSAHelper.reset = function () {
    return "{\\r}";
};

SSAHelper.setColorWhite = function () {
    return SSAHelper.setColor("FFFFFF");
};

SSAHelper.setColorGray = function () {
    return SSAHelper.setColor("909090");
};

SSAHelper.setColorYellow = function () {
    return SSAHelper.setColor("FFFF90");
};

SSAHelper.setColorGreen = function () {
    return SSAHelper.setColor("33ff33");
};

SSAHelper.setColorDarkRed = function () {
    return SSAHelper.setColor("EB4034");
};

SSAHelper.setColorRed = function () {
    return SSAHelper.setColor("FF3300");
};

SSAHelper.setColorBlack = function () {
    return SSAHelper.setColor("000000");
};

/**
 * Using https://qgustavor.github.io/svg2ass-gui/ , any svg file can
 * be displayed. However mpv has a quirk with this, files that consist
 * of multiple shapes will be missaligned. Those same lines will look
 * perfect in AegiSub.
 * This is why all images here are a single shape/SSA draw command.
 */
SSAHelper.Images = {};

/** Blue round info symbol. */
SSAHelper.Images.info = function () {
    var symbol = "";
    symbol +=
        "{\\an7\\1c&HF39621&\\bord2\\shad0\\p1}m 24 4 b 13 4 4 13 4 24 b 4 35 13 44 24 44 b 35 44 44 35 44 24 b 44 13 35 4 24 4 ";
    symbol +=
        "m 24 14 b 25.4 14 26.5 15.1 26.5 16.5 b 26.5 17.9 25.4 19 24 19 b 22.6 19 21.5 17.9 21.5 16.5 b 21.5 15.1 22.6 14 24 14 ";
    symbol += "m 22 22 l 26 22 l 26 33 l 22 33 l 22 22 {\\p0}";
    return symbol + SSAHelper.reset();
};

/** Yellow triangular warning symbol. */
SSAHelper.Images.warning = function () {
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
    return symbol + SSAHelper.reset();
};

/** Red round error symbol. */
SSAHelper.Images.error = function () {
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
    return symbol + SSAHelper.reset();
};

module.exports = SSAHelper;
