# Test receipt printing
Write-Host "Test fişi yazdırma testi..."

# Login
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login başarılı"
    
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.token)"
        "Content-Type" = "application/json"
    }
    
    # Test receipt printing
    Write-Host "Test fişi yazdırılıyor..."
    $receiptResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/printers/test-receipt" -Method POST -Headers $headers
    
    Write-Host "Test fişi sonucu:"
    $receiptResponse | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "Hata: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Hata detayı: $responseBody"
    }
} 