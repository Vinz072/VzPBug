# VzPBug v1.0 - Website Tool Sender Telegram

VzPBug v1.0 adalah website tool sender yang memungkinkan pengguna mengirim pesan ke grup Telegram dengan berbagai template pesan dan sistem manajemen user yang lengkap.

## 🚀 Fitur Utama

### 📱 Halaman Login
- Animasi smooth dan modern
- Validasi akun dengan pop-up custom
- Responsive design untuk mobile
- Pesan error yang user-friendly

### 🏠 Halaman Dashboard
- Kirim pesan ke grup Telegram dengan ID `-1002741451900`
- Pilihan template pesan (/pesan1, /pesan2, /pesan_rahasia, dll)
- Custom message support
- Pop-up informasi dengan 20 informasi terbaru
- Status server real-time
- Statistik user (percobaan bug, role, status akun)

### 👤 Halaman Profil
- Tema retro terminal yang keren
- Informasi akun lengkap
- Session timer real-time
- Terminal commands (refresh, clear, logout, dashboard)
- Keyboard shortcuts (Ctrl+R, Ctrl+L, Ctrl+D)

### ⚙️ Halaman Admin Panel
- **User Management**: Buat, edit, perpanjang, hapus user
- **Role System**: OWNER > Admin > Reseller > Pengguna
- **Daily Limits**: Admin/Reseller max 10 akun/hari
- **Statistics**: Total user, user aktif, percobaan bug
- **Server Control**: Ubah status server (OWNER only)
- **Information Management**: Kelola informasi pop-up (OWNER only)
- **User Monitoring**: Detail aktivitas dan riwayat user

## 🛠️ Teknologi yang Digunakan

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **UI Framework**: Bootstrap 5.3.0, TailwindCSS 2.2.19
- **Icons**: Font Awesome 6.0.0
- **Backend**: PHP 8.0+
- **Database**: JSON file-based storage
- **API**: RESTful API dengan CORS support

## 📂 Struktur Project

```
vzpbug/
├── assets/
│   ├── logo.png          # Logo aplikasi
│   └── bgvid.mp4         # Background video
├── css/
│   └── style.css         # Main stylesheet
├── js/
│   ├── login.js          # Login functionality
│   ├── dashboard.js      # Dashboard functionality
│   ├── profile.js        # Profile functionality
│   └── admin.js          # Admin panel functionality
├── api/
│   ├── auth.php          # Authentication API
│   ├── telegram.php      # Telegram integration
│   ├── admin.php         # Admin management API
│   └── system.php        # System functions API
├── data/
│   ├── users.json        # User database
│   ├── config.json       # System configuration
│   ├── information.json  # Information messages
│   ├── activity_logs.json # User activity logs
│   └── telegram_messages.json # Message history
├── index.html            # Login page
├── dashboard.html        # Main dashboard
├── profile.html          # User profile
├── admin.html            # Admin panel
└── README.md             # This file
```

## 🔧 Instalasi & Setup

### Requirements
- PHP 8.0 atau lebih tinggi
- Web server (Apache/Nginx)
- Write permissions untuk folder `data/`

### Langkah Instalasi

1. **Upload Files**
   ```bash
   # Upload semua file ke hosting
   # Pastikan folder data/ memiliki permission 755
   ```

2. **Set Permissions**
   ```bash
   chmod 755 data/
   chmod 644 data/*.json
   ```

3. **Default Login**
   - Username: `admin`
   - Password: `admin123`
   - Role: `OWNER`

4. **Konfigurasi Telegram**
   - API ID: `29400040`
   - API Hash: `5ffd282cc743acc1c31f83f6589d9b98`
   - Group ID: `-1002741451900`

## 👥 Sistem Role & Permission

### 🏆 OWNER
- Full access ke semua fitur
- Dapat membuat user dengan role apapun
- Unlimited daily limit
- Dapat mengubah status server
- Dapat mengelola informasi
- Dapat menghapus user

### 👨‍💼 Admin
- Dapat membuat user (pengguna, reseller)
- Max 10 akun per hari
- Dapat melihat statistik
- Dapat memperpanjang akun user

### 🛒 Reseller
- Dapat membuat user (pengguna only)
- Max 10 akun per hari
- Akses terbatas ke admin panel

### 👤 Pengguna
- Akses dashboard dan profile
- Dapat mengirim pesan ke Telegram
- View-only access

## 📱 Mobile Compatibility

Website ini dioptimasi untuk mobile dengan:
- Responsive design di semua halaman
- Touch-friendly interface
- Mobile-optimized animations
- Adaptive layouts untuk berbagai screen size

## 🎨 Design Features

- **Theme**: Dark red dengan aksen hitam
- **Background**: Video background di semua halaman
- **Animations**: Smooth transitions dan loading states
- **Terminal Theme**: Retro coding style di halaman profil
- **Professional UI**: Modern dan user-friendly

## 📊 Monitoring & Logging

- **Activity Logging**: Semua aktivitas user dicatat
- **Real-time Statistics**: Dashboard admin dengan data real-time
- **User Tracking**: Monitor pergerakan user secara detail
- **Message History**: Riwayat pesan Telegram tersimpan

## 🔒 Security Features

- **Password Hashing**: Menggunakan PHP password_hash()
- **Session Management**: LocalStorage dengan validation
- **Role-based Access**: Pembatasan akses berdasarkan role
- **Input Validation**: Validasi di frontend dan backend
- **CORS Protection**: Configured CORS headers

## 🚀 Deployment

### Hosting Compatibility
- ✅ Rumahweb Unlimited Hosting
- ✅ Shared hosting dengan PHP support
- ✅ VPS/Dedicated server
- ✅ Cloud hosting (AWS, GCP, Azure)

### Production Setup
1. Upload files via FTP/cPanel File Manager
2. Set proper file permissions
3. Configure database path jika diperlukan
4. Test semua functionality
5. Update Telegram API credentials jika diperlukan

## 📞 Support

Untuk bantuan dan support, hubungi:
- WhatsApp: [Nomor seller]
- Email: [Email support]

## 📝 Changelog

### v1.0.0 (Initial Release)
- ✅ Login system dengan animasi
- ✅ Dashboard dengan Telegram sender
- ✅ Profile dengan terminal theme
- ✅ Admin panel lengkap
- ✅ Role-based access control
- ✅ Mobile responsive design
- ✅ Real-time monitoring
- ✅ Information management system

## 🎯 Future Updates

- [ ] Real Telegram API integration
- [ ] Database migration to MySQL
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Enhanced security features

---

**VzPBug v1.0** - Professional Telegram Sender Tool
Made with ❤️ for Indonesian community