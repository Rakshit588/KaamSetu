# Plays the worker side of a booking from the terminal, until the worker screens are built.
# Run it like this (PowerShell, from the repo root):
#   powershell -ExecutionPolicy Bypass -File .\scripts\worker-sim.ps1 -Action whoami
#   powershell -ExecutionPolicy Bypass -File .\scripts\worker-sim.ps1 -Action accept   -BookingId <id>
#   powershell -ExecutionPolicy Bypass -File .\scripts\worker-sim.ps1 -Action ontheway -BookingId <id>
#   powershell -ExecutionPolicy Bypass -File .\scripts\worker-sim.ps1 -Action start    -BookingId <id> -Otp <start OTP shown to the customer>
#   powershell -ExecutionPolicy Bypass -File .\scripts\worker-sim.ps1 -Action complete -BookingId <id> -Otp <completion OTP shown to the customer>
#   powershell -ExecutionPolicy Bypass -File .\scripts\worker-sim.ps1 -Action say      -BookingId <id> -Text "On my way!"
param(
  [ValidateSet('whoami', 'accept', 'ontheway', 'start', 'complete', 'say')]
  [string]$Action = 'whoami',
  [string]$BookingId = '',
  [string]$Otp = '',
  [string]$Text = 'On my way!',
  [string]$Phone = '9100000001'
)

$ErrorActionPreference = 'Stop'
$api = 'http://localhost:4000'
$cache = Join-Path $env:TEMP "ks-worker-$Phone.json"

function Call($method, $path, $token, $body) {
  $headers = @{ 'Content-Type' = 'application/json' }
  if ($token) { $headers['Authorization'] = "Bearer $token" }
  $params = @{ Uri = "$api$path"; Method = $method; Headers = $headers }
  if ($null -ne $body) { $params['Body'] = ($body | ConvertTo-Json -Depth 5) }
  Invoke-RestMethod @params
}

function Login {
  # The token is cached, so this only runs when needed (the API limits OTP requests per number).
  Call 'Post' '/auth/otp/request' $null @{ phone = $Phone } | Out-Null
  $r = Call 'Post' '/auth/otp/verify' $null @{ phone = $Phone; otp = '123456' }
  @{ token = $r.accessToken } | ConvertTo-Json | Set-Content $cache
  return $r.accessToken
}

function GetToken {
  if (Test-Path $cache) {
    $c = Get-Content $cache -Raw | ConvertFrom-Json
    try { Call 'Get' '/auth/me' $c.token $null | Out-Null; return $c.token } catch { }
  }
  return Login
}

function NeedBooking {
  if (-not $BookingId) { throw 'Pass -BookingId <id> (it is the last part of the booking page address).' }
}

function SetStatus($to, $extra) {
  $b = (Call 'Get' "/bookings/$BookingId" $token $null).booking
  $body = @{ to = $to }
  if ($b.location.coordinates) {
    $body['lng'] = $b.location.coordinates[0]
    $body['lat'] = $b.location.coordinates[1]
  }
  if ($extra) { foreach ($k in $extra.Keys) { $body[$k] = $extra[$k] } }
  Call 'Post' "/bookings/$BookingId/status" $token $body | Out-Null
  Write-Host "Booking status is now: $to" -ForegroundColor Green
}

try {
  $token = GetToken
  switch ($Action) {
    'whoami' {
      $me = (Call 'Get' '/auth/me' $token $null).user
      $wp = Call 'Get' "/workers/$($me.id)" $null $null
      $trades = ($wp.profile.skills | ForEach-Object { $_.trade }) -join ', '
      Write-Host "Worker: $($me.name)   id: $($me.id)"
      Write-Host "Trades: $trades"
      Write-Host "Open as the customer: http://localhost:3000/customer/workers/$($me.id)" -ForegroundColor Green
    }
    'accept' {
      NeedBooking
      Call 'Post' "/bookings/$BookingId/accept" $token $null | Out-Null
      Write-Host 'Accepted.' -ForegroundColor Green
    }
    'ontheway' { NeedBooking; SetStatus 'on_the_way' $null }
    'start' {
      NeedBooking
      if (-not $Otp) { throw 'Pass -Otp <start OTP shown on the customer booking page>.' }
      SetStatus 'in_progress' @{ otp = $Otp }
    }
    'complete' {
      NeedBooking
      if (-not $Otp) { throw 'Pass -Otp <completion OTP shown on the customer booking page>.' }
      SetStatus 'completed' @{ otp = $Otp }
    }
    'say' {
      NeedBooking
      Call 'Post' "/chat/$BookingId/messages" $token @{ text = $Text } | Out-Null
      Write-Host "Sent: $Text" -ForegroundColor Green
    }
  }
}
catch {
  $detail = $_.ErrorDetails.Message
  if ($detail) { Write-Host "Failed: $detail" -ForegroundColor Red } else { Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red }
}
