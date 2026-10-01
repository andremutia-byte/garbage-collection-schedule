$f = "C:\Users\NIKKIE\OneDrive\Desktop\garbage-collection-schedule\.env.local"
$info = Get-Item $f
Write-Host "Size: $($info.Length) | Modified: $($info.LastWriteTime)"

$content = [System.IO.File]::ReadAllText($f)
$lines = $content -split "`n"

foreach ($line in $lines) {
    if ($line -match "^(NEXT_PUBLIC_SUPABASE[^=]*)=(.*)") {
        $k = $Matches[1]
        $v = $Matches[2].Trim()
        $len = $v.Length
        $starts = if ($len -gt 0) { $v.Substring(0, [Math]::Min(8, $len)) } else { "(empty)" }
        $isPlaceholder = $v.StartsWith("your")
        $isJwt = $v.StartsWith("ey") -and $len -gt 100
        Write-Host "$k : len=$len | placeholder=$isPlaceholder | jwt=$isJwt | starts=$starts"
    }
}
