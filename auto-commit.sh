#!/bin/bash

# Your time pattern (in seconds)
delays=(60 120 240 180 120 180 120 240 180 120 60 120 60 180 120 60)

for i in "${!delays[@]}"
do
  echo "// commit $i update $(date)" >> streak.js

  git add .
  git commit -m "feat: update logic iteration $i"

  echo "Committed $i — waiting ${delays[$i]} seconds..."
  sleep ${delays[$i]}
done

