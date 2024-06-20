/*
 * AUTOLOAD.JS (PART OF EASYMPV)
 *
 * Author:                  Jong
 * URL:                     https://github.com/JongWasTaken/easympv
 * License:                 MIT License
 */

var Autoload = {};

Autoload.loadedFile = "";
Autoload.location = "";
Autoload.previousLocation = "";
Autoload.enabled = true;
Autoload.playlist = [];
Autoload.maxPlaylistSize = 10000;

Autoload.loadFolder = function(force) {
    if (!Autoload.enabled)
    {
        return;
    }

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

    // check against previous location, only rebuild playlist on folder change
    if (!force)
    {
        if (Autoload.location == Autoload.previousLocation)
        {
            return;
        }
        Autoload.previousLocation = Autoload.location;
    }


    var currentDirectory = mpv.getDirectoryContents(Autoload.location, "files");

    if (currentDirectory == undefined) // non-file playlist
    {
        Autoload._reversePopulate();
        return;
    }

    // possible TODO: implement better sorting algorithm than the default array.sort()
    //currentDirectory.sort(function(a,b) {
    //    return Utils.naturalCompare(a.name, b.name)
    //});

    currentDirectory.sort();
    Autoload.playlist = [];
    // check extension and type foreach, add to list if good
    var isPlaying = false;
    for (var i = 0; i < currentDirectory.length; i++) {
        var icon = " ";
        var type = "none";
        for (
            var j = 0;
            j < Settings.presets.fileextensions.length;
            j++
        ) {
            var whitelist = Settings.presets.fileextensions[j];
            if (whitelist.extension != ".ssa" && whitelist.extension != ".ass" && whitelist.extension != ".srt" && whitelist.extension != ".mks")
            {
                if (
                    currentDirectory[i].includes(whitelist.extension)
                ) {
                    if (whitelist.type == "video")
                    {
                        icon = " ";
                        type = "video";
                    }
                    else if (whitelist.type == "audio")
                    {
                        icon = " ";
                        type = "audio";
                    }
                    else if (whitelist.type == "photo")
                    {
                        icon = " ";
                        type = "photo";
                    }
                    if(Autoload.loadedFile == Autoload.location + OS.directorySeperator + currentDirectory[i])
                    {
                        isPlaying = true;
                        icon = " ";
                    }
                    else { isPlaying = false; }
                    Autoload.playlist.push({
                        //title: UI.SSA.insertSymbolFA(icon, 26, 30) + currentDirectory[i],
                        icon: icon,
                        type: type,
                        filename: currentDirectory[i],
                        path: Autoload.location + OS.directorySeperator + currentDirectory[i],
                        playing: isPlaying
                    });
                    break;
                }
                if (Autoload.playlist.length == Autoload.maxPlaylistSize)
                {
                    Utils.log("Hit playlist size limit, stopping!","Autoload","warn")
                    break;
                }
            }
        }
    }
    Autoload.buildPlaylist();
};

Autoload.refresh = function()
{
    for (var i = 0; i < Autoload.playlist.length; i++)
    {
        if (Autoload.playlist[i].path == Autoload.loadedFile)
        {
            Autoload.playlist[i].playing = true;
            Autoload.playlist[i].icon = " ";
        }
        else
        {
            Autoload.playlist[i].playing = false;
            if (Autoload.playlist[i].type == "video")
            {
                Autoload.playlist[i].icon = " ";
            }
            else if (Autoload.playlist[i].type == "audio")
            {
                Autoload.playlist[i].icon = " ";
            }
            else if (Autoload.playlist[i].type == "photo")
            {
                Autoload.playlist[i].icon = " ";
            }
            else if (Autoload.playlist[i].type == "web")
            {
                Autoload.playlist[i].icon = " ";
            }
            else if (Autoload.playlist[i].type == "unknown")
            {
                Autoload.playlist[i].icon = "? ";
            }
        }
    }
}

Autoload._reversePopulate = function ()
{
    Autoload.playlist = [];
    var playlist = JSON.parse(mpv.getProperty("playlist"));
    //dump(playlist);
    if (playlist.length == 0)
    {
        return;
    }

    if (playlist[0].filename.slice(0,4) == "http")
    {
        var isPlaying = false;
        var icon = " ";
        for (var i = 0; i < playlist.length; i++)
        {
            if (playlist[i].playing != undefined)
            {
                if (playlist[i].playing)
                {
                    icon = " "
                    isPlaying = true;
                } else { isPlaying = false; icon = " ";}
            } else { isPlaying = false; icon = " ";}
            Autoload.playlist.push(
                {
                    icon: icon,
                    type: "web",
                    filename: playlist[i].title,
                    path: playlist[i].filename,
                    playing: isPlaying
                }
            )
        }
    }
    else
    {
        var isPlaying = false;
        var icon = "? ";
        for (var i = 0; i < playlist.length; i++)
        {
            if (playlist[i].playing != undefined)
            {
                if (playlist[i].playing)
                {
                    icon = " "
                    isPlaying = true;
                } else { isPlaying = false; icon = " ";}
            } else { isPlaying = false; icon = " ";}
            Autoload.playlist.push(
                {
                    icon: icon,
                    type: "unknown",
                    filename: playlist[i].title,
                    path: playlist[i].filename,
                    playing: isPlaying
                }
            )
        }
    }

}

Autoload.removeAt = function(index)
{
    if (Autoload.playlist[index].playing)
    {
        return false;
    }

    Autoload.playlist.splice(index,1);
    return true;
}

Autoload.moveTo = function (index, target)
{
    if (Autoload.playlist[index].playing)
    {
        return false;
    }

    if (Autoload.playlist[target] == undefined || Autoload.playlist.length-1 == target)
    {
        Autoload.playlist.push(Autoload.playlist.splice(index,1)[0]);
    }
    else
    {
        Autoload.playlist.splice(target,0,Autoload.playlist.splice(index,1)[0]);
    }

    return true;
}

Autoload.buildPlaylist = function ()
{
    mpv.commandv("playlist-clear"); // removes all entries except currently playing
    var prepend = function(path)
    {
        // to future me: DO NOT TOUCH THIS FUNCTION
        var pos = mpv.getPropertyNumber("playlist-count");
        mpv.commandv("loadfile", path, "append")
        mpv.commandv("playlist-move", pos, 0);
    }

    var toPrepend = [];
    var toAppend = [];

    var foundCurrent = false;
    var skip = false;
    for (var n = 0; n < Autoload.playlist.length; n++)
    {
        if (Autoload.playlist[n].playing)
        {
            foundCurrent = true;
            skip = true;
        }

        if (!skip)
        {
            if (foundCurrent)
            {
                toAppend.push(Autoload.playlist[n].path);
            }
            else
            {
                toPrepend.push(Autoload.playlist[n].path);
            }
        }

        skip = false;
    }

    toPrepend.reverse();
    for (var k = 0; k < toPrepend.length; k++)
    {
        prepend(toPrepend[k]);
    }

    for (var l = 0; l < toAppend.length; l++)
    {
        mpv.commandv("loadfile", toAppend[l], "append");
    }

}