/*
 * UTILS.JS (MODULE)
 *
 * Original Author:         VideoPlayerCode
 * Modified by:             Jong
 * URL:                     http://smto.pw/mpv
 * License:                 Apache License, Version 2.0
 */

"use strict";

var Utils = {};

Utils.os = undefined;

// get OS: win, linux or mac
// $DISPLAY is usually not set on macOS
if (mp.utils.getenv("OS") == "Windows_NT") {
  Utils.os = "win";
  mp.msg.info("Detected operating system: Windows");
} else {
  if (mp.utils.getenv("DISPLAY") != undefined) {
    Utils.os = "linux";
    mp.msg.info("Detected operating system: Linux");
    mp.msg.info(
      'Linux is not officially supported. Tough the majority of features will work if you install "mono". Don\'t blame me when something breaks!'
    );
  } else {
    Utils.os = "mac";
    mp.msg.info("Detected operating system: macOS");
    mp.msg.info(
      "macOS is not officially supported. Don't blame me when something breaks!"
    );
  }
}

// Open file relative to config root. Can also run applications.
Utils.openFile = function (file) {
  mp.msg.info("Opening file: " + file);
  file = mp.utils.get_user_path("~~/") + "/" + file;
  if (Utils.os == "win") {
    file = file.replace("+", "/");
    file = file.replace("/", "\\");
    mp.commandv("run", "cmd", "/c", "start " + file);
  } else if (Utils.os == "mac") {
    mp.msg.info("macOS is not supported.");
    //mp.commandv("run","zsh","-c","open " + file);
  } else if (Utils.os == "linux") {
    mp.commandv("run", "bash", "-c", '"xdg-open ' + file);
  }
};

Utils.externalUtil = function (arg) {
  mp.msg.info("Starting utility with arguments: " + arg);
  var util = mp.utils.get_user_path("~~/") + "/easympvUtility.exe";
  if (Utils.os == "win") {
    util = util.replace("+", "/");
    util = util.replace("/", "\\");
    mp.commandv("run", "cmd", "/c", util + " " + arg);
  } else if (Utils.os == "mac") {
    mp.msg.info("macOS is not supported.");
  } else if (Utils.os == "linux") {
    var largs = arg.split(" ");
    if (largs.length == 1) {
      mp.commandv("run", "mono", util, largs[0]);
    } else if (largs.length == 2) {
      mp.commandv("run", "mono", util, largs[0], largs[1]);
    }
  }
};

Utils.clearWatchdata = function () {
  mp.msg.info("Clearing watchdata");
  var folder = mp.utils.get_user_path("~~/watch_later");
  if (Utils.os == "win") {
    folder = folder.replace("/", "\\");
    mp.commandv("run", "cmd", "/c", "del /Q /S " + folder.replace("/", "\\"));
  } else if (Utils.os == "mac") {
    mp.msg.info("macOS is not supported.");
    //mp.commandv("run","zsh","-c","rm -rf " + folder);
  } else if (Utils.os == "linux") {
    mp.commandv("run", "rm", "-rf", folder);
  }
};

function __md5cycle(x, k) {
  var a = x[0],
    b = x[1],
    c = x[2],
    d = x[3];

  a = __ff(a, b, c, d, k[0], 7, -680876936);
  d = __ff(d, a, b, c, k[1], 12, -389564586);
  c = __ff(c, d, a, b, k[2], 17, 606105819);
  b = __ff(b, c, d, a, k[3], 22, -1044525330);
  a = __ff(a, b, c, d, k[4], 7, -176418897);
  d = __ff(d, a, b, c, k[5], 12, 1200080426);
  c = __ff(c, d, a, b, k[6], 17, -1473231341);
  b = __ff(b, c, d, a, k[7], 22, -45705983);
  a = __ff(a, b, c, d, k[8], 7, 1770035416);
  d = __ff(d, a, b, c, k[9], 12, -1958414417);
  c = __ff(c, d, a, b, k[10], 17, -42063);
  b = __ff(b, c, d, a, k[11], 22, -1990404162);
  a = __ff(a, b, c, d, k[12], 7, 1804603682);
  d = __ff(d, a, b, c, k[13], 12, -40341101);
  c = __ff(c, d, a, b, k[14], 17, -1502002290);
  b = __ff(b, c, d, a, k[15], 22, 1236535329);

  a = __gg(a, b, c, d, k[1], 5, -165796510);
  d = __gg(d, a, b, c, k[6], 9, -1069501632);
  c = __gg(c, d, a, b, k[11], 14, 643717713);
  b = __gg(b, c, d, a, k[0], 20, -373897302);
  a = __gg(a, b, c, d, k[5], 5, -701558691);
  d = __gg(d, a, b, c, k[10], 9, 38016083);
  c = __gg(c, d, a, b, k[15], 14, -660478335);
  b = __gg(b, c, d, a, k[4], 20, -405537848);
  a = __gg(a, b, c, d, k[9], 5, 568446438);
  d = __gg(d, a, b, c, k[14], 9, -1019803690);
  c = __gg(c, d, a, b, k[3], 14, -187363961);
  b = __gg(b, c, d, a, k[8], 20, 1163531501);
  a = __gg(a, b, c, d, k[13], 5, -1444681467);
  d = __gg(d, a, b, c, k[2], 9, -51403784);
  c = __gg(c, d, a, b, k[7], 14, 1735328473);
  b = __gg(b, c, d, a, k[12], 20, -1926607734);

  a = __hh(a, b, c, d, k[5], 4, -378558);
  d = __hh(d, a, b, c, k[8], 11, -2022574463);
  c = __hh(c, d, a, b, k[11], 16, 1839030562);
  b = __hh(b, c, d, a, k[14], 23, -35309556);
  a = __hh(a, b, c, d, k[1], 4, -1530992060);
  d = __hh(d, a, b, c, k[4], 11, 1272893353);
  c = __hh(c, d, a, b, k[7], 16, -155497632);
  b = __hh(b, c, d, a, k[10], 23, -1094730640);
  a = __hh(a, b, c, d, k[13], 4, 681279174);
  d = __hh(d, a, b, c, k[0], 11, -358537222);
  c = __hh(c, d, a, b, k[3], 16, -722521979);
  b = __hh(b, c, d, a, k[6], 23, 76029189);
  a = __hh(a, b, c, d, k[9], 4, -640364487);
  d = __hh(d, a, b, c, k[12], 11, -421815835);
  c = __hh(c, d, a, b, k[15], 16, 530742520);
  b = __hh(b, c, d, a, k[2], 23, -995338651);

  a = __ii(a, b, c, d, k[0], 6, -198630844);
  d = __ii(d, a, b, c, k[7], 10, 1126891415);
  c = __ii(c, d, a, b, k[14], 15, -1416354905);
  b = __ii(b, c, d, a, k[5], 21, -57434055);
  a = __ii(a, b, c, d, k[12], 6, 1700485571);
  d = __ii(d, a, b, c, k[3], 10, -1894986606);
  c = __ii(c, d, a, b, k[10], 15, -1051523);
  b = __ii(b, c, d, a, k[1], 21, -2054922799);
  a = __ii(a, b, c, d, k[8], 6, 1873313359);
  d = __ii(d, a, b, c, k[15], 10, -30611744);
  c = __ii(c, d, a, b, k[6], 15, -1560198380);
  b = __ii(b, c, d, a, k[13], 21, 1309151649);
  a = __ii(a, b, c, d, k[4], 6, -145523070);
  d = __ii(d, a, b, c, k[11], 10, -1120210379);
  c = __ii(c, d, a, b, k[2], 15, 718787259);
  b = __ii(b, c, d, a, k[9], 21, -343485551);

  x[0] = __add32(a, x[0]);
  x[1] = __add32(b, x[1]);
  x[2] = __add32(c, x[2]);
  x[3] = __add32(d, x[3]);
}

function __cmn(q, a, b, x, s, t) {
  a = __add32(__add32(a, q), __add32(x, t));
  return __add32((a << s) | (a >>> (32 - s)), b);
}

function __ff(a, b, c, d, x, s, t) {
  return __cmn((b & c) | (~b & d), a, b, x, s, t);
}

function __gg(a, b, c, d, x, s, t) {
  return __cmn((b & d) | (c & ~d), a, b, x, s, t);
}

function __hh(a, b, c, d, x, s, t) {
  return __cmn(b ^ c ^ d, a, b, x, s, t);
}

function __ii(a, b, c, d, x, s, t) {
  return __cmn(c ^ (b | ~d), a, b, x, s, t);
}

function __md51(s) {
  var txt = "";
  var n = s.length,
    state = [1732584193, -271733879, -1732584194, 271733878],
    i;
  for (i = 64; i <= s.length; i += 64) {
    __md5cycle(state, __md5blk(s.substring(i - 64, i)));
  }
  s = s.substring(i - 64);
  var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (i = 0; i < s.length; i++)
    tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
  tail[i >> 2] |= 0x80 << (i % 4 << 3);
  if (i > 55) {
    __md5cycle(state, tail);
    for (i = 0; i < 16; i++) tail[i] = 0;
  }
  tail[14] = n * 8;
  __md5cycle(state, tail);
  return state;
}

function __md5blk(s) {
  var md5blks = [],
    i;
  for (i = 0; i < 64; i += 4) {
    md5blks[i >> 2] =
      s.charCodeAt(i) +
      (s.charCodeAt(i + 1) << 8) +
      (s.charCodeAt(i + 2) << 16) +
      (s.charCodeAt(i + 3) << 24);
  }
  return md5blks;
}

var __hex_chr = "0123456789abcdef".split("");

function __rhex(n) {
  var s = "",
    j = 0;
  for (; j < 4; j++)
    s += __hex_chr[(n >> (j * 8 + 4)) & 0x0f] + __hex_chr[(n >> (j * 8)) & 0x0f];
  return s;
}

function __hex(x) {
  for (var i = 0; i < x.length; i++) {
    x[i] = __rhex(x[i]);
  }
  return x.join("");
}

function __add32(a, b) {
  return (a + b) & 0xffffffff;
}

Utils.md5 = function (s) {
  return __hex(__md51(s));
};


// NOTE: This is an implementation of a non-recursive quicksort, which doesn't
// risk any stack overflows. This function is necessary because of a MuJS <=
// 1.0.1 bug which causes a stack overflow when running its built-in sort() on
// any large array. See: https://github.com/ccxvii/mujs/issues/55
// Furthermore, this performs optimized case-insensitive sorting.
Utils.quickSort = function (arr, options) {
  options = options || {};

  var i,
    sortRef,
    caseInsensitive = !!options.caseInsensitive;

  if (caseInsensitive) {
    sortRef = arr.slice(0);
    for (i = sortRef.length - 1; i >= 0; --i)
      if (typeof sortRef[i] === "string") sortRef[i] = sortRef[i].toLowerCase();

    return Utils.quickSort_Run(arr, sortRef);
  }

  return Utils.quickSort_Run(arr);
};

Utils.quickSort_Run = function (arr, sortRef) {
  if (arr.length <= 1) return arr;

  var hasSortRef = !!sortRef;
  if (!hasSortRef) sortRef = arr; // Use arr instead. Makes a direct reference (no copy).

  if (arr.length !== sortRef.length)
    throw "Array and sort-reference length must be identical";

  // Adapted from a great, public-domain C algorithm by Darel Rex Finley.
  // Original implementation: http://alienryderflex.com/quicksort/
  // Ported by VideoPlayerCode and extended to sort via a 2nd reference array,
  // to allow sorting the main array by _any_ criteria via the 2nd array.
  var refPiv,
    arrPiv,
    beg = [],
    end = [],
    stackMax = -1,
    stackPtr = 0,
    L,
    R;

  beg.push(0);
  end.push(sortRef.length);
  ++stackMax; // Tracks highest available stack index.
  while (stackPtr >= 0) {
    L = beg[stackPtr];
    R = end[stackPtr] - 1;
    if (L < R) {
      if (hasSortRef)
        // If we have a SEPARATE sort-ref, mirror actions!
        arrPiv = arr[L];
      refPiv = sortRef[L]; // Left-pivot is fastest, no MuJS math needed!

      while (L < R) {
        while (sortRef[R] >= refPiv && L < R) R--;
        if (L < R) {
          if (hasSortRef) arr[L] = arr[R];
          sortRef[L++] = sortRef[R];
        }
        while (sortRef[L] <= refPiv && L < R) L++;
        if (L < R) {
          if (hasSortRef) arr[R] = arr[L];
          sortRef[R--] = sortRef[L];
        }
      }

      if (hasSortRef) arr[L] = arrPiv;
      sortRef[L] = refPiv;

      if (stackPtr === stackMax) {
        beg.push(0);
        end.push(0); // Grow stacks to fit next elem.
        ++stackMax;
      }

      beg[stackPtr + 1] = L + 1;
      end[stackPtr + 1] = end[stackPtr];
      end[stackPtr++] = L;
    } else {
      stackPtr--;
      // NOTE: No need to shrink stack here. Size-reqs GROW until sorted!
      // (Anyway, MuJS is slow at splice() and wastes time if we shrink.)
    }
  }

  return arr;
};

var __hexSymbols = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
];

Utils.toHex = function (num, outputLength) {
  // Generates a fixed-length output, and handles negative numbers properly.
  var result = "";
  while (outputLength--) {
    result = __hexSymbols[num & 0xf] + result;
    num >>= 4;
  }
  return result;
};

Utils.shuffle = function (arr) {
  var m = arr.length,
    tmp,
    i;

  while (m) {
    // While items remain to shuffle...
    // Pick a remaining element...
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    tmp = arr[m];
    arr[m] = arr[i];
    arr[i] = tmp;
  }

  return arr;
};

Utils.trim = function (str) {
  return str.replace(/(?:^\s+|\s+$)/g, ""); // Trim left and right whitespace.
};

Utils.ltrim = function (str) {
  return str.replace(/^\s+/, ""); // Trim left whitespace.
};

Utils.rtrim = function (str) {
  return str.replace(/\s+$/, ""); // Trim right whitespace.
};


Utils.wlCache = [];

Utils.cacheWL = function() {
  var wlFilesCache = mp.utils.readdir(
    mp.utils.get_user_path("~~/watch_later/"),
    "files"
  );
  for (i = 0; i < wlFilesCache.length; i++) {
    var file = {
      name: wlFilesCache[i],
      content: mp.utils.read_file(
        mp.utils.get_user_path("~~/watch_later/") + wlFilesCache[i]
      ),
    };
    Utils.wlCache.push(file);
  }
}

Utils.getWLData = function() {

  var cFile;
  for (i = 0; i < Number(mp.get_property("playlist/count")); i++) {
    if (mp.get_property("playlist/" + i + "/current") == "yes") {
      cFile = mp.get_property("playlist/" + i + "/filename");
    }
  }
  cFile = Utils.md5(cFile).toUpperCase();

  var wlName;
  var wlContent;

  for (i = 0; i < Utils.wlCache.length; i++) {
    if (Utils.wlCache[i].name == cFile) {
      wlName = Utils.wlCache[i].name;
      wlContent = Utils.wlCache[i].content;
    }
  }

  if (wlContent != undefined) {
    var WLtmp = wlContent.split("\n");

    var cShader;
    var cColor;

    for (i = 0; i < WLtmp.length; i++) {
      var WLtmp2 = WLtmp[i].split("=");
      if (WLtmp2[0].includes("shader")) {
        cShader = WLtmp2[1];
      }
      if (WLtmp2[0].includes("color")) {
        cColor = WLtmp2[1];
      }
    }
    var results = {shader: cShader, color: cColor};
    return results;
  }

}

Utils.writeWLData = function(shader,color) {
  var cFile;
  for (i = 0; i < Number(mp.get_property("playlist/count")); i++) {
    if (mp.get_property("playlist/" + i + "/current") == "yes") {
      cFile = mp.get_property("playlist/" + i + "/filename");
    }
  }
  var WLfile =
    mp.utils.get_user_path("~~/") +
    "/watch_later/" +
    Utils.md5(cFile).toUpperCase();

    if(mp.utils.file_info(WLfile) != undefined)
    {
      var WLtmp = mp.utils.read_file(WLfile);
      var WLtmp = WLtmp + "shader=" + shader + "\n" + "color=" + color + "\n";
      mp.utils.write_file("file://" + WLfile, WLtmp);
    }
}



module.exports = Utils;
