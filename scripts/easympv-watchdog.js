/*
 * EASYMPV_WATCHDOG.JS (PART OF EASYMPV)
 *
 * Author:                  Jong
 * URL:                     https://github.com/JongWasTaken/easympv
 * License:                 MIT License
 */

/*
    This script monitors easympv.

    This is done by pinging the main instance of easympv.
    Every ping increases Watchdog.pingCount by 1.
    If the main instance responds to the ping, Watchdog.pingCount decreases by 1.
    This happens every second.

    If Watchdog.pingCount exceeds 3, easympv will be considered "crashed".
    In that case, a very simple menu gets shown to the user, informing them and suggesting potential solutions.

    There are currently 3 options implemented:
    Option 1: restart mpv in place
        - This will first read the easympv config file to determine the location of the mpv executable.
        - Then the absolute path to the currently playing file gets determined.
        - Finally, the current watch-later data gets saved, and a new instance of mpv gets spawned. The old instance gets closed.
        - easympv works again!
    Option 2: eval easympv/main.js here
        - This will simply read easympv/main.js as a text file, and then eval its contents.
        - easympv works again, but it is now running in the easympv_watchdog namespace.
        - Because of this, the watchdog will not work anymore.
        - The change in namespace will also break script messages adressed to easympv!
    Option 3: do nothing
        - The menu gets closed.
        - Watchdog execution stops.
        - easympv does not work!

    That is everything it can do for now.
*/

String.prototype.replaceAll = function (str, newStr) {
    if (
        Object.prototype.toString.call(str).toLowerCase() === "[object regexp]"
    ) {
        return this.replace(str, newStr);
    }
    return this.replace(new RegExp(str, "g"), newStr);
};

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

var Watchdog = {};

Watchdog.getConfigKey = function(key) {
    if (mp.utils.file_info(mp.utils.get_user_path("~~/easympv.conf")) == undefined)
        return undefined;
    var lines = mp.utils.read_file(mp.utils.get_user_path("~~/easympv.conf"))
        .replaceAll("\r\n", "\n")
        .split("\n");

    for (var i = 0; i <= lines.length - 1; i++) {
        if (lines[i].substring(0, 1) != "#") {
            if (lines[i].includes("=")) {
                var temp = lines[i].split("=");
                var option = temp[0].trim();
                var value = temp[1].trim().split("#")[0];
                if (option == key) {
                    return value;
                }
            }
        }
    }
    return undefined;
}

Watchdog.pingCount = 0;
mp.register_script_message("__watchdog",function() {
    Watchdog.pingCount = Watchdog.pingCount - 1;
});

Watchdog.lastPingCountAfterCrash = -1;
Watchdog.maxPingCount = 5;

Watchdog.mainLoop = setInterval(function() {
    if (Watchdog.pingCount > Watchdog.maxPingCount) {
        //clearInterval(Watchdog.mainLoop);
        if (!Watchdog.Menu.isShown()) {
            mp.msg.warn("!!! EASYMPV MIGHT HAVE CRASHED !!!");
            Watchdog.Menu.show(false);
            Watchdog.lastPingCountAfterCrash = Watchdog.pingCount;
        } else {
            if (Watchdog.pingCount < Watchdog.lastPingCountAfterCrash) {
                mp.msg.warn("!!! EASYMPV HAS RECOVERED !!!");
                Watchdog.Menu.hide();
                Watchdog.lastPingCountAfterCrash = -1;
                Watchdog.pingCount = 0;
            }
        }
    }
    else
    {
        Watchdog.pingCount = Watchdog.pingCount + 1;
        mp.commandv("script-message-to", "easympv", "__watchdog", Watchdog.pingCount);
    }
}, 1000);

Watchdog.Strategies = {};

Watchdog.Strategies.hotLoad = function() {
    mp.msg.warn("!!! IT WILL BE RESTARTED IN THIS NAMESPACE AS FALLBACK !!!");
    eval(mp.utils.read_file(mp.utils.get_user_path("~~/scripts/easympv/main.js")));
}

Watchdog.Strategies.restartInPlace = function() {
    var mpvLocation = "/usr/bin/mpv";
    var temp = Watchdog.getConfigKey("mpvLocation");
    var isWindows = (mp.utils.getenv("OS") == "Windows_NT");
    if (temp != undefined)
    {
        if (temp != "unknown") {
            mpvLocation = temp;
        }
    }
    if (mp.utils.file_info(mpvLocation) == undefined)
    {
        mp.msg.warn("mpv location is unknown! Showing screen again!");
        Watchdog.Menu.show(true);
        return;
    }

    if (isWindows)
    {
        mpvLocation = mpvLocation + "mpv.exe"
        mpvLocation = mpvLocation.replaceAll("/", "\\");
    }

    var cFile = mp.get_property("playlist/0/filename");

    for (var i = 0; i < Number(mp.get_property("playlist/count")); i++) {
        if (mp.get_property("playlist/" + i + "/current") == "yes") {
            cFile = mp.get_property("playlist/" + i + "/filename");
            break;
        }
    }

    // cFile could be a relative path, so we need to expand it
    if (cFile != undefined) {
        if (
            !isWindows &&
            mp.utils.file_info(mp.get_property("working-directory") + "/" + cFile) != undefined
        ) {
            cFile =
                mp.get_property("working-directory") +
                "/" +
                cFile.replaceAll("./", "");
        }
    }
    else
    {
        cFile = "--player-operation-mode=pseudo-gui";
    }
    mp.commandv("write-watch-later-config");

    var args = [];
    args.push("run");
    args.push(mpvLocation);
    for (var i = 0; i < proper.length; i++) {
        args.push(proper[i]);
    }
    if (targetFile != undefined) {
        args.push(targetFile);
    } else args.push(cFile);

    mpv.commandv.apply(undefined, args);

    mpv.printWarn("!!! mpv will be restarted !!!");
    mpv.printWarn("!!! Custom options may not have been passed to the new mpv instance, please restart manually if neccessary !!!");
    mpv.commandv("quit");
}

Watchdog.Menu = {};
Watchdog.Menu.OSD = undefined;
Watchdog.Menu._divider = "-------------------------------------------";
Watchdog.Menu.assembleContent = function(disable_1)
{
    var content = "{\\b1}{\\bord1}{\\1c&H0033FF&}!!! EASYMPV HAS CRASHED !!!\n";
    content += "{\\bord1}{\\1c&H0099FF&}This is a message from the easympv watchdog. This is a dedicated script which monitors easympv to provide a fallback in the event of a crash.\n";
    content += "{\\bord1}{\\1c&H0099FF&}The easympv watchdog has not received any response from easympv for more than 3 seconds.\n";
    content += "{\\bord1}{\\1c&H0099FF&}{\\b1}It is safe to assume it crashed.{\\b0} You have a few options now:\n{\\bord1}"+Watchdog.Menu._divider+"\n";
    if (disable_1) {
        content += "{\\bord1}{\\1c&HFFFFFF&}{\\b1}Option 1:{\\1c&H0033FF&}{\\b1} FAILED, try 2 instead!\n";
    }
    else {
        content += "{\\bord1}{\\1c&HFFFFFF&}{\\b1}Option 1:{\\b0} Restart mpv in place\n";
        content += "{\\bord1}{\\1c&HFFFFFF&} Will save playback data and restart mpv in a seamless way.\n";
        content += "{\\bord1}{\\1c&H0099FF&}{\\b1}Recommended, but might not work correctly on some systems.{\\b0}\n{\\bord1}"+Watchdog.Menu._divider+"\n";
    }
    content += "{\\bord1}{\\1c&HFFFFFF&}{\\b1}Option 2:{\\b0} Load easympv again\n";
    content += "{\\bord1}{\\1c&HFFFFFF&} This will load easympv into the watchdog namespace, letting it take over. This will disable the watchdog for this session!\n";
    content += "{\\bord1}{\\1c&H0099FF&}{\\b1}Not recommended:{\\b0} can cause further issues.\n{\\bord1}"+Watchdog.Menu._divider+"\n";
    content += "{\\bord1}{\\1c&HFFFFFF&}{\\b1}Option 3:{\\b0} Do nothing\n";
    content += "{\\bord1}{\\1c&HFFFFFF&} Will hide this message and not show it again for this session.\n";
    content += "{\\bord1}{\\1c&H0099FF&}{\\b1}Choose this if you do not need easympv functionality right now.{\\b0}\n{\\bord1}"+Watchdog.Menu._divider+"\n";
    content += "{\\bord1}{\\1c&H0033FF&}{\\b1}Press the desired option number on your keyboard to proceed.\n";
    content += "{\\bord1}{\\1c&H0033FF&}{\\b1}(TLDR: Just press 1, except if you had issues with that previously, in that case press 2 or restart manually.)\n";
    return content;
}

Watchdog.Menu.keyHandler = function(key) {
    if (key == 1) {
        Watchdog.Menu.hide();
        Watchdog.Strategies.restartInPlace();
        return;
    }
    if (key == 2) {
        Watchdog.Menu.hide();
        Watchdog.Strategies.hotLoad();
        return;
    }
    if (key == 3) {
        Watchdog.Menu.hide();
        return;
    }
}

Watchdog.Menu.isShown = function() {
    return (Watchdog.Menu.OSD != undefined);
}

Watchdog.Menu.show = function(disable_1)
{
    if (Watchdog.Menu.OSD != undefined) {
        return;
    }
    Watchdog.Menu.OSD = mp.create_osd_overlay("ass-events");
    Watchdog.Menu.OSD.res_y = mp.get_property("osd-height");
    Watchdog.Menu.OSD.res_x = mp.get_property("osd-width");
    Watchdog.Menu.OSD.z = 1;
    Watchdog.Menu.OSD.data = Watchdog.Menu.assembleContent(disable_1);
    Watchdog.Menu.OSD.update();

    var tempFunction = function (x, key) {
        return function () {
            Watchdog.Menu.keyHandler(key);
        };
    };

    if (!disable_1) {
        mp.add_forced_key_binding(
            "1", "watchdog_emergency_selection_option_1", tempFunction(this, 1), { repeatable: false }
        );
    }
    mp.add_forced_key_binding(
        "2", "watchdog_emergency_selection_option_2", tempFunction(this, 2), { repeatable: false }
    );
    mp.add_forced_key_binding(
        "3", "watchdog_emergency_selection_option_3", tempFunction(this, 3), { repeatable: false }
    );
}

Watchdog.Menu.hide = function()
{
    if (Watchdog.Menu.OSD != undefined) {
        mp.commandv("osd-overlay", Watchdog.Menu.OSD.id, "none", "", 0, 0, 0, "no", "no");
        Watchdog.Menu.OSD = undefined;
    }
}