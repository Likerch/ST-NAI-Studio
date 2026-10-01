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
$config = Join-Path $target 'config.json'
$savedConfig = $null
if (Test-Path $config) { $savedConfig = Get-Content -Raw -Path $config }

if (Test-Path $target) { Remove-Item -Recurse -Force -Confirm:$false $target }
New-Item -ItemType Directory -Force $target | Out-Null
Get-ChildItem -Path $source -Exclude 'config.json' | Copy-Item -Destination $target -Recurse -Force
if ($null -ne $savedConfig) { Set-Content -Path $config -Value $savedConfig -Encoding utf8 -NoNewline }

Write-Output "NAI Studio plugin installed to $target"
$configYaml = Join-Path $SillyTavern 'config.yaml'
if ((Test-Path $configYaml) -and -not (Select-String -Path $configYaml -Pattern '^enableServerPlugins:\s*true' -Quiet)) {
    Write-Output "Set 'enableServerPlugins: true' in $configYaml, then restart SillyTavern."
} else {
    Write-Output 'Restart SillyTavern to load the plugin.'
}
