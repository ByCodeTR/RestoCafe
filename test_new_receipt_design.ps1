# Test New Receipt Design - Acar Köşe Restorant
Write-Host "=== ACAR KÖŞE RESTORANT - YENİ FİŞ TASARIMI TEST ===" -ForegroundColor Green

# Backend health check
Write-Host "Backend durumu kontrol ediliyor..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
    Write-Host "✅ Backend çalışıyor: $($healthResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend bağlantı hatası: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Login
Write-Host "Admin girişi yapılıyor..." -ForegroundColor Yellow
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Giriş başarılı" -ForegroundColor Green
} catch {
    Write-Host "❌ Giriş hatası: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test receipt data - Acar Köşe Restorant için optimize edilmiş
$testReceiptData = @{
    id = "acar-receipt-$(Get-Date -Format 'yyyyMMddHHmmss')"
    table = @{
        number = "12"
        name = "Masa 12"
    }
    total = 185.75
    paymentMethod = "CASH"
    cashReceived = 200.00
    waiter = "Mehmet Demir"
    items = @(
        @{
            name = "Acar Köşe Özel Kebap"
            quantity = 1
            price = 65.00
        },
        @{
            name = "Kuzu Şiş"
            quantity = 2
            price = 45.00
        },
        @{
            name = "Çoban Salata"
            quantity = 1
            price = 22.50
        },
        @{
            name = "Ayran (Büyük)"
            quantity = 3
            price = 8.25
        }
    )
} | ConvertTo-Json -Depth 10

# Test receipt printing
Write-Host "Acar Köşe Restorant fişi yazdırılıyor..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $printResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/printers/test-receipt" -Method POST -Body $testReceiptData -Headers $headers
    
    if ($printResponse.success) {
        Write-Host "✅ Acar Köşe Restorant fişi başarıyla yazdırıldı!" -ForegroundColor Green
        Write-Host "📄 Mesaj: $($printResponse.message)" -ForegroundColor Cyan
        
        # Receipt preview
        Write-Host "`n=== ACAR KÖŞE RESTORANT FİŞ ÖNİZLEME ===" -ForegroundColor Magenta
        Write-Host "           *** SATIS FISI ***           " -ForegroundColor White
        Write-Host "           Acar Köşe Restorant           " -ForegroundColor White
        Write-Host "         Tel: 0553 718 50 24            " -ForegroundColor White
        Write-Host "      www.acarkoserestorant.com.tr      " -ForegroundColor White
        Write-Host "================================================" -ForegroundColor White
        Write-Host "Fiş No: acar-receipt-$(Get-Date -Format 'yyyyMMddHHmmss')" -ForegroundColor White
        Write-Host "Masa: Masa 12" -ForegroundColor White
        Write-Host "Garson: Mehmet Demir" -ForegroundColor White
        Write-Host "Toplam: 185.75 TL" -ForegroundColor White
        Write-Host "Ödeme: NAKİT" -ForegroundColor White
        Write-Host "Alınan: 200.00 TL" -ForegroundColor White
        Write-Host "Para Üstü: 14.25 TL" -ForegroundColor White
        Write-Host "================================================" -ForegroundColor White
        Write-Host "ÜRÜNLER:" -ForegroundColor White
        Write-Host "  1x Acar Köşe Özel Kebap - 65.00 TL" -ForegroundColor White
        Write-Host "  2x Kuzu Şiş - 90.00 TL" -ForegroundColor White
        Write-Host "  1x Çoban Salata - 22.50 TL" -ForegroundColor White
        Write-Host "  3x Ayran (Büyük) - 24.75 TL" -ForegroundColor White
        Write-Host "================================================" -ForegroundColor White
        Write-Host "            TESEKKUR EDERIZ!            " -ForegroundColor White
        Write-Host "           Yeniden bekleriz...          " -ForegroundColor White
        Write-Host "================================================" -ForegroundColor White
        
    } else {
        Write-Host "❌ Test fişi yazdırma hatası: $($printResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ API hatası: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorDetails = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorDetails)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Hata detayı: $errorBody" -ForegroundColor Red
    }
}

Write-Host "`n=== TEST TAMAMLANDI ===" -ForegroundColor Green
Write-Host "🏪 Acar Köşe Restorant fiş tasarımı hazır!" -ForegroundColor Cyan
Write-Host "📱 Tel: 0553 718 50 24" -ForegroundColor Cyan
Write-Host "🌐 www.acarkoserestorant.com.tr" -ForegroundColor Cyan
Write-Host "📄 Aktif masalarda 'Adisyon Çıkart' butonu eklendi!" -ForegroundColor Cyan
Write-Host "💡 Dolu masaya tıklayın → 'Adisyon Çıkart' → Sipariş özeti görün!" -ForegroundColor Cyan 