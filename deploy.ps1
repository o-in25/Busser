# deploy to fly.io with build args from .env
$envFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envFile)) {
    Write-Error ".env file not found at $envFile"
    exit 1
}

$buildArgs = @()
$requiredVars = @(
    "DB_HOSTNAME", "DB_USER", "DB_PASSWORD", "DB_PORT",
    "BUCKET", "GOOGLE_SERVICE_KEY", "OPENAI_API_KEY",
    "INSTANCE_CONNECTION_NAME", "JWT_SIGNING_KEY", "MAILGUN_KEY",
    "APP_URL", "APP_VERSION",
    "GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"
)

# parse .env into a hashtable
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.*)$') {
        $envVars[$Matches[1]] = $Matches[2].Trim('"', "'", ' ')
    }
}

foreach ($var in $requiredVars) {
    if (-not $envVars.ContainsKey($var)) {
        Write-Warning "missing $var in .env - skipping"
        continue
    }
    $buildArgs += "--build-arg"
    $buildArgs += "$var=$($envVars[$var])"
}

Write-Host "deploying to fly.io" -ForegroundColor Cyan
fly deploy @buildArgs
