@echo off
setlocal
set REPO_ROOT=%~dp0\..\..\..
pushd "%REPO_ROOT%"
yarn rubric:matrix:anthropic --mode elevator --out-dir ".cache/rubric-sandbox/matrix-anthropic-elevator_pitch" %*
popd
