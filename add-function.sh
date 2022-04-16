#!/bin/sh

MSG="Add-Function: `date +'%Y-%m-%d %H:%M:%S'`"

echo Add function Commit AND Push Start

git add .
git commit -m "$MSG"
git push origin main

echo Add function Commit AND Push Done
