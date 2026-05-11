
/*
 * EASYMPV-ASYNC.JS (PART OF EASYMPV)
 *
 * Author:                  Jong
 * URL:                     https://github.com/JongWasTaken/easympv
 * License:                 MIT License
 */

// Funny thing about mpv: its api does not expose any way to do things async.
// BUT: different scripts cannot block each other
// we can (ab)use this to implement certain expensive operations asynchronously, such as directory listing

var implemented = {
    "listDirContents": function(path, filter) {
        return mp.utils.readdir(path, filter);
    },
    "custom": function(code, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        var output = undefined;
        eval(code);
        return output;
    }
};

var run = function(name, id, funcName, vars) {
    var response = undefined;
    var func = implemented[funcName];
    if (func != undefined) {
        var nvars = "[]";
        if (vars != undefined) nvars = vars;
        try {
            response = JSON.stringify(func.apply(undefined, JSON.parse(vars)));
        } catch(_) {}
    }
    mp.commandv("script-message-to", name, id, response);
};

mp.register_script_message("run", run);