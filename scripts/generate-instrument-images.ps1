# Windows 内置绘图生成本项目原创乐器示意图，无外部图片依赖。
Add-Type -AssemblyName System.Drawing
$assetRoot = Join-Path $PSScriptRoot '../miniprogram/assets/instruments'
New-Item -ItemType Directory -Path $assetRoot -Force | Out-Null
function Brush($color) { New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($color)) }
function Rect($color,$x,$y,$w,$h) { $b=Brush $color; $g.FillRectangle($b,[single]$x,[single]$y,[single]$w,[single]$h); $b.Dispose() }
function Oval($color,$x,$y,$w,$h) { $b=Brush $color; $g.FillEllipse($b,[single]$x,[single]$y,[single]$w,[single]$h); $b.Dispose() }
function Line($color,$width,$x1,$y1,$x2,$y2) { $p=New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($color)),([single]$width); $g.DrawLine($p,[single]$x1,[single]$y1,[single]$x2,[single]$y2); $p.Dispose() }
function Label($text,$size,$color,$x,$y) { $font=New-Object System.Drawing.Font 'Arial',([single]$size); $b=Brush $color; $g.DrawString($text,$font,$b,[single]$x,[single]$y); $font.Dispose();$b.Dispose() }
$types='piano','digital-piano','guitar','guzheng','violin','flute','erhu','drums'
$tones='#A96D3D','#784D36','#C8975A','#834B36','#313C3C'
foreach($kind in $types) { foreach($variant in 1..5) {
 $bitmap=New-Object System.Drawing.Bitmap 600,600
 $g=[System.Drawing.Graphics]::FromImage($bitmap)
 $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
 $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#F5F0E6'))
 Oval '#EAE0CF' 70 95 460 460
 Oval '#DDD1BD' 110 476 380 28
 $wood=$tones[$variant-1]; $dark='#30352F';$cream='#FFF8EB';$gold='#BE9457'
 switch($kind) {
 'piano' {
  if($variant -eq 5) {
   Oval $dark 125 140 350 180; Rect $dark 115 240 360 140
   Line $dark 15 150 350 138 480; Line $dark 15 450 350 464 480
   Line $gold 5 165 248 438 186
  } else {
   Rect $dark 118 146 364 265;Rect $wood 132 160 336 115
   Rect $gold 156 263 288 3
   Rect $dark 136 398 22 80;Rect $dark 442 398 22 80
  }
  Rect $cream 130 312 340 68
  foreach($k in 0..23){Line '#B8AD99' 1 (130+$k*14) 312 (130+$k*14) 380;if(($k%7)-notin 2,6){Rect $dark (139+$k*14) 312 8 40}}
  foreach($k in 0..2){Rect $gold (279+$k*17) 419 9 25}
 }
 'digital-piano' {
  Rect $dark 80 250 440 90;Rect $wood 90 258 420 25
  Rect $cream 94 292 412 40
  foreach($k in 0..31){Line '#B8AD99' 1 (94+$k*13) 292 (94+$k*13) 332;if(($k%7)-notin 2,6){Rect $dark (102+$k*13) 292 7 25}}
  Rect '#73958B' 275 261 50 15
  foreach($k in 0..3){Oval $gold (180+$k*14) 263 7 7}
  Line $dark 14 152 340 410 474;Line $dark 14 448 340 190 474
 }
 'guitar' {
  Oval $wood 186 270 228 215;Oval $wood 212 222 176 148
  Oval '#DDB67C' 212 298 176 160
  Oval $dark 270 309 60 60;Oval $gold 275 314 50 50;Oval $dark 280 319 40 40
  Rect '#64432C' 287 108 26 218;Rect $wood 276 75 48 74
  Rect $dark 266 408 68 14
  foreach($k in 0..5){Line '#EFE0BC' 1 (290+$k*4) 122 (290+$k*4) 420}
  foreach($k in 0..12){Line $gold 1 287 (147+$k*12) 313 (147+$k*12)}
  foreach($k in 0..2){Oval $cream 266 (84+$k*20) 10 10;Oval $cream 324 (84+$k*20) 10 10}
 }
 'guzheng' {
  Rect $wood 72 238 456 114;Oval $wood 72 225 456 30
  Rect '#D4A56F' 88 250 424 86
  foreach($k in 0..20){Line '#F5E6C7' 1 90 (253+$k*4) 510 (253+$k*4);Line $dark 2 (279+($k%5)*12) (250+$k*4) (275+($k%5)*12) (257+$k*4)}
  Rect $dark 114 352 16 107;Rect $dark 471 352 16 107
  Line $dark 5 120 412 477 412
 }
 'violin' {
  Oval $wood 211 215 178 124;Oval $wood 199 307 202 164
  Oval '#D7A66D' 225 242 150 88;Oval '#D7A66D' 215 334 169 119
  Oval '#EAE0CF' 192 300 54 57;Oval '#EAE0CF' 354 300 54 57
  Rect $dark 287 120 26 211;Oval $wood 284 78 32 50
  Line $dark 7 269 344 260 381;Line $dark 7 331 344 341 381
  Rect $cream 273 381 54 8;Line $dark 17 300 406 300 454
  foreach($k in 0..3){Line '#F7E9CB' 1 (292+$k*5) 139 (292+$k*5) 420}
  Line '#7D5132' 8 432 104 449 468;Line $cream 2 420 114 437 465
 }
 'flute' {
  $g.TranslateTransform(300,300);$g.RotateTransform(-38);$g.TranslateTransform(-300,-300)
  Rect $wood 90 274 420 42;Rect '#CDA572' 100 280 398 26
  foreach($x in 125,210,330,438,487){Rect '#614533' $x 274 4 42}
  foreach($x in 155,249,283,317,351,385,419){Oval $dark $x 285 13 13;Oval '#705539' ($x+3) 288 5 5}
  Rect '#F7EBDD' 116 274 22 42
  $g.ResetTransform()
 }
 'erhu' {
  Rect $wood 288 104 18 306;Line $wood 16 298 111 312 81
  Line $dark 10 262 148 320 148;Line $dark 10 268 185 329 185
  Rect $wood 255 380 93 88;Rect '#C5A36A' 264 389 73 69
  foreach($k in 0..7){Line '#71583A' 1 (267+$k*9) 391 (267+$k*9) 456;Line '#71583A' 1 266 (393+$k*8) 337 (393+$k*8)}
  Line $cream 1 297 137 297 449;Line $cream 1 303 137 303 449
  Line '#875C3C' 7 153 349 443 359;Line $cream 2 155 362 443 371
 }
 'drums' {
  Line $dark 8 151 265 147 458;Line $dark 8 449 265 453 458;Line $dark 8 150 313 450 313
  foreach($x in 195,310,408){Line $dark 5 $x 360 ($x-15) 475}
  foreach($x in 114,400){Oval $gold $x 198 96 22;Line $dark 5 ($x+48) 210 ($x+48) 317}
  Oval $wood 193 257 88 42;Oval $dark 201 264 72 25
  Oval $wood 303 257 88 42;Oval $dark 311 264 72 25
  Oval $wood 137 338 112 52;Oval $dark 146 344 94 34
  Oval $wood 354 338 112 52;Oval $dark 363 344 94 34
  Oval $dark 246 368 99 110;Oval '#63736C' 257 379 77 88
  Rect $dark 277 462 32 24;Rect $dark 435 269 34 27;Rect '#8DAFA1' 440 274 24 11
 }
 }
 Label 'YDW / MUSIC' 12 '#7D735E' 28 27
 Label ('ILLUSTRATION / 0'+$variant) 11 '#8B806D' 28 554
 $bitmap.Save((Join-Path $assetRoot ($kind+'-'+$variant+'.png')),[System.Drawing.Imaging.ImageFormat]::Png)
 $g.Dispose();$bitmap.Dispose()
}}
Write-Output 'Generated 40 original instrument PNG illustrations.'
