#!/bin/bash

local_folder="gifs/"
remote_folder="root@chameleon:/home/nodejs/R4aW/gifs/"

rsync -av --ignore-existing  "$remote_folder" "$local_folder/"
