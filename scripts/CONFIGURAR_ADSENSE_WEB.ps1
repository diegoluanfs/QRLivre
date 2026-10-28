# Rode na RAIZ do QR Livre:
# powershell -ExecutionPolicy Bypass -File .\scripts\CONFIGURAR_ADSENSE_WEB.ps1 -Client 'ca-pub-...' -Top '...' -Sidebar '...' -Bottom '...'
# Sem -EnableAds os banners permanecem desativados ate aprovacao/consentimento.
param(
  [Parameter(Mandatory=$true)][ValidatePattern('^ca-pub-\d{16}$')][string]$Client,
  [ValidatePattern('^(\d+)?$')][string]$Top = '',
  [ValidatePattern('^(\d+)?$')][string]$Sidebar = '',
  [ValidatePattern('^(\d+)?$')][string]$Bottom = '',
  [string]$AdsTxtLine = '',
  [switch]$EnableAds
)
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$EnvPath = Join-Path $ProjectRoot '.env.local'
$Example = Join-Path $ProjectRoot '.env.example'
if (!(Test-Path $EnvPath)) {
  if (Test-Path $Example) { Copy-Item $Example $EnvPath }
  else { New-Item -ItemType File -Path $EnvPath | Out-Null }
}
$Text = Get-Content $EnvPath -Raw
function Set-EnvValue([string]$Key, [string]$Value) {
  $script:Text = [regex]::Replace($script:Text, '(?m)^' + [regex]::Escape($Key) + '=.*(?:\r?\n|$)', '')
  $script:Text = $script:Text.TrimEnd() + "`r`n${Key}=${Value}`r`n"
}
Set-EnvValue 'VITE_ADSENSE_CLIENT' $Client
if ($Top) { Set-EnvValue 'VITE_ADSENSE_SLOT_TOP' $Top }
if ($Sidebar) { Set-EnvValue 'VITE_ADSENSE_SLOT_SIDEBAR' $Sidebar }
if ($Bottom) { Set-EnvValue 'VITE_ADSENSE_SLOT_BOTTOM' $Bottom }
if ($AdsTxtLine) {
  if ($AdsTxtLine -notmatch ('^google\.com,\s*' + [regex]::Escape($Client.Substring(3)) + ',\s*DIRECT,\s*f08c47fec0942fa0$')) {
    throw 'AdsTxtLine nao corresponde ao Client. Copie a linha do painel do AdSense.'
  }
  Set-EnvValue 'ADSENSE_ADS_TXT_LINE' $AdsTxtLine
}
if ($EnableAds) {
  if (!$Top -or !$Sidebar -or !$Bottom) {
    throw 'Para habilitar anuncios, informe Top, Sidebar e Bottom. Alem disso, confirme aprovacao e CMP.'
  }
  Set-EnvValue 'VITE_ADSENSE_ENABLED' 'true'
  Set-EnvValue 'VITE_SHOW_AD_PLACEHOLDERS' 'false'
} else {
  Set-EnvValue 'VITE_ADSENSE_ENABLED' 'false'
  Set-EnvValue 'VITE_SHOW_AD_PLACEHOLDERS' 'true'
}
Set-Content -Path $EnvPath -Value $Text -Encoding utf8
Write-Host "Arquivo local atualizado: $EnvPath" -ForegroundColor Green
Write-Host 'AdMob mantido inalterado. Nenhuma credencial secreta foi inserida no Git.'
Write-Host 'Repita as mesmas variaveis de compilacao no painel da Cloudflare Workers.'
if (!$EnableAds) { Write-Host 'Banners em modo de ESPACO RESERVADO. Ative somente apos aprovacao/consentimento.' }
