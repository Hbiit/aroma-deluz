Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path "public\brand-logo-transparent.png"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function MakeIcon([string]$destPath, [int]$size, [bool]$transparentBg, [float]$scaleFactor) {
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

    if ($destPath.EndsWith('.ico')) {
        $iconHandle = $bmp.GetHicon()
        $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
        $fs = [System.IO.FileStream]::new($destPath, [System.IO.FileMode]::Create)
        $icon.Save($fs)
        $fs.Close()
        [System.Runtime.InteropServices.Marshal]::DestroyIcon($iconHandle) | Out-Null
    } else {
        $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    $bmp.Dispose()
    Write-Host "Generated $destPath ($size x $size)"
}

MakeIcon "app\icon.png" 512 $false 0.85
MakeIcon "app\apple-icon.png" 180 $false 0.85
MakeIcon "public\icon.png" 512 $false 0.85
MakeIcon "app\favicon.ico" 64 $false 0.85
MakeIcon "public\favicon.ico" 64 $false 0.85

$srcImg.Dispose()
