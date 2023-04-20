/*
 * OS.JS (MODULE)
 *
 * Author:                  Jong
 * URL:                     http://smto.pw/mpv
 * License:                 MIT License
 */

// Most functions here are not in use yet!

var OS = {};

OS.checksCompleted = false;
OS.gitAvailable = false;

OS.name = undefined;
OS.isWindows = false;
OS.isSteamGamepadUI = false;
OS.directorySeperator = "/";

OS._connectionChecked = false;
OS._isConnected = false;

OS.init = function () {
    OS.getConnectionStatus();
    if (mp.utils.getenv("OS") == "Windows_NT") {
        OS.name = "win";
        OS.isWindows = true;
        OS.directorySeperator = "\\";
        Utils.commonFontName = "Overpass Light";
        Utils.log("Detected operating system: Windows","startup","info");
    } else {
        var uname = mp.command_native({
            name: "subprocess",
            playback_only: false,
            capture_stdout: true,
            capture_stderr: false,
            args: ["sh", "-c", "uname -a"],
        });

        if (uname.status != "0") {
            OS.name = "unknown";
            Utils.log("Detected operating system: unknown","startup","warn");
            Utils.log("There was an issue while identifying your operating system: uname is not available!","startup","error");
        } else {
            var output = uname.stdout.trim();
            if (output.includes("Darwin")) {
                OS.name = "macos";
                Utils.log("Detected operating system: macOS","startup","info");
                Utils.log(
                    "macOS support is experimental. Please report any issues.","startup","error"
                );
            } else if (output.includes("Linux")) {
                OS.name = "linux";
                Utils.log("Detected operating system: Linux","startup","info");
            } else {
                OS.name = "linux";
                Utils.log("Detected operating system: Unix-like?","startup","info");
                Utils.log(
                    "Your OS is untested, but if it is similar to Linux it will probably be fine.","startup","error"
                );
            }
            if (mp.utils.getenv("SteamGamepadUI") != undefined)
            {
                Utils.log("Detected Steam GamepadUI","startup","info");
                OS.isSteamGamepadUI = true;
            }
        }
    }
};

OS._performChecks = function () {
    // Git
    if (OS.isWindows) {
        var args = [
            "powershell",
            "-NoProfile",
            "-Command",
            "Get-Command git",
        ];
    } else {
        var args = [
            "sh",
            "-c",
            "which git",
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
    if (mp.utils.file_info(r.stdout.trim()) != undefined) {
        OS.gitAvailable = true;
    }

    OS.checksCompleted = true;
}

OS._call = function (cmd,async,callback) {

    if (async == undefined)
    {
        async = false;
    }

    if(!OS.checksCompleted) {
        OS._performChecks();
    }

    if (OS.isWindows) {
        mp.utils.write_file(
            "file://" + mp.utils.get_user_path("~~/.tmp-powershell.ps1"),
            cmd
        );
    }

    if (OS.isWindows) {
        var args = [
            "powershell",
            "-NoProfile",
            "-Command",
            mp.utils.get_user_path("~~/.tmp-powershell.ps1")
            //cmd,
        ];
    } else {
        var args = [
            "sh",
            "-c",
            cmd,
        ];
    }

    if(async)
    {
        var r = mp.command_native_async(
            {
                name: "subprocess",
                playback_only: false,
                capture_stdout: true,
                capture_stderr: false,
                args: args,
            },callback
        );
    }
    else
    {
        var r = mp.command_native(
            {
                name: "subprocess",
                playback_only: false,
                capture_stdout: true,
                capture_stderr: false,
                args: args,
            }
        );
    }
    if (r != undefined) {
        return r;
    }
    return "";
}

OS.getClipboard = function () {
    var clipboard = "";

    if (OS.isWindows)
    {
        return OS._call("Get-Clipboard").stdout.trim();
    }

    if (OS.name == "macos") {
        return OS._call("pbpaste").stdout.trim();
    }

    var r = OS._call("wl-paste");

    if (r.status != 0) {
        clipboard = OS._call("xclip -o").stdout.trim();
    }
    else {
        clipboard = r.stdout.trim();
    }
    return clipboard;
}

OS.showMessage = function(text,async) {

    var callback = function(){};

    if (OS.isWindows)
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
        ",async,callback);
        return;
    }

    if (OS.name == "macos") {
        OS._call("osascript -e \"tell application \\\"System Events\\\" to display dialog \\\""+ text +"\\\"\"",async,callback)
        return;
    }

    if (mp.utils.file_info(mp.utils.get_user_path("/usr/bin/zenity")) != undefined) {
        OS._call("/usr/bin/zenity --info --title=\"mpv\" --text=\""+ text + "\"",async,callback);
        return;
    }

    if (mp.utils.file_info(mp.utils.get_user_path("/usr/bin/yad")) != undefined) {
        OS._call("/usr/bin/yad --info --title=\"mpv\" --text=\""+ text + "\"",async,callback);
        return;
    }

    if (mp.utils.file_info(mp.utils.get_user_path("/usr/bin/kdialog")) != undefined) {
        OS._call("/usr/bin/kdialog --msgbox \"" + text +"\"",async,callback);
        return;
    }

    if (mp.utils.file_info(mp.utils.get_user_path("/usr/bin/xmessage")) != undefined) {
        OS._call("/usr/bin/xmessage \"" + text +"\"",async,callback);
        return;
    }
}

OS.showNotification = function(text) {
    if (OS.isWindows)
    {
        return OS._call(" \
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
        ").status  == 0 ? true : false;
    }

    if (OS.name == "macos") {
        return OS._call("osascript -e \"display notification \\\""+ text +"\\\" with title \\\"mpv\\\"\"").status  == 0 ? true : false;
    }

    if (mp.utils.file_info(mp.utils.get_user_path("/usr/bin/notify-send")) != undefined) {
        return OS._call("/usr/bin/notify-send -i mpv -t 5000 \"mpv\" \""+ text +"\"").status == 0 ? true : false;
    }

    Utils.log("No way to display notifications! Falling back to buildin...","OS","warn");
    return false;
}

// get-connection-status
OS._checkConnectionAsync = function (callback) {

    if (OS.isWindows)
    {
        return OS._call("Test-Connection smto.pw -Quiet -Count 1",true,callback);
    }

    return OS._call("curl --head https://smto.pw >/dev/null 2>&1",true,callback);
}

OS.getConnectionStatus = function () {
    if (OS._connectionChecked)
    {
        return OS._isConnected;
    }

    var callback = function (success, result, error) {
        if (result != undefined) {
            OS._isConnected = result.status == 0 ? true : false;
            //OS._isConnected = Boolean(result.stdout.trim());
        }
    };

    var call = OS._checkConnectionAsync(callback);

    setTimeout(function() {
        try { mp.abort_async_command(call); }
        catch(e) { }
    },1000)

    OS._connectionChecked = true;
    return false;
}

// get-dependencies
OS.dependencyGetList = function () {
    if (OS.isWindows)
    {
        return OS._call("$webclient = New-Object System.Net.WebClient\
        $latest = $webclient.DownloadString(\"https://smto.pw/mpv/hosted/dependencies.json\")\
        Write-Output $latest.Trim()\
        exit 0").stdout.trim();
    }

    return OS._call("curl -s https://smto.pw/mpv/hosted/dependencies.json").stdout.trim();
}

// download-dependency
OS.dependencyDownload = function (url, target) {
    var exitCode = 127;
    if(OS.isWindows)
    {
        exitCode = OS._call("$webclient = New-Object System.Net.WebClient \
        try { $webclient.DownloadFile(\""+url+"\",\""+target+"\") } Catch [system.exception] {exit 1} \
        exit 0").status;
    }
    else
    {
        exitCode = OS._call("curl -s "+url+" -o \"$HOME/.config/mpv/"+target+"\"").status;
    }
    return exitCode == 0 ? true: false;
}

// dependency-postinstall
OS.dependencyPostInsatll = function () {
    if(OS.name == "macos")
    {
        if (mp.utils.file_info("/usr/local/lib/libdiscord_game_sdk.dylib") == undefined)
        {
            var msg = OS._call("osascript -e 'tell application \"System Events\" to display dialog \"For Discord integration to work, GameSDK needs to be installed on your system. This requires your password. Press OK to continue.\"'").stdout.trim();
            if (msg.includes("OK"))
            {
                OS._call("osascript -e 'do shell script \"mkdir -p /usr/local/lib/ && mv ~/.config/mpv/scripts/mpvcord/discord_game_sdk.dylib /usr/local/lib/libdiscord_game_sdk.dylib\" with administrator privileges'");
                if(mp.utils.file_info("/usr/local/lib/libdiscord_game_sdk.dylib") != undefined)
                {
                    OS._call("osascript -e 'tell application \"System Events\" to display dialog \"Installation finished. Discord integration will work after restarting mpv.\"'");
                    return true;
                }
                else return false;
            } else return false;
        }
    }
    return false;
}

// get-version-latest
OS.versionGetLatestAsync = function (callback) {
    if (OS.isWindows)
    {
        return OS._call("$webclient = New-Object System.Net.WebClient\
        $latest = $webclient.DownloadString(\"https://smto.pw/mpv/hosted/latest.json\")\
        Write-Output $latest.Trim()\
        exit 0",true,callback);
    }

    return OS._call("curl -s https://smto.pw/mpv/hosted/latest.json",true,callback);
}

// get-version-latest-mpv
OS.versionGetLatestmpvAsync = function (callback) {
    if (OS.isWindows)
    {
        return OS._call("$webclient = New-Object System.Net.WebClient\
        $latest = $webclient.DownloadString(\"https://smto.pw/mpv/hosted/mpvLatestVersion\")\
        Write-Output $latest.Trim()\
        exit 0",true,callback);
    }

    return OS._call("curl -s https://smto.pw/mpv/hosted/mpvLatestVersion",true,callback);
}

// git-update
OS.gitUpdate = function () {
    var exitCode = 127;
    if(OS.isWindows)
    {
        exitCode = OS._call("Set-Location $env:APPDATA\\mpv\\ \
        $processOptions = @{ FilePath = \"cmd.exe\" ArgumentList = \"/k\", \"{cd $env:APPDATA\\mpv\ && git pull\" }\
        try { Start-Process @processOptions } Catch [system.exception] {exit 1} \
        exit 0").status;
    }
    else
    {
        exitCode = OS._call("cd ~/.config/mpv/ && git pull").status;
    }
    return exitCode == 0 ? true: false;
}

// get-package
OS.packageGetAsync = function (tag, callback) {
    if(mp.utils.file_info("~~" + Utils.directorySeperator + "package.zip") != undefined)
    {
        OS.fileRemove("package.zip");
    }

    var exitCode = 127;
    if(OS.isWindows)
    {
        exitCode = OS._call("$webclient = New-Object System.Net.WebClient \
        try { $webclient.DownloadFile(\"https://codeload.github.com/JongWasTaken/easympv/zip/refs/tags/"+tag+"\",\"$env:appdata\\mpv\\package.zip\") } Catch [system.exception] {exit 1} \
        exit 0",true,callback).status;
    }
    else
    {
        exitCode = OS._call("curl -LJs https://codeload.github.com/JongWasTaken/easympv/zip/refs/tags/"+tag+" -o \"$HOME/.config/mpv/package.zip\"",true,callback).status;
    }
    return exitCode == 0 ? true: false;
}

// extract-package
OS.packageExtractAsync = function (callback) {
    if(mp.utils.file_info("~~" + Utils.directorySeperator + "package.zip") == undefined)
    {
        return false;
    }

    var exitCode = 127;
    if(OS.isWindows)
    {
        exitCode = OS._call("try { \
            $shell = New-Object -ComObject Shell.Application \
            $zip = $shell.Namespace(\"$env:APPDATA\\mpv\\package.zip\") \
            $items = $zip.items() \
            $shell.Namespace(\"$env:APPDATA\\mpv\").CopyHere($items, 1556) } \
        Catch [system.exception] {exit 1} exit 0",true,callback).status;
    }
    else
    {
        exitCode = OS._call("unzip \"$HOME/.config/mpv/package.zip\" -d \"$HOME/.config/mpv/\"",true,callback).status;
    }
    return exitCode == 0 ? true: false;
}

// remove-package
OS.packageRemoveAsync = function (callback) {
    OS.fileRemove("package.zip");
    callback();
}

// apply-package
OS.packageApplyAsync = function (tag,callback) {
    if(mp.utils.file_info("~~" + Utils.directorySeperator + "easympv-" + tag) == undefined)
    {
        return false;
    }

    var exitCode = 127;
    if(OS.isWindows)
    {
        exitCode = OS._call("Copy-Item -Path \"$env:APPDATA\\mpv\\easympv-"+tag+"\*\" -Destination \"$env:APPDATA\\mpv\" -Recurse -Force \
        Remove-Item -Path \"$env:APPDATA\\mpv\\easympv-"+tag+"\" -Force -Recurse",true,callback).status;
    }
    else
    {
        exitCode = OS._call("cp -r \"$HOME/.config/mpv/easympv-"+tag+"/\"* \"$HOME/.config/mpv/\" && rm -rf \"$HOME/.config/mpv/easympv-"+tag+"\"",true,callback).status;
    }
    return exitCode == 0 ? true: false;
}

//
OS.fileInfo = function (file) {
    return mp.utils.file_info(file);
}

// remove-file
OS.fileRemove = function (file) {
    if (mp.utils.file_info("~~" + Utils.directorySeperator + file) == undefined)
    {
        return false;
    }

    var exitCode = 127;
    if(OS.isWindows)
    {
        exitCode = OS._call("Remove-Item -Path \"$env:APPDATA\\mpv\\"+file+"\" -Force").status;
    }
    else
    {
        exitCode = OS._call("rm -rf \"$HOME/.config/mpv/"+file+"\"").status;
    }
    return exitCode == 0 ? true: false;
}

OS.fileRemoveSystemwide = function (path) {
    if (mp.utils.file_info(path) == undefined)
    {
        return false;
    }

    if(OS.isWindows)
    {
        return OS._call("Remove-Item -Path \""+path+"\" -Force").status == 0 ? true: false;
    }
    else
    {
        return OS._call("rm -rf \"" + path + "\"").status == 0 ? true: false;
    }
}

// get-image-info
OS.getImageInfo = function (path) {
    if(OS.isWindows)
    {
        return OS._call("Add-Type -AssemblyName System.Drawing \
        $fstring = \"\" \
        try \
        { \
            $bmp = New-Object System.Drawing.Bitmap \""+path+"\" \
            $fstring += $bmp.Width + \"|\" \
            $fstring += $bmp.Height \
            $bmp.Dispose() \
        } \
        Catch [system.exception] \
        {exit 1} \
        Write-Output $fstring \
        exit 0");
    }

    return OS._call("file -b " + path);
}

// Windows-only:
// elevate
OS.runElevatedCommand = function (command)
{
    if (OS.isWindows)
    {
        return OS._call("$processOptions = @{ \
            FilePath = \"powershell.exe\" \
            Verb = \"runAs\" \
            ArgumentList = \"cmd\", \"/c\", "+ command +", \"/u\" \
        } \
        try \
        { \
            Start-Process @processOptions \
        } \
        Catch [system.exception] {exit 1} \
        exit 0").status == 0 ? true: false;
    }
    return false;
}

// update-mpv
OS.updateMpvWindows = function (path)
{
    if(OS.isWindows)
    {
        return OS._call("$processOptions = @{ \
            FilePath = \"powershell.exe\" \
            Verb = \"runAs\" \
            ArgumentList = \"powershell\", \"-Command {cd "+ path +" ; .\\installer\\updater.ps1}\", \"-NoExit\", \"-ExecutionPolicy bypass\" \
        } \
        try \
        { \
            Start-Process @processOptions \
        } \
        Catch [system.exception] {exit 1} \
        exit 0").status == 0 ? true: false;
    }
    return false;
}

// get-drive(type)
/**
 * @param {number} type should be one of these values:
 * 5: CD/DVD / 2: USB Drive / 3: Local Drive / 4: Network Drive
 */
OS.getWindowsDriveInfo = function (type) {
    if(OS.isWindows)
    {
        return OS._call("$fstring = \"\" \
        $filter = \"DriveType = "+type+"\" \
        try { \
            $w = Get-WmiObject -Class Win32_LogicalDisk -Filter $filter -errorvariable MyErr -erroraction Stop; \
            $w | ForEach-Object { $fstring += $_.DeviceID + \"|\" } \
        } \
        Catch [system.exception] { exit 1 } \
        if($w.Count -eq 0) { exit 1 } \
        $fstring = $fstring -replace \"(.*)\|(.*)\", '$1$2' \
        Write-Output $fstring \
        exit 0").stdout.trim();
    }
    return "";
}

/**
 * Registers mpv on Windows only.
 */
OS.registerMpv = function () {
    var onFinished = function () {
        Utils.showAlert(
            "info",
            "Successfully registered mpv! " +
            "Do not close any windows that have" +
            " opened. They will close themselves."
        );
    };

    if (OS.isWindows) {
        if (Settings.Data.mpvLocation != "unknown") {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "elevate",
                Settings.Data.mpvLocation + "\\installer\\mpv-install.bat",
            ];
            mp.command_native_async(
                {
                    name: "subprocess",
                    playback_only: false,
                    capture_stdout: true,
                    capture_stderr: false,
                    args: args,
                },
                onFinished
            );
        } else {
            Utils.showAlert(
                "error",
                "mpv location is unknown. " +
                "Please update easympv.conf!"
            );
        }
    } else {
        Utils.showAlert("error", "Only supported on Windows.");
    }
    return;
};

/**
 * Unregisters mpv on Windows only.
 */
OS.unregisterMpv = function () {
    var onFinished = function () {
        Utils.showAlert(
            "info",
            "Successfully unregistered mpv! " +
            "Do not close any windows that have" +
            " opened. They will close themselves."
        );
    };

    if (OS.isWindows) {
        if (Settings.Data.mpvLocation != "unknown") {
            var args = [
                "powershell",
                "-executionpolicy",
                "bypass",
                mp.utils
                    .get_user_path("~~/scripts/easympv/WindowsCompat.ps1")
                    .replaceAll("/", "\\"),
                "elevate",
                Settings.Data.mpvLocation + "\\installer\\mpv-uninstall.bat",
            ];
            mp.command_native_async(
                {
                    name: "subprocess",
                    playback_only: false,
                    capture_stdout: true,
                    capture_stderr: false,
                    args: args,
                },
                onFinished
            );
        } else {
            Utils.showAlert(
                "error",
                "mpv location is unknown. " +
                "Please update easympv.conf!"
            );
        }
    } else {
        Utils.showAlert("error", "Only supported on Windows.");
    }
    return;
};

module.exports = OS;