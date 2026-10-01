# ============================================================
# set-supabase-env.ps1
# Usage: .\scripts\set-supabase-env.ps1
#
# Run this script from the project root to update your
# Supabase credentials in .env.local WITHOUT opening an editor.
# This bypasses any editor save / OneDrive sync issues.
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$SupabaseUrl,

    [Parameter(Mandatory=$true)]
    [string]$SupabasePublishableKey,

    [string]$SupabaseServiceRoleKey = ""
)

$envFile = Join-Path $PSScriptRoot ".." ".env.local"
$envFile = [System.IO.Path]::GetFullPath($envFile)

if (-not (Test-Path $envFile)) {
    Write-Error ".env.local not found at: $envFile"
    exit 1
}

$content = Get-Content $envFile -Raw

# Replace NEXT_PUBLIC_SUPABASE_URL
$content = $content -replace 'NEXT_PUBLIC_SUPABASE_URL=.*', "NEXT_PUBLIC_SUPABASE_URL=$SupabaseUrl"

# Replace NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  
$content = $content -replace 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=.*', "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$SupabasePublishableKey"

# Optionally replace SUPABASE_SERVICE_ROLE_KEY
if ($SupabaseServiceRoleKey -ne "") {
    $content = $content -replace 'SUPABASE_SERVICE_ROLE_KEY=.*', "SUPABASE_SERVICE_ROLE_KEY=$SupabaseServiceRoleKey"
}

# Write to disk (bypasses editor cache)
[System.IO.File]::WriteAllText($envFile, $content, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "SUCCESS: .env.local updated on disk." -ForegroundColor Green

# Verify without printing values
$verify = Get-Content $envFile -Raw
$urlOk  = $verify -match 'NEXT_PUBLIC_SUPABASE_URL=https://'
$keyOk  = $verify -match 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ey'

Write-Host "  NEXT_PUBLIC_SUPABASE_URL     : $(if ($urlOk) { 'LOOKS VALID' } else { 'CHECK FORMAT' })" -ForegroundColor $(if ($urlOk) { 'Cyan' } else { 'Yellow' })
Write-Host "  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: $(if ($keyOk) { 'LOOKS VALID (starts with ey)' } else { 'CHECK FORMAT' })" -ForegroundColor $(if ($keyOk) { 'Cyan' } else { 'Yellow' })
Write-Host ""
Write-Host "Restart the dev server for changes to take effect:" -ForegroundColor White
Write-Host "  Ctrl+C  (stop)  then  npm run dev" -ForegroundColor Gray
