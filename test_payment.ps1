# Test payment processing
Write-Host "Ödeme işlemi testi..."

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
    
    # Önce siparişleri listele
    Write-Host "Siparişler listeleniyor..."
    $ordersResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/orders" -Method GET -Headers $headers
    
    if ($ordersResponse.data -and $ordersResponse.data.Count -gt 0) {
        $unpaidOrder = $ordersResponse.data | Where-Object { $_.status -ne "PAID" } | Select-Object -First 1
        
        if ($unpaidOrder) {
            Write-Host "Ödenmemiş sipariş bulundu: $($unpaidOrder.id)"
            
            # Ödeme işlemi
            $paymentBody = @{
                paymentMethod = "CASH"
                cashAmount = $unpaidOrder.total
                creditAmount = 0
            } | ConvertTo-Json
            
            Write-Host "Ödeme işlemi başlatılıyor..."
            $paymentResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/orders/$($unpaidOrder.id)/payment" -Method POST -Body $paymentBody -Headers $headers
            
            Write-Host "Ödeme sonucu:"
            $paymentResponse | ConvertTo-Json -Depth 10
        } else {
            Write-Host "Ödenmemiş sipariş bulunamadı"
        }
    } else {
        Write-Host "Hiç sipariş bulunamadı"
    }
    
} catch {
    Write-Host "Hata: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Hata detayı: $responseBody"
    }
} 