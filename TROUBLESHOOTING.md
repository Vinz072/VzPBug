# Troubleshooting Guide - VzPBug v1.0

## 🔧 Masalah Koneksi Umum

### 1. Error "Terjadi kesalahan koneksi"

**Penyebab:**
- Folder `data/` tidak ada atau tidak dapat ditulis
- File JSON database tidak ada
- Permission file tidak benar
- Server PHP tidak berjalan

**Solusi:**
1. Buka halaman `fix.html` untuk auto-fix
2. Atau jalankan manual:
   ```bash
   mkdir -p data
   chmod 755 data
   chmod 644 data/*.json
   ```

### 2. Error "Tidak dapat terhubung ke server"

**Penyebab:**
- Server web tidak berjalan
- Port tidak benar
- Firewall memblokir

**Solusi:**
1. Pastikan server web (Apache/Nginx) berjalan
2. Cek port yang digunakan (biasanya 80 atau 8080)
3. Buka `debug.html` untuk test koneksi

### 3. Error "Server tidak merespons"

**Penyebab:**
- PHP tidak terinstall atau tidak berjalan
- Memory limit PHP terlalu kecil
- Timeout setting terlalu pendek

**Solusi:**
1. Install PHP 8.0+ jika belum
2. Cek `php.ini` setting:
   ```ini
   memory_limit = 256M
   max_execution_time = 300
   ```
3. Restart server web

### 4. Error "User tidak ditemukan"

**Penyebab:**
- File `users.json` rusak atau kosong
- Password hash tidak valid

**Solusi:**
1. Reset file `users.json`:
   ```json
   [
     {
       "id": 1,
       "username": "admin",
       "password": "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
       "role": "OWNER",
       "bug_attempts": 0,
       "created_at": "2024-01-01 00:00:00",
       "expired_date": "2025-01-01",
       "last_login": null,
       "created_by": "system"
     }
   ]
   ```
2. Default login: `admin` / `admin123`

## 🛠️ Tools Debug

### 1. Debug Connection (`debug.html`)
- Test semua API endpoint
- Cek response dari server
- Identifikasi masalah spesifik

### 2. Auto Fix (`fix.html`)
- Perbaiki masalah umum otomatis
- Buat folder dan file yang hilang
- Set permission yang benar

### 3. Test Connection (`test_connection.php`)
- Cek ketersediaan PHP
- Test write permission
- Verifikasi konfigurasi

## 📋 Checklist Troubleshooting

### Sebelum Debug
- [ ] Server web berjalan
- [ ] PHP terinstall (versi 8.0+)
- [ ] Folder `data/` ada dan writable
- [ ] File JSON database ada
- [ ] Permission file benar (755 untuk folder, 644 untuk file)

### Setelah Debug
- [ ] Semua API endpoint merespons
- [ ] Login berhasil
- [ ] Dashboard dapat diakses
- [ ] Telegram sender berfungsi
- [ ] Admin panel dapat diakses

## 🔍 Debug Manual

### 1. Cek Error Log
```bash
# Apache error log
tail -f /var/log/apache2/error.log

# PHP error log
tail -f /var/log/php_errors.log
```

### 2. Test PHP
```bash
php -v
php -m | grep json
php -m | grep hash
```

### 3. Test File Permission
```bash
ls -la data/
ls -la data/*.json
```

### 4. Test API Manual
```bash
curl -X POST http://localhost/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"admin","password":"admin123"}'
```

## 🚨 Emergency Fix

Jika semua gagal, jalankan script emergency:

```bash
# Buat ulang struktur folder
mkdir -p data
chmod 755 data

# Buat file database default
cat > data/users.json << 'EOF'
[
  {
    "id": 1,
    "username": "admin",
    "password": "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    "role": "OWNER",
    "bug_attempts": 0,
    "created_at": "2024-01-01 00:00:00",
    "expired_date": "2025-01-01",
    "last_login": null,
    "created_by": "system"
  }
]
EOF

cat > data/config.json << 'EOF'
{
  "server_status": "online",
  "telegram_api_id": "29400040",
  "telegram_api_hash": "5ffd282cc743acc1c31f83f6589d9b98",
  "telegram_group_id": "-1002741451900"
}
EOF

cat > data/information.json << 'EOF'
[
  {
    "id": 1,
    "title": "Selamat Datang",
    "content": "Website tool sender Telegram",
    "created_at": "2024-01-01 00:00:00",
    "created_by": "system"
  }
]
EOF

echo "[]" > data/activity_logs.json
echo "[]" > data/telegram_messages.json

# Set permission
chmod 644 data/*.json
```

## 📞 Support

Jika masalah masih berlanjut:
1. Screenshot error message
2. Cek hasil dari `debug.html`
3. Cek hasil dari `fix.html`
4. Hubungi support dengan informasi lengkap

---

**VzPBug v1.0** - Professional Telegram Sender Tool