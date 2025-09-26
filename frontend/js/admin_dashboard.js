// Add logout button event listener
document.getElementById('logoutBtn')?.addEventListener('click', function() {
  logout();
});

// Handle form submission for creating new alerts
document.getElementById('createAlertForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const title = document.getElementById('alertTitle').value;
  const message = document.getElementById('alertMessage').value;
  const severity = document.getElementById('alertSeverity').value;
  const startTime = document.getElementById('startTime').value;
  const expiryTime = document.getElementById('expiryTime').value;
  const visibility = document.getElementById('visibility').value;
  const reminderFreq = document.getElementById('reminderFreq').value;
  
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
        start_time: startTime,
        expiry_time: expiryTime,
        visibility: visibility,
        reminder_frequency: parseInt(reminderFreq),
        delivery_type: 'INAPP',
        is_active: true,
        archived: false
      })
    });
    
    if (response.ok) {
      // Reset form
      document.getElementById('createAlertForm').reset();
      // Reload alerts
      await loadAlerts();
      alert('Alert created successfully!');
    } else if (response.status === 401 || response.status === 403) {
      window.location.href = '../index.html';
    } else {
      const errorData = await response.json();
      console.error('Error creating alert:', errorData);
      alert('Failed to create alert. Please check the form data.');
    }
  } catch (error) {
    console.error('Error creating alert:', error);
    alert('Network error. Please try again.');
  }
});

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
      const alerts = await res.json();
      const tableBody = document.getElementById('adminAlertsTable');
      
      if (alerts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No alerts available</td></tr>';
        updateStats([], alerts);
        return;
      }
      
      // Build table rows
      let tableHTML = '';
      alerts.forEach(alert => {
        tableHTML += `
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="font-medium text-gray-900">${alert.title}</div>
              <div class="text-sm text-gray-500">${truncateText(alert.message, 50)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityClassFull(alert.severity)}">
                ${alert.severity}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              ${alert.visibility}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${alert.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                ${alert.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button class="text-red-600 hover:text-red-900 mr-3" onclick="archiveAlert('${alert.id}')">
                <i class="fas fa-archive"></i> Archive
              </button>
              <button class="text-blue-600 hover:text-blue-900" onclick="editAlert('${alert.id}')">
                <i class="fas fa-edit"></i> Edit
              </button>
            </td>
          </tr>
        `;
      });
      
      tableBody.innerHTML = tableHTML;
      updateStats(alerts);
    } else {
      document.getElementById('adminAlertsTable').innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Failed to load alerts</td></tr>';
      updateStats([], []);
    }
  } catch (error) {
    console.error('Error loading alerts:', error);
    document.getElementById('adminAlertsTable').innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Error loading alerts</td></tr>';
    updateStats([], []);
  }
}

// Helper function to truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

// Helper function to get appropriate class based on severity for full badges
function getSeverityClassFull(severity) {
  switch(severity) {
    case 'INFO': return 'bg-blue-100 text-blue-800';
    case 'WARNING': return 'bg-yellow-100 text-yellow-800';
    case 'CRITICAL': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Function to archive an alert
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

// Function to edit an alert (placeholder for future implementation)
function editAlert(alertId) {
  alert('Edit functionality would be implemented here. Alert ID: ' + alertId);
}

// Function to update statistics
function updateStats(alerts) {
  // Calculate stats
  const totalAlerts = alerts.length;
  const activeAlerts = alerts.filter(alert => alert.is_active).length;
  const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL').length;
  
  // Update sidebar stats
  document.getElementById('totalAlerts').textContent = totalAlerts;
  document.getElementById('activeAlerts').textContent = activeAlerts;
  document.getElementById('criticalAlerts').textContent = criticalAlerts;
  
  // Update top stats
  document.getElementById('stats-total').textContent = totalAlerts;
  document.getElementById('stats-active').textContent = activeAlerts;
  document.getElementById('stats-critical').textContent = criticalAlerts;
}

// Load alerts on page load
document.addEventListener('DOMContentLoaded', function() {
  loadAlerts();
});