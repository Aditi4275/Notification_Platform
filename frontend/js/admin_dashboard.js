// Helper function to get CSRF token
function getCSRFToken() {
  let name = 'csrftoken';
  let value = '; ' + document.cookie;
  let parts = value.split('; ' + name + '=');
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
}

// Add logout button event listener
document.getElementById('logoutBtn')?.addEventListener('click', function() {
  logout();
});

// Handle form submission for creating new alerts
document.getElementById('createAlertForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const title = formData.get('title');
  const message = formData.get('message');
  const severity = formData.get('severity');
  const delivery_type = formData.get('delivery_type');
  const visibility = formData.get('visibility');
  const start_time = formData.get('start_time');
  const expiry_time = formData.get('expiry_time');
  const reminder_frequency = formData.get('reminder_frequency');
  const reminder_enabled = formData.get('reminder_enabled');
  
  try {
    const response = await fetch('/alerts/admin/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken()
      },
      body: JSON.stringify({
        title: title,
        message: message,
        severity: severity,
        delivery_type: delivery_type,
        visibility: visibility,
        start_time: start_time,
        expiry_time: expiry_time,
        reminder_frequency: parseInt(reminder_frequency),
        is_active: true,
        archived: false
      })
    });
    
    if (response.ok) {
      e.target.reset();
      e.target.elements['reminder_frequency'].value = 2;
      e.target.elements['reminder_enabled'].checked = true;
      await loadAlerts();
      document.getElementById('creationStatus').textContent = 'Alert created successfully!';
      setTimeout(() => {
        document.getElementById('creationStatus').textContent = '';
      }, 3000);
    } else if (response.status === 401 || response.status === 403) {
      window.location.href = '../index.html';
    } else {
      const errorData = await response.json();
      console.error('Error creating alert:', errorData);
      document.getElementById('creationStatus').textContent = 'Failed to create alert. Please check the form data.';
    }
  } catch (error) {
    console.error('Error creating alert:', error);
    document.getElementById('creationStatus').textContent = 'Network error. Please try again.';
  }
});

let allAlerts = [];

document.getElementById('filterSeverity')?.addEventListener('change', filterAlerts);
document.getElementById('filterStatus')?.addEventListener('change', filterAlerts);
document.getElementById('filterAudience')?.addEventListener('change', filterAlerts);
document.getElementById('applyFilters')?.addEventListener('click', filterAlerts);

async function loadAlerts() {
  try {
    const res = await fetch('/alerts/admin/', {
      headers: {
        'X-CSRFToken': getCSRFToken()
      }
    });
    
    // Handle unauthorized access
    if (res.status === 401 || res.status === 403) {
      window.location.href = '../index.html';
      return;
    }
    
    if (res.ok) {
      allAlerts = await res.json();
      displayAlerts(allAlerts);
      updateStats(allAlerts);
    } else {
      document.getElementById('alertsTableBody').innerHTML = '<tr><td colspan="8" style="padding: 1.5rem; text-align: center; color: #ef4444; font-size: 0.875rem;">Failed to load alerts</td></tr>';
      updateStats([]);
    }
  } catch (error) {
    console.error('Error loading alerts:', error);
    document.getElementById('alertsTableBody').innerHTML = '<tr><td colspan="8" style="padding: 1.5rem; text-align: center; color: #ef4444; font-size: 0.875rem;">Error loading alerts</td></tr>';
    updateStats([]);
  }
}

function filterAlerts() {
  const severityFilter = document.getElementById('filterSeverity')?.value;
  const statusFilter = document.getElementById('filterStatus')?.value;
  const audienceFilter = document.getElementById('filterAudience')?.value;
  
  let filteredAlerts = [...allAlerts];
  
  if (severityFilter) {
    filteredAlerts = filteredAlerts.filter(alert => alert.severity === severityFilter);
  }
  
  // Apply status filter
  if (statusFilter) {
    if (statusFilter === 'active') {
      filteredAlerts = filteredAlerts.filter(alert => alert.is_active && new Date(alert.expiry_time) > new Date());
    } else if (statusFilter === 'expired') {
      filteredAlerts = filteredAlerts.filter(alert => new Date(alert.expiry_time) < new Date());
    }
  }
  
  // Apply audience filter
  if (audienceFilter) {
    filteredAlerts = filteredAlerts.filter(alert => alert.visibility === audienceFilter);
  }
  
  displayAlerts(filteredAlerts);
  updateStats(filteredAlerts);
}

// Display alerts in the table
function displayAlerts(alerts) {
  const tableBody = document.getElementById('alertsTableBody');
  
  if (alerts.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" style="padding: 1.5rem; text-align: center; color: #6b7280; font-size: 0.875rem;">No alerts available</td></tr>';
    return;
  }
  
  let tableHTML = '';
  alerts.forEach(alert => {
    const isExpired = new Date(alert.expiry_time) < new Date();
    const status = isExpired ? 'Expired' : (alert.is_active ? 'Active' : 'Inactive');
    
    // Determine status style based on status
    let statusStyle = '';
    if (isExpired) {
      statusStyle = 'background-color: #f3d1d1; color: #991b1b;'; // Red for expired
    } else if (alert.is_active) {
      statusStyle = 'background-color: #dcfce7; color: #166534;'; // Green for active
    } else {
      statusStyle = 'background-color: #e5e7eb; color: #374151;'; // Gray for inactive
    }
    
    // Determine severity style
    let severityStyle = getSeverityStyle(alert.severity);
    
    tableHTML += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 0.75rem; vertical-align: top;">
          <div style="font-weight: 500; color: #1f2937; margin-bottom: 0.25rem;">${alert.title}</div>
          <div style="font-size: 0.75rem; color: #6b7280; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${truncateText(alert.message, 50)}</div>
        </td>
        <td style="padding: 0.75rem; vertical-align: top;">
          <span style="padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; ${severityStyle}">
            ${alert.severity}
          </span>
        </td>
        <td style="padding: 0.75rem; vertical-align: top; font-size: 0.8rem; color: #4b5563;">
          ${alert.visibility || 'N/A'}
        </td>
        <td style="padding: 0.75rem; vertical-align: top; font-size: 0.8rem; color: #4b5563;">
          ${new Date(alert.start_time).toLocaleString()}
        </td>
        <td style="padding: 0.75rem; vertical-align: top; font-size: 0.8rem; color: #4b5563;">
          ${new Date(alert.expiry_time).toLocaleString()}
        </td>
        <td style="padding: 0.75rem; vertical-align: top;">
          <span style="padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; ${statusStyle}">
            ${status}
          </span>
        </td>
        <td style="padding: 0.75rem; vertical-align: top; font-size: 0.8rem; color: #4b5563;">
          Every ${alert.reminder_frequency}h
        </td>
        <td style="padding: 0.75rem; vertical-align: top;">
          <button onclick="archiveAlert('${alert.id}')" style="color: #dc2626; font-size: 0.8rem; background: none; border: none; cursor: pointer; margin-right: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 0.25rem; transition: background-color 0.2s;">
            Archive
          </button>
          <button onclick="editAlert('${alert.id}')" style="color: #2563eb; font-size: 0.8rem; background: none; border: none; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 0.25rem; transition: background-color 0.2s;">
            Edit
          </button>
        </td>
      </tr>
    `;
  });
  
  tableBody.innerHTML = tableHTML;
}

async function loadTeams() {
  try {
    const res = await fetch('/alerts/admin/teams/', {
      headers: {
        'X-CSRFToken': getCSRFToken()
      }
    });

    if (res.status === 404) {
      document.getElementById('teamsTableBody').innerHTML = '<tr><td colspan="2" style="padding: 1.5rem; text-align: center; color: #6b7280; font-size: 0.875rem;">Teams data not available</td></tr>';
      return;
    }

    if (res.status === 401 || res.status === 403) {
      window.location.href = '../index.html';
      return;
    }

    if (res.ok) {
      const teams = await res.json();
      const teamsTableBody = document.getElementById('teamsTableBody');
      
      if (teams.length === 0) {
        teamsTableBody.innerHTML = '<tr><td colspan="2" style="padding: 1.5rem; text-align: center; color: #6b7280; font-size: 0.875rem;">No teams available</td></tr>';
        return;
      }

      let tableHTML = '';
      teams.forEach(team => {
        tableHTML += `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 0.75rem; vertical-align: top; font-weight: 500; color: #1f2937;">${team.name}</td>
            <td style="padding: 0.75rem; vertical-align: top; color: #4b5563;">${team.members ? team.members.join(', ') : 'No members'}</td>
          </tr>
        `;
      });
      
      teamsTableBody.innerHTML = tableHTML;
    } else {
      document.getElementById('teamsTableBody').innerHTML = '<tr><td colspan="2" style="padding: 1.5rem; text-align: center; color: #ef4444; font-size: 0.875rem;">Failed to load teams</td></tr>';
    }
  } catch (error) {
    console.error('Error loading teams:', error);
    document.getElementById('teamsTableBody').innerHTML = '<tr><td colspan="2" style="padding: 1.5rem; text-align: center; color: #ef4444; font-size: 0.875rem;">Error loading teams</td></tr>';
  }
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

function getSeverityStyle(severity) {
  switch(severity) {
    case 'INFO': return 'background-color: #dbeafe; color: #1d4ed8;';
    case 'WARNING': return 'background-color: #fef9c3; color: #854d0e;';
    case 'CRITICAL': return 'background-color: #fecaca; color: #b91c1c;';
    default: return 'background-color: #e5e7eb; color: #374151;';
  }
}

function archiveAlert(alertId) {
  if (!confirm('Are you sure you want to archive this alert? This action cannot be undone.')) {
    return;
  }
  
  fetch(`/alerts/admin/${alertId}/`, {
    method: 'DELETE',
    headers: {
      'X-CSRFToken': getCSRFToken()
    }
  })
  .then(response => {
    if (response.ok) {
      loadAlerts(); 
    } else if (response.status === 401 || response.status === 403) {
      window.location.href = '../index.html';
    } else {
      console.error('Failed to archive alert');
      alert('Failed to archive alert');
    }
  })
  .catch(error => {
    console.error('Error archiving alert:', error);
    alert('Network error. Please try again.');
  });
}

// Function to edit an alert 
function editAlert(alertId) {
  alert('Edit functionality would be implemented here. Alert ID: ' + alertId);
}

// Function to update statistics with better error handling
function updateStats(alerts) {
  // Try to fetch analytics from the new endpoint
  fetch('/alerts/admin/analytics/')
  
    .then(res => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error('Analytics endpoint not available');
      }
    })
    .then(data => {
      document.getElementById('totalAlerts').textContent = data.total_alerts || 0;
      document.getElementById('alertsDelivered').textContent = data.delivered || 0;
      document.getElementById('alertsRead').textContent = data.read || 0;
      document.getElementById('alertsSnoozed').textContent = data.snoozed || 0;
    })
    .catch(error => {
      // Fallback to client-side calculation
      console.warn('Using fallback analytics calculation:', error);
      const totalAlerts = alerts.length || 0;
      const delivered = totalAlerts; // Simplified assumption
      const read = alerts.filter(a => a.read).length || 0;
      const snoozed = 0; // Hard to calculate without preferences data
      
      document.getElementById('totalAlerts').textContent = totalAlerts;
      document.getElementById('alertsDelivered').textContent = delivered;
      document.getElementById('alertsRead').textContent = read;
      document.getElementById('alertsSnoozed').textContent = snoozed;
    });

  const activeAlerts = alerts.filter(a => a.is_active && new Date(a.expiry_time) > new Date()).length || 0;
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length || 0;
  
  document.getElementById('activeAlerts').textContent = activeAlerts;
  document.getElementById('criticalAlerts').textContent = criticalAlerts;
}

// Load alerts and teams on page load
document.addEventListener('DOMContentLoaded', function() {
  loadAlerts();
  loadTeams();
});

document.getElementById('refreshAlerts')?.addEventListener('click', function() {
  loadAlerts();
});