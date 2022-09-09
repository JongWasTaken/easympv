#!/bin/sh
EMPV_VERSION="2.0.0"
mkdir -p "$HOME/.config/mpv"
# Figure out distro
# From https://ilhicas.com/2018/08/08/bash-script-to-install-packages-multiple-os.html

declare -A osInfo;
# Debian, Ubuntu
osInfo[/etc/debian_version]="apt-get install -yy"
osInfo[/etc/alpine-release]="apk --update add"
osInfo[/etc/centos-release]="yum install -y"
# Fedora
osInfo[/etc/fedora-release]="dnf install -y"
# Arch
osInfo[/etc/arch-release]="pacman -S --noconfirm"

for f in ${!osInfo[@]}
do
    if [[ -f $f ]];then
        PKG_MANAGER=${osInfo[$f]}
    fi
done

# Set Variables
WGET_IS_INSTALLED=0
XCLIP_IS_INSTALLED=0
WLC_IS_INSTALLED=0
UNZIP_IS_INSTALLED=0
ZENITY_IS_INSTALLED=0
NOTIFYSEND_IS_INSTALLED=0
MPV_IS_INSTALLED=0
EMPV_IS_INSTALLED=0

INSTALL_PACKAGES_LIST=()
INSTALL_PACKAGES=0

# Check if everything is already installed
if [ $(type -P wget) != "" ]; then
    WGET_IS_INSTALLED=1
fi

if [ $(type -P xclip) != "" ]; then
    XCLIP_IS_INSTALLED=1
fi

if [ $(type -P wl-paste) != "" ]; then
    WLC_IS_INSTALLED=1
fi

if [ $(type -P unzip) != "" ]; then
    UNZIP_IS_INSTALLED=1
fi

if [ $(type -P notify-send) != "" ]; then
    NOTIFYSEND_IS_INSTALLED=1
fi

if [ $(type -P zenity) != "" ]; then
    ZENITY_IS_INSTALLED=1
fi

if [ $(type -P mpv) != "" ]; then
    MPV_IS_INSTALLED=1
fi

if [ -f "$HOME/.config/mpv/scripts/easympv/main.js" ]; then
    EMPV_IS_INSTALLED=1
fi

# if not, add to install array

if [ $WGET_IS_INSTALLED == 0 ]; then
    INSTALL_PACKAGES_LIST+=("wget")
    INSTALL_PACKAGES=1
fi

if [ $XCLIP_IS_INSTALLED == 0 ]; then
    INSTALL_PACKAGES_LIST+=("xclip")
    INSTALL_PACKAGES=1
fi

if [ $WLC_IS_INSTALLED == 0 ]; then
    INSTALL_PACKAGES_LIST+=("wl-clipboard")
    INSTALL_PACKAGES=1
fi

if [ $UNZIP_IS_INSTALLED == 0 ]; then
    INSTALL_PACKAGES_LIST+=("unzip")
    INSTALL_PACKAGES=1
fi

if [ $NOTIFYSEND_IS_INSTALLED == 0 ]; then
    INSTALL_PACKAGES_LIST+=("libnotify")
    INSTALL_PACKAGES=1
fi

if [ $MPV_IS_INSTALLED == 0 ]; then
    INSTALL_PACKAGES_LIST+=("mpv")
    INSTALL_PACKAGES=1
fi

# install all packages in install array

if [ $INSTALL_PACKAGES != 0 ]; then
    if [ "$TERM" != "dumb" ]; then
        echo "Please enter your password to install all necessary dependencies.\n" && sudo $PKG_MANAGER "${INSTALL_PACKAGES_LIST[@]}"
    else
        if [ $(type -P osascript) != "" ]; then
            osascript -e \'tell application "Terminal" to do script echo "Please enter your password to install all necessary dependencies.\n" && sudo $PKG_MANAGER "${INSTALL_PACKAGES_LIST[@]}" \'
        elif [ $(type -P gnome-terminal) != "" ]; then
            gnome-terminal -- echo "Please enter your password to install all necessary dependencies.\n" && sudo $PKG_MANAGER "${INSTALL_PACKAGES_LIST[@]}"
        elif [ $(type -P konsole) != "" ]; then
            konsole --noclose -e "Please enter your password to install all necessary dependencies.\n" && sudo $PKG_MANAGER "${INSTALL_PACKAGES_LIST[@]}"
        elif [ $(type -P lxterminal) != "" ]; then
            lxterminal --command="Please enter your password to install all necessary dependencies.\n" && sudo $PKG_MANAGER "${INSTALL_PACKAGES_LIST[@]}"
        elif [ $(type -P rxvt) != "" ]; then
            rxvt -e "Please enter your password to install all necessary dependencies.\n" && sudo $PKG_MANAGER "${INSTALL_PACKAGES_LIST[@]}"
        elif [ $(type -P xterm) != "" ]; then
            xterm -e "Please enter your password to install all necessary dependencies.\n" && sudo $PKG_MANAGER "${INSTALL_PACKAGES_LIST[@]}"
        fi
    fi
fi

if [ $EMPV_IS_INSTALLED == 0 ]; then
    wget --content-disposition -q -O "$HOME/.config/mpv/package.zip" https://codeload.github.com/JongWasTaken/easympv/zip/refs/tags/$EMPV_VERSION

    if [ -f "$HOME/.config/mpv/package.zip" ]; then
        unzip "$HOME/.config/mpv/package.zip" -d "$HOME/.config/mpv/"
    fi

    if [ -f "$HOME/.config/mpv/package.zip" ]; then
        rm -rf "$HOME/.config/mpv/package.zip"
    fi

    if [ -d "$HOME/.config/mpv/easympv-$EMPV_VERSION" ]; then
        cp -r "$HOME/.config/mpv/easympv-$EMPV_VERSION/"* "$HOME/.config/mpv/"
        rm -rf "$HOME/.config/mpv/easympv-$EMPV_VERSION"
    fi
fi

zenity --info --text="easympv has been installed successfully!\nmpv will now start."

# launch mpv
mpv --volume=30 --player-operation-mode=pseudo-gui "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
exit 0