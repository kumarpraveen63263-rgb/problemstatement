Add-Type -AssemblyName System.Drawing

$inputPath = Join-Path $PSScriptRoot '..\public\assets\branding\sa-college-emblem.jpg'
$outputPath = Join-Path $PSScriptRoot '..\public\assets\branding\sa-college-emblem.png'

$inputPath = [System.IO.Path]::GetFullPath($inputPath)
$outputPath = [System.IO.Path]::GetFullPath($outputPath)

Write-Host "Reading $inputPath"
$img = [System.Drawing.Bitmap]::FromFile($inputPath)
$newBmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($x = 0; $x -lt $img.Width; $x++) {
    for ($y = 0; $y -lt $img.Height; $y++) {
        $c = $img.GetPixel($x, $y)
        $maxVal = [Math]::Max($c.R, [Math]::Max($c.G, $c.B))
        
        # Threshold for black background removal with smooth edge feathering
        if ($maxVal -le 25) {
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($maxVal -lt 70) {
            $alpha = [int](($maxVal - 25) * 255 / 45)
            if ($alpha -gt 255) { $alpha = 255 }
            if ($alpha -lt 0) { $alpha = 0 }
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
        } else {
            $newBmp.SetPixel($x, $y, $c)
        }
    }
}

$img.Dispose()
$newBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$newBmp.Dispose()

Write-Host "Transparent emblem created at: $outputPath"
