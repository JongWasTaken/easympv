/*
 * BROWSERS.JS (MODULE)
 *
 * Author:              Jong
 * URL:                 https://smto.pw/mpv
 * License:             MIT License
 *
 */

/*----------------------------------------------------------------
The Browsers.js module

This file contains premade menus that act as browsers for
files, disc drives and devices.
There is a lot of spaghetti here, read at your own risk.
Comments are also missing.
----------------------------------------------------------------*/

var MenuSystem = require("./MenuSystem");
var Utils = require("./Utils");
var WindowSystem = require("./WindowSystem");
var SSA = require("./SSAHelper");

/**
 * Module containing Browser menus for Files, Disc drives, Devices & URLs.
 */
var Browsers = {};

Browsers.Selector = {};
Browsers.FileBrowser = {};
Browsers.DriveBrowser = {};
Browsers.DeviceBrowser = {};

Browsers.Selector.menu = undefined;
Browsers.Selector.menuSettings = {};
Browsers.Selector.cachedParentMenu = undefined;

Browsers.FileBrowser.currentLocation = undefined;
Browsers.FileBrowser.menu = undefined;
Browsers.FileBrowser.menuSettings = { autoClose: 0, scrollingEnabled: true };
Browsers.FileBrowser.cachedParentMenu = undefined;

Browsers.DriveBrowser.menu = undefined;
Browsers.DriveBrowser.menuSettings = {
    autoClose: 0,
    scrollingEnabled: true,
    scrollingPosition: 8,
};
Browsers.DriveBrowser.cachedParentMenu = undefined;
Browsers.DriveBrowser.menuMode = "list";
Browsers.DriveBrowser.cachedDriveName = "";

Browsers.DeviceBrowser.menu = undefined;
Browsers.DeviceBrowser.menuSettings = {
    autoClose: 0,
    scrollingEnabled: true,
    scrollingPosition: 8,
};
Browsers.DeviceBrowser.cachedParentMenu = undefined;

Browsers.FileBrowser.fileExtensionWhitelist = [
    //DVD/Blu-ray audio formats
    { type: "audio", name: "AC-3 Audio", extension: ".ac3" },
    { type: "audio", name: "AC-3 Audio", extension: ".a52" },
    { type: "audio", name: "E-AC-3 Audio", extension: ".eac3" },
    { type: "audio", name: "MLP Audio", extension: ".mlp" },
    { type: "audio", name: "DTS Audio", extension: ".dts" },
    { type: "audio", name: "DTS-HD Audio", extension: ".dts-hd" },
    { type: "audio", name: "DTS-HD Audio", extension: ".dtshd" },
    { type: "audio", name: "TrueHD Audio", extension: ".true-hd" },
    { type: "audio", name: "TrueHD Audio", extension: ".thd" },
    { type: "audio", name: "TrueHD Audio", extension: ".truehd" },
    { type: "audio", name: "TrueHD Audio", extension: ".thd+ac3" },
    { type: "audio", name: "True Audio", extension: ".tta" },

    //Uncompressed formats
    { type: "audio", name: "PCM Audio", extension: ".pcm" },
    { type: "audio", name: "Wave Audio", extension: ".wav" },
    { type: "audio", name: "AIFF Audio", extension: ".aiff" },
    { type: "audio", name: "AIFF Audio", extension: ".aif" },
    { type: "audio", name: "AIFF Audio", extension: ".aifc" },
    { type: "audio", name: "AMR Audio", extension: ".amr" },
    { type: "audio", name: "AMR-WB Audio", extension: ".awb" },
    { type: "audio", name: "AU Audio", extension: ".au" },
    { type: "audio", name: "AU Audio", extension: ".snd" },
    { type: "audio", name: "Linear PCM Audio", extension: ".lpcm" },
    { type: "video", name: "Raw YUV Video", extension: ".yuv" },
    { type: "video", name: "YUV4MPEG2 Video", extension: ".y4m" },

    //Free lossless formats
    { type: "audio", name: "Monkey's Audio", extension: ".ape" },
    { type: "audio", name: "WavPack Audio", extension: ".wv" },
    { type: "audio", name: "Shorten Audio", extension: ".shn" },

    //MPEG formats
    { type: "video", name: "MPEG-2 Transport Stream", extension: ".m2ts" },
    { type: "video", name: "MPEG-2 Transport Stream", extension: ".m2t" },
    { type: "video", name: "MPEG-2 Transport Stream", extension: ".mts" },
    { type: "video", name: "MPEG-2 Transport Stream", extension: ".mtv" },
    { type: "video", name: "MPEG-2 Transport Stream", extension: ".ts" },
    { type: "video", name: "MPEG-2 Transport Stream", extension: ".tsv" },
    { type: "video", name: "MPEG-2 Transport Stream", extension: ".tsa" },
    { type: "video", name: "MPEG-2 Transport Stream", extension: ".tts" },
    { type: "video", name: "MPEG-2 Transport Stream", extension: ".trp" },
    { type: "audio", name: "ADTS Audio", extension: ".adts" },
    { type: "audio", name: "ADTS Audio", extension: ".adt" },
    { type: "audio", name: "MPEG Audio", extension: ".mpa" },
    { type: "audio", name: "MPEG Audio", extension: ".m1a" },
    { type: "audio", name: "MPEG Audio", extension: ".m2a" },
    { type: "audio", name: "MPEG Audio", extension: ".mp1" },
    { type: "audio", name: "MPEG Audio", extension: ".mp2" },
    { type: "audio", name: "MP3 Audio", extension: ".mp3" },
    { type: "video", name: "MPEG Video", extension: ".mpeg" },
    { type: "video", name: "MPEG Video", extension: ".mpg" },
    { type: "video", name: "MPEG Video", extension: ".mpe" },
    { type: "video", name: "MPEG Video", extension: ".mpeg2" },
    { type: "video", name: "MPEG Video", extension: ".m1v" },
    { type: "video", name: "MPEG Video", extension: ".m2v" },
    { type: "video", name: "MPEG Video", extension: ".mp2v" },
    { type: "video", name: "MPEG Video", extension: ".mpv" },
    { type: "video", name: "MPEG Video", extension: ".mpv2" },
    { type: "video", name: "MPEG Video", extension: ".mod" },
    { type: "video", name: "MPEG Video", extension: ".tod" },
    { type: "video", name: "Video Object", extension: ".vob" },
    { type: "video", name: "Video Object", extension: ".vro" },
    { type: "video", name: "Enhanced VOB", extension: ".evob" },
    { type: "video", name: "Enhanced VOB", extension: ".evo" },
    { type: "video", name: "MPEG-4 Video", extension: ".mpeg4" },
    { type: "video", name: "MPEG-4 Video", extension: ".m4v" },
    { type: "video", name: "MPEG-4 Video", extension: ".mp4" },
    { type: "video", name: "MPEG-4 Video", extension: ".mp4v" },
    { type: "video", name: "MPEG-4 Video", extension: ".mpg4" },
    { type: "audio", name: "MPEG-4 Audio", extension: ".m4a" },
    { type: "audio", name: "Raw AAC Audio", extension: ".aac" },
    { type: "video", name: "Raw H.264/AVC Video", extension: ".h264" },
    { type: "video", name: "Raw H.264/AVC Video", extension: ".avc" },
    { type: "video", name: "Raw H.264/AVC Video", extension: ".x264" },
    { type: "video", name: "Raw H.264/AVC Video", extension: ".264" },
    { type: "video", name: "Raw H.265/HEVC Video", extension: ".hevc" },
    { type: "video", name: "Raw H.265/HEVC Video", extension: ".h265" },
    { type: "video", name: "Raw H.265/HEVC Video", extension: ".x265" },
    { type: "video", name: "Raw H.265/HEVC Video", extension: ".265" },

    //Xiph formats
    { type: "audio", name: "FLAC Audio", extension: ".flac" },
    { type: "audio", name: "Ogg Audio", extension: ".oga" },
    { type: "audio", name: "Ogg Audio", extension: ".ogg" },
    { type: "audio", name: "Opus Audio", extension: ".opus" },
    { type: "audio", name: "Speex Audio", extension: ".spx" },
    { type: "video", name: "Ogg Video", extension: ".ogv" },
    { type: "video", name: "Ogg Video", extension: ".ogm" },
    { type: "video", name: "Ogg Video", extension: ".ogx" },

    //Matroska formats
    { type: "video", name: "Matroska Video", extension: ".mkv" },
    { type: "video", name: "Matroska 3D Video", extension: ".mk3d" },
    { type: "audio", name: "Matroska Audio", extension: ".mka" },
    { type: "video", name: "WebM Video", extension: ".webm" },
    { type: "audio", name: "WebM Audio", extension: ".weba" },

    //Misc formats
    { type: "video", name: "Video Clip", extension: ".avi" },
    { type: "video", name: "Video Clip", extension: ".vfw" },
    { type: "video", name: "DivX Video", extension: ".divx" },
    { type: "video", name: "3ivx Video", extension: ".3iv" },
    { type: "video", name: "XVID Video", extension: ".xvid" },
    { type: "video", name: "NUT Video", extension: ".nut" },
    { type: "video", name: "FLIC Video", extension: ".flic" },
    { type: "video", name: "FLIC Video", extension: ".fli" },
    { type: "video", name: "FLIC Video", extension: ".flc" },
    { type: "video", name: "Nullsoft Streaming Video", extension: ".nsv" },
    { type: "video", name: "General Exchange Format", extension: ".gxf" },
    { type: "video", name: "Material Exchange Format", extension: ".mxf" },

    //Windows Media formats
    { type: "audio", name: "Windows Media Audio", extension: ".wma" },
    { type: "video", name: "Windows Media Video", extension: ".wm" },
    { type: "video", name: "Windows Media Video", extension: ".wmv" },
    { type: "video", name: "Windows Media Video", extension: ".asf" },
    { type: "video", name: "Microsoft Recorded TV Show", extension: ".dvr-ms" },
    { type: "video", name: "Microsoft Recorded TV Show", extension: ".dvr" },
    { type: "video", name: "Windows Recorded TV Show", extension: ".wtv" },

    //DV formats
    { type: "video", name: "DV Video", extension: ".dv" },
    { type: "video", name: "DV Video", extension: ".hdv" },

    //Flash Video formats
    { type: "video", name: "Flash Video", extension: ".flv" },
    { type: "video", name: "Flash Video", extension: ".f4v" },
    { type: "audio", name: "Flash Audio", extension: ".f4a" },

    //QuickTime formats
    { type: "video", name: "QuickTime Video", extension: ".qt" },
    { type: "video", name: "QuickTime Video", extension: ".mov" },
    { type: "video", name: "QuickTime HD Video", extension: ".hdmov" },

    //Real Media formats
    { type: "video", name: "Real Media Video", extension: ".rm" },
    { type: "video", name: "Real Media Video", extension: ".rmvb" },
    { type: "audio", name: "Real Media Audio", extension: ".ra" },
    { type: "audio", name: "Real Media Audio", extension: ".ram" },

    //3GPP formats
    { type: "audio", name: "3GPP Audio", extension: ".3ga" },
    { type: "audio", name: "3GPP Audio", extension: ".3ga2" },
    { type: "video", name: "3GPP Video", extension: ".3gpp" },
    { type: "video", name: "3GPP Video", extension: ".3gp" },
    { type: "video", name: "3GPP Video", extension: ".3gp2" },
    { type: "video", name: "3GPP Video", extension: ".3g2" },

    //Video game formats
    { type: "audio", name: "AY Audio", extension: ".ay" },
    { type: "audio", name: "GBS Audio", extension: ".gbs" },
    { type: "audio", name: "GYM Audio", extension: ".gym" },
    { type: "audio", name: "HES Audio", extension: ".hes" },
    { type: "audio", name: "KSS Audio", extension: ".kss" },
    { type: "audio", name: "NSF Audio", extension: ".nsf" },
    { type: "audio", name: "NSFE Audio", extension: ".nsfe" },
    { type: "audio", name: "SAP Audio", extension: ".sap" },
    { type: "audio", name: "SPC Audio", extension: ".spc" },
    { type: "audio", name: "VGM Audio", extension: ".vgm" },
    { type: "audio", name: "VGZ Audio", extension: ".vgz" },

    //Playlist formats
    { type: "audio", name: "M3U Playlist", extension: ".m3u" },
    { type: "audio", name: "M3U Playlist", extension: ".m3u8" },
    { type: "audio", name: "PLS Playlist", extension: ".pls" },
    { type: "audio", name: "CUE Sheet", extension: ".cue" },
];

Browsers.Selector.menuEventHandler = function (event, item) {
    if (event == "enter") {
        Browsers.Selector.menu.hideMenu();
        Browsers.Selector.menu = undefined;

        if (item == "file") {
            Browsers.FileBrowser.open(Browsers.Selector.cachedParentMenu);
        } else if (item == "disc") {
            Browsers.DriveBrowser.open(Browsers.Selector.cachedParentMenu);
        } else if (item == "device") {
            Browsers.DeviceBrowser.open(Browsers.Selector.cachedParentMenu);
        } else if (item == "url") {
            var handleURL = function (success, input) {
                if (success) {
                    if (input.includes("://")) {
                        if (input.includes("&list=")) {
                            mp.commandv("loadlist", input);
                        } else {
                            mp.commandv("loadfile", input);
                        }
                        Utils.showAlert("info", "URL is being loaded!");
                    }
                    else
                    {
                        Utils.showAlert("info", "Input is not a valid URL!");
                    }
                }
            }
            Utils.Input.show(handleURL,"URL: ");
            /*
            Utils.showAlert("info", "URL Input window has opened!");
            if (Utils.OSisWindows) {
                var args = [
                    "powershell",
                    "-executionpolicy",
                    "bypass",
                    mp.utils
                        .get_user_path(
                            "~~/scripts/easympv/WindowsCompat.ps1"
                        )
                        .replaceAll("/", "\\"),
                    "show-url-box",
                ];
            } else {
                var args = [
                    "sh",
                    "-c",
                    mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh") +
                        " show-url-box",
                ];
            }
            mp.command_native_async({
                name: "subprocess",
                playback_only: false,
                capture_stdout: true,
                args: args
            }, handleURL);
            */
        }
    }
};

Browsers.Selector.open = function (parentMenu) {
    if (parentMenu == undefined) {
        parentMenu = Browsers.Selector.cachedParentMenu;
    } else {
        Browsers.Selector.cachedParentMenu = parentMenu;
    }

    var items = [];

    items.push({
        title: SSA.insertSymbolFA(" ", 26, 30) + "File",
        item: "file",
        color: "ffffff",
    });
    items.push({
        title: SSA.insertSymbolFA(" ", 26, 30) + "Disc",
        item: "disc",
        color: "ffffff",
    });
    items.push({
        title: SSA.insertSymbolFA(" ", 26, 30) + "Device",
        item: "device",
        color: "ffffff",
    });
    items.push({
        title: SSA.insertSymbolFA(" ", 26, 30) + "URL",
        item: "url",
        color: "ffffff",
    });

    Browsers.Selector.menuSettings.title = "Select Content Type";
    Browsers.Selector.menuSettings.description = "What do you want to open?";
    Browsers.Selector.menu = new MenuSystem.Menu(
        Browsers.Selector.menuSettings,
        items,
        parentMenu
    );
    Browsers.Selector.menu.eventHandler = Browsers.Selector.menuEventHandler;
    Browsers.Selector.menu.showMenu();
};

Browsers.FileBrowser.openFileSafe = function (filename) {
    for (
        var i = 0;
        i < Browsers.FileBrowser.fileExtensionWhitelist.length;
        i++
    ) {
        if (
            filename.includes(
                Browsers.FileBrowser.fileExtensionWhitelist[i].extension
            )
        ) {
            Utils.showAlert(
                "info",
                "Playing " +
                    Browsers.FileBrowser.fileExtensionWhitelist[i].name +
                    " file: " + filename
            );
            mp.commandv(
                "loadfile",
                Browsers.FileBrowser.currentLocation +
                    Utils.directorySeperator +
                    filename
            );
            Browsers.FileBrowser.menu.hideMenu();
            Browsers.FileBrowser.menu = undefined;
            break;
        }
    }
};

Browsers.FileBrowser.getParentDirectory = function () {
    var newDir = "";
    var workDir = Browsers.FileBrowser.currentLocation;
    if (workDir.charAt(workDir.length - 1) == Utils.directorySeperator) {
        workDir = workDir.substring(0, workDir.length - 1);
    }
    var workDirTree = workDir.split(Utils.directorySeperator);

    if (Utils.OS != "win" && workDirTree.length < 3) {
        workDirTree[0] = "/";
    }

    for (var i = 0; i < workDirTree.length - 1; i++) {
        if (i == 0) {
            newDir = workDirTree[0];
        } else {
            newDir = newDir + Utils.directorySeperator + workDirTree[i];
        }
    }

    if (newDir.charAt(newDir.length - 1) == ":") {
        newDir += Utils.directorySeperator;
    }

    return newDir;
};

Browsers.FileBrowser.changeDirectory = function (directory) {
    Browsers.FileBrowser.currentLocation = directory.replaceAll(
        Utils.directorySeperator + Utils.directorySeperator,
        Utils.directorySeperator
    );
    Browsers.FileBrowser.menu.hideMenu();
    Browsers.FileBrowser.menu = undefined;
    Browsers.FileBrowser.open();
};

Browsers.FileBrowser.menuEventHandler = function (event, item) {
    if (event == "enter") {
        if (item == ".." + Utils.directorySeperator) {
            if (
                Utils.OSisWindows &&
                Browsers.FileBrowser.currentLocation.charAt(
                    Browsers.FileBrowser.currentLocation.length - 2
                ) == ":"
            ) {
                Browsers.FileBrowser.changeDirectory("@DRIVESELECTOR@");
            } else {
                Browsers.FileBrowser.changeDirectory(
                    Browsers.FileBrowser.getParentDirectory()
                );
            }
        } else {
            if (
                Utils.OSisWindows &&
                Browsers.FileBrowser.currentLocation == "@DRIVESELECTOR@"
            ) {
                var isFolder = true;
            } else {
                // turns out mp.file_info can return undefined in rare edgecases
                // this fixes a bug where opening a mount folder of an unmounted drive would crash everything
                var temp = mp.utils.file_info(
                    Browsers.FileBrowser.currentLocation +
                        Utils.directorySeperator +
                        item
                );
                if (temp != undefined) {
                    var isFolder = temp.is_dir;
                } else {
                    var isFolder = true;
                }
            }

            if (isFolder) {
                if (
                    Utils.OSisWindows &&
                    Browsers.FileBrowser.currentLocation == "@DRIVESELECTOR@"
                ) {
                    Browsers.FileBrowser.changeDirectory(item);
                } else {
                    Browsers.FileBrowser.changeDirectory(
                        Browsers.FileBrowser.currentLocation +
                            Utils.directorySeperator +
                            item
                    );
                }
            } else {
                Browsers.FileBrowser.openFileSafe(item);
            }
        }
    }
};
Browsers.FileBrowser.open = function (parentMenu) {
    if (parentMenu == undefined) {
        parentMenu = Browsers.FileBrowser.cachedParentMenu;
    } else {
        Browsers.FileBrowser.cachedParentMenu = parentMenu;
    }

    var items = [];

    if (
        Utils.OSisWindows &&
        Browsers.FileBrowser.currentLocation == "@DRIVESELECTOR@"
    ) {
        // Local Drives are type 3
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
                "get-drive-local",
            ],
        });

        if (r.status == "0") {
            drives = r.stdout.split("|");
            if (drives[0].trim() != "") {
                drives.sort();
                for (var i = 0; i < drives.length; i++) {
                    items.push({
                        title:
                            SSA.insertSymbolFA(" ", 26, 30) +
                            drives[i].trim() +
                            "\\",
                        item: drives[i].trim() + "\\",
                        color: "ffffff",
                    });
                }
            }
        }

        // USB Drives are type 2
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
                "get-drive-usb",
            ],
        });

        if (r.status == "0") {
            drives = r.stdout.split("|");
            if (drives[0].trim() != "") {
                drives.sort();
                for (var i = 0; i < drives.length; i++) {
                    items.push({
                        title:
                            SSA.insertSymbolFA(" ", 26, 30) +
                            drives[i].trim() +
                            "\\",
                        item: drives[i].trim() + "\\",
                        color: "ffffff",
                    });
                }
            }
        }

        // Network Drives are type 4
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
                "get-drive-network",
            ],
        });

        if (r.status == "0") {
            drives = r.stdout.split("|");
            if (drives[0].trim() != "") {
                drives.sort();
                for (var i = 0; i < drives.length; i++) {
                    items.push({
                        title:
                            SSA.insertSymbolFA(" ", 26, 30) +
                            drives[i].trim() +
                            "\\",
                        item: drives[i].trim() + "\\",
                        color: "ffffff",
                    });
                }
            }
        }
    } else {
        if (mp.utils.file_info(Browsers.FileBrowser.currentLocation) != undefined) {
            var currentLocationFolders = mp.utils.readdir(
                Browsers.FileBrowser.currentLocation,
                "dirs"
            );
            currentLocationFolders.sort();
        } else {
            Browsers.FileBrowser.currentLocation = mp.get_property("working-directory");
            var currentLocationFolders = mp.utils.readdir(
                Browsers.FileBrowser.currentLocation,
                "dirs"
            );
            currentLocationFolders.sort();
        }


        if (Utils.OS != "win" && Browsers.FileBrowser.currentLocation == "/") {
        } else {
            items.push({
                title:
                    SSA.insertSymbolFA(" ", 30, 30) +
                    ".." +
                    Utils.directorySeperator,
                item: ".." + Utils.directorySeperator,
                color: "909090",
            });
        }
        for (var i = 0; i < currentLocationFolders.length; i++) {
            if (currentLocationFolders[i].charAt(0) == ".") {
                if (Settings.Data.showHiddenFiles) {
                    var title = currentLocationFolders[i];
                    if (title.length >= 32) {
                        title = title.substring(0, 50) + "...";
                    }

                    items.push({
                        title:
                            SSA.insertSymbolFA(" ", 26, 30) +
                            title +
                            Utils.directorySeperator,
                        item:
                            currentLocationFolders[i] +
                            Utils.directorySeperator,
                        color: "FFFF90",
                    });
                }
            } else {
                var title = currentLocationFolders[i];
                if (title.length >= 32) {
                    title = title.substring(0, 50) + "...";
                }

                items.push({
                    title:
                        SSA.insertSymbolFA(" ", 26, 30) +
                        title +
                        Utils.directorySeperator,
                    item: currentLocationFolders[i] + Utils.directorySeperator,
                    color: "FFFF90",
                });
            }
        }
        var currentLocationFiles = mp.utils.readdir(
            Browsers.FileBrowser.currentLocation,
            "files"
        );
        currentLocationFiles.sort();
        for (var i = 0; i < currentLocationFiles.length; i++) {
            if (currentLocationFiles[i].charAt(0) == ".") {
                if (Settings.Data.showHiddenFiles) {
                    var color = "909090";

                    for (
                        var t = 0;
                        t < Browsers.FileBrowser.fileExtensionWhitelist.length;
                        t++
                    ) {
                        if (
                            currentLocationFiles[i].includes(
                                Browsers.FileBrowser.fileExtensionWhitelist[t]
                                    .extension
                            )
                        ) {
                            color = "ffffff";
                            break;
                        }
                    }

                    var title = currentLocationFiles[i];
                    if (title.length >= 32) {
                        title = title.substring(0, 50) + "...";
                    }

                    items.push({
                        title: SSA.insertSymbolFA(" ", 26, 30) + title,
                        item: currentLocationFiles[i],
                        color: color,
                    });
                }
            } else {
                var color = "909090";

                for (
                    var j = 0;
                    j < Browsers.FileBrowser.fileExtensionWhitelist.length;
                    j++
                ) {
                    if (
                        currentLocationFiles[i].includes(
                            Browsers.FileBrowser.fileExtensionWhitelist[j]
                                .extension
                        )
                    ) {
                        color = "ffffff";
                        break;
                    }
                }

                var title = currentLocationFiles[i];
                if (title.length >= 32) {
                    title = title.substring(0, 50) + "...";
                }

                items.push({
                    title: SSA.insertSymbolFA(" ", 26, 30) + title,
                    item: currentLocationFiles[i],
                    color: color,
                });
            }
        }
    }

    Browsers.FileBrowser.menuSettings.title = "File Browser";
    Browsers.FileBrowser.menuSettings.description =
        "Select a file to open.@br@Current directory: " +
        Browsers.FileBrowser.currentLocation.replaceAll(
            "@DRIVESELECTOR@",
            "Drive Selection"
        );
    Browsers.FileBrowser.menu = new MenuSystem.Menu(
        Browsers.FileBrowser.menuSettings,
        items,
        parentMenu
    );
    Browsers.FileBrowser.menu.eventHandler =
        Browsers.FileBrowser.menuEventHandler;
    Browsers.FileBrowser.menu.showMenu();
};

Browsers.DriveBrowser.menuEventHandler = function (event, item) {
    if (event == "enter" && Browsers.DriveBrowser.menuMode == "list") {
        Browsers.DriveBrowser.cachedDriveName = item;
        Browsers.DriveBrowser.menuMode = "ask";
        Browsers.DriveBrowser.menu.settings.description =
            "What type of disc are you trying to play?";
        var temp = Browsers.DriveBrowser.menu.items[0];
        Browsers.DriveBrowser.menu.items = [];
        Browsers.DriveBrowser.menu.items.push(temp);
        Browsers.DriveBrowser.menu.items.push({
            title: SSA.insertSymbolFA(" ", 26, 30) + "CD",
            item: "ccda",
            color: "ffffff",
        });
        Browsers.DriveBrowser.menu.items.push({
            title: SSA.insertSymbolFA(" ", 26, 30) + "DVD",
            item: "dvd",
            color: "ffffff",
        });
        Browsers.DriveBrowser.menu.items.push({
            title: SSA.insertSymbolFA(" ", 26, 30) + "BluRay",
            item: "bd",
            color: "ffffff",
        });
        Browsers.DriveBrowser.menu.redrawMenu();
    } else if (event == "enter" && Browsers.DriveBrowser.menuMode == "ask") {
        if (Utils.OSisWindows) {
            mp.commandv(
                "loadfile",
                item + "://longest/" + Browsers.DriveBrowser.cachedDriveName
            );
            Utils.showAlert(
                "info",
                "Opening disc drive " +
                    Browsers.DriveBrowser.cachedDriveName +
                    "..."
            );
        } else {
            mp.commandv(
                "loadfile",
                item +
                    "://longest//dev/" +
                    Browsers.DriveBrowser.cachedDriveName
            );
            Utils.showAlert(
                "info",
                "Opening disc drive " +
                    Browsers.DriveBrowser.cachedDriveName +
                    "..."
            );
        }
        Browsers.DriveBrowser.cachedDriveName = "";
        Browsers.DriveBrowser.menuMode = "list";
        Browsers.DriveBrowser.menu.hideMenu();
        Browsers.DriveBrowser.menu = undefined;
    }
};

Browsers.DriveBrowser.open = function (parentMenu) {
    var items = [];
    if (parentMenu == undefined) {
        parentMenu = Browsers.DriveBrowser.cachedParentMenu;
    } else {
        Browsers.DriveBrowser.cachedParentMenu = parentMenu;
    }
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
                "get-drive-disc",
            ],
        });

        if (r.status == "0") {
            drives = r.stdout.split("|");
            drives.sort();
            for (var i = 0; i < drives.length; i++) {
                items.push({
                    title:
                        SSA.insertSymbolFA(" ", 26, 30) +
                        drives[i].trim() +
                        "\\",
                    item: drives[i].trim() + "\\",
                    color: "ffffff",
                });
            }
        }
    } else {
        var deviceList = mp.utils.readdir("/dev/", "all");
        deviceList.sort();
        for (var i = 0; i < deviceList.length; i++) {
            if (deviceList[i].includes("sr")) {
                items.push({
                    title: SSA.insertSymbolFA(" ", 26, 30) + deviceList[i],
                    item: deviceList[i],
                    color: "ffffff",
                });
            }
        }
    }
    Browsers.DriveBrowser.menuMode = "list";
    Browsers.DriveBrowser.menuSettings.title = "Drive Browser";
    Browsers.DriveBrowser.menuSettings.description = "Select a drive to open.";
    Browsers.DriveBrowser.menu = new MenuSystem.Menu(
        Browsers.DriveBrowser.menuSettings,
        items,
        parentMenu
    );
    Browsers.DriveBrowser.menu.eventHandler =
        Browsers.DriveBrowser.menuEventHandler;
    Browsers.DriveBrowser.menu.showMenu();
};

Browsers.DeviceBrowser.menuEventHandler = function (event, item) {
    if (event == "enter") {
        //mp.commandv("apply-profile", "low-latency");
        mp.set_property("file-local-options/profile", "low-latency"); // should only apply to currrent file

        if (Utils.OSisWindows) {
            mp.commandv("loadfile", "av://dshow:video=" + item);
        } else {
            mp.commandv("loadfile", "av://v4l2:/dev/" + item);
        }
        Utils.showAlert(
            "info",
            "Opening device " + item
        );
        Browsers.DeviceBrowser.menu.hideMenu();
        Browsers.DeviceBrowser.menu = undefined;
    }
};

Browsers.DeviceBrowser.open = function (parentMenu) {
    var items = [];
    if (parentMenu == undefined) {
        parentMenu = Browsers.DeviceBrowser.cachedParentMenu;
    } else {
        Browsers.DeviceBrowser.cachedParentMenu = parentMenu;
    }
    if (Utils.OSisWindows) {
        var r = mp.command_native({
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            args: [
                mp.utils
                    .get_user_path("~~/scripts/easympv/GetDevices.exe")
                    .replaceAll("/", "\\"),
            ],
        });

        if (r.status == "0") {
            devices = r.stdout.split("|");
            for (var i = 0; i < devices.length - 1; i++) {
                items.push({
                    title: SSA.insertSymbolFA(" ", 26, 30) + devices[i].trim(),
                    item: devices[i].trim(),
                    color: "ffffff",
                });
            }
        }
    } else {
        var deviceList = mp.utils.readdir("/dev/", "all");
        deviceList.sort();
        for (var i = 0; i < deviceList.length; i++) {
            if (deviceList[i].includes("video")) {
                var title = SSA.insertSymbolFA(" ", 26, 30) + deviceList[i];
                title +=
                    " - " +
                    Utils.executeCommand([
                        "cat",
                        "/sys/class/video4linux/" + deviceList[i] + "/name",
                    ]).split(": ")[0];
                items.push({
                    title: title,
                    item: deviceList[i],
                    color: "ffffff",
                });
            }
        }
    }
    Browsers.DeviceBrowser.menuSettings.title = "Device Browser";
    Browsers.DeviceBrowser.menuSettings.description =
        "Select a device to open.@br@Important: If you play a file after playing a device, there might be issues.@br@ It is recommended to restart mpv first!";
    Browsers.DeviceBrowser.menu = new MenuSystem.Menu(
        Browsers.DeviceBrowser.menuSettings,
        items,
        parentMenu
    );
    Browsers.DeviceBrowser.menu.eventHandler =
        Browsers.DeviceBrowser.menuEventHandler;
    Browsers.DeviceBrowser.menu.showMenu();
};

module.exports = Browsers;
