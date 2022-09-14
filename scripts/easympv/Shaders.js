/*
 * SHADERS.JS (MODULE)
 *
 * Author:         Jong
 * URL:            https://smto.pw/mpv
 * License:        MIT License
 */

/*----------------------------------------------------------------
The Shaders.js module

This file handles all things shader, such as parsing Shaders.json,
keeping track of the current shaderset and applying a shaderset.
----------------------------------------------------------------*/

/** This module handles all things shader.*/
var Shaders = {};
Shaders.name = "none";
Shaders.manualSelection = false;

var Utils = require("./Utils");
var Settings = require("./Settings");

/**
 * Applies shaderset.
 * @param {string} shader name of a shaderset in Shaders.json
 */
Shaders.apply = function (shader) {
    Shaders.manualSelection = true;
    if (shader.includes("Automatic Anime4K")) {

	var suffix = " (Better, but more demanding)";
	if (shader.includes("Worse")) {
	    suffix = " (Worse, but less demanding)";
	}

        var resolutions = [300, 480, 720, 1080, 1440, 2560, 3000],
            file_resolution = Number(mp.get_property("video-params/h"));

        var closest = resolutions.reduce(function (prev, curr) {
            return Math.abs(curr - file_resolution) <
                Math.abs(prev - file_resolution)
                ? curr
                : prev;
        });

        if (closest == 480) {
            Shaders.apply("Anime4K for HD and SD media" + suffix);
        } else if (closest == 720) {
            Shaders.apply("Anime4K for 720p media" + suffix);
        } else if (closest == 1080) {
            Shaders.apply("Anime4K for HD and SD media" + suffix);
        } else if (closest == 1440) {
            Shaders.apply("Anime4K for 720p media" + suffix);
        } else {
            Shaders.apply("Anime4K for HD and SD media" + suffix);
        }
    } else if (shader == "Automatic All-Purpose") {
        Shaders.apply("NNEDI3 (128 Neurons)");
    } else if (
        shader == "clear" ||
        shader == "none" ||
        shader == "" ||
        shader == undefined
    ) {
        Shaders.name = "none";
        mp.commandv("change-list", "glsl-shaders", "clr", "");
    } else {
        mp.commandv("change-list", "glsl-shaders", "clr", "");
        if (shader.includes("none") || shader.includes("undefined")) {
            Shaders.name = "none";
        } else {
            Shaders.name = shader;
        }

        var i;
        var shaderFound = false;
        for (i = 0; i < Settings.presets.shadersets.length; i++) {
            if (Settings.presets.shadersets[i].name == shader) {
                shaderFound = true;
                mp.commandv(
                    "change-list",
                    "glsl-shaders",
                    "set",
                    Settings.presets.shadersets[i].files
                );
                break;
            }
        }
        if (!shaderFound)
        {
            for (i = 0; i < Settings.presets.shadersetsUser.length; i++) {
                if (Settings.presets.shadersetsUser[i].name == shader) {
                    mp.commandv(
                        "change-list",
                        "glsl-shaders",
                        "set",
                        Settings.presets.shadersetsUser[i].files
                    );
                    break;
                }
            }
        }

        Utils.log("Switching to preset: " + Shaders.name,"shaders","info");
    }
};

module.exports = Shaders;
