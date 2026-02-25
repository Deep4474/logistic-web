<#
PowerShell helper to set environment variables for a Render service via Render API.
Usage:
  1. Create an API key in Render dashboard (Account -> API Keys).
  2. Get your service ID from the Render dashboard (Service -> Settings -> Service ID).
  3. Edit the $envVars array below or provide values interactively.
  4. Run: `.
ender-set-env.ps1`

This script does NOT store your API key — it uses it during execution only.
#>

$renderApiKey = Read-Host -Prompt 'Enter your RENDER_API_KEY (will not be saved)'
if (-not $renderApiKey) { Write-Host 'API key required'; exit 1 }

$serviceId = Read-Host -Prompt 'Enter your RENDER_SERVICE_ID'
if (-not $serviceId) { Write-Host 'Service ID required'; exit 1 }

# Define key/value pairs to set (do NOT hardcode secrets into repo)
$envVars = @(
    @{ key = 'NODE_ENV'; value = 'production'; secure = $false },
    @{ key = 'MONGODB_URI'; value = '<YOUR_MONGODB_URI>'; secure = $true },
    @{ key = 'EMAIL_USER'; value = '<your-email@example.com>'; secure = $false },
    @{ key = 'EMAIL_PASS'; value = '<YOUR_EMAIL_PASS>'; secure = $true },
    @{ key = 'EMAIL_SERVICE'; value = 'gmail'; secure = $false },
    @{ key = 'DISABLE_SENDGRID'; value = 'true'; secure = $false }
)

Write-Host "Will set the following env vars for service ID: $serviceId"
$envVars | ForEach-Object { Write-Host " - $($_.key)" }

$confirm = Read-Host -Prompt 'Proceed to set these variables? (y/n)'
if ($confirm -ne 'y') { Write-Host 'Aborted'; exit 0 }

foreach ($e in $envVars) {
    $body = @{ key = $e.key; value = $e.value; secure = $e.secure } | ConvertTo-Json
    $url = "https://api.render.com/v1/services/$serviceId/env-vars"
    try {
        $resp = Invoke-RestMethod -Method Post -Uri $url -Headers @{ Authorization = "Bearer $renderApiKey"; 'Content-Type' = 'application/json' } -Body $body
        Write-Host "Set $($e.key)"
    } catch {
        Write-Host "Failed to set $($e.key): $_"
    }
}

Write-Host 'Done. Restart your Render service from dashboard to apply changes.'
