/*
 * AUTOLOAD.JS (MODULE)
 *
 * Author:                  Jong
 * URL:                     http://smto.pw/mpv
 * License:                 MIT License
 */

// this is so WIP thats its not even being loaded yet

var Autoload = {};

Autoload.loadedFile = "";
Autoload.location = "";

Autoload.load = function() {
    var playlist = [];

    // get current dir contents

    Autoload.location = "";
    var workDir = Autoload.loadedFile;
    if (workDir.charAt(workDir.length - 1) == OS.directorySeperator) {
        workDir = workDir.substring(0, workDir.length - 1);
    }
    var workDirTree = workDir.split(OS.directorySeperator);

    if (!OS.isWindows && workDirTree.length < 3) {
        workDirTree[0] = "/";
    }

    for (var i = 0; i < workDirTree.length - 1; i++) {
        if (i == 0) {
            Autoload.location = workDirTree[0];
        } else {
            Autoload.location = Autoload.location + OS.directorySeperator + workDirTree[i];
        }
    }

    if (Autoload.location.charAt(Autoload.location.length - 1) == ":") {
        Autoload.location += OS.directorySeperator;
    }

    var currentDirectory = mp.utils.readdir(Autoload.location, "files");
    currentDirectory.sort();

    // check extension and type foreach, add to list if good
    var currentlyPlaying = 0;
    for (var i = 0; i < currentDirectory.length; i++) {
        var icon = " ";
        for (
            var j = 0;
            j < Settings.presets.fileextensions.length;
            j++
        ) {
            var whitelist = Settings.presets.fileextensions[j];
            if (
                currentDirectory[i].includes(whitelist.extension)
            ) {

                if (whitelist.type == "video")
                {
                    icon = " ";
                }
                else if (whitelist.type == "audio")
                {
                    icon = " ";
                }
                else if (whitelist.type == "photo")
                {
                    icon = " ";
                }

                playlist.push({
                    title: UI.SSA.insertSymbolFA(icon, 26, 30) + currentDirectory[i],
                    path: Autoload.location + OS.directorySeperator + currentDirectory[i]
                });
                
                if(Autoload.loadedFile == Autoload.location + OS.directorySeperator + currentDirectory[i])
                {
                    currentlyPlaying = i;
                }

                break;
            }
        }
    }
    mp.msg.warn(currentlyPlaying);

    // set list as playlist
    mp.commandv("playlist-clear"); // removes all entries expect currently playing
    var prepend = function(path)
    {
        var pos = mp.get_property_number("playlist-count") - 1;
        mp.commandv("loadfile", path, "append")
        mp.commandv("playlist-move",pos,0);
    }

    for (var n = 0; n < playlist.length; n++)
    {
        if (n < currentlyPlaying)
        {
            prepend(playlist[n].path);
        }
        else if (n == currentlyPlaying)
        {
            // do nothing
        }
        else
        {
            mp.commandv("loadfile", playlist[n].path, "append")
        }
    }
};

module.exports = Autoload;