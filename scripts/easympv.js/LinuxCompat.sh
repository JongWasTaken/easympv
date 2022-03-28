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

curl_or_wget=$(if hash curl 2>/dev/null; then echo "curl -s"; elif hash wget 2>/dev/null; then echo "wget -qO-"; fi);

if [ -z "$curl_or_wget" ]; then
    echo "Neither curl nor wget found." >&2
    exit 1
fi

get_version_latest()
{
    if [ -f "/usr/bin/wget" ]; then
        version=$(/usr/bin/wget -q -O - https://smto.pw/mpv/hosted/latest.json)
    elif [ -f "/usr/bin/curl" ]; then
        version=$(curl https://smto.pw/mpv/hosted/latest.json | grep '.\..\..')
    fi
}

get-version-latest-mpv()
{
    if [ -f "/usr/bin/wget" ]; then
        version=$(/usr/bin/wget -q -O - https://smto.pw/mpv/hosted/mpvLatestVersion)
    elif [ -f "/usr/bin/curl" ]; then
        version=$(curl https://smto.pw/mpv/hosted/mpvLatestVersion | grep '.\...\..')
    fi
}

get-package()
{
    if [ -f "$HOME/.config/mpv/package.zip" ]; then
        /usr/bin/rm -rf "$HOME/.config/mpv/package.zip"
    fi

    if [ -f "/usr/bin/wget" ]; then
        /usr/bin/wget -q -O ../../package.zip https://smto.pw/mpv/hosted/$1
    elif [ -f "/usr/bin/curl" ]; then
        /usr/bin/curl https://smto.pw/mpv/hosted/$1 -o ../../package.zip
    fi
}

extract-package()
{
    if [ -f "$HOME/.config/mpv/package.zip" ]; then
        if [ -f "/usr/bin/unzip" ]; then
            /usr/bin/unzip "$HOME/.config/mpv/package.zip" -d "$HOME/.config/mpv/extractedPackage/"
        fi
    fi
}

remove-package()
{
    if [ -f "$HOME/.config/mpv/package.zip" ]; then
        /usr/bin/rm -rf "$HOME/.config/mpv/package.zip"
    fi
}

apply-package()
{
    if [ -d "$HOME/.config/mpv/extractedPackage" ]; then
        /usr/bin/cp -r "$HOME/.config/mpv/extractedPackage/"* "$HOME/.config/mpv/"
        /usr/bin/rm -rf "$HOME/.config/mpv/extractedPackage"
    fi
}

remove-file()
{
    if [ -f "$HOME/.config/mpv/$1" ]; then
        /usr/bin/rm -rf "$HOME/.config/mpv/$1"
    fi
}

if [ "$command" == "get-version-latest" ]; then
    get_version_latest
    echo $version
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
    apply-package
    exit $?
fi

if [ "$command" == "remove-file" ]; then
    remove-file $2
    exit $?
fi

if [ "$command" == "get-gpus" ]; then
    gpu_count=$(lspci | grep ' VGA ' | wc -l)
    gpus=""
    for i in {1..99..1}
        do
            if  (( $i > $gpu_count )); then
                break
            else
                gpus+=$(lspci | grep ' VGA ' | cut -c36- | sed -n "$i"p)
                gpus+="|"
            fi
        done
    echo $(echo "$gpus" | rev | cut -c 2- | rev)
fi

if [ "$command" == "get-connection-status" ]; then
    echo -e "GET http://smto.pw HTTP/1.0\n\n" | nc google.com 80 > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "True"
    else
        echo "False"
    fi
fi

exit 0