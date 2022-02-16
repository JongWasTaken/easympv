/*
 * UTILS.JS (MODULE)
 *
 * Author:                  Jong
 * URL:                     http://smto.pw/mpv
 * License:                 MIT License
 */

/*----------------------------------------------------------------
The Utils.js module

This file contains all the miscellaneous functions that 
don't really fit anywhere else, such as opening/executing files,
hashing strings to MD5, operations on the watch_later folder,
and other "nice to have" things.

It also determines the current Operating System.
----------------------------------------------------------------*/

"use strict";

var Utils = {};

// Determine OS: win, linux or mac
// Uses %OS% on Windows, $OSTYPE on every other platform
Utils.os = undefined;
if (mp.utils.getenv("OS") == "Windows_NT") {
	Utils.os = "win";
	mp.msg.info("Detected operating system: Windows");
} else if (mp.utils.getenv("OSTYPE") == "linux-gnu") {
	Utils.os = "linux";
	mp.msg.info("Detected operating system: Linux");
	mp.msg.warn(
		"Linux support is experimental. Here be dragons and all that..."
	);
} else if (mp.utils.getenv("OSTYPE") == "freebsd") {
	Utils.os = "linux";
	mp.msg.info("Detected operating system: FreeBSD");
	mp.msg.warn(
		"It appears that you are running on FreeBSD. I have never used that OS, so i will just assume its not much different from Linux. Don't expect anything to work at all!"
	);
} else if (mp.utils.getenv("OSTYPE") == "darwin") {
	Utils.os = "mac";
	mp.msg.info("Detected operating system: macOS");
	mp.msg.error("macOS is not officially supported and never will be.");
}

Utils.mpvVersion = mp.get_property("mpv-version").substring(4).split("-")[0];
Utils.mpvComparableVersion = Number(Utils.mpvVersion.substring(2));
//Utils.ffmpegVersion = mp.get_property("ffmpeg-version");
//Utils.libassVersion = mp.get_property("libass-version");

// Open file relative to config root. Could also run applications.
Utils.openFile = function (file) {
	file = mp.utils.get_user_path("~~/") + "/" + file;
	file = file.replaceAll('"+"', "/");
	if (Utils.os == "win") {
		file = file.replaceAll("/", "\\");
		mp.commandv("run", "cmd", "/c", "start " + file);
	} else if (Utils.os == "mac") {
		mp.msg.info("macOS is not supported.");
		mp.commandv("run", "zsh", "-c", '"open ' + file + '"');
	} else if (Utils.os == "linux") {
		mp.commandv("run", "bash", "-c", '"xdg-open ' + file + '"');
	}
	mp.msg.info("Opening file: " + file);
};

// Run the external Utility with arguments
Utils.externalUtil = function (arg) {
	var utilName = "easympv-cli";
	mp.msg.info("Starting utility with arguments: " + arg);
	if (Utils.os == "win") {
		var util = mp.utils.get_user_path("~~/") + "/" + utilName + ".exe";
		util = util.replaceAll("+", "/");
		util = util.replaceAll("/", "\\");
		mp.commandv("run", "cmd", "/c", util + " " + arg);
	} else if (Utils.os == "mac") {
		mp.msg.info("macOS is not supported.");
		var util = mp.utils.get_user_path("~~/") + "/" + utilName;
		// below is a workaround for a old mpv bug
		// where arguments would not be passed correctly to the subprocess,
		// it might not be needed anymore
		var largs = arg.split(" ");
		if (largs.length == 1) {
			mp.commandv("run", util, largs[0]);
		} else if (largs.length == 2) {
			mp.commandv("run", util, largs[0], largs[1]);
		} else if (largs.length == 3) {
			mp.commandv("run", util, largs[0], largs[1], largs[2]);
		} else if (largs.length == 4) {
			mp.commandv("run", util, largs[0], largs[1], largs[2], largs[3]);
		}
	} else if (Utils.os == "linux") {
		var util = mp.utils.get_user_path("~~/") + "/" + utilName;
		// below is a workaround for a old mpv bug
		// where arguments would not be passed correctly to the subprocess,
		// it might not be needed anymore
		var largs = arg.split(" ");
		if (largs.length == 1) {
			mp.commandv("run", util, largs[0]);
		} else if (largs.length == 2) {
			mp.commandv("run", util, largs[0], largs[1]);
		} else if (largs.length == 3) {
			mp.commandv("run", util, largs[0], largs[1], largs[2]);
		} else if (largs.length == 4) {
			mp.commandv("run", util, largs[0], largs[1], largs[2], largs[3]);
		}
	}
};

// Clears watch_later folder but keeps the dummy file 00000000000000000000000000000000
Utils.clearWatchdata = function () {
	mp.msg.info("Clearing watchdata");
	var folder = mp.utils.get_user_path("~~/watch_later");
	if (Utils.os == "win") {
		folder = folder.replaceAll("/", "\\");
		mp.commandv(
			"run",
			"cmd",
			"/c",
			"" +
				"copy " +
				folder.replaceAll("/", "\\") +
				"\\00000000000000000000000000000000 " +
				mp.utils.get_user_path("~~/").replaceAll("/", "\\") +
				" && " +
				"del /Q /S " +
				folder.replaceAll("/", "\\") +
				" && " +
				"copy " +
				mp.utils.get_user_path("~~/").replaceAll("/", "\\") +
				"\\00000000000000000000000000000000 " +
				folder.replaceAll("/", "\\") +
				"\\00000000000000000000000000000000" +
				" && " +
				"del /Q " +
				mp.utils.get_user_path("~~/").replaceAll("/", "\\") +
				"\\00000000000000000000000000000000"
		);
	} else if (Utils.os == "mac") {
		mp.msg.info("macOS is not supported.");
		//mp.commandv("run","zsh","-c","rm -rf " + folder);
	} else if (Utils.os == "linux") {
		mp.commandv(
			"run",
			"cp",
			folder + "/00000000000000000000000000000000",
			mp.utils.get_user_path("~~/")
		);
		mp.commandv("run", "rm", "-rf", folder);
		mp.commandv("run", "mkdir", folder);
		mp.commandv(
			"run",
			"cp",
			mp.utils.get_user_path("~~/") + "/00000000000000000000000000000000",
			folder
		);
		mp.commandv(
			"run",
			"rm",
			"-rf",
			mp.utils.get_user_path("~~/") + "/00000000000000000000000000000000"
		);
	}
};

// The entire section below is dedicated to implementing a fast MD5 hashing algorithm in native JS.
// It is copy-pasted from here: https://gist.github.com/jhoff/7680711 / http://www.myersdaily.org/joseph/javascript/md5-text.html
// There is no license for this, but the source site is ancient and has no mention of one, so i think this is fine.
// MD5 block starts //
var md5cycle = function (x, k) {
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
};

var cmn = function (q, a, b, x, s, t) {
	a = add32(add32(a, q), add32(x, t));
	return add32((a << s) | (a >>> (32 - s)), b);
};

var ff = function (a, b, c, d, x, s, t) {
	return cmn((b & c) | (~b & d), a, b, x, s, t);
};

var gg = function (a, b, c, d, x, s, t) {
	return cmn((b & d) | (c & ~d), a, b, x, s, t);
};

var hh = function (a, b, c, d, x, s, t) {
	return cmn(b ^ c ^ d, a, b, x, s, t);
};

var ii = function (a, b, c, d, x, s, t) {
	return cmn(c ^ (b | ~d), a, b, x, s, t);
};

var add32 = function (a, b) {
	return (a + b) & 0xffffffff;
};

var md51 = function (s) {
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
};

var md5blk = function (s) {
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
};

var hex_chr = "0123456789abcdef".split("");

var rhex = function (n) {
	var s = "",
		j = 0;
	for (; j < 4; j++)
		s +=
			hex_chr[(n >> (j * 8 + 4)) & 0x0f] + hex_chr[(n >> (j * 8)) & 0x0f];
	return s;
};

var hex = function (x) {
	for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]);
	return x.join("");
};
// MD5 block ends //

// Call this function to get a MD5 hash
Utils.md5 = function (s) {
	return hex(md51(s));
};

// This function caches the entirety of the watch_later folder
// Because that sounds like a terrible idea, it is capped to 999 files max.
Utils.wlCache = [];
Utils.cacheWL = function () {
	if (
		mp.utils.file_info(mp.utils.get_user_path("~~/watch_later/")) !=
		undefined
	) {
		var wlFilesCache = mp.utils.readdir(
			mp.utils.get_user_path("~~/watch_later/"),
			"files"
		);
		for (i = 0; i < wlFilesCache.length; i++) {
			if (i < 1000) {
				var file = {
					name: wlFilesCache[i],
					content: mp.utils.read_file(
						mp.utils.get_user_path("~~/watch_later/") +
							wlFilesCache[i]
					),
				};
				Utils.wlCache.push(file);
			} else {
				break;
			}
		}
	}
};

// This function parses the wlCache and returns the parsed values.
// (currently only the shaderset and colorset)
Utils.getWLData = function () {
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
		var results = { shader: cShader, color: cColor };
		return results;
	}
};

// This function finds the current videos wlFile and writes a shaderset and colorset to it.
// (this causes mpv to report unknown values the next time it parses the file,
//  but thats only cosmetic)
Utils.writeWLData = function (shader, color) {
	var cFile;
	for (i = 0; i < Number(mp.get_property("playlist/count")); i++) {
		if (mp.get_property("playlist/" + i + "/current") == "yes") {
			cFile = mp.get_property("playlist/" + i + "/filename");
		}
	}
	if (cFile != undefined) {
		var WLfile =
			mp.utils.get_user_path("~~/") +
			"/watch_later/" +
			Utils.md5(cFile).toUpperCase();

		if (mp.utils.file_info(WLfile) != undefined) {
			var WLtmp = mp.utils.read_file(WLfile);
			var WLtmp =
				WLtmp + "shader=" + shader + "\n" + "color=" + color + "\n";
			mp.utils.write_file("file://" + WLfile, WLtmp);
		}
	}
};
module.exports = Utils;
