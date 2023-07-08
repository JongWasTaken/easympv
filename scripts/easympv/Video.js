/*
 * VIDEO.JS (MODULE)
 *
 * Author:         Jong
 * URL:            https://github.com/JongWasTaken/easympv
 * License:        MIT License
 */

/*----------------------------------------------------------------
The Video.js module

This file handles everything related to presentation, such as FPS,
or keeping track of shaders.
----------------------------------------------------------------*/

var Video = {};

Video.FPS = {};
Video.FPS.setFixedFPS = function(fps)
{
    if (fps == undefined)
    {
        fps  = "";
    }

    mp.commandv(
        "vf",
        "set",
        "fps=fps=" + fps
    );
}
Video.FPS.checkVRR = function ()
{
    var double = "";
    if (Number(mp.get_property("container-fps")) < (Settings.Data.refreshRate / 2) && mp.get_property("speed") == 1) {
        double = String(Number(mp.get_property("container-fps")) * 2);
        if (double < 48) { double = double * 2};
        mp.set_property("override-display-fps",double)
        Video.FPS.setFixedFPS(double);
    } else {
        mp.set_property("override-display-fps",Settings.Data.refreshRate);
        Video.FPS.setFixedFPS();
    }
}

Video.Shaders = {};
Video.Shaders.name = "none";
Video.Shaders.manualSelection = false;

Video.Shaders.apply = function (shader) {
    Video.Shaders.manualSelection = true;
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
            Video.Shaders.apply("Anime4K for HD and SD media" + suffix);
        } else if (closest == 720) {
            Video.Shaders.apply("Anime4K for 720p media" + suffix);
        } else if (closest == 1080) {
            Video.Shaders.apply("Anime4K for HD and SD media" + suffix);
        } else if (closest == 1440) {
            Video.Shaders.apply("Anime4K for 720p media" + suffix);
        } else {
            Video.Shaders.apply("Anime4K for HD and SD media" + suffix);
        }
    } else if (shader == "Automatic All-Purpose") {
        Video.Shaders.apply("NNEDI3 (128 Neurons)");
    } else if (
        shader == "clear" ||
        shader == "none" ||
        shader == "" ||
        shader == undefined
    ) {
        Video.Shaders.name = "none";
        mp.commandv("change-list", "glsl-shaders", "clr", "");
    } else {
        mp.commandv("change-list", "glsl-shaders", "clr", "");
        if (shader.includes("none") || shader.includes("undefined")) {
            Video.Shaders.name = "none";
        } else {
            Video.Shaders.name = shader;
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

        Utils.log("Switching to preset: " + Video.Shaders.name,"shaders","info");
    }
};

Video.Colors = {};
Video.Colors.name = "none";
Video.Colors.manualSelection = false;

Video.Colors.apply = function (name) {
    Video.Colors.manualSelection = true;
    var values = undefined;
    if (name == "none") {
        values = {
            contrast: 0,
            brightness: 0,
            gamma: 0,
            saturation: 0,
            hue: 0,
            sharpen: 0.0,
        };
    } else {
        var i;
        for (i = 0; i < Settings.presets.colorpresets.length; i++) {
            if (Settings.presets.colorpresets[i].name == name) {
                values = Settings.presets.colorpresets[i].data;
                break;
            }
        }

        if (values == undefined) {
            for (i = 0; i < Settings.presets.colorpresetsUser.length; i++) {
                if (Settings.presets.colorpresetsUser[i].name == name) {
                    values = Settings.presets.colorpresetsUser[i].data;
                    break;
                }
            }
        }
    }

    for (var property in values) {
        mp.set_property(property, values[property]);
    }
    Video.Colors.name = name;
};

module.exports = Video;