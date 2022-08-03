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
var seperator = "";
Shaders.name = "none";
Shaders.sets = [];
Shaders.manualSelection = false;

var Utils = require("./Utils");
if (Utils.OSisWindows) {
    seperator = ";";
} else {
    seperator = ":";
}

Shaders.set = function (name, files) {
    this.name = name;
    this.files = files;
    return this;
};

Shaders.readFile = function () {
    mp.msg.verbose("[startup] Shaders.readFile");
    Shaders.sets = [];
    // Parse Shaders.json and add all entries to Shaders.sets
    var file = JSON.parse(
        mp.utils.read_file(
            mp.utils.get_user_path("~~/scripts/easympv/Shaders.json")
        )
    );
    for (var set in file) {
        var filelist = "";
        var i = 0;
        for (i = 0; i < file[set].length; i++) {
            filelist = filelist + "~~/shaders/" + file[set][i] + seperator;
        }
        filelist = filelist.slice(0, filelist.length - 1);
        Shaders.sets.push(new Shaders.set(set, filelist));
    }

    // Sort the array
    Shaders.sets.reverse();
    var i;
    var sorttemp_master = [];
    var sorttemp_sd = [];
    var sorttemp_hd = [];
    var sorttemp2 = [];
    for (i = 0; i < Shaders.sets.length; i++) {
        if (Shaders.sets[i].name.includes("Worse, but Faster")) {
            sorttemp_sd.push(Shaders.sets[i]);
        } else if (Shaders.sets[i].name.includes("Better, but slower")) {
            sorttemp_hd.push(Shaders.sets[i]);
        } else {
            sorttemp2.push(Shaders.sets[i]);
        }
    }
    sorttemp_sd.reverse();
    sorttemp_hd.reverse();

    for (i = 0; i < sorttemp_sd.length; i++) {
        sorttemp_master.push(sorttemp_sd[i]);
    }
    for (i = 0; i < sorttemp_hd.length; i++) {
        sorttemp_master.push(sorttemp_hd[i]);
    }
    for (i = 0; i < sorttemp2.length; i++) {
        sorttemp_master.push(sorttemp2[i]);
    }

    Shaders.sets = sorttemp_master;
};

/**
 * Applies shaderset.
 * @param {string} shader name of a shaderset in Shaders.json
 */
Shaders.apply = function (shader) {
    Shaders.manualSelection = true;
    if (shader == "Automatic Anime4K") {
        var resolutions = [300, 480, 720, 1080, 1440, 2560, 3000],
            file_resolution = Number(mp.get_property("video-params/h"));

        var closest = resolutions.reduce(function (prev, curr) {
            return Math.abs(curr - file_resolution) <
                Math.abs(prev - file_resolution)
                ? curr
                : prev;
        });

        if (closest == 480) {
            Shaders.apply("Anime4K for HD and SD media (Worse, but Faster)");
        } else if (closest == 720) {
            Shaders.apply("Anime4K for 720p media (Worse, but Faster)");
        } else if (closest == 1080) {
            Shaders.apply("Anime4K for HD and SD media (Worse, but Faster)");
        } else if (closest == 1440) {
            Shaders.apply("Anime4K for 720p media (Worse, but Faster)");
        } else {
            Shaders.apply("Anime4K for HD and SD media (Worse, but Faster)");
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
        for (i = 0; i < Shaders.sets.length; i++) {
            if (Shaders.sets[i].name == shader) {
                mp.commandv(
                    "change-list",
                    "glsl-shaders",
                    "set",
                    Shaders.sets[i].files
                );
                break;
            }
        }

        mp.msg.info("Switching to preset: " + Shaders.name);
    }
};

module.exports = Shaders;
