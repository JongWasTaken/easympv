/*
 * OS.JS (PART OF EASYMPV)
 *
 * Author:                  Jong
 * URL:                     https://github.com/JongWasTaken/easympv
 * License:                 MIT License
 */

/**
 * Provides OS interactivity, such as file operations, clipboard access and more.
 */
var OS = {};

OS.alertCategory = "OS Interaction Module";

OS.repoName = "easympv-installer"; // change to easympv once stable
OS.checksCompleted = false;
OS.gitAvailable = false;
OS.isGit = mpv.fileExists(mpv.getUserPath("~~/.git/"));
OS.gitCommit = "";
OS.name = undefined;
OS.isWindows = false;
OS.isSteamGamepadUI = false;
OS.directorySeperator = "/";

OS._connectionChecked = false;
OS._isConnected = false;

OS.init = function () {
    if (mpv.getEnv("OS") == "Windows_NT") {
        OS.name = "win";
        OS.isWindows = true;
        OS.directorySeperator = "\\";
        Utils.commonFontName = "Overpass Light";
        Utils.log("Detected operating system: Windows","startup","info");
    } else {
        var uname = mpv.commandNative({
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
            if (mpv.getEnv("SteamGamepadUI") != undefined)
            {
                Utils.log("Detected Steam GamepadUI","startup","info");
                OS.isSteamGamepadUI = true;
            }
        }
    }
    OS._performChecks();
    OS.getConnectionStatus();

};

OS._performChecks = function () {
    OS.checksCompleted = true;
    // Git
    var r = undefined;
    if (OS.isWindows) {
        r = OS._call("Get-Command git | foreach { $_.Source }");
    } else {
        r = OS._call("which git");
    }
    if (mpv.fileExists(r.stdout.trim())) {
        OS.gitAvailable = true;
    }
    if (OS.gitAvailable && OS.isGit) {
        var configdir = mpv.getUserPath("~~/");
        var and = "&&";
        if (OS.isWindows) { and = ";"; }
        OS.gitCommit = OS._call("cd "+configdir+" "+ and +" git rev-parse --abbrev-ref HEAD").stdout.trim() + "-" + OS._call("cd "+configdir+" "+ and +" git rev-parse --short HEAD").stdout.trim();
    }
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
        mpv.writeFile(
            mpv.getUserPath("~~/.tmp-powershell.ps1"),
            cmd// + "\nRemove-Item -Path $MyInvocation.MyCommand.Source\nexit 0"
        );
    }

    if (OS.isWindows) {
        var args = [
            "powershell",
            "-NoProfile",
            "-ExecutionPolicy",
            "bypass",
            "-Command",
            mpv.getUserPath("~~/.tmp-powershell.ps1")
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
        var r = mpv.commandNativeAsync(
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
        var r = mpv.commandNative(
            {
                name: "subprocess",
                playback_only: false,
                capture_stdout: true,
                capture_stderr: false,
                args: args,
            }
        );
    }

    if (OS.isWindows)
    {
        if (mpv.fileExists(mpv.getUserPath("~~/.tmp-powershell.ps1")))
        {
            var dcommand = "Remove-Item -Path \""+ mpv.getUserPath("~~/.tmp-powershell.ps1") +"\" -Force";
            mpv.commandNative(
                {
                    name: "subprocess",
                    playback_only: false,
                    capture_stdout: true,
                    capture_stderr: false,
                    args: ["powershell","-NoProfile","-Command",dcommand],
                }
            );
        }
    }

    if (r != undefined) {
        return r;
    }
    return "";
}

OS.openFile = function(file, raw) {
    if (file == undefined)
    {
        file = ""
    }

    if (raw == undefined) {
        file = mpv.getUserPath("~~/") + "/" + file;
        file = file.replaceAll("//", "/");
        file = file.replaceAll('"+"', "/");
    }
    //mpv.printWarn(file);
    if (OS.isWindows) {
        file = file.replaceAll("/", "\\");
        // look at this monstrosity. why is windows the way it is?
        OS._call("$processOptions = @{ \n"+
        "    FilePath = \"cmd.exe\"\n"+
        "    ArgumentList = \"/c\", \"start \`\"\`\" \`\""+file+"\`\" && exit %errorlevel%\" \n"+ // unholy amounts of escape sequences
        "}\n"+
        "try { Start-Process @processOptions } Catch [system.exception] {exit 1}\n"+
        "exit $LASTEXITCODE",false,undefined);
        // meanwhile *nix:
    } else if (OS.name == "linux") {
        mpv.commandv("run", "sh", "-c", "xdg-open " + file);
    } else if (OS.name == "macos") {
        mpv.commandv("run", "sh", "-c", "open " + file);
    }
    Utils.log("Opening file: " + file,"main","info");
};

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
        OS._call("Add-Type -AssemblyName System.Windows.Forms\n"+
            "$result = [System.Windows.Forms.MessageBox]::Show(\""+ text +"\",\"mpv\",[System.Windows.Forms.MessageBoxButtons]::OK)\n"+
            "exit 0\n",async,callback);
        return;
    }

    if (OS.name == "macos") {
        OS._call("osascript -e \"tell application \\\"System Events\\\" to display dialog \\\""+ text +"\\\"\"",async,callback)
        return;
    }

    if (mpv.fileExists(mpv.getUserPath("/usr/bin/zenity"))) {
        OS._call("/usr/bin/zenity --info --title=\"mpv\" --text=\""+ text + "\"",async,callback);
        return;
    }

    if (mpv.fileExists(mpv.getUserPath("/usr/bin/yad"))) {
        OS._call("/usr/bin/yad --info --title=\"mpv\" --text=\""+ text + "\"",async,callback);
        return;
    }

    if (mpv.fileExists(mpv.getUserPath("/usr/bin/kdialog"))) {
        OS._call("/usr/bin/kdialog --msgbox \"" + text +"\"",async,callback);
        return;
    }

    if (mpv.fileExists(mpv.getUserPath("/usr/bin/xmessage"))) {
        OS._call("/usr/bin/xmessage \"" + text +"\"",async,callback);
        return;
    }
}

OS.showNotification = function(text) {
    if (OS.isWindows)
    {
        return OS._call(
            "Add-Type -AssemblyName System.Windows.Forms \n"+
            "try { \n"+
            "    $global:balloon = New-Object System.Windows.Forms.NotifyIcon \n"+
            "    $path = (Get-Process \"mpv\").Path \n"+
            "    $balloon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path) \n"+
            "    $balloon.BalloonTipText = \""+ text +"\"\n"+
            "    $balloon.BalloonTipTitle = \"mpv\"  \n"+
            "    $balloon.Visible = $true  \n"+
            "    $balloon.ShowBalloonTip(5000) \n"+
            "    exit 0 \n"+
            "} \n"+
            "catch \n"+
            "{ \n"+
            "    $global:balloon = New-Object System.Windows.Forms.NotifyIcon \n"+
            "    $path = (Get-Process \"explorer\").Path \n"+
            "    $balloon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path) \n"+
            "    $balloon.BalloonTipText = \""+ text +"\" \n"+
            "    $balloon.BalloonTipTitle = \"mpv\"  \n"+
            "    $balloon.Visible = $true  \n"+
            "    $balloon.ShowBalloonTip(5000) \n"+
            "    exit 0 \n"+
            "} \n"+
            "exit 1 \n").status  == 0 ? true : false;
    }

    if (OS.name == "macos") {
        return OS._call("osascript -e \"display notification \\\""+ text +"\\\" with title \\\"mpv\\\"\"").status  == 0 ? true : false;
    }

    if (mpv.fileExists(mpv.getUserPath("/usr/bin/notify-send"))) {
        return OS._call("/usr/bin/notify-send -i mpv -t 5000 \"mpv\" \""+ text +"\"").status == 0 ? true : false;
    }

    Utils.log("No way to display notifications! Falling back to buildin...","OS","warn");
    return false;
}

// get-connection-status
OS._checkConnectionAsync = function (callback) {

    if (OS.isWindows)
    {
        return OS._call("Test-Connection github.com -Quiet -Count 1",true,callback);
    }

    return OS._call("curl --head https://github.com >/dev/null 2>&1",true,callback);
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

// get-version-latest
OS.versionGetLatestAsync = function (callback) {
    if (OS.isWindows)
    {
        return OS._call("$webclient = New-Object System.Net.WebClient\n"+
        "$latest = $webclient.DownloadString(\"https://github.com/JongWasTaken/"+OS.repoName+"/releases/latest/download/release.json\")\n"+
        "Write-Output $latest.Trim()\n"+
        "exit 0",true,callback);
    }

    return OS._call("curl -LJs https://github.com/JongWasTaken/"+OS.repoName+"/releases/latest/download/release.json",true,callback);
}

// git-update
OS.gitUpdate = function (callback) {
    var exitCode = 127;
    if(OS.isWindows)
    {
        exitCode = OS._call("Set-Location "+mpv.getUserPath("~~/")+" \n"+
        "$processOptions = @{\n"+
        "FilePath = \"cmd.exe\"\n"+
        "ArgumentList = \"/k\", \"cd "+mpv.getUserPath("~~/")+" && git pull && exit %errorlevel%\"\n"+ 
        "}\n"+
        "try { Start-Process @processOptions } Catch [system.exception] {exit 1} \n"+
        "exit $LASTEXITCODE",true,callback).status;
    }
    else
    {
        exitCode = OS._call("cd "+mpv.getUserPath("~~/")+" && git pull",true,callback).status;
    }
    return exitCode == 0 ? true: false;
}

// get-package
OS.packageGetAsync = function (tag, callback) {
    if(mpv.fileExists("~~" + OS.directorySeperator + "package.zip"))
    {
        OS.fileRemove("package.zip");
    }

    var exitCode = 127;
    if(OS.isWindows)
    {
        exitCode = OS._call("$webclient = New-Object System.Net.WebClient \n"+
        "try { $webclient.DownloadFile(\"https://codeload.github.com/JongWasTaken/easympv/zip/refs/tags/"+tag+"\",\""+mpv.getUserPath("~~/package.zip")+"\") } Catch [system.exception] {exit 1} \n"+
        "exit 0",true,callback).status;
    }
    else
    {
        exitCode = OS._call("curl -LJs https://codeload.github.com/JongWasTaken/easympv/zip/refs/tags/"+tag+" -o \""+mpv.getUserPath("~~/package.zip")+"\"",true,callback).status;
    }
    return exitCode == 0 ? true: false;
}

// extract-package
OS.packageExtractAsync = function (callback) {
    if(!mpv.fileExists("~~" + OS.directorySeperator + "package.zip"))
    {
        return false;
    }

    var exitCode = 127;
    if(OS.isWindows)
    {
        exitCode = OS._call("try { \n"+
            "$shell = New-Object -ComObject Shell.Application \n"+
            "$zip = $shell.Namespace(\""+ mpv.getUserPath("~~/package.zip") +"\") \n"+
            "$items = $zip.items() \n"+
            "$shell.Namespace(\""+mpv.getUserPath("~~/")+"\").CopyHere($items, 1556) } \n"+
            "Catch [system.exception] {exit 1} exit 0",true,callback).status;
    }
    else
    {
        exitCode = OS._call("unzip \""+ mpv.getUserPath("~~/package.zip") +"\" -d \""+ mpv.getUserPath("~~/") +"\"",true,callback).status;
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
    if(!mpv.fileExists(mpv.getUserPath("~~/easympv-" + tag)))
    {
        return false;
    }

    var exitCode = 127;
    if(OS.isWindows)
    {
        exitCode = OS._call("Copy-Item -Path \"" + mpv.getUserPath("~~/easympv-" + tag) + "\*\" -Destination \""+ mpv.getUserPath("~~/") +"\" -Recurse -Force \n"+
        "Remove-Item -Path \"" + mpv.getUserPath("~~/easympv-" + tag) + "\" -Force -Recurse",true,callback).status;
    }
    else
    {
        exitCode = OS._call("cp -r \"" + mpv.getUserPath("~~/easympv-" + tag) + "/*\" \"" + mpv.getUserPath("~~/") + "\" && rm -rf \""+mpv.getUserPath("~~/easympv-" + tag)+"\"",true,callback).status;
    }
    return exitCode == 0 ? true: false;
}

//
OS.fileInfo = function (file) {
    return mpv.fileInfo(file);
}

// move-file
OS.fileMoveSystemwide = function (source, target) {
    file = file.replaceAll("/",OS.directorySeperator);
    target = target.replaceAll("/",OS.directorySeperator);

    if (!mpv.fileExists(source))
    {
        return false;
    }
    var exitCode = 127;
    if(OS.isWindows)
    {
        // TODO: no idea if this works on Windows
        exitCode = OS._call("Move-Item -Path \""+source+"\" -Destination \""+target+"\" -Force").status;
    }
    else
    {
        exitCode = OS._call("mv \"" + file + "\" \"" + target + "\"").status;
    }
    return exitCode == 0 ? true: false;
}

// remove-file
OS.fileRemove = function (file) {
    file = file.replaceAll("/",OS.directorySeperator);
    if (!mpv.fileExists(mpv.getUserPath("~~/" + file)))
    {
        return false;
    }
    var exitCode = 127;
    if(OS.isWindows)
    {
        exitCode = OS._call("Remove-Item -Path \""+mpv.getUserPath("~~/" + file)+"\" -Force").status;
    }
    else
    {
        exitCode = OS._call("rm -rf \""+mpv.getUserPath("~~/" + file)+"\"").status;
    }
    return exitCode == 0 ? true: false;
}

OS.fileTrashSystemwide = function (path) {
    if (!mpv.fileExists(path))
    {
        return false;
    }

    if(OS.isWindows)
    {
        // powershell is weird with brackets
        path = path.replaceAll("\\\\","\\");
        path = path.replaceAll("\\[","\`\`\[");
        path = path.replaceAll("\\]","\`\`\]");
        return OS._call("Add-Type -AssemblyName Microsoft.VisualBasic\n"+
        "function Remove-Item-ToRecycleBin($Path) {\n"+
        "$item = Get-Item -Path $Path -ErrorAction SilentlyContinue\n"+
        "if ($item -eq $null)\n"+
        "{\n"+
        "    Write-Error(\"'{0}' not found\" -f $Path)\n"+
        "}\n"+
        "else\n"+
        "{\n"+
        "    $fullpath=$item.FullName\n"+
        "    Write-Verbose (\"Moving '{0}' to the Recycle Bin\" -f $fullpath)\n"+
        "    if (Test-Path -Path $fullpath -PathType Container)\n"+
        "     {\n"+
        "         [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($fullpath,'OnlyErrorDialogs','SendToRecycleBin')\n"+
        "     }\n"+
        "    else\n"+
        "     {\n"+
        "         [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($fullpath,'OnlyErrorDialogs','SendToRecycleBin')\n"+
        "    }\n"+
        "}\n"+
        "}\n"+
        "Remove-Item-ToRecycleBin(\""+path+"\")\n").status == 0 ? true: false;
    }
    else
    {
        return OS._call("trash \"" + path + "\"").status == 0 ? true: false;
    }
}


OS.fileRemoveSystemwide = function (path) {
    if (!mpv.fileExists(path))
    {
        return false;
    }

    if(OS.isWindows)
    {
        // powershell is weird with brackets
        path = path.replaceAll("\\\\","\\");
        path = path.replaceAll("\\[","\`\`\[");
        path = path.replaceAll("\\]","\`\`\]");
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
        return OS._call("Add-Type -AssemblyName System.Drawing \n"+
        "$fstring = \"\" \n"+
        "try \n"+
        "{ \n"+
        "    $bmp = New-Object System.Drawing.Bitmap \""+path+"\" \n"+
        "    $fstring += $bmp.Width + \"|\" \n"+
        "    $fstring += $bmp.Height \n"+
        "    $bmp.Dispose() \n"+
        "} \n"+
        "Catch [system.exception] \n"+
        "{exit 1} \n"+
        "Write-Output $fstring \n"+
        "exit 0");
    }

    return OS._call("file -b " + path);
}

// update-mpv
OS.updateMpvWindows = function (path)
{
    if(OS.isWindows)
    {
        if (path == undefined) { path = Settings.Data.mpvLocation; }
        return OS._call("$processOptions = @{ \n"+
        "    FilePath = \"powershell.exe\" \n"+
        "    Verb = \"runAs\" \n"+
        "    ArgumentList = \"powershell\", \"-Command {cd \'"+ path +"\' ; .\\installer\\updater.ps1}\", \"-NoExit\", \"-ExecutionPolicy bypass\" \n"+
        "} \n"+
        "try \n"+
        "{ \n"+
        "    Start-Process @processOptions \n"+
        "} \n"+
        "Catch [system.exception] {exit 1} \n"+
        "exit 0").status == 0 ? true: false;
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
        return OS._call("$fstring = \"\" \n"+
        "$filter = \"DriveType = "+type+"\" \n"+
        "try { \n"+
        "    $w = Get-WmiObject -Class Win32_LogicalDisk -Filter $filter -errorvariable MyErr -erroraction Stop; \n"+
        "    $w | ForEach-Object { $fstring += $_.DeviceID + \"|\" } \n"+
        "} \n"+
        "Catch [system.exception] { exit 1 } \n"+
        "if($w.Count -eq 0) { exit 1 } \n"+
        "$fstring = $fstring -replace \"(.*)\|(.*)\", '$1$2' \n"+
        "Write-Output $fstring \n"+
        "exit 0").stdout.trim();
    }
    return "";
}

OS.runScriptElevated = function (path, callback) {
    if(OS.isWindows)
    {
        return OS._call("$processOptions = @{\n"+
        "    FilePath = \"powershell.exe\"\n"+
        "    Verb = \"runAs\"\n"+
        "    ArgumentList = \"cmd\", \"/c\", \"\'"+ path +"\'\", \"/u\"\n"+
        "}\n"+
        "try\n"+
        "{\n"+
        "    Start-Process @processOptions\n"+
        "}\n"+
        "Catch [system.exception]\n"+
        "{exit 1}\n"+
        "exit 0", true, callback).status == 0 ? true: false;
    }
    return false;
}

/**
 * Registers mpv on Windows only.
 */
OS.registerMpv = function () {
    var onFinished = function () {
        UI.Alerts.push(Settings.getLocalizedString("alerts.registered"), OS.alertCategory, UI.Alerts.Urgencies.Normal);
    };

    if (OS.isWindows) {
        if (Settings.Data.mpvLocation != "unknown") {
            OS.runScriptElevated(Settings.Data.mpvLocation + "\\installer\\mpv-install.bat",onFinished);
        } else {
            UI.Alerts.push(Settings.getLocalizedString("alerts.locationunknown"), OS.alertCategory, UI.Alerts.Urgencies.Error);
        }
    } else {
        UI.Alerts.push(Settings.getLocalizedString("alerts.onlyonwindows"), OS.alertCategory, UI.Alerts.Urgencies.Normal);
    }
    return;
};

/**
 * Unregisters mpv on Windows only.
 */
OS.unregisterMpv = function () {
    var onFinished = function () {
        UI.Alerts.push(Settings.getLocalizedString("alerts.unregistered"), OS.alertCategory, UI.Alerts.Urgencies.Normal);
    };

    if (OS.isWindows) {
        if (Settings.Data.mpvLocation != "unknown") {
            OS.runScriptElevated(Settings.Data.mpvLocation + "\\installer\\mpv-uninstall.bat",onFinished);
        } else {
            UI.Alerts.push(Settings.getLocalizedString("alerts.locationunknown"), OS.alertCategory, UI.Alerts.Urgencies.Error);
        }
    } else {
        UI.Alerts.push(Settings.getLocalizedString("alerts.onlyonwindows"), OS.alertCategory, UI.Alerts.Urgencies.Normal);
    }
    return;
};

OS.getProcessArguments = function () {
    var proc = undefined;
    if (OS.isWindows) {
        proc = OS._call(
            "$fstring = \"\" \n"+
            "try \n"+
            "{ \n"+
            "    $fstring = Get-WmiObject -Query \"SELECT CommandLine FROM Win32_Process WHERE ProcessID = "+mpv.getPid()+"\"\n"+
            "} \n"+
            "Catch [system.exception] \n"+
            "{exit 1} \n"+
            "Write-Output $fstring \n"+
            "exit 0");
    } else {
        proc = OS._call("ps -p "+ mpv.getPid() +" -o args --no-headers");
    }

    if (proc.status != 0) return undefined;
    var args = proc.stdout.trim().split(" ");

    var out = [];
    out.push(args[0]);
    for (var i = 1; i < args.length; i++) {
        if (args[i].charAt(0) == "-" && args[i].charAt(1) == "-") {
            out.push(args[i]);
        }
    }

    return out;
}

OS.createMinifiedBundle = function () {
    //if (Environment.minified) return "Cannot minify in minified environment!";
    if (OS.isWindows) return "Cannot minify on Windows!";
    if (!mpv.fileExists("/usr/bin/uglifyjs")) return "UglifyJS not installed!";

    for(var i = 0; i < Environment.LoadOrder.length; i++) {
        if (!mpv.fileExists(mpv.getUserPath("~~/scripts/easympv/") + Environment.LoadOrder[i])) {
            return "Necessary files are not available, as this is not a development environment!";
        }
    }

    if(OS._call("cd " + mpv.getUserPath("~~/scripts/easympv/") + " && /usr/bin/uglifyjs " + Environment.LoadOrder.join(" ") + " --ie -o ./minified.js").status == 0 ? true: false) {
        return  "Successfully created \'minified.js\" in script root!";
    }
    return "Error during minification!";
};