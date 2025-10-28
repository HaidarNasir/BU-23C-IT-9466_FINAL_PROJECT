// Admin Dashboard JavaScript
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

// Check if user is admin and logged in
if (!user || !token || user.role !== 'admin') {
    alert('Access denied. Admin privileges required.');
    window.location.href = '/login.html';
}

// Store current users for branch head checking
let currentUsers = [];

// Set admin user info
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('userInfo').textContent = `Welcome, ${user.fullName} (ADMIN)`;
    loadAdminDashboard();
});

// Navigation functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Update active menu item
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');

    // Load section data
    switch (sectionId) {
        case 'dashboard':
            loadAdminDashboard();
            break;
        case 'complaints':
            loadAllComplaints();
            break;
        case 'suspects':
            loadAllSuspects();
            break;
        case 'users':
            loadAllUsers();
            break;
        case 'reports':
            loadAdminReports();
            break;
        case 'audit':
            loadAuditLogs();
            break;
    }
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// NEW: Close complaint function
async function closeComplaint(complaintId, caseNumber) {
    if (!confirm(`Are you sure you want to close complaint ${caseNumber}?`)) {
        return;
    }

    const closureReason = prompt('Enter closure reason:\n\n1. Resolved\n2. False Alarm\n3. Withdrawn\n4. Lack of Evidence\n5. Transferred\n6. Other');

    if (!closureReason) return;

    const closureNotes = prompt('Enter closure notes (optional):');

    try {
        const response = await fetch(`/api/complaints/${complaintId}/close`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                closureReason: closureReason,
                closureNotes: closureNotes || '',
                closedByOfficerId: user.id
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Complaint closed successfully!');
            loadAllComplaints();
        } else {
            alert('❌ Error closing complaint: ' + result.error);
        }
    } catch (error) {
        alert('❌ Error closing complaint: ' + error.message);
    }
}

// NEW: Check branch head availability for new user
function checkBranchHeadAvailability() {
    const role = document.getElementById('roleSelect').value;
    const station = document.getElementById('stationSelect').value;
    const warningDiv = document.getElementById('branchHeadWarning');
    const createBtn = document.getElementById('createUserBtn');

    if (role === 'branch_head' && station) {
        // Check if this branch already has a branch head
        const existingBranchHead = currentUsers.find(u => u.role === 'branch_head' && u.station === station);

        if (existingBranchHead) {
            warningDiv.style.display = 'block';
            createBtn.disabled = true;
            createBtn.innerHTML = '❌ Branch Head Exists';
        } else {
            warningDiv.style.display = 'none';
            createBtn.disabled = false;
            createBtn.innerHTML = '✅ Create User';
        }
    } else {
        warningDiv.style.display = 'none';
        createBtn.disabled = false;
        createBtn.innerHTML = '✅ Create User';
    }
}

// NEW: Check branch head availability for edit user
function checkEditBranchHeadAvailability() {
    const role = document.getElementById('editRoleSelect').value;
    const station = document.getElementById('editStationSelect').value;
    const userId = document.getElementById('editUserId').value;
    const warningDiv = document.getElementById('editBranchHeadWarning');
    const updateBtn = document.getElementById('updateUserBtn');

    if (role === 'branch_head' && station) {
        // Check if this branch already has a branch head (excluding current user)
        const existingBranchHead = currentUsers.find(u =>
            u.role === 'branch_head' &&
            u.station === station &&
            u.id !== parseInt(userId)
        );

        if (existingBranchHead) {
            warningDiv.style.display = 'block';
            updateBtn.disabled = true;
            updateBtn.innerHTML = '❌ Branch Head Exists';
        } else {
            warningDiv.style.display = 'none';
            updateBtn.disabled = false;
            updateBtn.innerHTML = '💾 Update User';
        }
    } else {
        warningDiv.style.display = 'none';
        updateBtn.disabled = false;
        updateBtn.innerHTML = '💾 Update User';
    }
}

// NEW: Refresh functions
function refreshComplaints() {
    loadAllComplaints();
    alert('🔄 Complaints data refreshed!');
}

function refreshSuspects() {
    loadAllSuspects();
    alert('🔄 Suspects data refreshed!');
}

function refreshUsers() {
    loadAllUsers();
    alert('🔄 Users data refreshed!');
}

function refreshReports() {
    loadAdminReports();
    alert('🔄 Reports data refreshed!');
}

// NEW: Suspect Details Functions
async function viewSuspectDetails(suspectId) {
    try {
        const response = await fetch(`/api/suspects/${suspectId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch suspect details');
        }
        const suspect = await response.json();

        displaySuspectDetails(suspect);
    } catch (error) {
        alert('Error loading suspect details: ' + error.message);
    }
}

function displaySuspectDetails(suspect) {
    const modal = document.getElementById('suspectDetailsModal');
    const content = document.getElementById('suspectDetailsContent');

    const suspectDetails = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
            <div style="grid-column: 1 / -1; text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0; color: #1e3c72;">${suspect.suspectId}</h4>
                <h2 style="margin: 0.5rem 0 0 0; color: #333;">${suspect.name}</h2>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="detail-item">
                <strong>Gender:</strong> ${suspect.gender}
            </div>
            <div class="detail-item">
                <strong>Date of Birth:</strong> ${suspect.dateOfBirth ? new Date(suspect.dateOfBirth).toLocaleDateString() : 'N/A'}
            </div>
            <div class="detail-item">
                <strong>Age:</strong> ${suspect.age ? suspect.age + ' years' : 'N/A'}
            </div>
            <div class="detail-item">
                <strong>ID Number:</strong> ${suspect.identificationNumber || 'N/A'}
            </div>
        </div>

        <div class="detail-item" style="margin-top: 1rem;">
            <strong>Address:</strong><br>
            ${suspect.address || 'No address provided'}
        </div>

        <div style="margin-top: 1.5rem; padding: 1rem; background: #e3f2fd; border-radius: 8px;">
            <h4 style="margin: 0 0 0.5rem 0; color: #1e3c72;">Case Information</h4>
            ${suspect.complaintCaseNumber ? `
                <div class="detail-item">
                    <strong>Related Case:</strong> ${suspect.complaintCaseNumber}
                </div>
                <div class="detail-item">
                    <strong>Crime Type:</strong> ${suspect.crimeType || 'N/A'}
                </div>
                <div class="detail-item">
                    <strong>Case Status:</strong> <span class="status-${suspect.complaintStatus ? suspect.complaintStatus.toLowerCase().replace(' ', '-') : ''}">${suspect.complaintStatus || 'N/A'}</span>
                </div>
                ${suspect.complaintDescription ? `
                <div class="detail-item">
                    <strong>Case Description:</strong><br>
                    ${suspect.complaintDescription}
                </div>
                ` : ''}
            ` : '<div class="detail-item">No case linked to this suspect</div>'}
        </div>

        <div style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
            <strong>Record Created:</strong> ${new Date(suspect.createdAt).toLocaleString()}
        </div>
    `;

    content.innerHTML = suspectDetails;
    modal.style.display = 'flex';
}

function closeSuspectDetails() {
    document.getElementById('suspectDetailsModal').style.display = 'none';
}

// NEW: Complaint Details Functions
async function viewComplaintDetails(complaintId) {
    try {
        const response = await fetch(`/api/complaints/${complaintId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch complaint details');
        }
        const complaint = await response.json();

        displayComplaintDetails(complaint);
    } catch (error) {
        alert('Error loading complaint details: ' + error.message);
    }
}

function displayComplaintDetails(complaint) {
    const modal = document.getElementById('complaintDetailsModal');
    const content = document.getElementById('complaintDetailsContent');

    const complaintDetails = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
            <div style="grid-column: 1 / -1; text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0; color: #1e3c72;">${complaint.caseNumber}</h4>
                <h2 style="margin: 0.5rem 0 0 0; color: #333;">${complaint.crimeType}</h2>
                <div style="margin-top: 0.5rem;">
                    <span style="padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; ${complaint.status === 'Closed' ? 'background: #dc3545; color: white;' : complaint.status === 'Under Investigation' ? 'background: #ffc107; color: black;' : 'background: #28a745; color: white;'}">
                        ${complaint.status}
                    </span>
                    <span style="margin-left: 10px; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; ${complaint.priority === 'High' ? 'background: #dc3545; color: white;' : complaint.priority === 'Medium' ? 'background: #ffc107; color: black;' : 'background: #28a745; color: white;'}">
                        ${complaint.priority} Priority
                    </span>
                </div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="detail-item">
                <strong>🕐 Days Open:</strong> ${complaint.daysOpen}
            </div>
            <div class="detail-item">
                <strong>📅 Date Reported:</strong> ${new Date(complaint.dateReported).toLocaleDateString()}
            </div>
        </div>

        <div class="detail-section">
            <h4 style="color: #1e3c72; margin-bottom: 0.5rem;">👤 Complainant Information</h4>
            <div class="detail-item">
                <strong>Name:</strong> ${complaint.complainantName}
            </div>
            <div class="detail-item">
                <strong>Contact:</strong> ${complaint.complainantContact || 'Not provided'}
            </div>
        </div>

        <div class="detail-section">
            <h4 style="color: #1e3c72; margin-bottom: 0.5rem;">📍 Incident Details</h4>
            <div class="detail-item">
                <strong>Crime Type:</strong> ${complaint.crimeType}
            </div>
            <div class="detail-item">
                <strong>Location:</strong> ${complaint.crimeLocation}
            </div>
            <div class="detail-item">
                <strong>Description:</strong><br>
                ${complaint.description}
            </div>
        </div>

        <div class="detail-section">
            <h4 style="color: #1e3c72; margin-bottom: 0.5rem;">👮‍♂️ Assignment Information</h4>
            <div class="detail-item">
                <strong>Assigned Officer:</strong> ${complaint.assignedOfficerName}
            </div>
            <div class="detail-item">
                <strong>Case Created By:</strong> ${complaint.createdByOfficerName}
            </div>
        </div>

        ${complaint.status === 'Closed' ? `
            <div class="detail-section" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid #28a745;">
                <h4 style="color: #1e3c72; margin-bottom: 0.5rem;">✅ Case Closure Information</h4>
                <div class="detail-item">
                    <strong>Closed Date:</strong> ${new Date(complaint.closedDate).toLocaleDateString()}
                </div>
                <div class="detail-item">
                    <strong>Closed By:</strong> ${complaint.closedByOfficerName}
                </div>
                <div class="detail-item">
                    <strong>Closure Reason:</strong> ${complaint.closureReason}
                </div>
                ${complaint.closureNotes ? `
                <div class="detail-item">
                    <strong>Closure Notes:</strong><br>
                    ${complaint.closureNotes}
                </div>
                ` : ''}
            </div>
        ` : ''}

        <div style="margin-top: 1rem; font-size: 0.8rem; color: #666; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
                <strong>Created:</strong> ${new Date(complaint.createdAt).toLocaleString()}
            </div>
            <div>
                <strong>Last Updated:</strong> ${new Date(complaint.updatedAt).toLocaleString()}
            </div>
        </div>
    `;

    content.innerHTML = complaintDetails;
    modal.style.display = 'flex';
}

function closeComplaintDetails() {
    document.getElementById('complaintDetailsModal').style.display = 'none';
}

// Add CSS for detail items
const style = document.createElement('style');
style.textContent = `
    .detail-item {
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 5px;
        margin-bottom: 0.5rem;
    }
    
    .detail-item strong {
        color: #1e3c72;
    }
    
    .detail-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        border-left: 4px solid #1e3c72;
    }
`;
document.head.appendChild(style);

// Admin Dashboard functions
async function loadAdminDashboard() {
    try {
        // Load admin stats
        const complaintsResponse = await fetch('/api/complaints/stats');
        const complaintsStats = await complaintsResponse.json();

        const suspectsResponse = await fetch('/api/suspects');
        const suspects = await suspectsResponse.json();

        // Update stats cards
        document.getElementById('totalComplaints').textContent = complaintsStats.totalComplaints;
        document.getElementById('totalSuspects').textContent = suspects.length;

        // Calculate active cases (non-closed complaints)
        const complaints = await (await fetch('/api/complaints')).json();
        const activeCases = complaints.filter(c => c.status !== 'Closed').length;
        document.getElementById('activeCases').textContent = activeCases;

        // Load user count
        const usersResponse = await fetch('/api/users');
        const users = await usersResponse.json();
        document.getElementById('totalUsers').textContent = users.length;

        // Load recent activity
        const recentActivity = complaints.slice(0, 5).map(complaint => `
            <div class="health-item">
                <span>${complaint.status === 'Closed' ? '✅' : '📋'} ${complaint.caseNumber} - ${complaint.crimeType}</span>
                <small>${new Date(complaint.dateReported).toLocaleDateString()}</small>
            </div>
        `).join('');

        document.getElementById('recentActivity').innerHTML = recentActivity;

        // Set last backup time
        document.getElementById('lastBackup').textContent = new Date().toLocaleString();

    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

// Enhanced complaint loading for admin with view details functionality
async function loadAllComplaints() {
    try {
        const response = await fetch('/api/complaints');
        const complaints = await response.json();

        const complaintsHtml = complaints.map(complaint => {
            const statusClass = `status-${complaint.status.toLowerCase().replace(' ', '-')}`;
            const priorityClass = `priority-${complaint.priority.toLowerCase()}`;

            // Add close button for non-closed complaints
            const closeButton = complaint.status !== 'Closed' ?
                `<button class="btn btn-warning btn-sm" onclick="closeComplaint(${complaint.id}, '${complaint.caseNumber}')">Close</button>` :
                '<span class="status-closed">CLOSED</span>';

            // Add closure info if closed
            const closureInfo = complaint.status === 'Closed' && complaint.closedDate ?
                `<br><small>Closed on: ${new Date(complaint.closedDate).toLocaleDateString()}<br>
                 By: ${complaint.closedByOfficerName || 'Officer'}<br>
                 Reason: ${complaint.closureReason || 'Not specified'}</small>` : '';

            return `
                <tr>
                    <td>
                        <strong>${complaint.caseNumber}</strong>
                        ${closureInfo}
                    </td>
                    <td>${complaint.complainantName}</td>
                    <td>${complaint.crimeType}</td>
                    <td>${complaint.crimeLocation}</td>
                    <td><span class="${statusClass}">${complaint.status}</span></td>
                    <td><span class="${priorityClass}">${complaint.priority}</span></td>
                    <td>${complaint.assignedOfficerName || 'Not Assigned'}</td>
                    <td>${new Date(complaint.dateReported).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="viewComplaintDetails(${complaint.id})">View Details</button>
                        <button class="btn btn-warning btn-sm">Edit</button>
                        ${closeButton}
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelector('#complaintsTable tbody').innerHTML = complaintsHtml;
    } catch (error) {
        console.error('Error loading complaints:', error);
    }
}

// Enhanced suspect loading for admin with view details
async function loadAllSuspects() {
    try {
        const response = await fetch('/api/suspects');
        const suspects = await response.json();

        const suspectsHtml = suspects.map(suspect => `
            <tr>
                <td><strong>${suspect.suspectId}</strong></td>
                <td>${suspect.name}</td>
                <td>${suspect.gender}</td>
                <td>${suspect.dateOfBirth ? new Date(suspect.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                <td>${suspect.identificationNumber || 'N/A'}</td>
                <td>${new Date(suspect.createdAt).toLocaleDateString()}</td>
                <td>
                    ${suspect.complaintCaseNumber ?
                `<span class="station-badge">${suspect.complaintCaseNumber}</span><br><small>${suspect.crimeType || ''}</small>` :
                '<span style="color: #666; font-style: italic;">No case linked</span>'
            }
                </td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="viewSuspectDetails(${suspect.id})">View Details</button>
                    <button class="btn btn-warning btn-sm">Edit</button>
                </td>
            </tr>
        `).join('');

        document.querySelector('#suspectsTable tbody').innerHTML = suspectsHtml;
    } catch (error) {
        console.error('Error loading suspects:', error);
    }
}

// REAL User Management functions (Admin Only)
function showUserForm() {
    document.getElementById('userForm').style.display = 'block';
    // Reset warnings when showing form
    document.getElementById('branchHeadWarning').style.display = 'none';
    document.getElementById('createUserBtn').disabled = false;
    document.getElementById('createUserBtn').innerHTML = '✅ Create User';
}

function hideUserForm() {
    document.getElementById('userForm').style.display = 'none';
    document.getElementById('newUserForm').reset();
}

function showEditUserForm(userId) {
    const user = currentUsers.find(u => u.id === userId);
    if (user) {
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editFullName').value = user.fullName;
        document.getElementById('editUsername').value = user.username;
        document.getElementById('editRoleSelect').value = user.role;
        document.getElementById('editStationSelect').value = user.station;

        // Reset warnings
        document.getElementById('editBranchHeadWarning').style.display = 'none';
        document.getElementById('updateUserBtn').disabled = false;
        document.getElementById('updateUserBtn').innerHTML = '💾 Update User';

        document.getElementById('editUserForm').style.display = 'block';
    }
}

function hideEditUserForm() {
    document.getElementById('editUserForm').style.display = 'none';
    document.getElementById('updateUserForm').reset();
}

async function loadAllUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        const users = await response.json();

        // Store users for branch head checking
        currentUsers = users;

        const usersHtml = users.map(user => {
            const roleClass = `role-${user.role.toLowerCase().replace('_', '-')}`;
            const isBranchHead = user.role === 'branch_head';
            const branchHeadBadge = isBranchHead ? ' <span class="role-branch-head-badge">👑 BRANCH HEAD</span>' : '';

            return `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.fullName}</td>
                    <td>
                        <span class="${roleClass}">
                            ${user.role.toUpperCase().replace('_', ' ')}
                        </span>
                        ${branchHeadBadge}
                    </td>
                    <td>
                        <span class="station-badge">
                            ${user.station}
                        </span>
                    </td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="showEditUserForm(${user.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id}, '${user.username}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelector('#usersTable tbody').innerHTML = usersHtml;

        // Update total users count
        document.getElementById('totalUsers').textContent = users.length;
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Error loading users: ' + error.message);
    }
}

// Set up user form event listener
document.addEventListener('DOMContentLoaded', function () {
    const userForm = document.getElementById('newUserForm');
    if (userForm) {
        userForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const userData = {
                username: formData.get('username'),
                password: formData.get('password'),
                fullName: formData.get('fullName'),
                role: formData.get('role'),
                station: formData.get('station')
            };

            // Validate required fields
            if (!userData.username || !userData.password || !userData.fullName || !userData.role || !userData.station) {
                alert('Please fill in all required fields');
                return;
            }

            // Validate password length
            if (userData.password.length < 6) {
                alert('Password must be at least 6 characters long');
                return;
            }

            try {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });

                const result = await response.json();

                if (result.success) {
                    alert('User created successfully!');
                    hideUserForm();
                    loadAllUsers();
                    loadAdminDashboard(); // Refresh dashboard stats
                } else {
                    alert('Error creating user: ' + result.error);
                }
            } catch (error) {
                alert('Error creating user: ' + error.message);
            }
        });
    }

    // Set up edit user form event listener
    const editUserForm = document.getElementById('updateUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const userId = document.getElementById('editUserId').value;
            const userData = {
                fullName: document.getElementById('editFullName').value,
                role: document.getElementById('editRoleSelect').value,
                station: document.getElementById('editStationSelect').value
            };

            // Validate required fields
            if (!userData.fullName || !userData.role || !userData.station) {
                alert('Please fill in all required fields');
                return;
            }

            try {
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });

                const result = await response.json();

                if (result.success) {
                    alert('User updated successfully!');
                    hideEditUserForm();
                    loadAllUsers();
                    loadAdminDashboard(); // Refresh dashboard stats
                } else {
                    alert('Error updating user: ' + result.error);
                }
            } catch (error) {
                alert('Error updating user: ' + error.message);
            }
        });
    }
});

async function deleteUser(userId, username) {
    if (confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                alert('User deleted successfully!');
                loadAllUsers();
                loadAdminDashboard(); // Refresh dashboard stats
            } else {
                alert('Error deleting user: ' + result.error);
            }
        } catch (error) {
            alert('Error deleting user: ' + error.message);
        }
    }
}

// Reports functions for admin
async function loadAdminReports() {
    try {
        const statsResponse = await fetch('/api/complaints/stats');
        const stats = await statsResponse.json();

        document.getElementById('reportTotalComplaints').textContent = stats.totalComplaints;
        document.getElementById('reportUnderInvestigation').textContent = stats.underInvestigation;
        document.getElementById('reportChargedCases').textContent = stats.charged;
        document.getElementById('reportClosedCases').textContent = stats.closed;

        // Calculate additional metrics
        const complaints = await (await fetch('/api/complaints')).json();
        const activeInvestigations = complaints.filter(c => c.status === 'Under Investigation').length;
        document.getElementById('activeInvestigations').textContent = activeInvestigations;

        // Simulate performance metrics
        document.getElementById('avgResolutionTime').textContent = '3.2 days';
        document.getElementById('clearanceRate').textContent = '78%';

    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

function generateReport() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reportType = document.getElementById('reportType').value;

    alert(`Report generated!\nPeriod: ${startDate || 'All time'} to ${endDate || 'Now'}\nType: ${reportType}`);
}

function exportReport() {
    alert('Report exported! (This would download the report as PDF/CSV)');
}

// NEW: Audit log functions
function clearAuditFilters() {
    document.getElementById('auditUserFilter').value = '';
    document.getElementById('auditActionFilter').value = '';
    document.getElementById('auditStartDate').value = '';
    document.getElementById('auditEndDate').value = '';
    loadAuditLogs();
}

function exportAuditLogs() {
    alert('Audit logs exported to CSV!');
}

// Audit logs functions
async function loadAuditLogs() {
    try {
        // Simulated audit logs - in real application, this would come from an API
        const auditLogs = [
            { timestamp: new Date(), user: 'admin', action: 'login', description: 'User logged into system', ip: '192.168.1.100' },
            { timestamp: new Date(Date.now() - 300000), user: 'officer1', action: 'create', description: 'Created new complaint CASE-20250927-001', ip: '192.168.1.101' },
            { timestamp: new Date(Date.now() - 600000), user: 'investigator1', action: 'update', description: 'Updated suspect information', ip: '192.168.1.102' },
            { timestamp: new Date(Date.now() - 900000), user: 'admin', action: 'close', description: 'Closed complaint CASE-20250927-005', ip: '192.168.1.100' },
            { timestamp: new Date(Date.now() - 1200000), user: 'constable1', action: 'create', description: 'Added new suspect record', ip: '192.168.1.103' }
        ];

        // Apply filters
        const userFilter = document.getElementById('auditUserFilter').value;
        const actionFilter = document.getElementById('auditActionFilter').value;

        let filteredLogs = auditLogs;

        if (userFilter) {
            filteredLogs = filteredLogs.filter(log => log.user === userFilter);
        }

        if (actionFilter) {
            filteredLogs = filteredLogs.filter(log => log.action === actionFilter);
        }

        const auditHtml = filteredLogs.map(log => `
            <tr>
                <td>${log.timestamp.toLocaleString()}</td>
                <td>${log.user}</td>
                <td>
                    <span class="action-${log.action}">
                        ${log.action.toUpperCase()}
                    </span>
                </td>
                <td>${log.description}</td>
                <td>${log.ip}</td>
            </tr>
        `).join('');

        document.querySelector('#auditTable tbody').innerHTML = auditHtml;
    } catch (error) {
        console.error('Error loading audit logs:', error);
    }
}

// Export functions
function exportComplaints() {
    alert('Complaints exported to CSV! (Simulation)');
}

function exportSuspects() {
    alert('Suspects exported to CSV! (Simulation)');
}

function showComplaintStats() {
    alert('Showing detailed complaint statistics... (Simulation)');
}