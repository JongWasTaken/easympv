/*
 * VIDEO.JS (PART OF EASYMPV)
 *
 * Author:         Jong
 * URL:            https://github.com/JongWasTaken/easympv
 * License:        MIT License
 */

/**
 * This file handles everything related to presentation, such as FPS,
 * or keeping track of shaders.
 */
var Video = {};

Video.FPS = {};
Video.FPS.setFixedFPS = function(fps)
{
    if (fps != undefined)
    {
        mpv.commandv(
            "vf",
            "set",
            "@empvfps:fps=fps=" + fps
        );
    }
    else
    {
        mpv.commandv(
            "vf",
            "remove",
            "@empvfps"
        );
    }

}

Video.FPS.getFixedFPS = function()
{
    var output = "native";
    var filters = mpv.getPropertyNative("vf");
    if (filters.length != 0)
    {
        for (var i = 0; i < filters.length; i++)
        {
            if (filters[i].name == "fps")
            {
                output = filters[i].params.fps;
                break;
            }
        }
    }
    return output;
}

Video.FPS.checkVRR = function ()
{
    var double = "";
    if (Number(mpv.getProperty("container-fps")) < (Settings.Data.refreshRate / 2) && mpv.getProperty("speed") == 1) {
        double = String(Number(mpv.getProperty("container-fps")) * 2);
        if (double < 48) { double = double * 2};
        mpv.setProperty("override-display-fps",double)
        Video.FPS.setFixedFPS(double);
    } else {
        mpv.setProperty("override-display-fps",Settings.Data.refreshRate);
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
            file_resolution = Number(mpv.getProperty("video-params/h"));

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
        mpv.commandv("change-list", "glsl-shaders", "clr", "");
    } else {
        mpv.commandv("change-list", "glsl-shaders", "clr", "");
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
                mpv.commandv(
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
                    mpv.commandv(
                        "change-list",
                        "glsl-shaders",
                        "set",
                        Settings.presets.shadersetsUser[i].files
                    );
                    break;
                }
            }
        }

        mpv.printInfo("Switching to preset: " + Video.Shaders.name);
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
        mpv.setProperty(property, values[property]);
    }
    Video.Colors.name = name;
};