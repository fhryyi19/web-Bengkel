let userDatabase = [];
let servicesData = [];
let userData = {
    points: 0,
    bookings: [],
    badges: {
        pemula: false,
        setia: false,
        master: false
    },
    isLoggedIn: false,
    userName: '',
    userEmail: '',
    userId: null
};
let undoBuffer = null; 
function loadUserDatabase() {
    const saved = localStorage.getItem('bengkelUserDatabase');
    if (saved) {
        try {
            userDatabase = JSON.parse(saved);
        } catch (e) {
            console.error('Error parsing userDatabase:', e);
            userDatabase = [];
        }
    }
}
function saveUserDatabase() {
    localStorage.setItem('bengkelUserDatabase', JSON.stringify(userDatabase));
}
function openLoginPopup() {
    document.getElementById('loginModal').classList.add('show');
}
function closeLoginPopup() {
    document.getElementById('loginModal').classList.remove('show');
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
}
function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(t => t.classList.remove('active'));
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(f => f.classList.remove('active'));
    if (tab === 'login') {
        document.getElementById('loginForm').classList.add('active');
        tabs[0].classList.add('active');
    } else if (tab === 'signup') {
        document.getElementById('signupForm').classList.add('active');
        tabs[1].classList.add('active');
    }
}
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}
function handleBookingClick() {
    if (userData.isLoggedIn) {
        scrollToSection('booking');
    } else {
        openLoginPopup();
    }
}
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!username || !password) {
        alert('❌ Username dan password harus diisi');
        return;
    }
    fetch('/Ulangan/api/auth/login.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            userData.isLoggedIn = true;
            userData.userName = data.data.username;
            userData.userEmail = data.data.email;
            userData.userId = data.data.user_id;
            userData.points = data.data.points || 0;
            saveData();
            updateLoginUI();
            closeLoginPopup();
            alert(`✅ Login berhasil!\n\nSelamat datang, ${data.data.username}!`);
            setTimeout(() => scrollToSection('booking'), 300);
            loadRewardsFromServer();
            startBookingPolling();
        } else {
            alert(`❌ ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        alert('❌ Error saat login. Cek koneksi Anda.');
    })
    .finally(() => {
        document.getElementById('loginForm').reset();
    });
}
function handleSignUp(event) {
    event.preventDefault();
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value.trim();
    if (!username || !email || !password || !passwordConfirm) {
        alert('❌ Username, email, dan password harus diisi');
        return;
    }
    if (password.length < 6) {
        alert('❌ Password minimal 6 karakter');
        return;
    }
    if (password !== passwordConfirm) {
        alert('❌ Password dan konfirmasi password tidak cocok');
        return;
    }
    fetch('/Ulangan/api/auth/signup.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, phone, password, passwordConfirm })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`✅ Registrasi berhasil!\n\nUsername: ${username}\nSekarang silakan login.`);
            document.getElementById('signupForm').reset();
            switchAuthTab('login');
        } else {
            alert(`❌ ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Signup error:', error);
        alert('❌ Error saat registrasi. Cek koneksi Anda.');
    });
}
function logout() {
    fetch('/Ulangan/api/auth/logout.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .catch(error => console.error('Logout error:', error))
    .finally(() => {
        stopBookingPolling();
        userData = {
            points: 0,
            bookings: [],
            badges: { pemula: false, setia: false, master: false },
            isLoggedIn: false,
            userName: '',
            userEmail: '',
            userId: null
        };
        localStorage.removeItem('bengkelData');
        updateLoginUI();
        updateDisplay();
        alert('✅ Anda telah logout');
    });
}
let bookingPollIntervalId = null;
function startBookingPolling(intervalMs = 3000) {
    if (bookingPollIntervalId) return;
    fetchBookingsFromServer();
    bookingPollIntervalId = setInterval(fetchBookingsFromServer, intervalMs);
}
function stopBookingPolling() {
    if (bookingPollIntervalId) {
        clearInterval(bookingPollIntervalId);
        bookingPollIntervalId = null;
    }
}
function fetchBookingsFromServer() {
    fetch('/Ulangan/api/bookings/get.php', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(resp => resp.json())
    .then(data => {
        if (!data.success) {
            console.warn('fetchBookingsFromServer:', data.message);
            return;
        }
        const serverBookings = Array.isArray(data.data.bookings) ? data.data.bookings : [];
        userData.bookings = serverBookings.map(b => ({
            id: b.id,
            name: b.customer_name,
            phone: b.customer_phone,
            service: b.service_name,
            serviceKey: b.service_type,
            date: b.booking_date,
            points: parseInt(b.points_earned) || 0,
            status: b.status,
            createdAt: b.created_at
        }));
        saveData();
        updateDisplay();
    })
    .catch(err => console.error('fetchBookingsFromServer error:', err));
}
function updateLoginUI() {
    const userProfileArea = document.getElementById('userProfileArea');
    const guestArea = document.getElementById('guestArea');
    const userNameEl = document.getElementById('userName');
    if (userData.isLoggedIn) {
        userProfileArea.style.display = 'block';
        guestArea.style.display = 'none';
        userNameEl.textContent = userData.userName;
    } else {
        userProfileArea.style.display = 'none';
        guestArea.style.display = 'flex';
    }
}
function loadData() {
    loadUserDatabase();
    const saved = localStorage.getItem('bengkelData');
    if (saved) {
        try {
            userData = JSON.parse(saved);
        } catch (e) {
            console.error('Error parsing saved bengkelData:', e);
            userData = {
                points: 0,
                bookings: [],
                badges: { pemula: false, setia: false, master: false },
                isLoggedIn: false,
                userName: '',
                userEmail: '',
                userId: null
            };
        }
        fetch('/Ulangan/api/bookings/get.php', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(resp => resp.json())
        .then(data => {
            if (data && data.success) {
                const serverBookings = Array.isArray(data.data.bookings) ? data.data.bookings : [];
                userData.bookings = serverBookings.map(b => ({
                    id: b.id,
                    name: b.customer_name,
                    phone: b.customer_phone,
                    service: b.service_name,
                    serviceKey: b.service_type,
                    date: b.booking_date,
                    points: parseInt(b.points_earned) || 0,
                    status: b.status,
                    createdAt: b.created_at
                }));
                userData.isLoggedIn = true;
                saveData();
                updateDisplay();
                updateLoginUI();
                startBookingPolling();
            } else {
                userData.isLoggedIn = false;
                userData.userName = '';
                userData.userEmail = '';
                userData.userId = null;
                userData.bookings = [];
                userData.points = 0;
                saveData();
                updateDisplay();
                updateLoginUI();
            }
        })
        .catch(err => {
            console.error('loadData: session check error', err);
            userData.isLoggedIn = false;
            userData.userName = '';
            userData.userEmail = '';
            userData.userId = null;
            userData.bookings = [];
            userData.points = 0;
            updateDisplay();
            updateLoginUI();
        });
        console.log('loadData: restored data from localStorage. bookings=', (userData.bookings && userData.bookings.length) || 0);
    }
}
function saveData() {
    localStorage.setItem('bengkelData', JSON.stringify(userData));
}
function updateDisplay() {
    const totalPointsEl = document.getElementById('totalPoints');
    const totalPointsDisplayEl = document.getElementById('totalPointsDisplay');
    const totalBookingsEl = document.getElementById('totalBookings');
    if (totalPointsEl) totalPointsEl.textContent = userData.points;
    if (totalPointsDisplayEl) totalPointsDisplayEl.textContent = userData.points;
    if (totalBookingsEl) totalBookingsEl.textContent = userData.bookings.length;
    displayBookings();
}
function normalizeStatus(raw) {
    if (!raw) return 'pending';
    const s = String(raw).toLowerCase();
    if (s === 'confirm' || s === 'confirmed' || s === 'accepted') return 'confirm';
    if (s === 'reject' || s === 'rejected' || s === 'cancelled') return 'rejected';
    if (s === 'completed' || s === 'done') return 'done';
    return 'pending';
}
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}
function loadServices() {
    fetch('/Ulangan/api/services/get.php', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(resp => resp.json())
    .then(data => {
        if (!data.success) {
            console.warn('loadServices:', data.message);
            servicesData = [];
        } else {
            servicesData = data.data.services || [];
            console.log('✅ Services loaded:', servicesData.length);
        }
        populateServiceSelects();
    })
    .catch(err => {
        console.error('loadServices error:', err);
        servicesData = [];
        populateServiceSelects();
    });
}
function populateServiceSelects() {
    const selects = ['serviceSelect', 'editServiceSelect'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        const defaultOption = select.options[0];
        select.innerHTML = '';
        select.appendChild(defaultOption);
        if (servicesData && servicesData.length > 0) {
            servicesData.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.text = `${service.service_name} - Rp ${service.price.toLocaleString('id-ID')} (+${service.points_earned} Poin)`;
                option.dataset.price = service.price;
                option.dataset.points = service.points_earned;
                option.dataset.description = service.description;
                select.appendChild(option);
            });
        }
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.text = 'Ketik Sendiri...';
        select.appendChild(customOption);
        console.log(`✅ ${selectId} populated with ${servicesData.length} services + custom option`);
    });
}
document.addEventListener('change', function(e) {
    if (e.target.id === 'serviceSelect') {
        const value = e.target.value;
        if (!value) {
            document.getElementById('serviceInfo').style.display = 'none';
            document.getElementById('customServiceFields').style.display = 'none';
        } else if (value === 'custom') {
            document.getElementById('serviceInfo').style.display = 'none';
            document.getElementById('customServiceFields').style.display = 'block';
        } else {
            const selectedIndex = e.target.selectedIndex;
            const option = e.target.options[selectedIndex];
            document.getElementById('servicePrice').textContent = option.dataset.price.toLocaleString('id-ID');
            document.getElementById('servicePoints').textContent = option.dataset.points;
            document.getElementById('serviceInfo').style.display = 'block';
            document.getElementById('customServiceFields').style.display = 'none';
        }
    }
    if (e.target.id === 'editServiceSelect') {
        const value = e.target.value;
        if (!value) {
            document.getElementById('editServiceInfo').style.display = 'none';
            document.getElementById('editCustomServiceFields').style.display = 'none';
        } else if (value === 'custom') {
            document.getElementById('editServiceInfo').style.display = 'none';
            document.getElementById('editCustomServiceFields').style.display = 'block';
        } else {
            const selectedIndex = e.target.selectedIndex;
            const option = e.target.options[selectedIndex];
            document.getElementById('editServicePoints').textContent = option.dataset.points;
            document.getElementById('editServiceInfo').style.display = 'block';
            document.getElementById('editCustomServiceFields').style.display = 'none';
        }
    }
});
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        const target = this.getAttribute('href').substring(1);
        scrollToSection(target);
    });
});
document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    console.log('Booking form submitted. isLoggedIn:', userData.isLoggedIn);
    if (!userData.isLoggedIn) {
        console.log('User not logged in. Showing login popup.');
        alert('❌ Silakan login terlebih dahulu!');
        openLoginPopup();
        return;
    }
    const serviceId = document.getElementById('serviceSelect').value;
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const date = document.getElementById('serviceDate').value;
    if (!serviceId || !name || !phone || !date) {
        alert('❌ Semua field booking harus diisi');
        return;
    }
    const payload = {
        serviceId: (serviceId === 'custom' ? 0 : parseInt(serviceId)),
        customerName: name,
        customerPhone: phone,
        serviceDate: date
    };
    if (serviceId === 'custom') {
        const customName = document.getElementById('customServiceName').value.trim();
        if (!customName) {
            alert('❌ Silakan masukkan nama layanan kustom.');
            return;
        }
        payload.customServiceName = customName;
    }
    fetch('/Ulangan/api/bookings/create.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(resp => resp.json())
    .then(data => {
        if (!data.success) {
            alert('❌ Gagal membuat booking: ' + (data.message || 'Unknown error'));
            return;
        }
        const booking = {
            id: data.data.booking_id,
            name,
            phone,
            service: data.data.service_name || '',
            date: data.data.booking_date || date,
            points: data.data.points_earned || 0,
            status: normalizeStatus(data.data.status),
            createdAt: new Date().toISOString()
        };
        if (!Array.isArray(userData.bookings)) userData.bookings = [];
        userData.bookings.push(booking);
        userData.points = data.data.total_points || (userData.points + booking.points);
        saveData();
        updateDisplay();
        openBookingModal();
        alert('✅ Booking berhasil dibuat! +' + booking.points + ' Poin');
        this.reset();
        document.getElementById('serviceInfo').style.display = 'none';
    })
    .catch(err => {
        console.error('Create booking error:', err);
        alert('❌ Error saat membuat booking. Periksa koneksi Anda dan coba lagi.');
    });
});
function openBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.add('show');
}
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.remove('show');
}
function displayBookings() {
    const container = document.getElementById('bookingsList');
    if (!container) {
        console.log('displayBookings: #bookingsList tidak ditemukan di DOM');
        return; 
    }
    console.log('displayBookings: mengecek bookings, jumlah=', (userData.bookings && userData.bookings.length) || 0);
    if (userData.bookings.length === 0) {
        container.innerHTML = '<p class="empty-state">Belum ada booking</p>';
        return;
    }
        const statusMap = {
            pending: { cls: 'pending', label: '⏳ Menunggu' },
            confirm: { cls: 'confirm', label: '✅ Dikonfirmasi' },
            done: { cls: 'done', label: '🏁 Selesai' },
            rejected: { cls: 'rejected', label: '❌ Ditolak' }
        };
        container.innerHTML = '<div class="bookings-grid">' + userData.bookings.map(booking => {
            const sKey = normalizeStatus(booking.status);
            const s = statusMap[sKey] || statusMap.pending;
            const canEdit = (sKey === 'pending');
            const canCancel = (sKey === 'pending');
            return `
            <article class="booking-card ${s.cls}" aria-labelledby="booking-${booking.id}-title">
                <div class="booking-card-header">
                    <h4 id="booking-${booking.id}-title" class="booking-customer-name">Booking tanggal: ${booking.date}</h4>
                    <span class="booking-status-badge ${s.cls}">${s.label}</span>
                </div>
                <div class="booking-card-content">
                    <div><strong>Layanan:</strong> ${booking.service || '-'}</div>
                    <div><strong>Nama:</strong> ${booking.name || '-'}</div>
                    <div><strong>HP:</strong> ${booking.phone || '-'}</div>
                    <div><strong>Poin:</strong> <span style="color: #456882; font-weight: bold;">+${booking.points} 🎁</span></div>
                </div>
                <footer class="booking-card-footer">
                    <div class="booking-actions">
                        ${canEdit ? `<button type="button" class="btn-secondary" onclick="openEditModal(${booking.id})">Ubah</button>` : ''}
                        ${canCancel ? `<button type="button" class="btn-secondary" onclick="cancelBooking(${booking.id})">Batalkan</button>` : ''}
                    </div>
                </footer>
            </article>
            `;
        }).reverse().join('') + '</div>';
}
            function cancelBooking(id) {
                const index = userData.bookings.findIndex(b => b.id === id);
                    if (index === -1) return;
                    fetch('/Ulangan/api/bookings/cancel.php', {
                        method: 'DELETE',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bookingId: id })
                    })
                    .then(resp => resp.json())
                    .then(data => {
                        if (!data.success) {
                            alert('❌ Gagal membatalkan booking: ' + (data.message || 'Unknown'));
                            return;
                        }
                        const [removed] = userData.bookings.splice(index, 1);
                        userData.points = data.data.total_points || Math.max(0, (userData.points - (removed.points || 0)));
                        saveData();
                        updateDisplay();
                        if (undoBuffer && undoBuffer.timeoutId) {
                            clearTimeout(undoBuffer.timeoutId);
                        }
                        const timeoutId = setTimeout(() => {
                            undoBuffer = null;
                            const ub = document.getElementById('undoBanner');
                            if (ub) ub.style.display = 'none';
                        }, 7000);
                        undoBuffer = { booking: removed, timeoutId };
                        const banner = document.getElementById('undoBanner');
                        if (banner) banner.style.display = 'block';
                        alert('✅ Booking dibatalkan. Poin telah diperbarui.');
                    })
                    .catch(err => {
                        console.error('cancelBooking error:', err);
                        alert('❌ Error saat membatalkan booking. Cek koneksi Anda.');
                    });
            }
            function undoCancel() {
                if (!undoBuffer || !undoBuffer.booking) return;
                userData.bookings.push(undoBuffer.booking);
                saveData();
                updateDisplay();
                clearTimeout(undoBuffer.timeoutId);
                undoBuffer = null;
                const banner = document.getElementById('undoBanner');
                if (banner) banner.style.display = 'none';
                alert('Pembatalan dibatalkan. Booking dikembalikan.');
            }
function loadRewardsFromServer() {
    fetch('/Ulangan/api/rewards/get.php', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(resp => resp.json())
    .then(data => {
        if (data && data.success) {
            const rewards = data.data.rewards || [];
            displayRewards(rewards);
        } else {
            console.warn('Failed to load rewards:', data?.message);
        }
    })
    .catch(err => console.error('loadRewardsFromServer error:', err));
}
function displayRewards(rewards) {
    const container = document.querySelector('.rewards-grid');
    if (!container) return;
    if (rewards.length === 0) {
        container.innerHTML = '<p class="empty-state">Tidak ada reward tersedia</p>';
        return;
    }
    container.innerHTML = rewards.map(reward => {
        const thumb = reward.reward_image || 'images/reward-default.jpg';
        return `
        <div class="reward-card">
            <div class="reward-icon reward-icon-image">
                <img src="${thumb}" alt="${reward.reward_name}" class="reward-img" onerror="this.src='images/reward-default.jpg'">
            </div>
            <h4>${reward.reward_name}</h4>
            <p style="font-size: 0.85rem; color: #666; margin: 0.5rem 0;">${reward.description || ''}</p>
            <div class="reward-points">${reward.points_required} Poin</div>
            <button class="btn-reward" onclick="redeemReward(${reward.points_required}, '${reward.reward_name}')">Tukar</button>
        </div>
        `;
    }).join('');
}
function redeemReward(pointsCost, rewardName) {
    console.log('==== REDEEM START ====');
    console.log('pointsCost:', pointsCost);
    console.log('rewardName:', rewardName);
    console.log('userData.isLoggedIn:', userData.isLoggedIn);
    console.log('userData.points:', userData.points);
    if (!userData.isLoggedIn) {
        alert('❌ Silakan login terlebih dahulu!');
        openLoginPopup();
        return;
    }
    if (userData.points < pointsCost) {
        alert(`❌ Poin tidak cukup!\n\nAnda membutuhkan ${pointsCost} poin.\nPoin Anda saat ini: ${userData.points}`);
        return;
    }
    if (!confirm(`Tukar ${pointsCost} poin dengan ${rewardName}?`)) return;
    const rewardMap = {
        'Diskon 10%': 1,
        'Ganti Oli Gratis': 2,
        'Service Premium': 3
    };
    const rewardId = rewardMap[rewardName] || 1;
    console.log('rewardId:', rewardId);
    console.log('Mengirim fetch ke /Ulangan/api/rewards/redeem.php');
    fetch('/Ulangan/api/rewards/redeem.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId })
    })
    .then(resp => {
        console.log('Response status:', resp.status);
        return resp.json();
    })
    .then(data => {
        console.log('==== API RESPONSE ====');
        console.log('Full response:', data);
        console.log('data.success:', data.success);
        console.log('data.data:', data.data);
        console.log('data.data?.redemption_code:', data.data?.redemption_code);
        if (!data.success) {
            console.error('❌ Success is false');
            alert(`❌ ${data.message || 'Gagal menukar reward'}`);
            return;
        }
        if (!data.data) {
            console.error('❌ data.data is undefined');
            alert('❌ Error: Response format tidak valid');
            return;
        }
        userData.points = data.data.remaining_points;
        saveData();
        updateDisplay();
        alert(`✅ ${rewardName} berhasil ditukarkan!\n\nPoin Anda: ${data.data.remaining_points} 🎁`);
    })
    .catch(err => {
        console.error('❌ Fetch error:', err);
        alert('❌ Error saat menukar reward. Periksa koneksi Anda.');
    });
}
function openEditModal(id) {
    const booking = userData.bookings.find(b => b.id === id);
    if (!booking) return;
    document.getElementById('editBookingId').value = booking.id;
    document.getElementById('editCustomerName').value = booking.name;
    document.getElementById('editCustomerPhone').value = booking.phone;
    document.getElementById('editServiceDate').value = booking.date;
    const serviceSelect = document.getElementById('editServiceSelect');
    if (booking.serviceKey) {
        const service = servicesData.find(s => s.service_key === booking.serviceKey);
        if (service) {
            serviceSelect.value = service.id;
            document.getElementById('editServiceInfo').style.display = 'block';
            document.getElementById('editServicePoints').textContent = service.points_earned;
        }
    } else {
        serviceSelect.value = 'custom';
        document.getElementById('editCustomServiceFields').style.display = 'block';
        document.getElementById('editCustomServiceName').value = booking.service || '';
        document.getElementById('editCustomServicePoints').value = booking.points || 0;
    }
    document.getElementById('editModal').classList.add('show');
}
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.classList.remove('show');
}
function handleEditSubmit(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editBookingId').value, 10);
    const serviceId = document.getElementById('editServiceSelect').value;
    const name = document.getElementById('editCustomerName').value.trim();
    const phone = document.getElementById('editCustomerPhone').value.trim();
    const date = document.getElementById('editServiceDate').value;
    if (!serviceId || !name || !phone || !date) {
        alert('❌ Semua field harus diisi');
        return;
    }
    const reqBody = {
        bookingId: id,
        serviceId: (serviceId === 'custom' ? 0 : parseInt(serviceId)),
        customerName: name,
        customerPhone: phone,
        serviceDate: date
    };
    if (serviceId === 'custom') {
        const customName = document.getElementById('editCustomServiceName').value.trim();
        if (!customName) {
            alert('❌ Masukkan nama layanan kustom.');
            return;
        }
        reqBody.customServiceName = customName;
    }
    fetch('/Ulangan/api/bookings/update.php', {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqBody)
    })
    .then(resp => resp.json())
    .then(data => {
        if (!data.success) {
            alert('❌ Gagal update booking: ' + (data.message || 'Unknown error'));
            return;
        }
        const booking = userData.bookings.find(b => b.id === id);
        if (booking) {
            const service = servicesData.find(s => s.id === parseInt(serviceId));
            booking.name = name;
            booking.phone = phone;
            booking.date = date;
            booking.service = data.data.service_name;
            booking.serviceKey = service?.service_key;
            booking.points = data.data.points_earned;
        }
        userData.points = userData.points + (data.data.points_change || 0);
        saveData();
        updateDisplay();
        closeEditModal();
        alert('✅ Booking berhasil diperbarui! ' + (data.data.points_change > 0 ? '+' : '') + data.data.points_change + ' Poin');
    })
    .catch(err => {
        console.error('Edit booking error:', err);
        alert('❌ Error saat update booking');
    });
}
function addDemoBookings() {
    const today = new Date().toISOString().split('T')[0];
    const demo = [
        {
            id: Date.now() + 1,
            name: 'Budi Santoso',
            phone: '081234567890',
            date: today,
            points: 10,
            status: 'pending',
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            name: 'Siti Aminah',
            phone: '082345678901',
            date: today,
            points: 20,
            status: 'done',
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 3,
            name: 'Andi Wijaya',
            phone: '083312345678',
            date: today,
            points: 0,
            status: 'rejected',
            createdAt: new Date().toISOString()
        }
    ];
    if (!Array.isArray(userData.bookings)) userData.bookings = [];
    userData.bookings = userData.bookings.concat(demo);
    saveData();
    updateDisplay();
    alert('Contoh booking berhasil ditambahkan.');
}
function addDemoUsers() {
    const demoUsers = [
        {
            id: 1701532800000,
            username: "budi",
            email: "budi@gmail.com",
            phone: "081234567890",
            password: "password123",
            createdAt: new Date().toISOString()
        },
        {
            id: 1701532801000,
            username: "siti",
            email: "siti@gmail.com",
            phone: "082345678901",
            password: "password456",
            createdAt: new Date().toISOString()
        },
        {
            id: 1701532802000,
            username: "randi",
            email: "randi@yahoo.com",
            phone: "085678901234",
            password: "testpass789",
            createdAt: new Date().toISOString()
        }
    ];
    userDatabase = demoUsers;
    saveUserDatabase();
    console.log('✅ Demo users ditambahkan:', demoUsers.length);
    alert(`✅ Demo users berhasil ditambahkan:\n\n${demoUsers.map(u => `Username: ${u.username}\nPassword: ${u.password}`).join('\n\n')}`);
}
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('serviceDate').setAttribute('min', today);
    loadData();
    updateLoginUI();
    servicesData = [];
    populateServiceSelects();
    loadServices();
    loadRewardsFromServer();
    document.getElementById('customServiceFields').style.display = 'none';
    document.getElementById('editCustomServiceFields').style.display = 'none';
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('loginModal');
        if (event.target === modal) {
            closeLoginPopup();
        }
        const bookingModal = document.getElementById('bookingModal');
        if (bookingModal && event.target === bookingModal) {
            closeBookingModal();
        }
        const userMenu = document.getElementById('userMenu');
        const userAvatar = document.getElementById('userAvatar');
        if (userMenu && userMenu.style.display !== 'none' && 
            event.target !== userAvatar && !userMenu.contains(event.target)) {
            userMenu.style.display = 'none';
        }
    });
});
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};
const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);
document.querySelectorAll('.service-card, .stat-card, .badge-card, .reward-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});
