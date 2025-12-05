let allBookings = [];
let allServices = [];
let allUsers = [];
let allRewards = [];
document.addEventListener('DOMContentLoaded', () => {
    const adminWrapper = document.querySelector('.admin-wrapper');
    if (adminWrapper) {
        checkAdminSession();
    } else {
        showLoginPage();
    }
});
function showLoginPage() {
    document.body.innerHTML = `
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: linear-gradient(135deg, #1B3C53 0%, #234C6A 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; }
            .login-container { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); width: 100%; max-width: 400px; }
            .login-logo { text-align: center; margin-bottom: 2rem; }
            .login-logo h1 { color: #1B3C53; font-size: 1.8rem; margin: 0; }
            .login-logo p { color: #999; font-size: 0.9rem; margin: 0.5rem 0 0 0; }
            .login-form { display: grid; gap: 1rem; }
            .form-group { display: flex; flex-direction: column; }
            .form-group label { font-weight: 600; color: #1B3C53; margin-bottom: 0.5rem; }
            .form-group input { padding: 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; font-family: inherit; }
            .form-group input:focus { outline: none; border-color: #234C6A; box-shadow: 0 0 0 3px rgba(35, 76, 106, 0.1); }
            .login-btn { padding: 0.8rem; background: #234C6A; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem; transition: all 0.3s; }
            .login-btn:hover { background: #1B3C53; transform: translateY(-2px); }
            .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            .login-alert { padding: 1rem; border-radius: 6px; margin-bottom: 1rem; display: none; }
            .login-alert.show { display: block; }
            .login-alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .login-alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        </style>
        <div class="login-container">
            <div class="login-logo">
                <h1>🔧 Admin Panel</h1>
                <p>Bengkel Motor Jaya</p>
            </div>
            <div class="login-alert" id="loginAlert"></div>
            <form class="login-form" id="loginForm">
                <div class="form-group">
                    <label for="adminUsername">Username</label>
                    <input type="text" id="adminUsername" required placeholder="Masukkan username" autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="adminPassword">Password</label>
                    <input type="password" id="adminPassword" required placeholder="Masukkan password" autocomplete="current-password">
                </div>
                <button type="submit" class="login-btn">Login</button>
            </form>
        </div>
    `;
    setTimeout(() => {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleAdminLogin);
        }
    }, 100);
}
function handleAdminLogin(event) {
    event.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    if (!username || !password) {
        showLoginAlert('Username dan password harus diisi', 'error');
        return;
    }
    const btn = event.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Loading...';
    console.log('Attempting login with username:', username);
    fetch('/Ulangan/api/admin/login.php', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.get('content-type'));
        if (!response.ok) {
            throw new Error('HTTP Error: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            console.log('Login successful!');
            window.location.href = '/Ulangan/admin.html';
        } else {
            showLoginAlert(data.message || 'Login gagal', 'error');
            btn.disabled = false;
            btn.textContent = 'Login';
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showLoginAlert('Error: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Login';
    });
}
function showLoginAlert(message, type) {
    setTimeout(() => {
        const alert = document.getElementById('loginAlert');
        if (alert) {
            alert.textContent = message;
            alert.className = `login-alert show login-alert-${type}`;
            window.scrollTo(0, 0);
        }
    }, 100);
}
function checkAdminSession() {
    fetch('/Ulangan/api/admin/check-session.php')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                showLoginPage();
            } else {
                loadDashboardData();
            }
        })
        .catch(error => {
            console.error('Session check error:', error);
            showLoginPage();
        });
}
function loadDashboardData() {
    loadDashboardStats();
    loadBookings();
    loadServices();
    loadUsers();
    loadRewards();
}
function loadDashboardStats() {
    fetch('/Ulangan/api/admin/stats.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('statTotalUsers').textContent = data.data.total_users || 0;
                document.getElementById('statPendingBookings').textContent = data.data.pending_bookings || 0;
                document.getElementById('statDoneBookings').textContent = data.data.done_bookings || 0;
                document.getElementById('statTotalServices').textContent = data.data.total_services || 0;
            }
        })
        .catch(error => console.error('Error loading stats:', error));
}
function loadBookings() {
    fetch('/Ulangan/api/admin/bookings.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.bookings) {
                allBookings = data.data.bookings;
                renderBookings();
            }
        })
        .catch(error => console.error('Error loading bookings:', error));
}
function renderBookings() {
    const filterName = document.getElementById('bookingFilterName')?.value || '';
    const filterStatus = document.getElementById('bookingFilterStatus')?.value || '';
    let filtered = allBookings.filter(booking => {
        const nameMatch = booking.customer_name?.toLowerCase().includes(filterName.toLowerCase());
        const statusMatch = !filterStatus || booking.status === filterStatus;
        return nameMatch && statusMatch;
    });
    const tbody = document.getElementById('bookingsList');
    if (!tbody) return;
    tbody.innerHTML = filtered.map(booking => `
        <tr>
            <td><strong>#${booking.id}</strong></td>
            <td>${booking.customer_name}</td>
            <td>${booking.customer_phone}</td>
            <td>
                ${booking.service_type === 'custom' 
                    ? `<span class="badge badge-custom">${booking.service_name}</span>` 
                    : booking.service_name}
            </td>
            <td>${booking.points_earned || 0}</td>
            <td>${new Date(booking.booking_date).toLocaleDateString('id-ID')}</td>
            <td><span class="badge badge-${booking.status}">${capitalizeFirst(booking.status)}</span></td>
            <td>
                <button class="admin-btn admin-btn-edit admin-btn-small" onclick="openEditStatusModal(${booking.id}, '${booking.status}')">Edit</button>
            </td>
        </tr>
    `).join('');
    const dashboardList = document.getElementById('dashboardBookingsList');
    if (dashboardList) {
        dashboardList.innerHTML = allBookings.slice(0, 5).map(booking => `
            <tr>
                <td><strong>#${booking.id}</strong></td>
                <td>${booking.customer_name}</td>
                <td>${booking.service_name}</td>
                <td><span class="badge badge-${booking.status}">${capitalizeFirst(booking.status)}</span></td>
                <td>${new Date(booking.booking_date).toLocaleDateString('id-ID')}</td>
            </tr>
        `).join('');
    }
}
function loadServices() {
    fetch('/Ulangan/api/services/get.php')
        .then(response => response.json())
        .then(data => {
            const servicesList = data.services || (data.data && data.data.services) || [];
            if (Array.isArray(servicesList)) {
                allServices = servicesList.map(s => ({
                    id: s.id,
                    service_key: s.service_key || s.serviceKey || '',
                    service_name: s.service_name || s.serviceName || s.service_name,
                    price: s.price || s.price || 0,
                    points_earned: (s.points_earned ?? s.points) || 0,
                    description: s.description || s.desc || '',
                    is_active: ('is_active' in s) ? Boolean(s.is_active) : true
                })).filter(s => (s.service_type || s.service_key) !== 'custom');
                renderServices();
            } else {
                console.warn('loadServices: unexpected payload', data);
            }
        })
        .catch(error => console.error('Error loading services:', error));
}
function renderServices() {
    const tbody = document.getElementById('servicesList');
    if (!tbody) return;
    tbody.innerHTML = allServices.map(service => `
        <tr>
            <td><strong>${service.service_name}</strong></td>
            <td>Rp ${parseInt(service.price).toLocaleString('id-ID')}</td>
            <td><strong>${service.points_earned}</strong></td>
            <td>
                <span class="badge ${service.is_active ? 'badge-active' : 'badge-pending'}">
                    ${service.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
            </td>
            <td>
                <button class="admin-btn admin-btn-edit admin-btn-small" onclick="openEditServiceModal(${service.id}, '${service.service_name}', ${service.price}, ${service.points_earned}, '${service.description || ''}')">Edit</button>
                <button class="admin-btn admin-btn-delete admin-btn-small" onclick="deleteService(${service.id})">Hapus</button>
            </td>
        </tr>
    `).join('');
}
function loadUsers() {
    fetch('/Ulangan/api/admin/users.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.users) {
                allUsers = data.data.users;
                renderUsers();
            }
        })
        .catch(error => console.error('Error loading users:', error));
}
function renderUsers() {
    const filterName = document.getElementById('userFilterName')?.value || '';
    let filtered = allUsers.filter(user => {
        return user.username?.toLowerCase().includes(filterName.toLowerCase()) ||
               user.email?.toLowerCase().includes(filterName.toLowerCase());
    });
    const tbody = document.getElementById('usersList');
    if (!tbody) return;
    tbody.innerHTML = filtered.map(user => `
        <tr>
            <td>${user.id}</td>
            <td><strong>${user.username}</strong></td>
            <td>${user.email || '-'}</td>
            <td>${user.phone || '-'}</td>
            <td>${user.booking_count || 0}</td>
            <td><strong>${user.total_points || 0}</strong></td>
            <td>
                <button class="admin-btn admin-btn-edit admin-btn-small" onclick="viewUserDetails(${user.id})">Detail</button>
            </td>
        </tr>
    `).join('');
}
function loadRewards() {
    fetch('/Ulangan/api/admin/rewards.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.rewards) {
                allRewards = data.data.rewards;
                renderRewards();
            }
        })
        .catch(error => console.error('Error loading rewards:', error));
}
function renderRewards() {
    const tbody = document.getElementById('rewardsList');
    if (!tbody) return;
    tbody.innerHTML = allRewards.map(reward => `
        <tr>
            <td><strong>${reward.username}</strong></td>
            <td>${reward.reward_name || reward.reward_type}</td>
            <td>${reward.points_used || 0}</td>
            <td><span class="badge badge-${reward.status || 'pending'}">${capitalizeFirst(reward.status || 'pending')}</span></td>
            <td>${new Date(reward.created_at).toLocaleDateString('id-ID')}</td>
        </tr>
    `).join('');
}
function switchTab(tabName) {
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    event.target.closest('.admin-nav-item').classList.add('active');
    const titles = {
        dashboard: '📊 Dashboard',
        bookings: '📋 Booking',
        services: '🛠️ Layanan',
        users: '👥 User',
        rewards: '🎁 Reward'
    };
    document.getElementById('pageTitle').textContent = titles[tabName] || 'Admin Panel';
}
function openEditStatusModal(bookingId, currentStatus) {
    document.getElementById('editStatusBookingId').value = bookingId;
    document.getElementById('editStatusValue').value = currentStatus;
    document.getElementById('editStatusModal').classList.add('show');
}
function closeEditStatusModal() {
    document.getElementById('editStatusModal').classList.remove('show');
}
function saveBookingStatus(event) {
    event.preventDefault();
    const bookingId = document.getElementById('editStatusBookingId').value;
    const newStatus = document.getElementById('editStatusValue').value;
    fetch('/Ulangan/api/admin/update-booking-status.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bookingId: bookingId,
            status: newStatus
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('bookingAlert', 'Status booking berhasil diubah', 'success');
            closeEditStatusModal();
            loadBookings();
        } else {
            showAlert('bookingAlert', data.message || 'Error', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('bookingAlert', 'Terjadi kesalahan', 'error');
    });
}
function openAddServiceModal() {
    document.getElementById('serviceId').value = '';
    document.getElementById('serviceName').value = '';
    document.getElementById('servicePrice').value = '';
    document.getElementById('servicePoints').value = '';
    document.getElementById('serviceDesc').value = '';
    document.getElementById('serviceModalTitle').textContent = 'Tambah Layanan';
    document.getElementById('serviceModal').classList.add('show');
}
function openEditServiceModal(serviceId, serviceName, price, points, description) {
    document.getElementById('serviceId').value = serviceId;
    document.getElementById('serviceName').value = serviceName;
    document.getElementById('servicePrice').value = price;
    document.getElementById('servicePoints').value = points;
    document.getElementById('serviceDesc').value = description;
    document.getElementById('serviceModalTitle').textContent = 'Edit Layanan';
    document.getElementById('serviceModal').classList.add('show');
}
function closeServiceModal() {
    document.getElementById('serviceModal').classList.remove('show');
}
function saveService(event) {
    event.preventDefault();
    const serviceId = document.getElementById('serviceId').value;
    const serviceName = document.getElementById('serviceName').value;
    const servicePrice = document.getElementById('servicePrice').value;
    const servicePoints = document.getElementById('servicePoints').value;
    const serviceDesc = document.getElementById('serviceDesc').value;
    const method = serviceId ? 'PUT' : 'POST';
    const payload = {
        service_name: serviceName,
        price: servicePrice,
        points_earned: servicePoints,
        description: serviceDesc
    };
    if (serviceId) {
        payload.serviceId = serviceId;
    }
    fetch('/Ulangan/api/admin/services.php', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('serviceAlert', serviceId ? 'Layanan berhasil diubah' : 'Layanan berhasil ditambahkan', 'success');
            closeServiceModal();
            loadServices();
        } else {
            showAlert('serviceAlert', data.message || 'Error', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('serviceAlert', 'Terjadi kesalahan', 'error');
    });
}
let pendingDeleteServiceId = null;
function deleteService(serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    const serviceName = service ? service.service_name : 'Layanan';
    pendingDeleteServiceId = serviceId;
    document.getElementById('deleteServiceName').textContent = serviceName;
    document.getElementById('deleteServiceModal').classList.add('show');
}
function closeDeleteServiceModal() {
    document.getElementById('deleteServiceModal').classList.remove('show');
    pendingDeleteServiceId = null;
}
function confirmDeleteService() {
    if (!pendingDeleteServiceId) return;
    const serviceId = pendingDeleteServiceId;
    closeDeleteServiceModal();
    fetch('/Ulangan/api/admin/services.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: serviceId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('serviceAlert', 'Layanan berhasil dihapus', 'success');
            loadServices();
        } else {
            showAlert('serviceAlert', data.message || 'Error', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('serviceAlert', 'Terjadi kesalahan', 'error');
    });
}
function viewUserDetails(userId) {
    alert('Detail user #' + userId + ' (fitur pengembangan)');
}
function adminLogout() {
    fetch('/Ulangan/api/admin/logout.php', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/Ulangan/admin.html';
            }
        })
        .catch(error => console.error('Logout error:', error));
}
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function showAlert(elementId, message, type) {
    const alertElement = document.getElementById(elementId);
    if (!alertElement) return;
    alertElement.innerHTML = `<div class="admin-alert admin-alert-${type}">${message}</div>`;
    setTimeout(() => {
        if (alertElement) alertElement.innerHTML = '';
    }, 5000);
}
