ExtensionLoader = {};

ExtensionLoader.init = function() {
    try {
        var extensionCode = ""; //mpv.readFile(mpv.getUserPath("~~/scripts/easympv/ExtensionHelpers.js")) + "\n";
        for (var i = 0; i < Extensions.length; i++) {
            extensionCode += Extensions[i].code + "\n";
        }
        eval(extensionCode);
    }
    catch(e) {
        mpv.printWarn("[Core] Error while loading extensions: " + e)
    }
}