# 🖨️ RestoCafe USB Yazıcı Sorun Giderme Rehberi

## Mevcut Sorun: USB Yazıcıdan Çıktı Alamama ve Kasa Yazıcısı Sorunları

### 🔍 Hızlı Sorun Teşhisi

1. **Yazıcı Fiziksel Bağlantısı Kontrolü:**
   - USB kablosunun sağlam bağlı olduğunu kontrol edin
   - Yazıcının açık ve hazır durumda olduğunu kontrol edin  
   - Yazıcıda kağıt ve kartuş/ribon olduğunu kontrol edin

2. **Windows Yazıcı Tanıma Kontrolü:**
   ```powershell
   # Windows PowerShell'de yazıcıları listeleyin:
   Get-Printer | Select-Object Name, DriverName, PortName
   ```

3. **RestoCafe Yazıcı Ayarları Kontrolü:**
   - Admin Panel → Ayarlar → Yazıcı Ayarları bölümüne gidin
   - Kasa yazıcısının "Etkin" olduğunu kontrol edin
   - Doğru USB port'un seçili olduğunu kontrol edin

---

## 🛠️ Adım Adım Çözüm Yöntemleri

### 1. Yazıcı Driver ve Bağlantı Kontrolü

**Windows'ta Yazıcı Durumu:**
1. `Başlat` → `Ayarlar` → `Yazıcılar ve Tarayıcılar`
2. Yazıcınızın listede görünüp görünmediğini kontrol edin
3. Eğer görünmüyorsa `Yazıcı veya tarayıcı ekle` tıklayın

**USB Port Kontrolü:**
- Device Manager'da (Aygıt Yöneticisi) USB portlarını kontrol edin
- COM portları bölümüne bakın
- Sarı ünlem işareti varsa driver sorunu var demektir

### 2. RestoCafe Yazıcı Ayarları Düzenleme

**Adım 1: Admin Paneline Erişim**
1. RestoCafe'de sol menüden "Ayarlar"a tıklayın
2. "Yazıcı Ayarları" sekmesine geçin

**Adım 2: Kasa Yazıcısı Ayarları**
1. "Kasa Yazıcısı" toggle'ını açın (etkinleştirin)
2. "Bağlantı Türü"nü "USB Bağlantısı" olarak seçin
3. "USB Yazıcı" dropdown'ından yazıcınızı seçin

**Yazıcı Seçim Seçenekleri:**
- Sistem yazıcısı (Windows'a kurulu yazıcılar)
- Manuel port seçimi:
  - `USB001` - USB Yazıcı Port 1
  - `COM1` - Seri Port 1  
  - `COM2` - Seri Port 2
  - `LPT1` - Paralel Port 1

### 3. Yazıcı Test İşlemi

**Test Çıktısı Alma:**
1. Yazıcı ayarlarında "Test Et" butonuna tıklayın
2. Test çıktısının yazıcıdan çıkıp çıkmadığını kontrol edin
3. Çıktı alınamıyorsa farklı port deneyin

---

## ⚡ Hızlı Çözümler

### A. Port Değiştirme
Eğer mevcut USB port çalışmıyorsa:
1. `USB001` yerine `COM1` veya `COM2` deneyin
2. Eğer POS yazıcı kullanıyorsanız genellikle `COM1` çalışır

### B. Yazıcı Driver Yenileme
1. Windows Device Manager'ı açın
2. "Yazıcılar" veya "Portlar (COM & LPT)" bölümünü bulun
3. Yazıcıya sağ tıklayıp "Driver'ı güncelle" seçin

### C. Yazıcı Sıfırlama
1. Yazıcıyı kapatın ve USB kablosunu çıkarın
2. 30 saniye bekleyin
3. Tekrar bağlayın ve açın
4. Windows'un yazıcıyı tekrar tanımasını bekleyin

---

## 🔧 Gelişmiş Sorun Giderme

### 1. Windows Yazıcı Spooler Servisi Yenileme
```cmd
net stop spooler
net start spooler
```

### 2. Manuel Port Kontrolü
PowerShell'de port durumunu kontrol edin:
```powershell
# Mevcut COM portlarını listele
[System.IO.Ports.SerialPort]::getportnames()

# USB aygıtlarını listele
Get-WmiObject -Class Win32_USBHub | Select-Object Name, DeviceID
```

### 3. Yazıcı Kağıt ve Kartuş Kontrolü
- **Termal yazıcılar:** Termal kağıt doğru yönde mi?
- **Mürekkepli yazıcılar:** Kartuş dolu mu ve doğru takılı mı?
- **İğneli yazıcılar:** Ribon değiştirilmeli mi?

---

## 📋 Yaygın Hata Mesajları ve Çözümleri

### "USB yazıcı hatası: timeout"
**Çözüm:** 
- Yazıcı çok yavaş yanıt veriyor
- Yazıcıyı yeniden başlatın
- Farklı USB port deneyin

### "Yazıcı yanıt vermedi"
**Çözüm:**
- USB kablosu sağlam bağlı mı kontrol edin
- Yazıcı açık ve hazır durumda mı kontrol edin
- Windows'ta yazıcı çevrimiçi mi kontrol edin

### "Print_Error: Access denied"
**Çözüm:**
- RestoCafe'yi "Yönetici olarak çalıştır" ile açın
- Windows kullanıcı izinlerini kontrol edin

---

## 🎯 Kasa Yazıcısı Özel Ayarları

### POS Yazıcı (80mm Termal) Ayarları:
- **Port:** Genellikle `COM1` veya sistem yazıcısı adı
- **Baud Rate:** 9600 (manuel port kullanıyorsanız)
- **Kağıt Genişliği:** 80mm
- **Karakter Kodlama:** UTF-8

### USB Thermal Yazıcı Ayarları:
- **Port:** Sistem yazıcısı adını seçin (örnek: "POS-80C")
- **Sürücü:** Generic/Text Only veya üretici sürücüsü

---

## 🚨 Acil Çözüm: Manuel Test

Eğer RestoCafe üzerinden yazıcı çalışmıyorsa, doğrudan Windows'tan test edin:

1. **Notepad** açın
2. "Test çıktısı" yazın
3. `Ctrl+P` ile yazdırın
4. Yazıcınızı seçin ve yazdırın

Eğer bu çalışıyorsa sorun RestoCafe ayarlarında; çalışmıyorsa Windows/yazıcı sorunu.

---

## 📞 Teknik Destek

Bu rehberi denedikten sonra sorun devam ediyorsa:

1. **Yazıcı modeli ve üreticisini** not edin
2. **Hata mesajının tam metnini** kaydedin  
3. **Windows sürümünüzü** kontrol edin
4. **RestoCafe log dosyalarını** kontrol edin

**Log dosyaları:** `backend/logs/` klasöründe yazıcı hatalarını inceleyebilirsiniz.

---

## ✅ Başarılı Kurulum Kontrol Listesi

- [ ] Yazıcı Windows'ta görünüyor ve çevrimiçi
- [ ] USB kablosu sağlam bağlı
- [ ] Yazıcıda kağıt ve kartuş/ribon var
- [ ] RestoCafe'de yazıcı etkin ve doğru port seçili
- [ ] Test çıktısı başarıyla alındı
- [ ] Satış sonrası fiş yazdırıldı

Bu rehberi takip ederek yazıcı sorunlarınızı çözebilirsiniz! 🎉 