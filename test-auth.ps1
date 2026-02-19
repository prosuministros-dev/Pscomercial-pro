$loginUrl = 'https://jmevnusslcdaldtzymax.supabase.co/auth/v1/token?grant_type=password'
$headers = @{
  'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjEwNDcsImV4cCI6MjA4NjM5NzA0N30.CCGILUaLNsmwgT5MbffinKOpNJV0Jy5_0xg1yTNCOyg'
  'Content-Type' = 'application/json'
}
$body = '{"email":"admin@prosuministros.com","password":"Admin2026!"}'

try {
  $r = Invoke-RestMethod -Uri $loginUrl -Method Post -Headers $headers -Body $body
  $uid = $r.user.id
  $alen = $r.access_token.Length
  Write-Output "SUCCESS"
  Write-Output "user_id=$uid"
  Write-Output "access_token_len=$alen"

  # Now test the profile query using service role
  $srk = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw'
  $profileUrl = "https://jmevnusslcdaldtzymax.supabase.co/rest/v1/profiles?id=eq.$uid&select=id,organization_id,email,full_name"
  $profileHeaders = @{
    'apikey' = $srk
    'Authorization' = "Bearer $srk"
  }
  $pr = Invoke-RestMethod -Uri $profileUrl -Method Get -Headers $profileHeaders
  Write-Output "PROFILE_RESULT:"
  Write-Output ($pr | ConvertTo-Json -Depth 5)
} catch {
  $msg = $_.Exception.Message
  $det = $_.ErrorDetails.Message
  Write-Output "FAILED: $msg"
  Write-Output "DETAILS: $det"
}
