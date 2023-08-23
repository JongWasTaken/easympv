# easympv (mpv plugin)

> :warning: **Work in progress**: Master branch can be unstable!  

![](https://smto.pw/mpv/images/preview.png)  
(Image is outdated, menus look fancier now!)  

Extends base mpv with more features and makes it a bit more user-friendly.  
Currently supports Windows, macOS and Linux.  
macOS support is experimental and not fully finished, as I lack a device to test on.  

## Features
- Menus with custom Fonts, optionally everything is controllable using only the mouse, useful for home theater use!
- Integrated File Browser, Disc/Device Selector, URL Input
    - Save folders to Favorites
    - Load subtitles during playback
    - Remove files from within mpv
- Automated applying of shadersets, such as Anime4K, FSRCNNX, CRT and more ([all are included!](https://github.com/JongWasTaken/easympv/tree/master/scripts/easympv/shaders))
    - Custom shaders can be [added by the user](https://github.com/JongWasTaken/easympv/wiki/Presets)
- Automated applying of color profiles
    - Custom color profiles can be [added by the user](https://github.com/JongWasTaken/easympv/wiki/Presets)
- Automatic skipping of certain chapters (such as Openings/Endings)
- Quick toggles for properties you don't have to touch often, such as `fps` or `aspect-ratio`, saving keybinds!
- A more advanced reimplementation of `autoload.lua`, providing interactive playlist management 
    - Please disable `autoload.lua` if you use it, otherwise this functionality will be disabled at runtime!
- A reimplementation of `autosave.lua`
    - Please disable `autosave.lua` if you use it, otherwise this functionality will be disabled at runtime!
- Automatic Updates/Git pulling
- Overlays, such as:
    - A simple digital clock, the screen corner position can be customized
        - It could be cut off at weird window sizes, I hope to fix this soon...
    - On-screen log, so you don't have to launch mpv from a terminal to read it (`CTRL+ALT+~`)
    - Command input for mpv commands (`CTRL+~`)
    - A JavaScript console for easier debugging (`CTRL+Shift+~`)
        - All of these can also be summoned from the `Developer Options` (`Preferences -> Developer Options`)
- A simple [API](https://github.com/JongWasTaken/easympv/wiki/API) to create and remove menus from other plugins
    - This might get replaced with a better solution down the line
#### and a lot more!
## Installation
### Prerequisites
#### Windows
- Windows 8 or higher (Windows 7 might work if you update Powershell and .NET Framework to v4.5+)
- mpv, the newest version from [here](https://sourceforge.net/projects/mpv-player-windows/files/64bit/)

#### macOS
- mpv, preferably installed using brew: `brew install mpv`  
> :exclamation: **Why?**: This version of mpv has been compiled with LuaJIT support, which is needed for some of the more advanced plugins like [mpvcord](https://github.com/yutotakano/mpvcord). easympv by itself does not need it, so if you have no need for plugins like mpvcord, any other up-to-date mpv distribution will probably work.  

#### Linux
The automatic installer script will (hopefully) take care of any dependencies.  
If you wish to install easympv manually you will (at least) need the following dependencies:
- mpv (duh)
    - If you want plugins like [mpvcord](https://github.com/yutotakano/mpvcord) to work, it needs to have been compiled with LuaJIT support (Not all distributions do this!)
- either `wget` (preferred) or `curl` (usually preinstalled)
    - This is only needed for the updater, easympv will only send requests to GitHub!
- `xclip` OR `wl-clipboard` (if you use Wayland)
    - When in doubt, install both!

### Install
#### Windows Installer
Unfinished. Installing manually is recommended for now.  
If you feel adventurous, you can download the installer from [here](https://github.com/JongWasTaken/easympv-installer/releases/latest).  

#### Linux Installer
Paste this into a terminal:  
`sh -c "$(curl https://raw.githubusercontent.com/JongWasTaken/easympv-installer/master/installer.sh)"`  
> :warning: Running random commands from the internet can be dangerous, you should always check what exactly you are running. Read the source [here](https://raw.githubusercontent.com/JongWasTaken/easympv-installer/master/installer.sh) (i suck at bash scripting, sorry).  

This script should work on Arch and Debian/Ubuntu, though it has not been fully tested yet.  
Please report issues!  
#### Manual (All platforms)
Download the latest release (or the master branch) and put all files into `%appdata%\mpv` (Windows) or `~/.config/mpv` (macOS/Linux/BSD/everywhere else).  
Launch mpv to generate config files (`mpv.conf`, `input.conf`, `easympv.conf`) and follow the on-screen instructions.  

## Known Issues
### Autoload.js
- The internal playlist will sometimes clear itself, and i have no idea why
- Jumping to a playlist entry in the playlist menu will rarely crash mpv
### UI.js
- Clock positioning can be weird on non-standard resolutions
### Utils.js
- Git update will lock up mpv in some cases
### Misc
- macOS code path has not been tested in a while and will probably break

## Ideas
- Overhaul menu definition to make code more readable?
    - The idea I have for this would also make third-party menu integration possible

## License
All easympv code and assets (all JavaScript files and images in `scripts/easympv/images/`) are licensed under the MIT License.  
Third-Party assets in this repository use different licenses, such as fonts and shaders.  
See [`scripts/easympv/Credits.txt`](https://github.com/JongWasTaken/easympv/blob/master/scripts/easympv/Credits.txt) for all attributions.  
Special thanks to VideoPlayerCode for their awesome plugins. They have served as inspiration for this project, although none of their code has been reused.  
Please open an issue if I forgot someone!  