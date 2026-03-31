$ErrorActionPreference = "Continue"
$url = "https://dyifhrodlkqjdlzbwckg.supabase.co/rest/v1"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aWZocm9kbGtxamRsemJ3Y2tnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc2NzM3MiwiZXhwIjoyMDg4MzQzMzcyfQ.u68E6k3VzPFvHbY_jKMJT5yaOkT40orwTOsuVvBEoAM"

$h = @{ "apikey" = $key; "Authorization" = "Bearer $key"; "Prefer" = "return=representation" }
$hp = @{ "apikey" = $key; "Authorization" = "Bearer $key"; "Content-Type" = "application/json"; "Prefer" = "return=representation" }

$g6 = "1da295e7-b24a-403e-9894-574c6adfd985"
$g78 = "a9ba4416-583d-4257-8eb0-76861aa47efb"
$games = "$g6,$g78"

$tids = @(
  "14776b98-80ed-4b4f-9116-7b87cbfa3213",
  "b37372e9-9915-4952-b81d-ebbe3be54214",
  "51577b33-7a1d-4cef-a76f-524dd8a3fe4b",
  "218a481b-647b-4718-964b-4b836869ed70",
  "3f83d27a-1d61-4b84-80d6-141a23e80054",
  "a6f9416f-b3ee-43f0-92a5-8a2d0df4d683",
  "d4a137f0-2efb-44d6-9622-a8913f8377db",
  "a9bb77ca-97f2-46e6-b81b-fd5f1c23c4b9",
  "668cc85d-3bbb-474e-8f7e-2903f8d5f7ca",
  "743937d8-de6d-4bdf-947d-37136da8402e",
  "d31fb0cf-c601-416e-840f-d01e42ad73ae"
) -join ","

Write-Host "`nRESETTING BOTH GAMES" -ForegroundColor Cyan
Write-Host "6th Grade: $g6"
Write-Host "7/8 Grade: $g78"
Write-Host ""

# 1. Delete epoch_submissions
Write-Host "1. Deleting epoch_submissions..." -NoNewline
try {
  $r = Invoke-RestMethod -Method Delete -Uri "$url/epoch_submissions?game_id=in.($games)" -Headers $h
  Write-Host " deleted $($r.Count)" -ForegroundColor Green
} catch { Write-Host " skipped" -ForegroundColor Yellow }

# 2. Delete epoch_role_assignments
Write-Host "2. Deleting epoch_role_assignments..." -NoNewline
try {
  $r = Invoke-RestMethod -Method Delete -Uri "$url/epoch_role_assignments?team_id=in.($tids)" -Headers $h
  Write-Host " deleted $($r.Count)" -ForegroundColor Green
} catch { Write-Host " skipped" -ForegroundColor Yellow }

# 3. Delete sub_zones
Write-Host "3. Deleting sub_zones..." -NoNewline
try {
  $r = Invoke-RestMethod -Method Delete -Uri "$url/sub_zones?game_id=in.($games)" -Headers $h
  Write-Host " deleted $($r.Count)" -ForegroundColor Green
} catch { Write-Host " skipped" -ForegroundColor Yellow }

# 4. Delete team_assets
Write-Host "4. Deleting team_assets..." -NoNewline
try {
  $r = Invoke-RestMethod -Method Delete -Uri "$url/team_assets?game_id=in.($games)" -Headers $h
  Write-Host " deleted $($r.Count)" -ForegroundColor Green
} catch { Write-Host " skipped" -ForegroundColor Yellow }

# 5. Delete tech_research
Write-Host "5. Deleting tech_research..." -NoNewline
try {
  $r = Invoke-RestMethod -Method Delete -Uri "$url/tech_research?team_id=in.($tids)" -Headers $h
  Write-Host " deleted $($r.Count)" -ForegroundColor Green
} catch { Write-Host " skipped" -ForegroundColor Yellow }

# 6. Delete trade records
Write-Host "6. Deleting trade records..." -NoNewline
try { Invoke-RestMethod -Method Delete -Uri "$url/trade_offers?game_id=in.($games)" -Headers $h } catch {}
try { Invoke-RestMethod -Method Delete -Uri "$url/trade_agreements?game_id=in.($games)" -Headers $h } catch {}
try { Invoke-RestMethod -Method Delete -Uri "$url/embargoes?game_id=in.($games)" -Headers $h } catch {}
Write-Host " done" -ForegroundColor Green

# 7. Delete wonder_progress
Write-Host "7. Deleting wonder_progress..." -NoNewline
try { Invoke-RestMethod -Method Delete -Uri "$url/wonder_progress?team_id=in.($tids)" -Headers $h } catch {}
Write-Host " done" -ForegroundColor Green

# 8. Delete civilization_names
Write-Host "8. Deleting civilization_names..." -NoNewline
try {
  $r = Invoke-RestMethod -Method Delete -Uri "$url/civilization_names?team_id=in.($tids)" -Headers $h
  Write-Host " deleted $($r.Count)" -ForegroundColor Green
} catch { Write-Host " skipped" -ForegroundColor Yellow }

# 9. Reset team_resources: food=10, rest=0
Write-Host "9. Resetting team_resources..." -NoNewline
try {
  Invoke-RestMethod -Method Patch -Uri "$url/team_resources?team_id=in.($tids)&resource_type=neq.food" -Headers $hp -Body '{"amount":0}'
  Invoke-RestMethod -Method Patch -Uri "$url/team_resources?team_id=in.($tids)&resource_type=eq.food" -Headers $hp -Body '{"amount":10}'
  Write-Host " food=10, rest=0" -ForegroundColor Green
} catch { Write-Host " ERROR: $_" -ForegroundColor Red }

# 10. Un-absent team members
Write-Host "10. Un-absenting team members..." -NoNewline
try {
  Invoke-RestMethod -Method Patch -Uri "$url/team_members?team_id=in.($tids)" -Headers $hp -Body '{"is_absent":false}'
  Write-Host " done" -ForegroundColor Green
} catch { Write-Host " skipped" -ForegroundColor Yellow }

# 11. Reset teams (keep region_id)
Write-Host "11. Resetting teams..." -NoNewline
try {
  $body = '{"population":5,"civilization_name":null,"war_exhaustion_level":0,"is_in_dark_age":false,"confederation_id":null,"draft_order":null}'
  Invoke-RestMethod -Method Patch -Uri "$url/teams?id=in.($tids)" -Headers $hp -Body $body
  Write-Host " pop=5, civ_name=null" -ForegroundColor Green
} catch { Write-Host " ERROR: $_" -ForegroundColor Red }

# 12. Reset games to epoch 1 / login
Write-Host "12. Resetting games to epoch 1 / login..." -NoNewline
try {
  $body = '{"current_round":"login","current_epoch":1}'
  Invoke-RestMethod -Method Patch -Uri "$url/games?id=in.($games)" -Headers $hp -Body $body
  Write-Host " done" -ForegroundColor Green
} catch { Write-Host " ERROR: $_" -ForegroundColor Red }

# Verify
Write-Host "`nVERIFYING..." -ForegroundColor Cyan
$verify = Invoke-RestMethod -Uri "$url/games?id=in.($games)&select=name,current_epoch,current_round" -Headers $h
foreach ($g in $verify) {
  Write-Host "  $($g.name): epoch=$($g.current_epoch), round=$($g.current_round)" -ForegroundColor White
}

Write-Host "`nBOTH GAMES RESET" -ForegroundColor Green
