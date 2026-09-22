param([string]$Repo='')
$ErrorActionPreference='Continue'
function FindRepo([string]$p){if($p -and (Test-Path (Join-Path $p '.git'))){return (Resolve-Path $p).Path};foreach($c in @((Join-Path $HOME 'Documents\indieplus-pohang'),(Join-Path $HOME 'Desktop\indieplus-pohang'),(Join-Path $HOME 'Downloads\indieplus-pohang'))){if(Test-Path (Join-Path $c '.git')){return (Resolve-Path $c).Path}};throw '저장소를 찾지 못했습니다.'}
$r=FindRepo $Repo;Set-Location $r
$project='indieplus-pohang-khs';if(Test-Path '.firebaserc'){try{$j=Get-Content '.firebaserc' -Raw|ConvertFrom-Json;if($j.projects.default){$project=[string]$j.projects.default}}catch{}}
$site='';if(Test-Path '.v20-site.txt'){$site=(Get-Content '.v20-site.txt' -Raw).Trim()}
$lines=New-Object System.Collections.Generic.List[string]
function Add([string]$s){$lines.Add($s);Write-Host $s}
Add '=== INDI+P v22 VERIFY ===';Add ("Time: "+(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'));Add ("Repo: $r");Add ("Project: $project");Add ("Site: $site")
foreach($f in @('features-v20.js','features-v21.js','features-v22.js','v20.css','v21.css','v22.css','firestore.rules','firebase.json')){Add (("{0,-24} {1}" -f $f,$(if(Test-Path $f){'OK'}else{'MISSING'})))}
if(Get-Command node -ErrorAction SilentlyContinue){& node --check 'features-v22.js';Add ("node check: "+$(if($LASTEXITCODE -eq 0){'OK'}else{'FAIL'}))}
if(Get-Command firebase.cmd -ErrorAction SilentlyContinue){$fun=& firebase.cmd functions:list --project $project --json 2>&1|Out-String;Add ("functions:list: "+$(if($LASTEXITCODE -eq 0){'OK'}else{'FAIL'}));$lines.Add($fun.Trim())}
if($site){try{$res=Invoke-WebRequest -UseBasicParsing -Uri $site -TimeoutSec 30;Add ("site HTTP: $($res.StatusCode)");Add ("index v22 marker: "+$(if($res.Content -match 'features-v22\.js'){'OK'}else{'MISSING'}));$js=Invoke-WebRequest -UseBasicParsing -Uri ($site.TrimEnd('/')+'/features-v22.js') -TimeoutSec 30;Add ("features-v22.js HTTP: $($js.StatusCode)");$cfg=Invoke-WebRequest -UseBasicParsing -Uri ($site.TrimEnd('/')+'/__/firebase/init.json') -TimeoutSec 30;Add ("firebase init HTTP: $($cfg.StatusCode)")}catch{Add ("HTTP VERIFY FAIL: $($_.Exception.Message)")}}
$path=Join-Path $r 'V22_VERIFY_REPORT.txt';[IO.File]::WriteAllLines($path,$lines,(New-Object Text.UTF8Encoding($false)));Add ("Report: $path")
