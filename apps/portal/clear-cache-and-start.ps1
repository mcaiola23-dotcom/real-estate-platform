# Clear Next.js cache and start development server
# Run this script whenever you encounter "Internal Server Error"

Write-Host "=== Next.js Cache Clear & Restart ===" -ForegroundColor Cyan
Write-Host ""

# Stop any running Node processes
Write-Host "Stopping any running Node processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clear caches
Write-Host "Clearing .next cache..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Clearing node_modules cache..." -ForegroundColor Yellow
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Caches cleared successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Cyan
Write-Host ""

# Start the dev server
npm run dev











