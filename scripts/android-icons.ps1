# Regenerates the Android launcher icons and splash screens from assets/summoner-logo.png.
# Run from the repo root:  powershell -File scripts/android-icons.ps1
# (Windows only: it uses System.Drawing, so there is nothing to install.)
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$res = Join-Path $root 'android/app/src/main/res'
$logo = [System.Drawing.Image]::FromFile((Join-Path $root 'assets/summoner-logo.png'))
$bg = [System.Drawing.ColorTranslator]::FromHtml('#010a13')

# The drawing does not fill its canvas; find where it is so it can be centred by its own edges.
$bmp = New-Object System.Drawing.Bitmap $logo
$minX = $bmp.Width; $minY = $bmp.Height; $maxX = 0; $maxY = 0
for ($y = 0; $y -lt $bmp.Height; $y += 2) {
  for ($x = 0; $x -lt $bmp.Width; $x += 2) {
    if ($bmp.GetPixel($x, $y).A -gt 40) {
      if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }; if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
$bmp.Dispose()
$src = New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)

# Draws the logo centred, its longer side being `fraction` of the shorter side of the canvas.
function Draw-Logo($g, $w, $h, $fraction) {
  $side = [Math]::Min($w, $h) * $fraction
  $scale = $side / [Math]::Max($src.Width, $src.Height)
  $dw = $src.Width * $scale; $dh = $src.Height * $scale
  $dest = New-Object System.Drawing.RectangleF (($w - $dw) / 2), (($h - $dh) / 2), $dw, $dh
  $g.DrawImage($logo, $dest, [System.Drawing.RectangleF]$src, [System.Drawing.GraphicsUnit]::Pixel)
}

function New-Canvas($w, $h) {
  $b = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  return @($b, $g)
}

function Save($b, $path) { $b.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose() }

$densities = @{ mdpi = 48; hdpi = 72; xhdpi = 96; xxhdpi = 144; xxxhdpi = 192 }
foreach ($d in $densities.Keys) {
  $icon = $densities[$d]; $layer = [int]($icon * 108 / 48)
  $dir = Join-Path $res "mipmap-$d"

  # The square icon of Android before 8: the dark tile, with rounded corners.
  $b, $g = New-Canvas $icon $icon
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $r = $icon * 0.18; $dia = $r * 2
  $path.AddArc(0, 0, $dia, $dia, 180, 90); $path.AddArc($icon - $dia, 0, $dia, $dia, 270, 90)
  $path.AddArc($icon - $dia, $icon - $dia, $dia, $dia, 0, 90); $path.AddArc(0, $icon - $dia, $dia, $dia, 90, 90)
  $path.CloseFigure()
  $g.FillPath((New-Object System.Drawing.SolidBrush $bg), $path)
  Draw-Logo $g $icon $icon 0.78
  Save $b (Join-Path $dir 'ic_launcher.png')

  # The round one.
  $b, $g = New-Canvas $icon $icon
  $g.FillEllipse((New-Object System.Drawing.SolidBrush $bg), 0, 0, $icon, $icon)
  Draw-Logo $g $icon $icon 0.62
  Save $b (Join-Path $dir 'ic_launcher_round.png')

  # The adaptive icon's front layer: the launcher crops it to a shape, so keep to the middle two thirds.
  $b, $g = New-Canvas $layer $layer
  Draw-Logo $g $layer $layer 0.58
  Save $b (Join-Path $dir 'ic_launcher_foreground.png')
}

# The adaptive icon's back layer, and the colour the app shows while it starts.
$hex = '#010A13'
Set-Content -Encoding utf8 (Join-Path $res 'values/ic_launcher_background.xml') @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">$hex</color>
</resources>
"@

# Splash screens keep the size each already has: the dark of the app, with the logo in the middle.
Get-ChildItem $res -Recurse -Filter splash.png | ForEach-Object {
  $old = [System.Drawing.Image]::FromFile($_.FullName); $w = $old.Width; $h = $old.Height; $old.Dispose()
  $b, $g = New-Canvas $w $h
  $g.Clear($bg)
  Draw-Logo $g $w $h 0.32
  Save $b $_.FullName
}
$logo.Dispose()
Write-Output 'done'
