param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference='Stop'
$outDir=Join-Path $ProjectRoot 'assets\editorial'
$dataPath=Join-Path $ProjectRoot 'data\director-portraits.json'
$nl=[Environment]::NewLine
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# QID is fixed to avoid same-name mistakes. Add composers/directors here as needed.
$people=@(
  @{Name='Alfred Hitchcock';Ko='알프레드 히치콕';Q='Q7374';Slug='hitchcock';Kind='portrait';Fallback=''},
  @{Name='Robert Bresson';Ko='로베르 브레송';Q='Q55391';Slug='bresson';Kind='signature';Fallback='File:Robert Bresson signature.svg'},
  @{Name='Andrei Tarkovsky';Ko='안드레이 타르콥스키';Q='Q853';Slug='tarkovsky';Kind='portrait';Fallback='File:Andrey Tarkovsky with air.jpg'},
  @{Name='Agnès Varda';Ko='아녜스 바르다';Q='Q229990';Slug='varda';Kind='portrait';Fallback=''},
  @{Name='Akira Kurosawa';Ko='구로사와 아키라';Q='Q8006';Slug='kurosawa';Kind='portrait';Fallback=''}
)

function Plain([string]$s){
  if(-not $s){return ''}
  return (([regex]::Replace($s,'<[^>]+>',' ') -replace '&nbsp;',' ') -replace '\s+',' ').Trim()
}
function Get-CommonsInfo([string]$title,[int]$width=960){
  $api='https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url%7Cextmetadata&iiurlwidth='+$width+'&titles='+[uri]::EscapeDataString($title)
  $c=Invoke-RestMethod -UseBasicParsing -Uri $api -TimeoutSec 30 -Headers @{'User-Agent'='INDIP-open-media/1.0'}
  $page=$c.query.pages.PSObject.Properties.Value | Select-Object -First 1
  if(-not $page -or -not $page.imageinfo){return $null}
  $ii=$page.imageinfo[0]
  [pscustomobject]@{
    title=$page.title; thumb=$ii.thumburl; original=$ii.url; source=$ii.descriptionurl
    license=$ii.extmetadata.LicenseShortName.value
    licenseUrl=$ii.extmetadata.LicenseUrl.value
    creator=Plain $ii.extmetadata.Artist.value
    credit=Plain $ii.extmetadata.Credit.value
  }
}
function Allowed([string]$license){
  if(-not $license){return $false}
  $l=$license.ToLowerInvariant()
  ($l -eq 'public domain' -or $l -eq 'cc0' -or $l -match '^cc by($| )' -or $l -match '^cc by-sa($| )')
}
function NonPortrait([string]$title){
  if(-not $title){return $false}
  $title -match '(?i)stamp|gravestone|grave|tomb|logo|plaque|poster|signature|memorial|statue'
}

$result=[ordered]@{version=2;portraits=[ordered]@{}}

foreach($p in $people){
  Write-Host ('[open-media] '+$p.Name)
  $entity=Invoke-RestMethod -UseBasicParsing -Uri ('https://www.wikidata.org/wiki/Special:EntityData/'+$p.Q+'.json') -TimeoutSec 30 -Headers @{'User-Agent'='INDIP-open-media/1.0'}
  $e=$entity.entities.($p.Q)
  $filename=$null
  if($e.claims.P18 -and $e.claims.P18.Count -gt 0){$filename=$e.claims.P18[0].mainsnak.datavalue.value}

  $info=$null
  if($filename){
    $candidate=Get-CommonsInfo ('File:'+$filename)
    if($candidate -and (Allowed $candidate.license) -and -not (NonPortrait $candidate.title)){$info=$candidate}
  }
  if(-not $info -and $p.Fallback){
    $candidate=Get-CommonsInfo $p.Fallback
    if($candidate -and (Allowed $candidate.license)){$info=$candidate}
  }
  if(-not $info){
    Write-Warning ('No safe open media for '+$p.Name)
    continue
  }

  $isSvg=$info.title.ToLowerInvariant().EndsWith('.svg')
  $ext=if($isSvg){'.png'}else{'.jpg'}
  $prefix=if($p.Kind -eq 'signature'){'signature-'}else{'portrait-'}
  $local=Join-Path $outDir ($prefix+$p.Slug+$ext)
  Start-Sleep -Milliseconds 800
  Invoke-WebRequest -UseBasicParsing -Uri $info.thumb -OutFile $local -TimeoutSec 60 -Headers @{'User-Agent'='INDIP-open-media/1.0'}

  $result.portraits[$p.Name]=[ordered]@{
    kind=$p.Kind
    path='./assets/editorial/'+[IO.Path]::GetFileName($local)
    source=$info.source
    creator=$info.creator
    license=$info.license
    licenseUrl=$info.licenseUrl
    credit=$info.credit
    displayTreatment=if($p.Kind -eq 'signature'){'Public-domain signature fallback; source attribution retained.'}else{'Open-license portrait; CSS crop for display. Source attribution and license retained.'}
    bytes=(Get-Item $local).Length
  }
}

[System.IO.File]::WriteAllText($dataPath,($result|ConvertTo-Json -Depth 8)+$nl,(New-Object System.Text.UTF8Encoding($false)))
Write-Host ('[open-media] wrote '+$dataPath)
