@echo off
setlocal
set REPO_ROOT=%~dp0\..\..\..
pushd "%REPO_ROOT%"
yarn rubric:matrix:anthropic --mode vc_pitch --out-dir ".cache/rubric-sandbox/matrix-anthropic-two_min_pitch" %*
popd
