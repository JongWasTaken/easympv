# easympv (mpv plugin)
## (WORK IN PROGRESS; DO NOT USE)  
![](https://raw.githubusercontent.com/JongWasTaken/easympv-scripts/master/images/logo.bmp)


Extends base mpv with more features and makes it a bit more user-friendly.
Currently supports Windows and Linux (and probably BSD).
macOS support is planned, but currently not implemented.

## Features
- Menus with custom Fonts
- Alerts in the top right corner
- Integrated File Browser, Disc/Device Selector, URL Input
- Automated applying of shadersets, such as Anime4K
- Color profiles
- Automatic skipping of certain chapters (such as Openings/Endings)
- Automatic Updates (not implemented yet!)

## Installation
#### Windows Dependencies
- Windows 8 or higher (Windows 7 might work if you install Powershell and .NET)
- mpv, the newest version from [here](https://sourceforge.net/projects/mpv-player-windows/files/64bit/)

#### Linux Dependencies
Due to the modular nature of Linux, you will need to install a few dependencies:
- mpv, the newest possible version (0.34.1 at the time of writing) [AUR](https://aur.archlinux.org/packages/mpv-build-git)
- GNU coreutils (should be preinstalled on every distibution)
- either `wget`(preferred) or `curl`
- `zenity` (optional, required for URL input)

### Automatic
(Not yet:) Download the latest version from [here](https://smto.pw/mpv/?#downloads).
### Manual
Download the master branch and put all files into `%appdata%\mpv` (Windows) or `~/.config/mpv` (macOS/Linux/BSD).  
Adjust .conf files to your liking.

## License
All easympv code and assets (everything in `scripts/easympv.js/` and `images/`) is licensed under the MIT License.  
Other files in this repository use different licenses, such as fonts and shaders.  
See `scripts/easympv.js/Credits.txt` for all attributions.  
Special thanks to VideoPlayerCode for their awesome plugins, though none of their code has been used.  
