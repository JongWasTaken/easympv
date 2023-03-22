# easympv (mpv plugin)

> :warning: **Work in progress**: Master branch can be unstable or non-working!  
Development currently happens on the `replace-compat` branch!

![](https://smto.pw/mpv/images/preview.png)


Extends base mpv with more features and makes it a bit more user-friendly.  
Currently supports Windows, macOS and Linux.  
macOS support is experimental and not fully finished.

## Features
- Menus with custom Fonts
- Alerts in the top right corner
- Integrated File Browser, Disc/Device Selector, URL Input
- Automated applying of shadersets, such as Anime4K
- Color profiles
- Automatic skipping of certain chapters (such as Openings/Endings)
- Automatic Updates
#### and more!
## Installation
### Prerequisites
#### Windows
- Windows 8 or higher (Windows 7 might work if you update Powershell and .NET Framework to v4.5+)
- mpv, the newest version from [here](https://sourceforge.net/projects/mpv-player-windows/files/64bit/)

#### macOS
- mpv, installed using brew: `brew install mpv`  
**Other versions of mpv will not work, as they are not compiled with LuaJIT support!**

#### Linux
The automatic installer script will take care of any dependencies.  
If you wish to install easympv manually you will need the following dependencies:
- mpv, compiled with LuaJIT support (Not all distributions do this!)
- either `wget` (preferred) or `curl` (usually preinstalled)
- `xclip` OR `wl-clipboard` (if you use Wayland)  
    When in doubt, install both!

### Install
#### Windows Installer
Unfinished. Use manual installation for now.  

[//]: # (This sentence will be here once this is finished: Download the latest version from https://smto.pw/mpv/?#downloads.)  
#### Linux Installer
Paste this into a terminal:  
`sh -c "$(curl https://raw.githubusercontent.com/JongWasTaken/easympv/master/scripts/easympv/installer.sh)"`  
This script should work on Arch and Debian/Ubuntu, though it has not been fully tested yet.  
Please report issues!  
#### Manual (All platforms)
Download the master branch and put all files into `%appdata%\mpv` (Windows) or `~/.config/mpv` (macOS/Linux/BSD).  
Launch mpv once to generate config files (`mpv.conf`, `input.conf`, `easympv.conf`).  
Adjust those to your liking, then launch it again.  
In the future there will be some sort of setup on the first start, this is currently unfinished.  

## License
All easympv code and assets (everything in `scripts/easympv/`) is licensed under the MIT License.  
Third-Party assets in this repository use different licenses, such as fonts and shaders.  
See `scripts/easympv/Credits.txt` for all attributions.  
Special thanks to VideoPlayerCode for their awesome plugins, they have served as inspiration for this project, though none of their code has been used.  
