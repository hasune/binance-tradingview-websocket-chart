#!/bin/sh

MSG="Fix-Function: `date +'%Y-%m-%d %H:%M:%S'`"

echo Fix function Commit AND Push Start

git add .
git commit -m "$MSG"
git push origin main

echo Fix function Commit AND Push Done
