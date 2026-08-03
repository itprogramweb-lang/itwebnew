param(
  [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)]
  [string[]]$Files
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

foreach ($file in $Files) {
  if (-not (Test-Path -LiteralPath $file)) {
    throw "MISSING: $file"
  }

  $item = Get-Item -LiteralPath $file
  if ($item.PSIsContainer) {
    throw "NOT_A_FILE: $file"
  }

  $hash = Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256

  Write-Output "FILE: $($item.FullName)"
  Write-Output "SIZE_BYTES: $($item.Length)"
  Write-Output "SHA256: $($hash.Hash.ToLowerInvariant())"
  Write-Output ""
}