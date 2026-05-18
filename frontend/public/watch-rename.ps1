# Auto-renames logo.png.png -> logo.png in this folder.
# Run once: powershell -ExecutionPolicy Bypass -File watch-rename.ps1
$pub = Split-Path -Parent $MyInvocation.MyCommand.Path
$watcher = New-Object System.IO.FileSystemWatcher $pub, "logo.png.png"
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName
$watcher.EnableRaisingEvents = $true
Write-Host "Watching $pub for logo.png.png..."
while ($true) {
    $change = $watcher.WaitForChanged([System.IO.WatcherChangeTypes]::Created -bor [System.IO.WatcherChangeTypes]::Renamed, 60000)
    if (-not $change.TimedOut) {
        $src = Join-Path $pub "logo.png.png"
        $dst = Join-Path $pub "logo.png"
        if (Test-Path $src) {
            if (Test-Path $dst) { Remove-Item $dst -Force }
            Rename-Item $src $dst -Force
            Write-Host "Renamed logo.png.png -> logo.png"
        }
    }
}
