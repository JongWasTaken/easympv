// {"name": "XScreenSaver Inhibitor", "author": "Jong", "version": "1.0.0", "icon": "", "description": "Linux/Mac only: Disables XScreenSaver while content is playing.", "url": "https://github.com/JongWasTaken/easympv" }

Events.afterInit.$register(function() {
    setInterval(function() {
        if (mpv.getPropertyAsNative("pause") == false) {
            mp.utils.subprocess(args = ["xscreensaver-command", "-deactivate"]);
        }
    }, 30);
});