# 🔧 Panduan Troubleshooting Masalah Koneksi VzPBug v1.0

## 🚨 Masalah Yang Sudah Diperbaiki

### ✅ 1. Direktori `data/` Tidak Ada
**Masalah:** Aplikasi tidak dapat menyimpan data karena direktori `data/` tidak ada.
**Solusi:** Direktori dan file JSON yang diperlukan sudah dibuat:
- `data/users.json` - Database user
- `data/config.json` - Konfigurasi sistem
- `data/information.json` - Informasi popup
- `data/activity_logs.json` - Log aktivitas
- `data/telegram_messages.json` - History pesan

### ✅ 2. Permission File Salah
**Masalah:** File tidak dapat dibaca/ditulis karena permission salah.
**Solusi:** Permission sudah diatur dengan benar:
- Direktori `data/`: 755 (rwxr-xr-x)
- File JSON: 644 (rw-r--r--)

### ✅ 3. Konfigurasi .htaccess
**Masalah:** API tidak dapat diakses karena konfigurasi Apache salah.
**Solusi:** 
- Ditambahkan konfigurasi khusus untuk direktori API
- Diperbaiki CORS headers
- Diupdate domain reference dari `yourdomain.com` ke `localhost`

## 🔍 Cara Mendiagnosa Masalah Koneksi

### 1. Gunakan Test Tool
Buka file `test_api.html` di browser untuk menguji semua endpoint API:
```
http://your-domain.com/test_api.html
```

### 2. Periksa Console Browser
- Buka Developer Tools (F12)
- Lihat tab Console untuk error JavaScript
- Lihat tab Network untuk status HTTP request

### 3. Periksa Log Server
```bash
# Apache Error Log
tail -f /var/log/apache2/error.log

# PHP Error Log  
tail -f /var/log/php/error.log
```

## 🛠️ Solusi Masalah Koneksi Umum

### ❌ Error: "Failed to fetch" atau "Network Error"

**Penyebab Umum:**
1. Server web tidak berjalan
2. PHP tidak terinstall atau tidak dikonfigurasi
3. File API tidak dapat diakses
4. CORS policy blocking

**Solusi:**
```bash
# 1. Pastikan Apache/Nginx berjalan
sudo systemctl status apache2
sudo systemctl start apache2

# 2. Pastikan PHP terinstall
php --version
sudo apt install php php-cli php-json

# 3. Periksa permission file
ls -la api/
chmod 755 api/
chmod 644 api/*.php

# 4. Test manual API
curl -X POST http://localhost/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"admin","password":"admin123"}'
```

### ❌ Error: "500 Internal Server Error"

**Penyebab Umum:**
1. Syntax error di file PHP
2. Permission file salah
3. Direktori data/ tidak ada
4. PHP extension tidak terinstall

**Solusi:**
```bash
# 1. Check syntax PHP
php -l api/auth.php
php -l api/telegram.php
php -l api/system.php
php -l api/admin.php

# 2. Periksa error log
tail -f /var/log/apache2/error.log

# 3. Pastikan extension PHP tersedia
php -m | grep json
sudo apt install php-json php-curl
```

### ❌ Error: "403 Forbidden"

**Penyebab Umum:**
1. .htaccess memblokir akses
2. Permission direktori salah
3. Apache mod_rewrite tidak aktif

**Solusi:**
```bash
# 1. Enable mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2

# 2. Periksa permission
chmod 755 api/
chmod 644 api/*.php

# 3. Test tanpa .htaccess
mv .htaccess .htaccess.bak
# Test API, lalu restore
mv .htaccess.bak .htaccess
```

### ❌ Error: "CORS Policy" di Browser

**Penyebab:** Browser memblokir request cross-origin.

**Solusi:**
1. Pastikan CORS headers sudah ada di file PHP:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

2. Test dengan disable CORS di browser (hanya untuk testing):
```bash
# Chrome
google-chrome --disable-web-security --user-data-dir=/tmp/chrome_dev

# Firefox
firefox --disable-web-security
```

## 📋 Checklist Troubleshooting

Ikuti checklist ini secara berurutan:

- [ ] **Server Web Status**
  - [ ] Apache/Nginx berjalan
  - [ ] Port 80/443 terbuka
  - [ ] Document root benar

- [ ] **PHP Configuration**
  - [ ] PHP terinstall dan berjalan
  - [ ] Extension JSON aktif
  - [ ] Error reporting enabled

- [ ] **File System**
  - [ ] Direktori `data/` ada dan writable
  - [ ] File JSON sudah dibuat
  - [ ] Permission file benar (755/644)

- [ ] **API Endpoints**
  - [ ] `api/auth.php` dapat diakses
  - [ ] `api/telegram.php` dapat diakses
  - [ ] `api/system.php` dapat diakses
  - [ ] `api/admin.php` dapat diakses

- [ ] **Network & CORS**
  - [ ] CORS headers dikonfigurasi
  - [ ] No firewall blocking
  - [ ] DNS resolution benar

## 🔧 Tools Debugging

### 1. Test API Manual
```bash
# Test server status
curl "http://localhost/api/system.php?action=server_status"

# Test login
curl -X POST http://localhost/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"admin","password":"admin123"}'

# Test bot info
curl "http://localhost/api/telegram.php?action=get_bot_info"
```

### 2. PHP Debug Script
Buat file `debug.php`:
```php
<?php
echo "PHP Version: " . PHP_VERSION . "\n";
echo "JSON Extension: " . (extension_loaded('json') ? 'OK' : 'MISSING') . "\n";
echo "Data Directory: " . (is_dir('data') ? 'EXISTS' : 'MISSING') . "\n";
echo "Data Writable: " . (is_writable('data') ? 'YES' : 'NO') . "\n";

// Test file creation
$test = file_put_contents('data/test.txt', 'test');
echo "File Write Test: " . ($test ? 'OK' : 'FAILED') . "\n";
if ($test) unlink('data/test.txt');
?>
```

### 3. JavaScript Debug
Tambahkan di console browser:
```javascript
// Test fetch API
fetch('api/system.php?action=server_status')
  .then(response => response.json())
  .then(data => console.log('API Response:', data))
  .catch(error => console.error('API Error:', error));
```

## 📞 Bantuan Lebih Lanjut

Jika masalah masih berlanjut:

1. **Periksa Environment:**
   - Hosting provider (shared/VPS/dedicated)
   - PHP version dan configuration
   - Web server type dan version

2. **Hubungi Support:**
   - Sertakan error message lengkap
   - Screenshot dari browser console
   - Hasil dari test tool (`test_api.html`)
   - Log file dari server

3. **Forum Community:**
   - Post di forum dengan detail lengkap
   - Tag dengan "connection-issue"
   - Sertakan environment info

---

**VzPBug v1.0** - Connection Troubleshooting Guide
Dibuat untuk membantu menyelesaikan masalah koneksi dengan cepat dan efektif.