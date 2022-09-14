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
var ImageOSD = {};

var Settings = require("./Settings");

/**
 * Uses system provided tools to get image metadata.
 * Falls back to parsing .info files, otherwise assumes default values.
 * Defaults: H 60px x W 200px.
 */
ImageOSD.getImageInfo = function (file) {
    file = mp.utils.get_user_path(file);
    var h, w, offset;
    // try using system tools to get image metadata
    if (Utils.OSisWindows) {
        var r = mp.command_native({
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            args: [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "get-image-info",
                file,
            ],
        });
    } else {
        var r = mp.command_native({
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            args: [
                mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh"),
                "get-image-info",
                file,
            ],
        });
    }
    if (r.status == "0") {
        var input = r.stdout.trim();
        if (Utils.OSisWindows) {
            var data = input.split("|");
            w = data[0];
            h = data[1];
            offset =
                mp.utils.file_info(file).size - 4 * w * h;
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
        if (mp.utils.file_info(filex) != undefined) {
            var data = mp.utils.read_file(filex).split(";");
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
        offset =
            mp.utils.file_info(file).size - 4 * w * h;
    }

    return (result = { h: h, w: w, offset: offset });
};

__getFilebyName = function (name) {
    for (i = 0; i < Settings.presets.images.length; i++) {
        if (Settings.presets.images[i].name == name) {
            return Settings.presets.images[i];
        }
    }
};

/**
 * Represents an image.
 * You probably want to call OSD.addImage() instead.
 */
ImageOSD.Image = function (active, id, file, width, height, offset, x, y) {
    this.id = id;
    this.file = mp.utils.get_user_path("~~/scripts/easympv/images/") + file;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.offset = offset;
    this.active = active;
    return this;
};

/**
 * Adds an image file to the internal file array.
 * Place the correctly formated image file in ~~/scripts/easympv/images/.
 * @param {string} name internal name for image file, used when drawing/removing overlay
 * @param {string} file file name with extension
 
ImageOSD.addImage = function (name, file) {
    var imgdata = __getImageInfo(file);
    var height = imgdata.h;
    var width = imgdata.w;
    var offset = imgdata.offset;
    var image = {
        name: name,
        data: new ImageOSD.Image(
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
 * @param {string} name internal name of image
 * @return {Boolean} true if image is currently on screen
 */
ImageOSD.status = function (name) {
    var image = __getFilebyName(name);
    return image.data.active;
};

ImageOSD.getScale = function () {
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
ImageOSD.show = function (name, x, y) {
    if (name != undefined && x != undefined && y != undefined) {
        var scale = ImageOSD.getScale();
        var image = __getFilebyName(scale + name);

        image.data.x = x;
        image.data.y = y;
        if (!image.data.active) {
            mp.commandv(
                "overlay-add",
                image.data.id,
                image.data.x,
                image.data.y,
                mp.utils.get_user_path(image.data.file),
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
ImageOSD.toggle = function (name, x, y) {
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
        ImageOSD.show(image.name, x, y);
    } else {
        mp.commandv("overlay-remove", image.data.id);
        image.data.active = false;
    }
};

/**
 * Removes image from screen.
 * @param {string} name internal name of image
 */
ImageOSD.hide = function (name) {
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
ImageOSD.hideAll = function () {
    for (i = 0; i < Settings.presets.images.length; i++) {
        if (Settings.presets.images[i].data.active == true) {
            ImageOSD.hide(Settings.presets.images[i].name);
        }
    }
};

module.exports = ImageOSD;
