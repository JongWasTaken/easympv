// { "name": "Mouse: Hold For Speed", "icon": "", "author": "Jong", "version": "1.0.0", "description": "Hold the left mouse button to speed up playback, just like on YouTube!\n(Kinda broken? Might work...)" }

/*
 * MOUSE_HOLD_SPEED.JS (PART OF EASYMPV)
 *
 * Author:         Jong
 * URL:            https://github.com/JongWasTaken/easympv
 * License:        MIT License
 */

$self.pauseTimeWindow = 0.2;
$self.targetSpeed = 2.0;

$self.keybindRef = $metadata.instanceName + ":MBTN_LEFT_forced_keybind";
$self.running = false;
$self.speedBackup = -1;
$self.lastDownTime = 0;

Events.duringRegistration.$register(function() {
    mp.add_forced_key_binding("MBTN_LEFT", $self.keybindRef, function(obj) {
        if (obj.event == "down") {
            $self.lastDownTime = mpv.getTime();
            if (!$self.running) {
                $self.speedBackup = mpv.getPropertyAsNative("speed");
                mpv.setProperty("speed", $self.targetSpeed);
                $self.running = true;
                return;
            }
        }
        if (obj.event == "up") {
            if ($self.running) {
                if (mpv.getTime() < $self.lastDownTime + $self.pauseTimeWindow) {
                    mpv.command("cycle pause");
                    $self.running = false;
                    return;
                }
                $self.running = false;
                mpv.setProperty("speed", $self.speedBackup);
                mpv.command("write-watch-later-config");
                $self.speedBackup = -1;
            }
        }
    }, {
        "complex": true
    });
});

Events.duringUnregistration.$register(function() {
    mpv.removeKeyBinding($self.keybindRef);
});