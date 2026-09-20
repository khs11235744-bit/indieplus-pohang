param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Paths)
Add-Type -AssemblyName System.Drawing

function Get-DHash([string]$Path) {
  $img=[System.Drawing.Image]::FromFile($Path)
  $bmp=New-Object System.Drawing.Bitmap 17,16
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($img,0,0,17,16)
  $sb=New-Object System.Text.StringBuilder
  for($y=0;$y -lt 16;$y++){
    for($x=0;$x -lt 16;$x++){
      $a=$bmp.GetPixel($x,$y); $b=$bmp.GetPixel($x+1,$y)
      $ga=$a.R*0.299+$a.G*0.587+$a.B*0.114
      $gb=$b.R*0.299+$b.G*0.587+$b.B*0.114
      [void]$sb.Append($(if($ga -gt $gb){"1"}else{"0"}))
    }
  }
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  return $sb.ToString()
}

$out=@()
foreach($p in $Paths){
  if(Test-Path $p){
    $out += [pscustomobject]@{path=$p;hash=(Get-DHash $p)}
  }
}
$out | ConvertTo-Json -Compress
