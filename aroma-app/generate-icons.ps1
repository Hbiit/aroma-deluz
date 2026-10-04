Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path "..\aroma-deluz\public\brand-logo-transparent.png"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function MakeSquare([string]$destPath, [bool]$transparentBg, [float]$scaleFactor) {
    $size = 1024
    $bmp = [System.Drawing.Bitmap]::new($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($transparentBg) {
        $g.Clear([System.Drawing.Color]::Transparent)
    } else {
        $bgColor = [System.Drawing.ColorTranslator]::FromHtml('#241441')
        $g.Clear($bgColor)
    }

    $targetW = [int]($size * $scaleFactor)
    $ratio = [float]$srcImg.Height / [float]$srcImg.Width
    $targetH = [int]($targetW * $ratio)

    $x = [int](($size - $targetW) / 2)
    $y = [int](($size - $targetH) / 2)

    $g.DrawImage($srcImg, $x, $y, $targetW, $targetH)
    $g.Dispose()

    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $destPath ($size x $size)"
}

MakeSquare "assets\icon.png" $false 0.75
MakeSquare "assets\adaptive-icon.png" $true 0.65
MakeSquare "assets\splash.png" $false 0.60
$srcImg.Dispose()
