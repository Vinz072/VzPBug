document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
    
    // Check if user is already logged in
    if (localStorage.getItem('vzpbug_user')) {
        window.location.href = 'dashboard.html';
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = document.querySelector('.login-btn');
        
        // Show loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading"></span> Memproses...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Store user data
                localStorage.setItem('vzpbug_user', JSON.stringify(data.user));
                
                // Show success animation
                submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Berhasil!';
                submitBtn.style.background = 'linear-gradient(45deg, #00ff00, #008800)';
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
                
            } else {
                // Show error modal
                showAlert('Login Gagal', data.message || 'Akun tidak ditemukan, harap membeli akun atau meminta bantuan ke seller kami');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Error', 'Terjadi kesalahan koneksi. Silakan coba lagi.');
        } finally {
            // Reset button after delay
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = '';
            }, 2000);
        }
    });
    
    function showAlert(title, message) {
        document.getElementById('alertTitle').textContent = title;
        document.getElementById('alertMessage').textContent = message;
        alertModal.show();
    }
    
    // Add input animations
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
    
    // Add logo glitch effect on click
    const logo = document.querySelector('.logo-img');
    logo.addEventListener('click', function() {
        this.classList.add('glitch');
        setTimeout(() => {
            this.classList.remove('glitch');
        }, 2000);
    });
});