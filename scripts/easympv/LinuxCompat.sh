#!/bin/bash

# LINUXCOMPAT.SH
#
# Author:              Jong
# URL:                 https://smto.pw/mpv
# License:             MIT License
#
# This file does all the linux-specific things that are not possible using mpv.

command=$1

version=""
changelog=""

curl_or_wget=$(if hash curl 2>/dev/null; then echo "curl -s"; elif hash wget 2>/dev/null; then echo "wget -qO-"; fi)

if [ -z "$curl_or_wget" ]; then
    echo "Neither curl nor wget found." >&2
    exit 1
fi

get-dependencies() {
    if [ -f "/usr/bin/wget" ]; then
        version=$(wget -q -O - https://smto.pw/mpv/hosted/dependencies.json)
    elif [ -f "/usr/bin/curl" ]; then
        version=$(curl https://smto.pw/mpv/hosted/dependencies.json | grep '.\..\..')
    fi
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
        version=$(curl https://smto.pw/mpv/hosted/latest.json | grep '.\..\..')
    fi
}

get-version-latest-mpv() {
    if [ -f "/usr/bin/wget" ]; then
        version=$(wget -q -O - https://smto.pw/mpv/hosted/mpvLatestVersion)
    elif [ -f "/usr/bin/curl" ]; then
        version=$(curl https://smto.pw/mpv/hosted/mpvLatestVersion | grep '.\...\..')
    fi
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
    if [ -f "$HOME/.config/mpv/scripts/easympv/images/$1" ]; then
        file -b "$HOME/.config/mpv/scripts/easympv/images/$1"
    fi
}

if [ "$command" == "get-version-latest" ]; then
    get-version-latest
    echo $version
    exit 0
fi

if [ "$command" == "get-dependencies" ]; then
    get-dependencies
    echo $version
    exit 0
fi

if [ "$command" == "download-dependency" ]; then
    download-dependency $2 $3
    exit 0
fi

if [ "$command" == "get-version-latest-mpv" ]; then
    get-version-latest-mpv
    echo $version
    exit 0
fi

if [ "$command" == "get-package" ]; then
    get-package $2
    exit $?
fi

if [ "$command" == "extract-package" ]; then
    extract-package
    exit $?
fi

if [ "$command" == "remove-package" ]; then
    remove-package
    exit $?
fi

if [ "$command" == "apply-package" ]; then
    apply-package $2
    exit $?
fi

if [ "$command" == "remove-file" ]; then
    remove-file $2
    exit $?
fi

if [ "$command" == "get-image-info" ]; then
    get-image-info $2
    exit $?
fi

if [ "$command" == "get-gpus" ]; then
    gpu_count=$(lspci | grep ' VGA ' | wc -l)
    gpus=""
    for i in {1..99..1}; do
        if (($i > $gpu_count)); then
            break
        else
            gpus+=$(lspci | grep ' VGA ' | cut -c36- | sed -n "$i"p)
            gpus+="|"
        fi
    done
    echo $(echo "$gpus" | rev | cut -c 2- | rev)
fi

if [ "$command" == "get-connection-status" ]; then
    echo -e "GET http://smto.pw HTTP/1.0\n\n" | nc google.com 80 >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "True"
    else
        echo "False"
    fi
fi

exit 0
