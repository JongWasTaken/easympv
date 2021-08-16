/*
 * OSD.JS (MODULE)
 *
 * Author:         Jong
 * URL:            https://smto.pw/mpv
 * License:        MIT License
 */

var OSD = {};
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
  mp.msg.info("Checking for image info file: " + file);
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
    mp.msg.info("Image info found! (H: " + h + ", W: " + w + ")");
  } else {
    mp.msg.info("Image info not found! Assuming default. (H: 60, W: 200)");
    h = 60;
    w = 200;
  }
  return (result = { h: h, w: w });
};

// self explanatory
__getFilebyName = function (name) {
  for (i = 0; i < Files.length; i++) {
    if (Files[i].name == name) {
      return Files[i];
    }
  }
};

/* 
Structs are not possible, so we use functions instead.
This 'struct' represents an image file.
*/
OSD.File = function (active, id, file, width, height, offset, x, y) {
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

/* 
This function will add an image file in ~~/images/ to the file array.
    name: internal name for image file, used when drawing/removing overlay.
    file: file name with extension
    width/height: dimensions of image file
The offset gets calculated from file size.
*/
OSD.addFile = function (name, file) {
  var imgdata = __getImageInfo(file);
  height = imgdata.h;
  width = imgdata.w;

  var offset =
    mp.utils.file_info(mp.utils.get_user_path("~~/images/") + file).size -
    4 * width * height;
  var image = {
    name: name,
    data: new OSD.File(false, Files.length, file, width, height, offset, 0, 0),
  };
  Files.push(image);
};

// Checks if image is beeing displayed.
OSD.status = function (name) {
  var image = __getFilebyName(name);
  return image.data.active;
};

// Draw image to screen at specified coordinates.
OSD.show = function (name, x, y) {
  if (name != undefined && x != undefined && y != undefined) {

    var scale = "";
    var height = mp.get_property("osd-height");
    if (height == 0) {
      height = mp.get_property("height");
    }
    
    if(height < 1090) {
      scale = "";
    } else if(height <= 1450 && height >= 1080) {
      scale = "2";
    } else if(height <= 2170 && height >= 1440) {
      scale = "4";
    }
    //mp.msg.info("CURRENT SCALE: " + scale);
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

// Draws/hides image to/from screen.
OSD.toggle = function (name, x, y) {
  var image = __getFilebyName(name);
  if (!image.data.active) {
    OSD.show(image.name,x,y)
  } else {
    mp.commandv("overlay-remove", image.data.id);
    image.data.active = false;
  }
};

// Hides image.
OSD.hide = function (name) {
  if (name != null) {
    var image = __getFilebyName(name);
    if (image.data.active) {
      mp.commandv("overlay-remove", image.data.id);
      image.data.active = false;
    }
  }
};

OSD.hideAll = function () {
  for (i = 0; i < Files.length; i++) {
    if (Files[i].data.active == true) {
      OSD.hide(Files[i].name);
    }
  }
};

module.exports = OSD;
