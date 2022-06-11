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
Colors.sets = [];
Colors.manualSelection = false;

Colors.set = function (name, data) {
	this.name = name;
	this.data = data;
	return this;
};

Colors.readFile = function () {
	mp.msg.verbose("[startup] Shaders.readFile");
	Colors.sets = [];
	var file = JSON.parse(
		mp.utils.read_file(
			mp.utils.get_user_path("~~/scripts/easympv/Colors.json")
		)
	);

	for (var set in file) {
		Colors.sets.push(
			new Colors.set(set, {
				contrast: file[set].contrast,
				brightness: file[set].brightness,
				gamma: file[set].gamma,
				saturation: file[set].saturation,
				hue: file[set].hue,
				sharpen: parseFloat(file[set].sharpen),
			})
		);
	}
};

Colors.apply = function (name) {
	Colors.manualSelection = true;
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
		for (i = 0; i < Colors.sets.length; i++) {
			if (Colors.sets[i].name == name) {
				values = Colors.sets[i].data;
				break;
			}
		}
	}

	for (var property in values) {
		mp.set_property(property, values[property]);
	}
	Colors.name = name;
};

module.exports = Colors;
