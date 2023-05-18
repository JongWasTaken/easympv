# easympv (mpv plugin)

> :warning: **Work in progress**: Master branch can be unstable or non-working!  

![](https://smto.pw/mpv/images/preview.png)


Extends base mpv with more features and makes it a bit more user-friendly.  
Currently supports Windows, macOS and Linux.  
macOS support is experimental and not fully finished.

## Features
- Menus with custom Fonts, optionally controllable using only the mouse
- Integrated File Browser, Disc/Device Selector, URL Input
    - Save folders to Favorites
    - Load subtitles during playback
    - Remove files from within mpv
- Automated applying of shadersets, such as Anime4K
- Automated applying of color profiles
- Automatic skipping of certain chapters (such as Openings/Endings)
- Automatic Updates/Git pulling
- Overlays, such as:
    - A simple digital clock, the screen corner position can be customized
    - On-screen log, so you don't have to launch mpv from a terminal to read it
    - Command input for mpv commands
    - A JavaScript console for easier debugging
#### and a lot more!
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
- mpv, if you want Discord integration to work it needs to have been compiled with LuaJIT support (Not all distributions do this!)
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

## TODOs and Ideas
#### TODOs
- More Windows testing: My main rig runs Arch Linux, so any Windows-specific code is usually guessed
- macOS testing: I need to set up a macOS virtual machine again
- Figure out upgrading from 1.x
- Write a simple installer for Windows folks (probably .NET again, maybe ill try out NSIS or something like that)
#### Ideas
- Remove Discord integration, add a way to optionally install it after the fact (and possibly more, merge with dependency loader?)
- Improve images, add variants up to 8k resolution and make it consistent
#### All TODO items need to be addressed before I can consider declaring this project stable.

## License
All easympv code and assets (everything in `scripts/easympv/`) is licensed under the MIT License.  
Third-Party assets in this repository use different licenses, such as fonts and shaders.  
See `scripts/easympv/Credits.txt` for all attributions.  
Special thanks to VideoPlayerCode for their awesome plugins, they have served as inspiration for this project, although none of their code has been reused.  
