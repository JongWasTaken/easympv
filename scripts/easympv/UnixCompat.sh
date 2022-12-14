#!/bin/bash

# UNIXCOMPAT.SH
#
# Author:              Jong
# URL:                 https://smto.pw/mpv
# License:             MIT License
#
# This file does all the unix-specific things that are not possible using mpv.

command=$1

OS_IS_NOT_MACOS=1

if [[ "$(uname -a)" == *"Darwin"* ]]; then
    OS_IS_NOT_MACOS=""
fi

curl_or_wget=$(if hash curl 2>/dev/null; then echo "curl -s"; elif hash wget 2>/dev/null; then echo "wget -qO-"; fi)

if [ -z "$curl_or_wget" ]; then
    echo "Neither curl nor wget found." >&2
    exit 1
fi

__get-clipboard() {
    CLIPBOARD=""
    if [ -z "$OS_IS_NOT_MACOS" ]; then
        CLIPBOARD="$(pbpaste)"
    else
        CLIPBOARD="$(wl-paste)"
        if [[ "$?" == "1" ]]; then

            CLIPBOARD="$(xclip -o)"
        fi
    fi
    if [[ "$?" != "0" ]]; then
        CLIPBOARD=""
    fi

    echo "$CLIPBOARD"
}

__show-message() {
    TEXT=$(echo "$@")
    if [ -z "$OS_IS_NOT_MACOS" ]; then
        osascript -e "tell application \"System Events\" to display dialog \"$TEXT\""
        return 0
    else
        if [ -f "/usr/bin/zenity" ]; then
            /usr/bin/zenity --info --title="mpv" --text="$TEXT"
            return 0
        fi

        if [ -f "/usr/bin/yad" ]; then
            /usr/bin/yad --info --title="mpv" --text="$TEXT"
            return 0
        fi

        if [ -f "/usr/bin/kdialog" ]; then
            /usr/bin/kdialog --msgbox "$TEXT"
            return 0
        fi

        if [ -f "/usr/bin/xmessage" ]; then
            /usr/bin/xmessage "$TEXT"
            return 0
        fi

        echo "No way to display graphical messages! Message text:"
        echo "$TEXT"
        return 0
    fi
}

__show-input() {
    TEXT=$(echo $@)
    if [ -z "$OS_IS_NOT_MACOS" ]; then
        DATA=$(osascript -e "display dialog \"$TEXT\" default answer \"\"" | cut -c35-)
        echo $DATA
        return 0
    else
        if [ -f "/usr/bin/zenity" ]; then
            DATA=$(/usr/bin/zenity --entry --title="mpv" --text="$TEXT")
            echo $DATA
            return 0
        fi

        if [ -f "/usr/bin/yad" ]; then
            DATA=$(/usr/bin/yad --entry --title="mpv" --text="$TEXT")
            echo $DATA
            return 0
        fi

        if [ -f "/usr/bin/kdialog" ]; then
            DATA=$(/usr/bin/kdialog --inputbox "$TEXT")
            echo $DATA
            return 0
        fi

        if [ -f "/usr/bin/dmenu" ]; then
            DATA=$(/usr/bin/dmenu -i -b -m 0 -p "$TEXT " <&-)
            echo $DATA
            return 0
        fi

        echo "No way to display graphical inputs! Input promt:"
        echo "$TEXT"
        read -p "type or paste:" DATA
        echo $DATA
        return 0
    fi
}

__show-alert() {
    TEXT=$(echo "$@")
    if [ -z "$OS_IS_NOT_MACOS" ]; then
        osascript -e "display notification \"$TEXT\" with title \"mpv\""
        return 0
    else
        if [ -f "/usr/bin/notify-send" ]; then
            /usr/bin/notify-send -i mpv -t 5000 "mpv" "$TEXT"
            return 0
        fi

        echo "No way to display alerts! Falling back to buildin..."
        return 1
    fi
}

get-connection-status() {
    echo -e "GET http://smto.pw HTTP/1.0\n\n" | nc google.com 80 >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "True"
    else
        echo "False"
    fi
}

get-dependencies() {
    if [ -f "/usr/bin/wget" ]; then
        output=$(wget -q -O - https://smto.pw/mpv/hosted/dependencies.json)
    elif [ -f "/usr/bin/curl" ]; then
        output=$(curl https://smto.pw/mpv/hosted/dependencies.json)
    fi
    echo $output
}

download-dependency() {
    if [ -f "/usr/bin/wget" ]; then
        wget -q -O "$HOME/.config/mpv/$2" $1
    elif [ -f "/usr/bin/curl" ]; then
        curl $1 -o "$HOME/.config/mpv/$2"
    fi
}

get-version-latest() {
    if [ -f "/usr/bin/wget" ]; then
        version=$(wget -q -O - https://smto.pw/mpv/hosted/latest.json)
    elif [ -f "/usr/bin/curl" ]; then
        version=$(curl https://smto.pw/mpv/hosted/latest.json)
    fi
    echo $version
}

get-version-latest-mpv() {
    if [ -f "/usr/bin/wget" ]; then
        version=$(wget -q -O - https://smto.pw/mpv/hosted/mpvLatestVersion)
    elif [ -f "/usr/bin/curl" ]; then
        version=$(curl https://smto.pw/mpv/hosted/mpvLatestVersion | grep '.\...\..')
    fi
    echo $version
}

git-update() {
    cd $HOME/.config/mpv/
    git pull
}

get-package() {
    if [ -f "$HOME/.config/mpv/package.zip" ]; then
        rm -rf "$HOME/.config/mpv/package.zip"
    fi

    if [ -f "/usr/bin/wget" ]; then
        wget --content-disposition -q -O "$HOME/.config/mpv/package.zip" https://codeload.github.com/JongWasTaken/easympv/zip/refs/tags/$1
    elif [ -f "/usr/bin/curl" ]; then
        curl -LJ https://codeload.github.com/JongWasTaken/easympv/zip/refs/tags/$1 -o "$HOME/.config/mpv/package.zip"
    fi
}

extract-package() {
    if [ -f "$HOME/.config/mpv/package.zip" ]; then
        if [ -f "/usr/bin/unzip" ]; then
            unzip "$HOME/.config/mpv/package.zip" -d "$HOME/.config/mpv/"
        fi
    fi
}

remove-package() {
    if [ -f "$HOME/.config/mpv/package.zip" ]; then
        rm -rf "$HOME/.config/mpv/package.zip"
    fi
}

apply-package() {
    if [ -d "$HOME/.config/mpv/easympv-$1" ]; then
        cp -r "$HOME/.config/mpv/easympv-$1/"* "$HOME/.config/mpv/"
        rm -rf "$HOME/.config/mpv/easympv-$1"
    fi
}

remove-file() {
    if [ -f "$HOME/.config/mpv/$1" ]; then
        rm -rf "$HOME/.config/mpv/$1"
    fi
}

get-image-info() {
    if [ -f "$1" ]; then
        file -b "$1"
    fi
}

get-clipboard() {
    __get-clipboard
}

messagebox() {
    __show-message $@
}

alert() {
    __show-alert $@
}

dependency-postinstall() {
    if [ -z "$OS_IS_NOT_MACOS" ]; then
        if [ -f "/usr/local/lib/libdiscord_game_sdk.dylib" ]; then
            exit
        fi
        INPUT=$(osascript -e 'tell application "System Events" to display dialog "For Discord integration to work, GameSDK needs to be installed on your system. This requires your password. Press OK to continue."')
        if [[ "$INPUT" == *"OK"* ]]; then
            osascript -e "do shell script \"mkdir -p /usr/local/lib/ && mv ~/.config/mpv/scripts/mpvcord/discord_game_sdk.dylib /usr/local/lib/libdiscord_game_sdk.dylib\" with administrator privileges"
            if [ -f "/usr/local/lib/libdiscord_game_sdk.dylib" ]; then
                osascript -e 'tell application "System Events" to display dialog "Installation finished. Discord integration will work after restarting mpv."'
            fi
        fi
        exit
    else
        echo "Currently only required on macOS!"
    fi
}

show-url-box() {
    __show-input "Paste URL:"
}

show-command-box() {
    __show-input "mpv command:"
}

$@
exit $?
