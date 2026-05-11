ExtensionManager = {};

ExtensionManager.Sandbox = {};

ExtensionManager.alertCategory = "Extension Manager";

ExtensionManager.checkExtensionAllowed = function(filename) {
    for (var e = 0; e < Settings.Data.enabledExtensions.length; e++) {
        if (Settings.Data.enabledExtensions[e] == filename) return true;
    }
    return false;
}

ExtensionManager.init = function() {
    if (Environment.Extensions.length == 0) return;
    for (var i = 0; i < Environment.Extensions.length; i++) {
        var ext = Environment.Extensions[i];
        if (ExtensionManager.checkExtensionAllowed(ext.filename)) {
            ExtensionManager._preprocessCode(i);
            try {
                if (ext.preprocessed) {
                    eval(ext.code + "\n");
                    ext.code = "// Extension has been loaded, code is not required anymore!";
                    ext.loaded = true;
                } else throw "Could not preprocess extension!";
            }
            catch(e) {
                UI.Alerts.push("Failed to load extension \"" + ext.name + "\"! Check log for details.", ExtensionManager.alertCategory, UI.Alerts.Urgencies.Error)
                mpv.printError("[Core] Exception while loading extension \"" + ext.name + " " + ext.version + "\": " + e)
            }
        }
    }
}

ExtensionManager._preprocessCode = function(extensionIndex) {
    var extension = Environment.Extensions[extensionIndex];
    if (extension == undefined) return;
    if (extension.preprocessed == undefined) return;
    if (extension.preprocessed == true) return;

    // set up extension pseudo namespace thingy
    if (ExtensionManager.Sandbox[extension.instanceName] != undefined) {
        extension.instanceName = extension.instanceName + "_1";
    };
    ExtensionManager.Sandbox[extension.instanceName] = {};
    // replace fields
    extension.code = extension.code.replaceAll("\\$self", "ExtensionManager.Sandbox." + extension.instanceName);
    extension.code = extension.code.replaceAll("\\$metadata", "Environment.Extensions[" + extensionIndex + "]");
    // replace methods
    extension.code = extension.code.replaceAll("\\.\\$register\\(", ".register(\"" + extension.instanceName + "\",");
    extension.code = extension.code.replaceAll("\\.\\$unregister\\(", ".kick(\"" + extension.instanceName + "\"");

    if (extension.debug) {
        mpv.printWarn(extension.code);
    }
    extension.preprocessed = true;
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