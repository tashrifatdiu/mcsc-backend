# Test Supabase REST endpoint for club_members by user_id
# Usage (PowerShell):
# $env:SUPABASE_URL='https://...'; $env:SUPABASE_ANON_KEY='your-anon-key'; .\test-supabase-rest.ps1 -UserId 'd8bb50dc-1cda-4338-9ffd-05b3ee25f19f'
param(
  [Parameter(Mandatory=$true)][string]$UserId
)

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY) {
  Write-Host "Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables before running this script." -ForegroundColor Yellow
  exit 1
}

$SUPABASE_URL = $env:SUPABASE_URL
$ANON_KEY = $env:SUPABASE_ANON_KEY

$url = "$SUPABASE_URL/rest/v1/club_members?select=*&user_id=eq.$UserId"
Write-Host "GET $url`n" -ForegroundColor Cyan

$headers = @(
  "apikey: $ANON_KEY",
  "Authorization: Bearer $ANON_KEY",
  "Accept: application/json"
)

# Use curl (should be available on Windows 10+)
$headerArgs = $headers | ForEach-Object { '-H', $_ }
$args = @('-i', '-X', 'GET', $url) + $headerArgs

Write-Host "Running curl...`n" -ForegroundColor Green
curl @args

Write-Host "`nIf you get HTTP 404, check the table name 'club_members' in Supabase Table Editor and confirm it's in the public schema." -ForegroundColor Yellow
