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

    Utils.log("Starting test: \"" + name + "\"","Tests","warn");

    if (test.variables != undefined)
    {
        Utils.log("Setting variables...","Tests","info");
        for (var i = 0; i < test.variables.length; i++) {
            eval("var " + test.variables[i] + ";");
        }
    }

    var evaluate = function(target, arguments, destination)
    {
        var output = {};

        // target
        var toEval = target + "(";

        // arguments
        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            if (typeof(arg) == "string" && arg.charAt(0) != "@")
            {
                if (arg.includes("~~"))
                {
                    arg = mp.utils.get_user_path(arg);
                }
                toEval += "\"" + arg + "\"";
            }
            else
            {
                toEval += arg.replaceAll("@","");
            }

            if ((i+1) != arguments.length)
            {
                toEval += ",";
            }
        }
        toEval += ");";
        Utils.log("Assembled eval string: " + toEval,"Tests","info");

        try {
            eval("output = " + toEval);
        } catch(e) {
            Utils.log("Eval execution crashed!","Tests","error");
            output = "*crashed*";
        }

        if(destination != undefined)
        {
            eval(destination + " = output;");
        }

        // expectedResult
        if (typeof(output) == "object")
        {
            output = JSON.stringify(output);
        }
        return output;
    }

    if (test.preparation != undefined)
    {
        Utils.log("Evaluating preparation functions...","Tests","info");
        for (var i = 0; i < test.preparation.length; i++) {
            var output = evaluate(test.preparation[i].target,test.preparation[i].arguments,test.preparation[i].destination);
            Utils.log("Preparation function returned \"" + output + "\"","Tests","info");
        }
    }

    Utils.log("Evaluating main function...","Tests","info");
    var output = evaluate(test.target,test.arguments);

    if (typeof(test.expectedResult) == "object")
    {
        test.expectedResult = JSON.stringify(test.expectedResult);
    }

    Utils.log("Test eval output: " + output,"Tests","info");
    Utils.log("Expected output: " + test.expectedResult,"Tests","info");

    // cleanup
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
        Utils.log("Test \"" + name + "\" PASSED!","Tests","warn");
        return true;
    }
    Utils.log("Test \"" + name + "\" FAILED!","Tests","warn");
    return false;
};

module.exports = Tests;