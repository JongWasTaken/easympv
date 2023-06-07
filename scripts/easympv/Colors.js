/*
 * COLORS.JS (MODULE),
 *
 * Author:         Jong
 * URL:            https://smto.pw/mpv
 * License:        MIT License
 *
 * Inspired by (but not containing code from) COLORBOX.JS by VideoPlayerCode.
 */


var Colors = {};
Colors.name = "none";
Colors.manualSelection = false;

Colors.apply = function (name) {
    Colors.manualSelection = true;
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
    Colors.name = name;
};

module.exports = Colors;
