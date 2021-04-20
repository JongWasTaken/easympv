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

function md5cycle(x, k) {
  var a = x[0],
    b = x[1],
    c = x[2],
    d = x[3];

  a = ff(a, b, c, d, k[0], 7, -680876936);
  d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17, 606105819);
  b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  d = ff(d, a, b, c, k[5], 12, 1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341);
  b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416);
  d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063);
  b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682);
  d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290);
  b = ff(b, c, d, a, k[15], 22, 1236535329);

  a = gg(a, b, c, d, k[1], 5, -165796510);
  d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14, 643717713);
  b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  d = gg(d, a, b, c, k[10], 9, 38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335);
  b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438);
  d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961);
  b = gg(b, c, d, a, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14, 1735328473);
  b = gg(b, c, d, a, k[12], 20, -1926607734);

  a = hh(a, b, c, d, k[5], 4, -378558);
  d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16, 1839030562);
  b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  d = hh(d, a, b, c, k[4], 11, 1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632);
  b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174);
  d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979);
  b = hh(b, c, d, a, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487);
  d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16, 530742520);
  b = hh(b, c, d, a, k[2], 23, -995338651);

  a = ii(a, b, c, d, k[0], 6, -198630844);
  d = ii(d, a, b, c, k[7], 10, 1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905);
  b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571);
  d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -1051523);
  b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6, 1873313359);
  d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380);
  b = ii(b, c, d, a, k[13], 21, 1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  d = ii(d, a, b, c, k[11], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15, 718787259);
  b = ii(b, c, d, a, k[9], 21, -343485551);

  x[0] = add32(a, x[0]);
  x[1] = add32(b, x[1]);
  x[2] = add32(c, x[2]);
  x[3] = add32(d, x[3]);
}

function cmn(q, a, b, x, s, t) {
  a = add32(add32(a, q), add32(x, t));
  return add32((a << s) | (a >>> (32 - s)), b);
}

function ff(a, b, c, d, x, s, t) {
  return cmn((b & c) | (~b & d), a, b, x, s, t);
}

function gg(a, b, c, d, x, s, t) {
  return cmn((b & d) | (c & ~d), a, b, x, s, t);
}

function hh(a, b, c, d, x, s, t) {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a, b, c, d, x, s, t) {
  return cmn(c ^ (b | ~d), a, b, x, s, t);
}

function md51(s) {
  var txt = "";
  var n = s.length,
    state = [1732584193, -271733879, -1732584194, 271733878],
    i;
  for (i = 64; i <= s.length; i += 64) {
    md5cycle(state, md5blk(s.substring(i - 64, i)));
  }
  s = s.substring(i - 64);
  var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (i = 0; i < s.length; i++)
    tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
  tail[i >> 2] |= 0x80 << (i % 4 << 3);
  if (i > 55) {
    md5cycle(state, tail);
    for (i = 0; i < 16; i++) tail[i] = 0;
  }
  tail[14] = n * 8;
  md5cycle(state, tail);
  return state;
}

function md5blk(s) {
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

var hex_chr = "0123456789abcdef".split("");

function rhex(n) {
  var s = "",
    j = 0;
  for (; j < 4; j++)
    s += hex_chr[(n >> (j * 8 + 4)) & 0x0f] + hex_chr[(n >> (j * 8)) & 0x0f];
  return s;
}

function hex(x) {
  for (var i = 0; i < x.length; i++) {
    x[i] = rhex(x[i]);
  }
  return x.join("");
}

function add32(a, b) {
  return (a + b) & 0xffffffff;
}

Utils.md5 = function (s) {
  return hex(md51(s));
};

// this was just for testing, do not use it
Utils.sleep = function (ms) {
  // DO NOT USE THIS, IT WILL MAX OUT THE CPU
  var unixtime_ms = new Date().getTime();
  while (new Date().getTime() < unixtime_ms + ms) {}
};
Utils.keyhold = function (key, duration) {
  // not working
  mp.commandv("keydown", key);
  setTimeout(function () {
    mp.commandv("keyup", key);
  }, duration);
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

Utils.isInt = function (value) {
  // Verify that the input is an integer (whole number).
  return typeof value !== "number" || isNaN(value)
    ? false
    : (value | 0) === value;
};

Utils._hexSymbols = [
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
    result = Utils._hexSymbols[num & 0xf] + result;
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

Utils.dump = function (value) {
  mp.msg.error(JSON.stringify(value));
};

Utils.benchmarkStart = function (textLabel) {
  Utils.benchmarkTimestamp = mp.get_time();
  Utils.benchmarkTextLabel = textLabel;
};

Utils.benchmarkEnd = function () {
  var now = mp.get_time(),
    start = Utils.benchmarkTimestamp ? Utils.benchmarkTimestamp : now,
    elapsed = now - start,
    label =
      typeof Utils.benchmarkTextLabel === "string"
        ? Utils.benchmarkTextLabel
        : "";
  mp.msg.info(
    "Time Elapsed (Benchmark" +
      (label.length ? ": " + label : "") +
      "): " +
      elapsed +
      " seconds."
  );
};

module.exports = Utils;
