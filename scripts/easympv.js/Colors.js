/*
 * COLORS.JS (MODULE), using parts of COLORBOX.JS by VideoPlayerCode
 *
 * Author:         Jong
 * URL:            http://smto.pw/mpv
 * License:        Apache License, Version 2.0
 */

var Colors = {};
Colors.lookName = "none";
Colors.presetCache = {};

Colors.buildCache = function (presets) {
  var i, parts, title, values;
  for (i = 0; i < presets.length; ++i) {
    parts = presets[i].split(";");
    title = "Invalid preset";
    values = null;
    if (parts.length) {
      switch (parts[0]) {
        case "v1":
          if (parts.length < 7) break;
          title = parts
            .slice(7)
            .join(";")
            .replace(/^\s+|\s+$/g, "");
          if (!title.length) title = "Untitled preset";
          values = {
            contrast: parseFloat(parts[1]),
            brightness: parseFloat(parts[2]),
            gamma: parseFloat(parts[3]),
            saturation: parseFloat(parts[4]),
            hue: parseFloat(parts[5]),
            sharpen: parseFloat(parts[6]),
          };
          Colors.presetCache[title] = values;
          break;
      }
    }
  }
};

Colors.applyLook = function (values) {
  if (values === "reset")
    values = {
      contrast: 0,
      brightness: 0,
      gamma: 0,
      saturation: 0,
      hue: 0,
      sharpen: 0.0,
    };

  if (!values || typeof values !== "object") return false; // Nothing to apply.

  for (var prop in values) {
    if (values.hasOwnProperty(prop)) mp.set_property(prop, values[prop]);
  }

  return true; // Successfully applied object properties.
};

Colors.applyLookWithFeedback = function (title, values) {
  if (title == "[Disable All Presets]") {
    Colors.lookName = "none";
  } else {
    Colors.lookName = title;
  }
  Colors.applyLook(values);
};

Colors.applyLookByName = function (lookName) {
  var title, values;
  if (lookName === "reset") {
    title = "[Reset Image Settings]\n\n";
    values = "reset";
  } else if (Colors.presetCache.hasOwnProperty(lookName)) {
    title = lookName;
    values = Colors.presetCache[lookName];
  } else {
    title = "none";
    values = "reset";
  }
  mp.msg.info("Applied colorbox look: " + lookName);
  Colors.applyLookWithFeedback(title, values);
};

module.exports = Colors;
