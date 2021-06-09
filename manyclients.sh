#!/bin/sh

for N in {1..50}
do
    ruby client.rb &
done
wait
