#!/bin/bash

date=$(date '+%Y-%m-%d %H:%M')
git add -A
git commit -m "$date"
git push github master