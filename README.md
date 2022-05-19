# easympv (mpv plugin)
## (WORK IN PROGRESS; DO NOT USE)  
![](https://raw.githubusercontent.com/JongWasTaken/easympv/master/images/logo.bmp)


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
- Automatic Updates
#### and more!
## Installation
#### Windows Dependencies
- Windows 8 or higher (Windows 7 might work if you update Powershell and .NET Framework to v4.5+)
- mpv, the newest version from [here](https://sourceforge.net/projects/mpv-player-windows/files/64bit/)

#### Linux Dependencies
Due to the modular nature of Linux, you will need to install a few dependencies:
- mpv, preferably the newest possible version (0.34.1 at the time of writing) [AUR](https://aur.archlinux.org/packages/mpv-build-git)
- GNU coreutils (usually preinstalled on every distibution)
- either `wget`(preferred) or `curl` (both are usually preinstalled)
- `zenity` (required for inputs)

### Automatic
(Not yet:) Download the latest version from [here](https://smto.pw/mpv/?#downloads).
### Manual
Download the master branch and put all files into `%appdata%\mpv` (Windows) or `~/.config/mpv` (macOS/Linux/BSD).  
Adjust .conf files to your liking.

## License
All easympv code and assets (everything in `scripts/easympv.js/` and `images/`) is licensed under the MIT License.  
Third-Party assets in this repository use different licenses, such as fonts and shaders.  
See `scripts/easympv.js/Credits.txt` for all attributions.  
Special thanks to VideoPlayerCode for their awesome plugins, though none of their code has been used.  
