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
 * @param {string} path Path.
 * @returns {string} Resolved path.
 */
mpv.getUserPath = function (path) {
    return mp.utils.get_user_path(path);
};

/**
 * Returns metadata about given file path.
 * @param {string} path Full path to file.
 * @returns {object} Metadata, or undefined if the file does not exist.
 */
mpv.fileInfo = function (path) {
    return mp.utils.file_info(path);
};

/**
 * Checks if path exists.
 * @param {string} path Full path to file.
 * @returns {boolean}
 */
mpv.fileExists = function (path) {
    return mp.utils.file_info(path) != undefined;
};

/**
 * Lists content of given directory path.
 * @param {string} path Full path to directory.
 * @param {string} filter Either `files` or `dirs`. Leave undefined for none.
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
 * Reads file contents from given path.
 * @param {string} path Full path to target file.
 * @returns {string} File contents.
 */
mpv.readFile = function (path) {
    return mp.utils.read_file(path);
};

/**
 * Writes string to given path.
 * Note: This function already prepends `file://` to the given path, do not add it yourself.
 * @param {string} path Full path to target file.
 * @param {string} content File contents. Set to `undefined` to create an empty file.
 */
mpv.writeFile = function (path, content) {
    if (content == undefined) {
        content = "";
    }
    return mp.utils.write_file("file://" + path, content);
};

mpv.printDebug = function (msg) {
    return mp.msg.debug(msg);
};

mpv.printInfo = function (msg) {
    return mp.msg.info(msg);
};

mpv.printWarn = function (msg) {
    return mp.msg.warn(msg);
};

mpv.printError = function (msg) {
    return mp.msg.error(msg);
};

var console = {};
console.log = function (msg) {
    return mp.msg.info(msg);
}

/**
 * Gets contents of a given environment variable.
 * @param {string} envvar Environment variable.
 * @returns {string} Environment variable contents, or `undefined`.
 */
mpv.getEnv = function (envvar) {
    return mp.utils.getenv(envvar);
};

/**
 * Returns process id of the current mpv instance.
 * @returns {number}
 */
mpv.getPid = function () {
    return mp.utils.getpid();
}

mpv.getTime = function () {
    return mp.get_time();
}

mpv.addKeyBinding = function (key, id, callback, forced) {
    if (forced == undefined) forced = false;
    if (forced) {
        return mp.add_forced_key_binding(key, id, callback);
    }
    return mp.add_key_binding(key, id, callback);
};

mpv.addForcedKeyBinding = function (key, id, callback) {
    return mpv.addKeyBinding(key, id, callback, true);
};

mpv.removeKeyBinding = function (id) {
    return mp.remove_key_binding(id);
};

mpv.registerEvent = function (id, callback) {
    return mp.register_event(id, callback);
};

mpv.unregisterEvent = function (fn) {
    return mp.unregister_event(fn);
};

mpv.registerScriptMessage = function (id, callback) {
    return mp.register_script_message(id, callback);
};

mpv.observeProperty = function (property, id, callback) {
    return mp.observe_property(property, id, callback);
};

mpv.unobserveProperty = function (fn) {
    return mp.unobserve_property(fn);
};

mpv.setProperty = function (property, value) {
    return mp.set_property(property, value);
};

mpv.getProperty = function (property) {
    return mp.get_property(property);
};

mpv.getPropertyAsNumber = function (property) {
    return mp.get_property_number(property);
};

mpv.getPropertyOfOsd = function (property) {
    return mp.get_property_osd(property);
}

mpv.getPropertyAsNative = function (property) {
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