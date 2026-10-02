# Installs the NAI Studio server plugin into a SillyTavern folder (Windows).
# Usage: .\install-server.ps1 -SillyTavern "C:\path\to\SillyTavern"
# Then set enableServerPlugins: true in config.yaml and restart SillyTavern.
param(
    [Parameter(Mandatory = $true)][string]$SillyTavern
)

$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'server'
$plugins = Join-Path $SillyTavern 'plugins'
if (-not (Test-Path (Join-Path $SillyTavern 'server.js'))) {
    throw "Not a SillyTavern folder: $SillyTavern"
}
$target = Join-Path $plugins 'nai-studio'
New-Item -ItemType Directory -Force $target | Out-Null
# Keep the installed config.json (may hold a token) and cache\ (paid vibe encodings).
Get-ChildItem -Path $target -Exclude 'config.json', 'cache' | Remove-Item -Recurse -Force -Confirm:$false
Get-ChildItem -Path $source -Exclude 'config.json', 'cache' | Copy-Item -Destination $target -Recurse -Force

Write-Output "NAI Studio plugin installed to $target"
$configYaml = Join-Path $SillyTavern 'config.yaml'
if ((Test-Path $configYaml) -and -not (Select-String -Path $configYaml -Pattern '^enableServerPlugins:\s*true' -Quiet)) {
    Write-Output "Set 'enableServerPlugins: true' in $configYaml, then restart SillyTavern."
} else {
    Write-Output 'Restart SillyTavern to load the plugin.'
}
