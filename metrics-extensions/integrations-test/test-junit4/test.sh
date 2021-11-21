#!/bin/bash
set -e
xpdirs=/tmp/varicity-xp-projets

# Run maven tests
cd ../../../metrics-extension
mvn clean verify -Dtest=CompilerTest#compileAndScanJunit4 -DfailIfNoTests=false

if [ ! -d $xpdirs/junit4/target ]; then
  echo "No target folder, build did not occur, test failed"
  exit 1
fi

echo "************************"
echo "************************"
echo "************************"
echo "************************"


docker container logs varicity-compiler-scanner-container

echo "************************"
echo "************************"
echo "************************"
echo "************************"