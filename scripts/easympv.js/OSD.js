/*
 * OSD.JS (MODULE)
 *
 * Author:         Jong
 * URL:            https://smto.pw/mpv
 * License:        MIT License
 */

/*----------------------------------------------------------------
The OSD.js module

This file handles drawing images to the screen and manages them. 
----------------------------------------------------------------*/

/**
 * This module handles drawing images to the screen and manages them. 
 */
var OSD = {};

/**
 * This array contains all images added with OSD.addImage(). 
 */
var Files = [];

/* 
Check for image info file. If the image is called "image.bmp",
then the info file is called "image.bmp.info".
The contents of this file are expected to be:
"h=60;w=200"
In this case H 60px x W 200px.
If the file is not found, defaults will be used instead.

This is needed because there is no way to check image metadata.
*/
__getImageInfo = function (file) {
	file = mp.utils.get_user_path("~~/images/") + file + ".info";
	var h, w;
	if (mp.utils.file_info(file) != undefined) {
		var data = mp.utils.read_file(file).split(";");
		for (var i = 0; i < data.length; i++) {
			var pair = data[i].split("=");
			if (pair[0] == "h") {
				h = Number(pair[1]);
			} else if (pair[0] == "w") {
				w = Number(pair[1]);
			}
		}
	} else {
		h = 60;
		w = 200;
	}
	return (result = { h: h, w: w });
};

__getFilebyName = function (name) {
	for (i = 0; i < Files.length; i++) {
		if (Files[i].name == name) {
			return Files[i];
		}
	}
};

/** 
 * Represents an image.
 * You probably want to call OSD.addImage() instead.
*/
OSD.Image = function (active, id, file, width, height, offset, x, y) {
	this.id = id;
	this.file = mp.utils.get_user_path("~~/images/") + file;
	this.width = width;
	this.height = height;
	this.x = x;
	this.y = y;
	this.offset = offset;
	this.active = active;
	return this;
};

/** 
 * Adds an image file to the file array.
 * Place the correctly formated image file in ~~/images/.
 * @param {string} name internal name for image file, used when drawing/removing overlay
 * @param {string} file file name with extension
*/
OSD.addImage = function (name, file) {
	var imgdata = __getImageInfo(file);
	height = imgdata.h;
	width = imgdata.w;

	var offset =
		mp.utils.file_info(mp.utils.get_user_path("~~/images/") + file).size -
		4 * width * height;
	var image = {
		name: name,
		data: new OSD.Image(
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

/** 
 * @param {string} name internal name of image
 * @return {Boolean} true if image is currently on screen
*/
OSD.status = function (name) {
	var image = __getFilebyName(name);
	return image.data.active;
};

OSD.getScale = function () {
	var scale = "";
	var height = mp.get_property("osd-height");
	if (height == 0) {
		height = mp.get_property("height");
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
 * Draws image to screen at specified coordinates.
 * x = 0, y = 0 is the top left corner!
 * @param {string} name internal name of image
 */
OSD.show = function (name, x, y) {
	if (name != undefined && x != undefined && y != undefined) {
		var scale = OSD.getScale();
		var image = __getFilebyName(scale + name);

		image.data.x = x;
		image.data.y = y;
		if (!image.data.active) {
			mp.commandv(
				"overlay-add",
				image.data.id,
				image.data.x,
				image.data.y,
				image.data.file,
				image.data.offset,
				"bgra",
				image.data.width,
				image.data.height,
				image.data.width * 4
			);
			image.data.active = true;
		}
	}
};

/**
 * Either draws or hides image, depending on its current state.
 * x = 0, y = 0 is the top left corner!
 * @param {string} name internal name of image
 */ 
OSD.toggle = function (name, x, y) {
	var scale = "";
	var height = mp.get_property("osd-height");
	if (height == 0) {
		height = mp.get_property("height");
	}

	if (height < 1090) {
		scale = "";
	} else if (height <= 1450 && height >= 1080) {
		scale = "2";
	} else if (height <= 2170 && height >= 1440) {
		scale = "4";
	}

	var image = __getFilebyName(scale + name);
	if (!image.data.active) {
		OSD.show(image.name, x, y);
	} else {
		mp.commandv("overlay-remove", image.data.id);
		image.data.active = false;
	}
};

/**
 * Removes image from screen.
 * @param {string} name internal name of image
 */
OSD.hide = function (name) {
	if (name != null) {
		var image;
		//var scale = "";
		var height = mp.get_property("osd-height");
		if (height == 0) {
			height = mp.get_property("height");
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

		image = __getFilebyName(name);
		if (image.data.active) {
			mp.commandv("overlay-remove", image.data.id);
			image.data.active = false;
		}

		image = __getFilebyName("2" + name);
		if (image.data.active) {
			mp.commandv("overlay-remove", image.data.id);
			image.data.active = false;
		}

		image = __getFilebyName("4" + name);
		if (image.data.active) {
			mp.commandv("overlay-remove", image.data.id);
			image.data.active = false;
		}
		
	}
};

/**
 * Removes all images from screen.
 */
OSD.hideAll = function () {
	for (i = 0; i < Files.length; i++) {
		if (Files[i].data.active == true) {
			OSD.hide(Files[i].name);
		}
	}
};

module.exports = OSD;
