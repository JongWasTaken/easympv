/*
 * CHAPTERS.JS (PART OF EASYMPV)
 *
 * Author:         Jong
 * URL:            https://github.com/JongWasTaken/easympv
 * License:        MIT License
 */

var Chapters = {};

Chapters.total = 0;
Chapters.current = 0;
Chapters.style = "unknown";
Chapters.cspeed = 1;
Chapters.mode = "skip";
Chapters.status = "disabled";

Chapters.handler = function () {
    // Called on every chapter change (in main.js)
    Utils.log("Chapter change detected", "chapters","info");
    Chapters.current = mp.get_property("chapter"); // Which chapter is currently playing
    Chapters.total = Number(mp.get_property("chapters")) - 1; // Total number of chapters in video file

    // Try to identify 'style' by comparing data to common patterns
    // Even though this seems janky, it works suprisingly well
    if (Chapters.total >= 5) {
        Chapters.style = "modern";
    } else if (Chapters.total == 4) {
        Chapters.style = "classic";
    } else if (Chapters.total == 3) {
        Chapters.style = "modernalt";
    } else {
        Chapters.style = "unknown";
    }

    // Do the actual operation
    if (Chapters.status == "enabled") {
        if (Chapters.mode == "skip") {
            if (Chapters.style == "modern") {
                if (
                    Chapters.current == 1 ||
                    Chapters.current == 4 ||
                    Chapters.current == 5
                ) {
                    mp.command("no-osd add chapter 1");
                }
            } else if (Chapters.style == "classic") {
                if (
                    Chapters.current == 0 ||
                    Chapters.current == 3 ||
                    Chapters.current == 4
                ) {
                    mp.command("no-osd add chapter 1");
                }
            } else if (Chapters.style == "modernalt") {
                if (
                    Chapters.current == 0 ||
                    Chapters.current == 2 ||
                    Chapters.current == 3
                ) {
                    mp.command("no-osd add chapter 1");
                }
            }
        } else if (Chapters.mode == "slowdown") {
            if (Chapters.style == "modern") {
                if (Chapters.current == 1 || Chapters.current == 4) {
                    Chapters.cspeed = mp.get_property("speed");
                    mp.set_property("speed", 1);
                }
                if (Chapters.current == 2 || Chapters.current == 5) {
                    mp.set_property("speed", Chapters.cspeed);
                }
            } else if (Chapters.style == "classic") {
                if (Chapters.current == 0 || Chapters.current == 3) {
                    Chapters.cspeed = mp.get_property("speed");
                    mp.set_property("speed", 1);
                }
                if (Chapters.current == 1 || Chapters.current == 4) {
                    mp.set_property("speed", Chapters.cspeed);
                }
            } else if (Chapters.style == "modernalt") {
                if (Chapters.current == 0 || Chapters.current == 2) {
                    Chapters.cspeed = mp.get_property("speed");
                    mp.set_property("speed", 1);
                }
                if (Chapters.current == 1 || Chapters.current == 3) {
                    mp.set_property("speed", Chapters.cspeed);
                }
            }
        }
    }
};