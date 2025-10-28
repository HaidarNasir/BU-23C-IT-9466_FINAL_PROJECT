// User Dashboard JavaScript
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

// Check if user is logged in
if (!user || !token) {
    window.location.href = '/login.html';
}

// Set user info on page load
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('userInfo').textContent = `Welcome, ${user.fullName} (${user.role.toUpperCase()})`;
    loadDashboard();
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
            loadDashboard();
            break;
        case 'complaints':
            loadComplaints();
            break;
        case 'suspects':
            loadSuspects();
            break;
        case 'detentions':
            loadDetentions();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// NEW: Close complaint function for users
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
            loadComplaints();
            loadDashboard();
        } else {
            alert('❌ Error closing complaint: ' + result.error);
        }
    } catch (error) {
        alert('❌ Error closing complaint: ' + error.message);
    }
}

// NEW: Suspect Details Functions for Users
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

// NEW: Complaint Details Functions for Users
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

// Add CSS for detail items in user dashboard
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

// Dashboard functions
async function loadDashboard() {
    try {
        // Load stats
        const statsResponse = await fetch('/api/complaints/stats');
        const stats = await statsResponse.json();

        document.getElementById('totalComplaints').textContent = stats.totalComplaints;
        document.getElementById('underInvestigation').textContent = stats.underInvestigation;
        document.getElementById('chargedCases').textContent = stats.charged;
        document.getElementById('closedCases').textContent = stats.closed;

        // Load recent activity
        const complaintsResponse = await fetch('/api/complaints');
        const complaints = await complaintsResponse.json();

        const recentActivity = complaints.slice(0, 5).map(complaint => `
            <div class="health-item">
                <span>${complaint.status === 'Closed' ? '✅' : '📋'} ${complaint.caseNumber} - ${complaint.crimeType}</span>
                <small>${new Date(complaint.dateReported).toLocaleDateString()}</small>
            </div>
        `).join('');

        document.getElementById('recentActivity').innerHTML = recentActivity;

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Complaint functions
function showComplaintForm() {
    document.getElementById('complaintForm').style.display = 'block';
}

function hideComplaintForm() {
    document.getElementById('complaintForm').style.display = 'none';
    document.getElementById('newComplaintForm').reset();
}

async function loadComplaints() {
    try {
        const response = await fetch('/api/complaints');
        const complaints = await response.json();

        const complaintsHtml = complaints.map(complaint => {
            const priorityClass = `priority-${complaint.priority.toLowerCase()}`;
            const statusClass = `status-${complaint.status.toLowerCase().replace(' ', '-')}`;

            // Add close button for non-closed complaints (for investigators and above)
            const canClose = (user.role === 'admin' || user.role === 'investigator' || user.role === 'branch_head');
            const closeButton = (complaint.status !== 'Closed' && canClose) ?
                `<button class="btn btn-warning btn-sm" onclick="closeComplaint(${complaint.id}, '${complaint.caseNumber}')">Close Case</button>` : '';

            // Add closure information if available
            const closureInfo = complaint.status === 'Closed' && complaint.closedDate ?
                `<br><small>Closed: ${new Date(complaint.closedDate).toLocaleDateString()} by ${complaint.closedByOfficerName || 'Officer'}</small>` : '';

            return `
                <tr>
                    <td>
                        <strong>${complaint.caseNumber}</strong>
                        ${closureInfo}
                    </td>
                    <td>${complaint.complainantName}</td>
                    <td>${complaint.crimeType}</td>
                    <td>${complaint.crimeLocation}</td>
                    <td><span class="${statusClass}">${complaint.status}</span> ${closeButton}</td>
                    <td><span class="${priorityClass}">${complaint.priority}</span></td>
                    <td>${new Date(complaint.dateReported).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="viewComplaintDetails(${complaint.id})">View Details</button>
                        ${complaint.status !== 'Closed' ? `<button class="btn btn-warning btn-sm" onclick="viewComplaintSuspects(${complaint.id}, '${complaint.caseNumber}')">View Suspects</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelector('#complaintsTable tbody').innerHTML = complaintsHtml;
    } catch (error) {
        console.error('Error loading complaints:', error);
    }
}

// NEW: View suspects for a specific complaint
async function viewComplaintSuspects(complaintId, caseNumber) {
    try {
        const response = await fetch(`/api/suspects/by-complaint/${complaintId}`);
        const suspects = await response.json();

        if (suspects.length === 0) {
            alert(`No suspects found for complaint ${caseNumber}`);
            return;
        }

        let suspectsList = `Suspects for ${caseNumber}:\n\n`;
        suspects.forEach(suspect => {
            suspectsList += `• ${suspect.name} (${suspect.suspectId})\n`;
        });

        alert(suspectsList);
    } catch (error) {
        console.error('Error loading complaint suspects:', error);
        alert('Error loading suspects for this complaint');
    }
}

// Set up complaint form event listener
document.addEventListener('DOMContentLoaded', function () {
    const complaintForm = document.getElementById('newComplaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const complaintData = {
                complainantName: formData.get('complainantName'),
                complainantContact: formData.get('complainantContact'),
                crimeType: formData.get('crimeType'),
                crimeLocation: formData.get('crimeLocation'),
                description: formData.get('description'),
                priority: formData.get('priority')
            };

            try {
                const response = await fetch('/api/complaints', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(complaintData)
                });

                const result = await response.json();

                if (result.success) {
                    alert('✅ Complaint created successfully!');
                    hideComplaintForm();
                    loadComplaints();
                    loadDashboard();
                } else {
                    alert('❌ Error creating complaint: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error creating complaint: ' + error.message);
            }
        });
    }
});

// Suspect functions
function showSuspectForm() {
    document.getElementById('suspectForm').style.display = 'block';
    populateComplaintSelect(); // NEW: Load complaints for dropdown
}

function hideSuspectForm() {
    document.getElementById('suspectForm').style.display = 'none';
    document.getElementById('newSuspectForm').reset();
}

// NEW: Populate complaint dropdown for suspect form
async function populateComplaintSelect() {
    try {
        const response = await fetch('/api/complaints');
        const complaints = await response.json();

        const select = document.getElementById('complaintSelect');
        select.innerHTML = '<option value="">Select Complaint (Optional)</option>';

        // Only show non-closed complaints
        const activeComplaints = complaints.filter(complaint => complaint.status !== 'Closed');

        activeComplaints.forEach(complaint => {
            const option = document.createElement('option');
            option.value = complaint.id;
            option.textContent = `${complaint.caseNumber} - ${complaint.crimeType}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading complaints for select:', error);
    }
}

async function loadSuspects() {
    try {
        const response = await fetch('/api/suspects');
        const suspects = await response.json();

        const suspectsHtml = suspects.map(suspect => {
            // NEW: Display related complaint information
            const complaintInfo = suspect.complaintCaseNumber ?
                `<strong>${suspect.complaintCaseNumber}</strong><br><small>${suspect.crimeType || 'N/A'}</small>` :
                '<span style="color: #666; font-style: italic;">Not linked</span>';

            return `
                <tr>
                    <td><strong>${suspect.suspectId}</strong></td>
                    <td>${suspect.name}</td>
                    <td>${suspect.gender}</td>
                    <td>${complaintInfo}</td>
                    <td>${suspect.crimeType || 'N/A'}</td>
                    <td>${suspect.identificationNumber || 'N/A'}</td>
                    <td>${new Date(suspect.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="viewSuspectDetails(${suspect.id})">View Details</button>
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelector('#suspectsTable tbody').innerHTML = suspectsHtml;
    } catch (error) {
        console.error('Error loading suspects:', error);
    }
}

// Set up suspect form event listener
document.addEventListener('DOMContentLoaded', function () {
    const suspectForm = document.getElementById('newSuspectForm');
    if (suspectForm) {
        suspectForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const suspectData = {
                name: formData.get('name'),
                gender: formData.get('gender'),
                dateOfBirth: formData.get('dateOfBirth') || null,
                address: formData.get('address'),
                identificationNumber: formData.get('identificationNumber'),
                complaintId: formData.get('complaintId') || null // NEW: Include complaint ID
            };

            // Validate required fields
            if (!suspectData.name || !suspectData.gender) {
                alert('❌ Please fill in all required fields (Name and Gender)');
                return;
            }

            try {
                const response = await fetch('/api/suspects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(suspectData)
                });

                const result = await response.json();

                if (result.success) {
                    alert(`✅ Suspect added successfully!\nSuspect ID: ${result.suspectId}`);
                    hideSuspectForm();
                    loadSuspects();
                    populateSuspectSelect(); // Refresh suspect select for detentions
                } else {
                    alert('❌ Error adding suspect: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error adding suspect: ' + error.message);
            }
        });
    }
});

// Detention functions
function showDetentionForm() {
    document.getElementById('detentionForm').style.display = 'block';
    populateSuspectSelect();
}

function hideDetentionForm() {
    document.getElementById('detentionForm').style.display = 'none';
    document.getElementById('newDetentionForm').reset();
}

async function populateSuspectSelect() {
    try {
        const response = await fetch('/api/suspects');
        const suspects = await response.json();

        const select = document.getElementById('suspectSelect');
        select.innerHTML = '<option value="">Select Suspect</option>';

        suspects.forEach(suspect => {
            const option = document.createElement('option');
            option.value = suspect.id;
            // NEW: Include complaint information in suspect display
            const complaintInfo = suspect.complaintCaseNumber ? ` - ${suspect.complaintCaseNumber}` : '';
            option.textContent = `${suspect.suspectId} - ${suspect.name}${complaintInfo}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading suspects for select:', error);
    }
}

async function loadDetentions() {
    try {
        const response = await fetch('/api/detentions');
        const detentions = await response.json();

        const detentionsHtml = detentions.map(detention => {
            const intakeTime = new Date(detention.intakeTime);
            const releaseTime = detention.releaseTime ? new Date(detention.releaseTime) : null;
            const duration = releaseTime ?
                Math.round((releaseTime - intakeTime) / (1000 * 60 * 60)) + ' hours' :
                'Still detained';

            const status = !releaseTime ? '<span class="status-active">ACTIVE</span>' : '<span class="status-inactive">RELEASED</span>';

            // NEW: Get suspect complaint information (this would need backend enhancement)
            const complaintInfo = detention.complaintCaseNumber ?
                `<strong>${detention.complaintCaseNumber}</strong>` :
                '<span style="color: #666; font-style: italic;">Not specified</span>';

            return `
                <tr>
                    <td>${detention.suspectName} (${detention.suspectId})</td>
                    <td>${complaintInfo}</td>
                    <td>${intakeTime.toLocaleString()}</td>
                    <td>${releaseTime ? releaseTime.toLocaleString() : 'Not released'}</td>
                    <td>${duration}</td>
                    <td>${detention.reason}</td>
                    <td>${status}</td>
                    <td>
                        ${!releaseTime ?
                    `<button class="btn btn-success btn-sm" onclick="releaseSuspect(${detention.id})">Release</button>` :
                    '<span class="status-inactive">Completed</span>'
                }
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelector('#detentionsTable tbody').innerHTML = detentionsHtml;
    } catch (error) {
        console.error('Error loading detentions:', error);
    }
}

async function releaseSuspect(detentionId) {
    if (confirm('Are you sure you want to release this suspect?')) {
        try {
            const response = await fetch(`/api/detentions/${detentionId}/release`, {
                method: 'PUT'
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ Suspect released successfully!');
                loadDetentions();
            } else {
                alert('❌ Error releasing suspect: ' + result.error);
            }
        } catch (error) {
            alert('❌ Error releasing suspect: ' + error.message);
        }
    }
}

// Set up detention form event listener
document.addEventListener('DOMContentLoaded', function () {
    const detentionForm = document.getElementById('newDetentionForm');
    if (detentionForm) {
        detentionForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const detentionData = {
                suspectId: parseInt(formData.get('suspectId')),
                intakeTime: formData.get('intakeTime'),
                reason: formData.get('reason')
            };

            try {
                const response = await fetch('/api/detentions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(detentionData)
                });

                const result = await response.json();

                if (result.success) {
                    alert('✅ Detention recorded successfully!');
                    hideDetentionForm();
                    loadDetentions();
                } else {
                    alert('❌ Error recording detention: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error recording detention: ' + error.message);
            }
        });
    }
});

// Reports functions
async function loadReports() {
    try {
        const statsResponse = await fetch('/api/complaints/stats');
        const stats = await statsResponse.json();

        document.getElementById('reportTotalComplaints').textContent = stats.totalComplaints;
        document.getElementById('reportUnderInvestigation').textContent = stats.underInvestigation;
        document.getElementById('reportChargedCases').textContent = stats.charged;
        document.getElementById('reportClosedCases').textContent = stats.closed;

    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Report generation functions
function generateDailyReport() {
    alert('📅 Daily report generated! This would create a PDF report of today\'s activities.');
}

function generateCaseReport() {
    alert('📄 Case summary report generated! This would create a detailed case analysis.');
}

function generateDetentionReport() {
    alert('⛓️ Detention report generated! This would create a report of all current detentions.');
}