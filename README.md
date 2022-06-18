# easympv (mpv plugin)
## (WORK IN PROGRESS: DO NOT USE YET)  
![](https://smto.pw/mpv/images/preview.png)


Extends base mpv with more features and makes it a bit more user-friendly.  
Currently supports Windows and Linux.  
macOS (and probably BSD) support is planned, but currently not fully tested.
Most features should work though.

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

#### macOS Dependencies
- mpv, installed using brew: `brew install mpv`  
**Other versions of mpv will not work!**

#### Linux Dependencies
Due to the modular nature of Linux, you will need to install a few dependencies:
- mpv, preferably the newest possible version (0.34.1 at the time of writing) [AUR](https://aur.archlinux.org/packages/mpv-build-git)
- GNU coreutils (usually preinstalled)
- either `wget`(preferred) or `curl` (usually preinstalled)
- `zenity` (optional; currently required for inputs like YouTube URLs; we might ditch this later for something nicer)

### Automatic
Unfinished. Use manual installation for now.
  
[//]: # (This sentence will be here once this is finished: Download the latest version from https://smto.pw/mpv/?#downloads.)
### Manual
Download the master branch and put all files into `%appdata%\mpv` (Windows) or `~/.config/mpv` (macOS/Linux/BSD).  
Add `m script_binding easympv` to your input.conf. Launch mpv once to generate `easympv.conf`. Adjust to your liking.  
If no `input.conf` is present, easympv will generate one with sane defaults and terminate.  
Then launch it again.  
In the future there will be some sort of setup on the first start, this is currently unfinished.  

## License
All easympv code and assets (everything in `scripts/easympv/`) is licensed under the MIT License.  
Third-Party assets in this repository use different licenses, such as fonts and shaders.  
See `scripts/easympv/Credits.txt` for all attributions.  
Special thanks to VideoPlayerCode for their awesome plugins, they have served as inspiration for this project, though none of their code has been used.  
