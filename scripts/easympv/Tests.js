/*
 * TESTS.JS (MODULE)
 *
 * Author:                     Jong
 * URL:                        https://smto.pw/mpv
 * License:                    MIT License
 */

var Tests = {};

Tests.json = {};

Tests.init = function() {
    Tests.json = JSON.parse(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/Tests.json")));
};

Tests.run = function(name) {
    if (name == "ignore")
    {
        return;
    }

    var test = Tests.json[name];
    if (test == undefined)
    {
        return;
    }

    Utils.log("Starting test: \"" + name + "\"","Tests","info");

    var output = {};

    var toEval = "output = ";
    toEval += test.target + "(";
    for (var i = 0; i < test.arguments.length; i++) {
        var arg = test.arguments[i];
        if (typeof(arg) == "string")
        {
            if (arg.includes("~~"))
            {
                arg = mp.utils.get_user_path(arg);
            }
            toEval += "\"" + arg + "\"";
        }
        else
        {
            toEval += arg;
        }

        if ((i+1) != test.arguments.length)
        {
            toEval += ",";
        }
    }
    toEval += ");";
    Utils.log("Assembled eval string: " + toEval,"Tests","info");

    eval(toEval);

    if (typeof(output) == "object")
    {
        output = JSON.stringify(output);
    }

    if (typeof(test.expectedResult) == "object")
    {
        test.expectedResult = JSON.stringify(test.expectedResult);
    }

    Utils.log("Eval output: " + output,"Tests","info");
    Utils.log("Expected output: " + test.expectedResult,"Tests","info");

    if (test.cleanup != undefined)
    {
        Utils.log("Cleaning up...","Tests","info")
        for (var i = 0; i < test.cleanup.length; i++) {
            var directive = test.cleanup[i];
            if (directive.type == "file")
            {
                var temp = directive.content;
                if (temp.includes("~~"))
                {
                    temp = mp.utils.get_user_path(temp);
                }
                OS.fileRemoveSystemwide(temp);
            }
        }
    }
    if (output == test.expectedResult)
    {
        Utils.log("Test \"" + name + "\" PASSED!","Tests","info");
        return true;
    }
    Utils.log("Test \"" + name + "\" FAILED!","Tests","info");
    return false;
};

module.exports = Tests;