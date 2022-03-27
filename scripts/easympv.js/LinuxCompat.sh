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
        version=$(/usr/bin/wget -q -O - https://smto.pw/mpv/meta/latest)
    elif [ -f "/usr/bin/curl" ]; then
        version=$(curl https://smto.pw/mpv/meta/latest | grep '.\..\..')
    fi
}

get-version-latest-mpv()
{
    if [ -f "/usr/bin/wget" ]; then
        version=$(/usr/bin/wget -q -O - https://smto.pw/mpv/meta/mpv)
    elif [ -f "/usr/bin/curl" ]; then
        version=$(curl https://smto.pw/mpv/meta/mpv | grep '.\...\..')
    fi
}

get_changelog()
{
    get_version_latest
    if [ -f "/usr/bin/wget" ]; then
        changelog=$(/usr/bin/wget -q -O - https://smto.pw/mpv/meta/changelog_$version)
    elif [ -f "/usr/bin/curl" ]; then
        changelog=$(curl https://smto.pw/mpv/meta/changelog_$version)
    fi
}

if [ "$command" == "get-changelog" ]; then
    get_changelog
    echo $changelog
    exit 0
fi

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