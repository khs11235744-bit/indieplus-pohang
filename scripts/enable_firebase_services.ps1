$configPath = "$env:USERPROFILE\.config\configstore\firebase-tools.json"
$config = Get-Content -Raw $configPath | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($config.tokens.access_token)" }
$projectNumber = "953914697180"
$services = @("firestore.googleapis.com","identitytoolkit.googleapis.com")
foreach ($service in $services) {
  $uri = "https://serviceusage.googleapis.com/v1/projects/$projectNumber/services/$($service):enable"
  try {
    Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -ContentType "application/json" -Body "{}" | Out-Null
    Write-Output "$service ENABLE_REQUESTED"
  } catch {
    Write-Output "$service ERROR $($_.Exception.Message)"
  }
}
