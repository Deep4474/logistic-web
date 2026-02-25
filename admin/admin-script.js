// Admin Server Connection
const ADMIN_SERVER_URL = 'https://logistic-web-6fxn.onrender.com/api';
let adminUser = null;
let currentEditOrder = null;

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    checkAdminStatus();
    initializeEventListeners();
    loadDashboard();
});

// Check Admin Status
function checkAdminStatus() {
    const adminData = localStorage.getItem('adminLogin');
    if (!adminData) {
        // Admin authentication with multiple attempts
        let attempts = 3;
        let isAuthenticated = false;
        
        while (attempts > 0 && !isAuthenticated) {
            const adminPassword = prompt(`Enter Admin Password (${attempts} attempts remaining):`);
            if (adminPassword === null) {
                // User cancelled - show access denied
                showAccessDenied();
                return;
            }
            if (adminPassword === 'Olamide44#') {
                isAuthenticated = true;
                adminUser = { name: 'Admin', email: 'admin@logiflow.com' };
                localStorage.setItem('adminLogin', JSON.stringify(adminUser));
                document.getElementById('adminUsername').textContent = adminUser.name;
                hideAccessDenied();
            } else {
                attempts--;
                if (attempts > 0) {
                    alert(`Incorrect password. ${attempts} attempts remaining.`);
                } else {
                    alert('Maximum attempts exceeded.');
                    showAccessDenied();
                    return;
                }
            }
        }
    } else {
        adminUser = JSON.parse(adminData);
        document.getElementById('adminUsername').textContent = adminUser.name;
        hideAccessDenied();
    }
}

// Show Access Denied Screen
function showAccessDenied() {
    const accessDenied = document.getElementById('accessDenied');
    const adminContainer = document.getElementById('adminContainer');
    if (accessDenied) {
        accessDenied.classList.remove('hidden');
    }
    if (adminContainer) {
        adminContainer.classList.add('hidden');
    }
}

// Hide Access Denied Screen
function hideAccessDenied() {
    const accessDenied = document.getElementById('accessDenied');
    const adminContainer = document.getElementById('adminContainer');
    if (accessDenied) {
        accessDenied.classList.add('hidden');
    }
    if (adminContainer) {
        adminContainer.classList.remove('hidden');
    }
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Retry Button for Access Denied
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            localStorage.removeItem('adminLogin');
            checkAdminStatus();
        });
    }

    // Tab Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.dataset.tab;
            switchTab(tabName);
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Search/Filter Events
    document.getElementById('userSearch').addEventListener('input', filterUsers);
    document.getElementById('orderSearch').addEventListener('input', filterOrders);
    document.getElementById('statusFilter').addEventListener('change', filterOrders);
    document.getElementById('notificationSearch').addEventListener('input', filterNotifications);

    // Modal Events
    const modal = document.getElementById('editOrderModal');
    document.querySelector('.close').addEventListener('click', () => {
        removePicture(); // Clear picture when modal closes
        modal.classList.remove('active');
    });
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            removePicture(); // Clear picture when modal closes
            modal.classList.remove('active');
        }
    });

    // Edit Order Form
    document.getElementById('editOrderForm').addEventListener('submit', saveOrderChanges);
}

// Switch Tab
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Load tab data
    if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'orders') {
        loadOrders();
    } else if (tabName === 'notifications') {
        loadNotifications();
    }
}

// Load Dashboard
async function loadDashboard() {
    try {
        // Fetch all data
        const [usersRes, ordersRes, notificationsRes] = await Promise.all([
            fetch(`${ADMIN_SERVER_URL}/users`),
            fetch(`${ADMIN_SERVER_URL}/orders`),
            fetch(`${ADMIN_SERVER_URL}/all-notifications`)
        ]);

        const usersData = await usersRes.json();
        const ordersData = await ordersRes.json();
        const notificationsData = await notificationsRes.json();

        // Update Stats
        const totalUsers = usersData.users ? usersData.users.length : 0;
        const totalOrders = ordersData.orders ? ordersData.orders.length : 0;
        const deliveredOrders = ordersData.orders ? ordersData.orders.filter(o => o.status === 'Delivered').length : 0;
        
        const totalNotifications = Object.values(notificationsData.notifications || {}).reduce((sum, arr) => sum + arr.length, 0);

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalNotifications').textContent = totalNotifications;
        document.getElementById('deliveredOrders').textContent = deliveredOrders;

        // Recent Orders
        displayRecentOrders(ordersData.orders || []);

    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

// Display Recent Orders
function displayRecentOrders(orders) {
    const recentOrders = orders.slice(-5).reverse();
    const recentOrdersDiv = document.getElementById('recentOrders');

    if (recentOrders.length === 0) {
        recentOrdersDiv.innerHTML = '<p class="empty-state">No orders yet</p>';
        return;
    }

    recentOrdersDiv.innerHTML = recentOrders.map(order => `
        <div class="recent-item">
            <div class="recent-item-info">
                <div class="recent-item-id">Order #${order.id}</div>
                <div class="recent-item-meta">${order.userEmail} | ${new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
            <span class="recent-item-status status-${order.status.toLowerCase().replace(/\s+/g, '-')}">${order.status}</span>
        </div>
    `).join('');
}

// Load Users
async function loadUsers() {
    try {
        const response = await fetch(`${ADMIN_SERVER_URL}/users`);
        const data = await response.json();
        displayUsers(data.users || []);
    } catch (error) {
        console.error('Load users error:', error);
        document.getElementById('usersList').innerHTML = '<p class="empty-state">Error loading users</p>';
    }
}

// Display Users
function displayUsers(users) {
    const usersList = document.getElementById('usersList');

    if (users.length === 0) {
        usersList.innerHTML = '<p class="empty-state">No registered users yet</p>';
        return;
    }

    usersList.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Registered</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${new Date(user.registeredAt).toLocaleDateString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Filter Users
function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const rows = document.querySelectorAll('.users-table tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Load Orders
async function loadOrders() {
    try {
        const response = await fetch(`${ADMIN_SERVER_URL}/orders`);
        if (!response.ok) {
            throw new Error('Failed to load orders');
        }
        const data = await response.json();
        displayOrders(data.orders || []);
    } catch (error) {
        console.error('Load orders error:', error);
        document.getElementById('ordersList').innerHTML = '<p class="empty-state">Error loading orders. Please refresh the page.</p>';
    }
}

// Display Orders
function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');

    if (orders.length === 0) {
        ordersList.innerHTML = '<p class="empty-state">No orders yet</p>';
        return;
    }

    ordersList.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>User Email</th>
                    <th>Service</th>
                    <th>Tracking</th>
                    <th>Package</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr>
                        <td>#${order.id}</td>
                        <td>${order.userEmail}</td>
                        <td>${order.service}</td>
                        <td>${order.trackingId}</td>
                        <td>
                            ${order.pictureUrl ? `<img src="${order.pictureUrl}" alt="Package" class="package-thumbnail" onclick="viewPackageImage('${order.pictureUrl}')"/>` : '<span class="no-image">No image</span>'}
                        </td>
                        <td><span class="recent-item-status status-${order.status.toLowerCase().replace(/\s+/g, '-')}">${order.status}</span></td>
                        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>
                            <button class="btn-action btn-edit" onclick="editOrder(${order.id}, '${order.status}', '${order.description.replace(/'/g, "\\'")}', '${order.userEmail}')">Edit</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Filter Orders
function filterOrders() {
    const searchTerm = document.getElementById('orderSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('.orders-table tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const status = row.querySelector('.recent-item-status').textContent;
        
        const matchesSearch = text.includes(searchTerm);
        const matchesStatus = !statusFilter || status === statusFilter;
        
        row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
    });
}

// Edit Order
function editOrder(orderId, currentStatus, description, userEmail) {
    removePicture(); // Clear any previous picture
    currentEditOrder = orderId;
    document.getElementById('editOrderId').value = orderId;
    document.getElementById('editOrderStatus').value = currentStatus;
    document.getElementById('editOrderDescription').value = description;
    // Store user email in data attribute
    document.getElementById('editOrderForm').dataset.userEmail = userEmail;
    document.getElementById('editOrderModal').classList.add('active');
}

// Save Order Changes
async function saveOrderChanges(e) {
    e.preventDefault();

    const orderId = document.getElementById('editOrderId').value;
    const newStatus = document.getElementById('editOrderStatus').value;
    const newDescription = document.getElementById('editOrderDescription').value;
    const userEmail = document.getElementById('editOrderForm').dataset.userEmail;

    // Prepare the update data
    const updateData = {
        orderId: parseInt(orderId),
        status: newStatus,
        description: newDescription,
        userEmail: userEmail,
        sendEmail: true
    };

    // Add picture data if one was uploaded
    if (currentPackagePicture) {
        updateData.pictureUrl = currentPackagePicture.data;
        updateData.pictureName = currentPackagePicture.name;
    }

    try {
        const response = await fetch(`${ADMIN_SERVER_URL}/update-order`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Order updated successfully! Email sent to user.');
            document.getElementById('editOrderModal').classList.remove('active');
            removePicture(); // Clear the picture after successful save
            loadOrders();
        } else {
            alert(data.error || 'Failed to update order');
        }
    } catch (error) {
        console.error('Update order error:', error);
        alert('Error updating order');
    }
}

// Load Notifications
async function loadNotifications() {
    try {
        // Fetch users first to know who has notifications
        const usersRes = await fetch(`${ADMIN_SERVER_URL}/users`);
        const usersData = await usersRes.json();

        // Fetch all notifications endpoint
        const notificationsRes = await fetch(`${ADMIN_SERVER_URL}/all-notifications`);
        const notificationsData = await notificationsRes.json();

        displayNotifications(notificationsData.allNotifications || {});
    } catch (error) {
        console.error('Load notifications error:', error);
        document.getElementById('notificationsList').innerHTML = '<p class="empty-state">Error loading notifications</p>';
    }
}

// Display Notifications
function displayNotifications(notificationsObj) {
    const notificationsList = document.getElementById('notificationsList');

    const totalNotifications = Object.values(notificationsObj).reduce((sum, arr) => sum + arr.length, 0);

    if (totalNotifications === 0) {
        notificationsList.innerHTML = '<p class="empty-state">No notifications yet</p>';
        return;
    }

    let html = '<table class="table"><thead><tr><th>User Email</th><th>Title</th><th>Message</th><th>Type</th><th>Timestamp</th></tr></thead><tbody>';

    for (const [email, notifications] of Object.entries(notificationsObj)) {
        if (Array.isArray(notifications)) {
            notifications.forEach(notif => {
                html += `
                    <tr>
                        <td>${email}</td>
                        <td>${notif.title}</td>
                        <td>${notif.message}</td>
                        <td>${notif.type}</td>
                        <td>${new Date(notif.timestamp).toLocaleDateString()}</td>
                    </tr>
                `;
            });
        }
    }

    html += '</tbody></table>';
    notificationsList.innerHTML = html;
}

// Filter Notifications
function filterNotifications() {
    const searchTerm = document.getElementById('notificationSearch').value.toLowerCase();
    const rows = document.querySelectorAll('.notifications-table tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Logout
function logout() {
    localStorage.removeItem('adminLogin');
    adminUser = null;
    alert('Logged out successfully');
    showAccessDenied();
}

// View Package Image
function viewPackageImage(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'package-image-modal';
    modal.innerHTML = `
        <div class="package-image-content">
            <span class="close-package" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <img src="${imageUrl}" alt="Package Image" class="package-image-full"/>
        </div>
    `;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    const content = modal.querySelector('.package-image-content');
    content.style.cssText = `
        position: relative;
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
    `;
    
    const closeBtn = modal.querySelector('.close-package');
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
        color: #333;
    `;
    
    const img = modal.querySelector('.package-image-full');
    img.style.cssText = `
        max-width: 100%;
        max-height: 500px;
        border-radius: 4px;
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Package Picture Upload Functions
let currentPackagePicture = null;

function triggerCameraOrGallery() {
    const fileInput = document.getElementById('packagePictureInput');
    
    // On mobile, clicking the hidden file input will show camera/gallery options
    // capture="environment" uses back camera by default
    if (fileInput) {
        fileInput.click();
    }
}

// Handle file selection (both camera and gallery)
document.addEventListener('DOMContentLoaded', () => {
    const packagePictureInput = document.getElementById('packagePictureInput');
    if (packagePictureInput) {
        packagePictureInput.addEventListener('change', handlePictureUpload);
    }
});

function handlePictureUpload(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }
    
    // Read file as Data URL
    const reader = new FileReader();
    reader.onload = function(e) {
        currentPackagePicture = {
            data: e.target.result,
            name: file.name,
            type: file.type,
            size: file.size
        };
        
        // Display preview
        const previewDiv = document.getElementById('picturePreview');
        const previewImg = document.getElementById('previewImage');
        
        if (previewDiv && previewImg) {
            previewImg.src = e.target.result;
            previewDiv.classList.remove('hidden');
        }
    };
    reader.readAsDataURL(file);
}

function removePicture() {
    currentPackagePicture = null;
    
    const previewDiv = document.getElementById('picturePreview');
    const previewImg = document.getElementById('previewImage');
    const fileInput = document.getElementById('packagePictureInput');
    
    if (previewDiv) {
        previewDiv.classList.add('hidden');
    }
    
    if (previewImg) {
        previewImg.src = '';
    }
    
    if (fileInput) {
        fileInput.value = '';
    }
}

