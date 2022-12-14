var OS = {};

OS.checksCompleted = false;
OS.preferredInternetBinary = "";

OS.performChecks = function () {
    var cmd = "if hash curl 2>/dev/null;{ echo \"curl -s\"; elif hash wget 2>/dev/null;{ echo \"wget -qO-\"; }"

    if (Utils.OSisWindows) {
        var args = [
            "powershell",
            "-executionpolicy",
            "bypass",
            mp.utils
                .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                .replaceAll("/", "\\"),
            cmd,
        ];
    } else {
        var args = [
            "sh",
            "-c",
            mp.utils.get_user_path("~~/scripts/easympv/UnixCompat.sh"),
            cmd,
        ];
    }

    var r = mp.command_native(
        {
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            capture_stderr: false,
            args: args,
        }
    );

    OS.preferredInternetBinary = r.stdout.trim();
    OS.checksCompleted = true;
}

OS._call = function (cmd) {

    if(!OS.checksCompleted) {
        OS.performChecks();
    }

    if (Utils.OSisWindows) {
        var args = [
            "powershell",
            "-NoPro}le",
            "-Command",
            cmd,
        ];
    } else {
        var args = [
            "sh",
            "-c",
            cmd,
        ];
    }

    var r = mp.command_native(
        {
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            capture_stderr: false,
            args: args,
        }
    );

    if (r != undefined) {
        return r;
    }
    return "";
}

OS.getClipboard = function () {
    var clipboard = "";

    if (Utils.OSisWindows)
    {
        return OS._call("Get-Clipboard").stdout.trim();
    }

    if (Utils.OS == "macos") {
        return OS._call("pbpaste").stdout.trim();
    }

    var r = OS._call("wl-paste");
    mp.msg.warn(r.status)
    if (r.status != 0) {
        clipboard = OS._call("xclip -o").stdout.trim();
    }
    else {
        clipboard = r.stdout.trim();
    }
    return clipboard;
}

OS.showMessage = function(text) {
    if (Utils.OSisWindows)
    {
        OS._call(" \
        { \
            Add-Type -AssemblyName System.Windows.Forms \
            $result = [System.Windows.Forms.MessageBox]::Show(\""+ text +"\",\"mpv\",[System.Windows.Forms.MessageBoxButtons]::OK) \
            if ($result -eq \"OK\") \
            { \
                exit 0 \
            } \
        } \
        ");
        return;
    }

    if (Utils.OS == "macos") {
        OS._call("osascript -e \"tell application \\\"System Events\\\" to display dialog \\\""+ text +"\\\"\"")
        return;
    }

    if (mp.utils.file_info(mp.utils.get_user_path("/usr/bin/zenity")) != undefined) {
        OS._call("/usr/bin/zenity --info --title=\"mpv\" --text=\""+ text + "\"");
        return;
    }

    if (mp.utils.file_info(mp.utils.get_user_path("/usr/bin/yad")) != undefined) {
        OS._call("/usr/bin/yad --info --title=\"mpv\" --text=\""+ text + "\"");
        return;
    }

    if (mp.utils.file_info(mp.utils.get_user_path("/usr/bin/kdialog")) != undefined) {
        OS._call("/usr/bin/kdialog --msgbox \"" + text +"\"");
        return;
    }

    if (mp.utils.file_info(mp.utils.get_user_path("/usr/bin/xmessage")) != undefined) {
        OS._call("/usr/bin/xmessage \"" + text +"\"");
        return;
    }
}

OS.showNotification = function(text) {

    if (Utils.OSisWindows)
    {
        OS._call(" \
        { \
            Add-Type -AssemblyName System.Windows.Forms \
            try { \
                $global:balloon = New-Object System.Windows.Forms.NotifyIcon \
                $path = (Get-Process \"mpv\").Path \
                $balloon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path) \
                $balloon.BalloonTipText = \""+ text +"\" \
                $balloon.BalloonTipTitle = \"mpv\"  \
                $balloon.Visible = $true  \
                $balloon.ShowBalloonTip(5000) \
            } \
            catch \
            { \
                $global:balloon = New-Object System.Windows.Forms.NotifyIcon \
                $path = (Get-Process \"explorer\").Path \
                $balloon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path) \
                $balloon.BalloonTipText = \""+ text +"\" \
                $balloon.BalloonTipTitle = \"mpv\"  \
                $balloon.Visible = $true  \
                $balloon.ShowBalloonTip(5000) \
            } \
            exit 1 \
        } \
        ");
        return;
    }

    if (Utils.OS == "macos") {
        OS._call("osascript -e \"display notification \\\""+ text +"\\\" with title \\\"mpv\\\"\"")
        return;
    }

    if (mp.utils.file_info(mp.utils.get_user_path("/usr/bin/notify-send")) != undefined) {
        OS._call("/usr/bin/notify-send -i mpv -t 5000 \"mpv\" \""+ text +"\"");
        return;
    }

    Utils.log("No way to display notifications! Falling back to buildin...","OS","warn");
    return;
}

OS.checkConnection = function () {

    if (Utils.OSisWindows)
    {
        return Boolean(OS._call("Test-Connection smto.pw -Quiet -Count 1").stdout.trim());
    }

    if(OS._call("echo -e \"GET http://smto.pw HTTP/1.0\n\n\" | nc google.com 80 >/dev/null 2>&1").status == 0)
    {
        return true;
    }
    return false;
}

// get-dependencies

// download-dependency

// get-version-latest

// get-version-latest-mpv

// git-update

// get-package

// extract-package

// remove-package

// apply-package

// remove-file

// get-image-info

// dependency-postinstall

module.exports = OS;
