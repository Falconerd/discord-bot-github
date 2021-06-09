#!/bin/sh

for N in {1..350}
do
    ruby client.rb &
done
wait
