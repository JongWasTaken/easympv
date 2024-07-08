ExtensionManager = {};

ExtensionManager.checkExtensionAllowed = function(filename) {
    for (var e = 0; e < Settings.Data.enabledExtensions.length; e++) {
        if (Settings.Data.enabledExtensions[e] == filename) return true;
    }
    return false;
}

ExtensionManager.init = function() {
    if (Environment.Extensions.length == 0) return;
    for (var i = 0; i < Environment.Extensions.length; i++) {
        if (ExtensionManager.checkExtensionAllowed(Environment.Extensions[i].filename)) {
            try {
                eval(Environment.Extensions[i].code + "\n");
                Environment.Extensions[i].loaded = true;
            }
            catch(e) {
                mpv.printError("[Core] Exception while loading extension \"" + Environment.Extensions[i].name + " " + Environment.Extensions[i].version + "\": " + e)
            }
        }
    }
}

ExtensionManager.disallowExtension = function(filename) {
    if (Settings.Data.enabledExtensions.length == 0) return;
    for (var e = 0; e < Settings.Data.enabledExtensions.length; e++) {
        if (Settings.Data.enabledExtensions[e] == filename) {
            Settings.Data.enabledExtensions.splice(e, 1);
        }
    }
    Settings.save();
}

ExtensionManager.allowExtension = function(filename) {
    if (Settings.Data.enabledExtensions.length != 0) {
        for (var e = 0; e < Settings.Data.enabledExtensions.length; e++) {
            if (Settings.Data.enabledExtensions[e] == filename) {
                return;
            }
        }
    }
    Settings.Data.enabledExtensions.push(filename);
    Settings.save();
}

/**
 * Toggles extension availability.
 * @param {string} filename Extension file name
 * @returns Boolean, `true` if the extension is now allowed, `false` if not
 */
ExtensionManager.toggleExtension = function(filename) {
    if (ExtensionManager.checkExtensionAllowed(filename)) {
        ExtensionManager.disallowExtension(filename);
        return false;
    }
    ExtensionManager.allowExtension(filename);
    return true;
}