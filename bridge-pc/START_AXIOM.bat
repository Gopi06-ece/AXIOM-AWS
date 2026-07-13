
@echo off
title AXIOM Launcher
color 0B
echo.
echo  ===========================================
echo     AXIOM Industrial AI Monitor
echo  ===========================================
echo.
 
set HERE=%~dp0
set CLOUDFLARED=C:\cloudflared\cloudflared.exe
set LOGFILE=%HERE%cloudflared.log
 
REM ── EDIT THESE ──────────────────────────────────────────────
set GMAIL_FROM=gopiece2006@gmail.com
set GMAIL_PASS=zexr qygg ecpr wpiu
set MENTOR_EMAIL=gopiganeshjayabalan@gmail.com
set DASHBOARD_URL=https://axiom-ongc.onrender.com
REM ────────────────────────────────────────────────────────────
 
echo  [1/3] Starting OPC-UA Server...
start "1-OPCUA-SERVER" cmd /k "cd /d %HERE% && color 0A && python server.py"
timeout /t 4 /nobreak >nul
 
echo  [2/3] Starting Bridge...
start "2-BRIDGE" cmd /k "cd /d %HERE% && color 0E && node bridge.js"
timeout /t 5 /nobreak >nul
 
echo  [3/3] Starting Cloudflare Tunnel...
if exist "%LOGFILE%" del "%LOGFILE%"
start "3-TUNNEL" cmd /k "color 0D && %CLOUDFLARED% tunnel --url http://localhost:8080 > "%LOGFILE%" 2>&1"
 
echo.
echo  Waiting for tunnel URL (25 seconds)...
timeout /t 25 /nobreak >nul
 
echo  Extracting URL and sending email to mentor...
powershell -ExecutionPolicy Bypass -Command ^
  "$log = '%LOGFILE%';" ^
  "$gmailFrom = '%GMAIL_FROM%';" ^
  "$gmailPass = '%GMAIL_PASS%';" ^
  "$mentorEmail = '%MENTOR_EMAIL%';" ^
  "$dashboardUrl = '%DASHBOARD_URL%';" ^
  "$found = $false;" ^
  "for ($i = 0; $i -lt 20; $i++) {" ^
  "  Start-Sleep -Seconds 2;" ^
  "  if (Test-Path $log) {" ^
  "    $content = Get-Content $log -Raw -EA SilentlyContinue;" ^
  "    $match = [regex]::Match($content, 'https://[a-zA-Z0-9-]+\.trycloudflare\.com');" ^
  "    if ($match.Success) {" ^
  "      $tunnelUrl = $match.Value;" ^
  "      $connectLink = $dashboardUrl + '/?tunnel=' + [Uri]::EscapeDataString($tunnelUrl);" ^
  "      Write-Host '';" ^
  "      Write-Host '  Tunnel URL: ' $tunnelUrl;" ^
  "      Write-Host '  Sending email to mentor...';" ^
  "      $smtp = New-Object Net.Mail.SmtpClient('smtp.gmail.com', 587);" ^
  "      $smtp.EnableSsl = $true;" ^
  "      $smtp.Credentials = New-Object Net.NetworkCredential($gmailFrom, $gmailPass);" ^
  "      $mail = New-Object Net.Mail.MailMessage;" ^
  "      $mail.From = $gmailFrom;" ^
  "      $mail.To.Add($mentorEmail);" ^
  "      $mail.Subject = 'AXIOM Bridge Online - Click to Open Dashboard';" ^
  "      $mail.IsBodyHtml = $true;" ^
  "      $mail.Body = '<html><body style=""font-family:Arial;background:#06090d;color:#e2eaf4;padding:20px"">" ^
  "<div style=""background:#0f1720;border:1px solid #1a2535;border-radius:12px;padding:28px;max-width:500px;margin:0 auto"">" ^
  "<div style=""font-size:22px;font-weight:700;color:#00d4e8;font-family:monospace;margin-bottom:4px"">AXIOM</div>" ^
  "<div style=""font-size:11px;color:#4d6a85;font-family:monospace;letter-spacing:.2em;margin-bottom:16px"">INDUSTRIAL AI MONITOR</div>" ^
  "<div style=""background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);color:#22c55e;border-radius:20px;padding:4px 14px;font-size:12px;display:inline-block;margin-bottom:16px"">Bridge Online</div>" ^
  "<p style=""font-size:13px;color:#8ba0b8;line-height:1.7;margin-bottom:16px"">The AXIOM bridge is running at ONGC. Click the button to open your live dashboard - the connection is already set up automatically.</p>" ^
  "<div style=""background:#0b1018;border:1px solid #1a2535;border-radius:8px;padding:12px 16px;margin-bottom:14px"">" ^
  "<div style=""font-size:10px;color:#4d6a85;font-family:monospace;margin-bottom:4px"">TUNNEL URL</div>" ^
  "<div style=""font-size:11px;color:#00d4e8;font-family:monospace;word-break:break-all"">' + $tunnelUrl + '</div></div>" ^
  "<a href=""' + $connectLink + '"" style=""display:block;text-align:center;background:#00d4e8;color:#06090d;border-radius:9px;padding:14px;font-size:14px;font-weight:700;text-decoration:none;font-family:monospace;margin-bottom:12px"">OPEN AXIOM DASHBOARD</a>" ^
  "<div style=""font-size:11px;color:#4d6a85;text-align:center"">Log in with your access code to view live data.</div>" ^
  "</div></body></html>';" ^
  "      try {" ^
  "        $smtp.Send($mail);" ^
  "        Write-Host '  Email sent successfully!';" ^
  "      } catch {" ^
  "        Write-Host '  Email failed: ' $_.Exception.Message;" ^
  "      }" ^
  "      $found = $true;" ^
  "      break;" ^
  "    }" ^
  "  }" ^
  "}" ^
  "if (-not $found) { Write-Host '  Could not find tunnel URL. Check purple window manually.'; }"
 
echo.
echo  ===========================================
echo   All started!
echo   Check above for email status.
echo   Keep all 3 colored windows open.
echo  ===========================================
echo.
pause
 