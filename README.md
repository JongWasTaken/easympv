# easympv (mpv plugin)

> :warning: **Work in progress**: Master branch can be unstable!  

![](https://github.com/JongWasTaken/easympv-installer/blob/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images/main.png)  
|Some|Images|
| :-: | :-: |
| ![](https://github.com/JongWasTaken/easympv-installer/blob/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images/browser.png) | ![](https://github.com/JongWasTaken/easympv-installer/blob/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images/playback.png) |
| ![](https://github.com/JongWasTaken/easympv-installer/blob/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images/shaders.png) | ![](https://github.com/JongWasTaken/easympv-installer/blob/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images/settings.png) |
  
[More images](https://github.com/JongWasTaken/easympv-installer/tree/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images)  
  
Extends base mpv with more features and makes it a bit more user-friendly.  
Currently supports Windows, macOS and Linux.  
macOS support is experimental and not fully finished, as I lack a device to test on.  

## Features
- Menus with custom Fonts, optionally everything is controllable using only the mouse, useful for home theater use!
    - Different languages are supported! See the bottom of this page for more information.
    - The color of the selector is customizable
- Integrated [File Browser](https://github.com/JongWasTaken/easympv-installer/blob/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images/browser.png), Disc/Device Selector, [URL Input](https://github.com/JongWasTaken/easympv-installer/blob/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images/url.png)
    - Save folders to Favorites
    - Load subtitles during playback
    - Remove files from within mpv
- [Automated applying of shadersets](https://github.com/JongWasTaken/easympv-installer/blob/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images/shaders.png), such as Anime4K, FSRCNNX, CRT and more ([these are included](https://github.com/JongWasTaken/easympv/tree/master/scripts/easympv/shaders))
    - Custom shaders can be [added by the user](https://github.com/JongWasTaken/easympv/wiki/Presets)
- Automated applying of color profiles
    - Custom color profiles can be [added by the user](https://github.com/JongWasTaken/easympv/wiki/Presets)
- Automatic skipping of certain chapters (such as Openings/Endings)
- [Quick toggles](https://github.com/JongWasTaken/easympv-installer/blob/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images/playback.png) for properties you don't have to touch often, such as `fps` or `aspect-ratio`, saving precious keybinds!
- A more advanced reimplementation of `autoload.lua`, providing interactive playlist management
    - This is currently very half-baked and will often break, see [Known Issues](#known-issues).
    - Please disable `autoload.lua` if you use it, otherwise this functionality will be disabled at runtime!
- A reimplementation of `autosave.lua`
    - Please disable `autosave.lua` if you use it, otherwise this functionality will be disabled at runtime!
- [Automatic Updates & Git Pulling](https://github.com/JongWasTaken/easympv-installer/blob/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images/update.png)
    - Git Pulling may lock up mpv in some cases, see [Known Issues](#known-issues).
- Overlays, such as:
    - A simple digital clock (screen corner position can be customized)
        - It could be cut off at weird window sizes, see [Known Issues](#known-issues).
    - [On-screen log](https://github.com/JongWasTaken/easympv-installer/blob/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images/log.png), so you don't have to launch mpv from a terminal to read it (`CTRL+ALT+~`)
    - Command input for mpv commands (`CTRL+~`)
    - A JavaScript console for easier debugging (`CTRL+Shift+~`)
        - All of these can also be toggled from the `Developer Options` (`Preferences -> Developer Options`)
- A simple [API](https://github.com/JongWasTaken/easympv/wiki/API) to create and remove menus from other plugins
    - This might get replaced with a better solution down the line.
#### [and a lot more!](https://github.com/JongWasTaken/easympv-installer/blob/d71bf546c9d12859bc383ab21f0114ae7fdb47c2/images/settings.png)
## Installation
Please be aware of the [Known Issues](#known-issues) before installing this.  
### Prerequisites
#### Windows
- Windows 8 or higher 
    - Windows 7 might work if you update Powershell and .NET Framework to v4.5+
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
    - This is only needed for the updater, easympv will only ever send requests to GitHub!
- `xclip` OR `wl-clipboard` (if you use Wayland)
    - When in doubt, install both!

### Install
#### Windows Installer
Unfinished. Installing manually is recommended for now.  
If you feel adventurous, you can download the installer from [here](https://github.com/JongWasTaken/easympv-installer/releases/latest).  
In case you choose this route, make sure to select the Git version in the installer, otherwise you will forever be stuck on that version.

#### Linux Installer
Paste this into a terminal:  
`sh -c "$(curl https://raw.githubusercontent.com/JongWasTaken/easympv-installer/master/installer.sh)"`  
> :warning: Running random commands from the internet can be dangerous, you should always check what exactly you are running. Read the source [here](https://raw.githubusercontent.com/JongWasTaken/easympv-installer/master/installer.sh) (i suck at bash scripting, sorry).  

This script should work on Arch and Debian/Ubuntu, though it has not been fully tested yet.  
Please report issues!  
#### Manual (All platforms)
Download the latest release (or the master branch) and put all files into `%appdata%\mpv` (Windows) or `~/.config/mpv` (everywhere else).  
Launch mpv to generate config files (`mpv.conf`, `input.conf`, `easympv.conf`) and follow the on-screen instructions.  

## Known Issues
### General
- Custom fonts may not load on newer mpv versions.
    - Workaround: Install all fonts in the `fonts` directory manually to fix this!
- macOS code paths have not been tested in a while and will probably cause issues or crashes.
### Autoload.js
- The generated mpv playlist will sometimes clear itself.
- The generated mpv playlist will sometimes not be in the correct order.
- Jumping to a playlist entry in the playlist menu will rarely crash mpv.
    - This is probably some kind of file path name issue.

Because of these issues, it is currently recommended to use [`autoload.lua`](https://github.com/mpv-player/mpv/blob/master/TOOLS/lua/autoload.lua) alongside easympv.  
The Autoload module will be disabled automatically.
### UI.js
- Clock positioning can look incorrect on non-standard resolutions.
    - Will be fixed by giving the user more control over the positioning
### Utils.js
- Git update will currently lock up mpv in most cases.
### Syncplay Incompatibility
- SyncPlay's chat integration somehow offsets the OSD, which makes menus appear out of bounds.
    - Workaround: Disable chat integration, and use the SyncPlay window instead.
    - I am currently unaware of a solution to this.

## Localization
easympv now supports different languages!  
These languages are currently implemented:  
- English
- German
  
See the [wiki page](https://github.com/JongWasTaken/easympv/wiki/Localization) for more information.

## License
All easympv code and assets (all JavaScript files and images in `scripts/easympv/images/`) are licensed under the MIT License.  
Third-Party assets in this repository use different licenses, such as fonts and shaders.  
See [`scripts/easympv/Credits.txt`](https://github.com/JongWasTaken/easympv/blob/master/scripts/easympv/Credits.txt) for all attributions.  
Special thanks to VideoPlayerCode for their awesome plugins. They have served as inspiration for this project, although none of their code has been reused.  
Please open an issue if I forgot someone!  
