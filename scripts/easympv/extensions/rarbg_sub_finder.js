// { "name": "RARBG Subtitle Finder", "icon": "", "author": "Jong", "version": "1.0.0", "description": "Automatically loads subtitles for RARBG releases." }

/*
 * RARBGSUBFINDER.JS (PART OF EASYMPV)
 *
 * Author:         Jong
 * URL:            https://github.com/JongWasTaken/easympv
 * License:        MIT License
 */

Events.onFileLoad.$register(function (loadedFile) {
    var filename = Utils.removeFileExtension(Utils.getFileName(loadedFile))
    var rootDir = Utils.getParentDirectory(loadedFile);

    rootDir = rootDir + OS.directorySeperator + "Subs";
    if (mpv.fileExists(rootDir)) {
        if (mpv.fileExists(rootDir + OS.directorySeperator + filename)) {
            var subs = mpv.getDirectoryContents(rootDir + OS.directorySeperator + filename, "files");
            for (var index = 0; index < subs.length; index++) {
                mpv.commandv(
                    "sub-add", rootDir + OS.directorySeperator + filename + OS.directorySeperator + subs[index]
                );
            }
        }
    }
});