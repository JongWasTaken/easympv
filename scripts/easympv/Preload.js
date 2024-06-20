/*
 * PRELOAD.JS (PART OF EASYMPV)
 *
 * Author:                  Jong
 * URL:                     https://github.com/JongWasTaken/easympv
 * License:                 MIT License
 */

String.prototype.includes = function (search, start) {
    if (typeof start !== "number") {
        start = 0;
    }
    if (start + search.length > this.length) {
        return false;
    } else {
        return this.indexOf(search, start) !== -1;
    }
};

String.prototype.replaceAll = function (str, newStr) {
    if (
        Object.prototype.toString.call(str).toLowerCase() === "[object regexp]"
    ) {
        return this.replace(str, newStr);
    }
    return this.replace(new RegExp(str, "g"), newStr);
};

String.prototype.trim = function () {
    return this.replace(/(?:^\s+|\s+$)/g, "");
};

String.prototype.trimStart = function () {
    return this.replace(/^\s+/, "");
};

String.prototype.trimEnd = function () {
    return this.replace(/\s+$/, "");
};

String.prototype.insertAt = function (index, string) {
    return this.substring(0, index) + string + this.substring(index);
};

Number.prototype.isOdd = function () {
    return this % 2 == 1;
};

Math.percentage = function (partialValue, totalValue) {
    return Math.round((100 * partialValue) / totalValue);
};

var mpv = {};
/**
 * Resolves special character sequences in given path.
 * @param path Path.
 * @returns {string} Resolved path.
 */
mpv.getUserPath = function (path) {
    return mp.utils.get_user_path(path);
};

/**
 * Returns metadata about given file path.
 * @param path Full path to file.
 * @returns Metadata, or undefined if the file does not exist.
 */
mpv.fileInfo = function (path) {
    return mp.utils.file_info(path);
};

/**
 * Checks if path exists.
 * @param path Full path to file.
 * @returns Boolean
 */
mpv.fileExists = function (path) {
    return mp.utils.file_info(path) != undefined;
};

/**
 * Lists content of given directory path.
 * @param {string} path Full path to directory.
 * @param {string} filter Either "files" or "dirs". Leave undefined for none.
 * @returns String Array of elements
 */
mpv.getDirectoryContents = function(path, filter) {
    if (filter == undefined)
    {
        filter = "all";
    }
    return mp.utils.readdir(path, filter);
};

/**
 * Reads file contents from given path
 * @param {string} path Full path to file.
 * @returns {string} File contents.
 */
mpv.readFile = function (path) {
    return mp.utils.read_file(path);
};

/**
 * Reads file contents from given path
 * @param {string} path Full path to file.
 * @param {string} content File contents.
 */
mpv.writeFile = function (path, content) {
    if (content == undefined) {
        content = "";
    }
    return mp.utils.write_file(path, content);
};

// print
mpv.printInfo = function (msg) {
    return mp.msg.info(msg);
};

mpv.printWarn = function (msg) {
    return mp.msg.warn(msg);
};

mpv.printError = function (msg) {
    return mp.msg.error(msg);
};

// misc
/**
 * Gets contents of a given environment variable.
 * @param {string} envvar Environment variable.
 * @returns Environment variable contents, or undefined.
 */
mpv.getEnv = function (envvar) {
    return mp.utils.getenv(envvar);
};

mpv.addKeyBinding = function (key, id, callback) {
    return mp.add_key_binding(key, id, callback);
};

mpv.addForcedKeyBinding = function (key, id, callback) {
    return mp.add_forced_key_binding(key, id, callback);
};

mpv.removeKeyBinding = function (id) {
    return mp.remove_key_binding(id);
};

mpv.registerEvent = function (id, callback) {
    return mp.register_event(id, callback);
};

mpv.unregisterEvent = function (functionSignature) {
    return mp.unregister_event(functionSignature);
};

mpv.registerScriptMessage = function (id, callback) {
    return mp.register_script_message(id, callback);
};

mpv.observeProperty = function (property, id, callback) {
    return mp.observe_property(property, id, callback);
};

mpv.unobserveProperty = function (functionSignature) {
    return mp.unobserve_property(functionSignature);
};

mpv.setProperty = function (property, value) {
    return mp.set_property(property, value);
};

mpv.getProperty = function (property) {
    return mp.get_property(property);
};

mpv.getPropertyNumber = function (property) {
    return mp.get_property_number(property);
};

mpv.getPropertyOSD = function (property) {
    return mp.get_property_osd(property);
}

mpv.getPropertyNative = function (property) {
    return mp.get_property_native(property);
}

mpv.osdMessage = function (msg) {
    return mp.osd_message(msg);
};

mpv.command = function (command) {
    return mp.command(command);
};

mpv.commandNative = function (obj) {
    return mp.command_native(obj);
};

mpv.commandNativeAsync = function (obj, callback) {
    return mp.command_native_async(obj, callback);
};

mpv.commandv = function () {
    return mp.commandv.apply(this,arguments);
};

mpv.enableMessages = function (type) {
    return mp.enable_messages(type);
};