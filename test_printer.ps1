# Test printer endpoint
Write-Host "Testing printer check-fix endpoint..."

# First, login to get a token
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login successful"
    Write-Host "Token: $($loginResponse.token.Substring(0,20))..."
    
    # Now test the printer endpoint
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.token)"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Testing printer check-fix endpoint..."
    $printerResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/printers/check-fix" -Method GET -Headers $headers
    
    Write-Host "Printer response:"
    $printerResponse | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
} 