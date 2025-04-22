// { "name": "SWF Flash Support", "icon": "", "author": "Jong", "version": "1.0.0", "description": "Linux only: Launch swf files externally when opened!@br@(Flash Player Standalone has to be installed!)" }

/*
 * SWF_SUPPORT.JS (PART OF EASYMPV)
 *
 * Author:         Jong
 * URL:            https://github.com/JongWasTaken/easympv
 * License:        MIT License
 */

Events.earlyInit.$register(function() {
    Settings.presets.fileextensions.push({
        type: "special",
        name: "Flash Animation",
        extension: ".swf"
    });
})

Events.beforeBrowserFileOpen.$register(function(entry, path) {
    if (entry.extension == ".swf") {
        OS._call("flashplayer \"" + path + "\"", true);
        return true;
    }
});