// Helper function to get CSRF token
function getCSRFToken() {
  // Get CSRF token from cookie
  let name = 'csrftoken';
  let value = '; ' + document.cookie;
  let parts = value.split('; ' + name + '=');
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
}

// Profile fetch, render, edit
async function loadUserProfile() {
  try {
    const response = await fetch('/alerts/user/profile/', {
      headers: {
        'Accept': 'application/json',
        'X-CSRFToken': getCSRFToken()
      }
    });
    if (response.ok) {
      const profile = await response.json();
      document.getElementById('profileName').textContent = profile.name || '';
      document.getElementById('profileEmail').textContent = profile.email || '';
      document.getElementById('profileTeam').textContent = profile.team || '';
      document.getElementById('editName').value = profile.name || '';
      document.getElementById('editEmail').value = profile.email || '';
      document.getElementById('editTeam').value = profile.team || '';
    } else {
      document.getElementById('profileMsg').textContent = "Error loading profile.";
      document.getElementById('profileMsg').className = "error-msg";
    }
  } catch (error) {
    document.getElementById('profileMsg').textContent = "Error loading profile.";
    document.getElementById('profileMsg').className = "error-msg";
  }
}

document.getElementById('editProfileBtn').addEventListener('click', () => {
  document.getElementById('profileForm').style.display = 'block';
  document.getElementById('editProfileBtn').style.display = 'none';
  document.getElementById('profileMsg').textContent = '';
});

document.getElementById('cancelEditBtn').addEventListener('click', () => {
  document.getElementById('profileForm').style.display = 'none';
  document.getElementById('editProfileBtn').style.display = 'inline';
  document.getElementById('profileMsg').textContent = '';
});

document.getElementById('profileForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('editName').value,
    email: document.getElementById('editEmail').value,
    team: document.getElementById('editTeam').value
  };
  try {
    const response = await fetch('/alerts/user/profile/', {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken()
      },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      document.getElementById('profileMsg').textContent = "Profile updated!";
      document.getElementById('profileMsg').className = "success-msg";
      loadUserProfile();
    } else {
      document.getElementById('profileMsg').textContent = "Failed to update profile.";
      document.getElementById('profileMsg').className = "error-msg";
    }
  } catch (error) {
    document.getElementById('profileMsg').textContent = "Error updating profile.";
    document.getElementById('profileMsg').className = "error-msg";
  }
  document.getElementById('profileForm').style.display = 'none';
  document.getElementById('editProfileBtn').style.display = 'inline';
});

// Alerts logic with filter and refresh
async function loadAlerts() {
  const severity = document.getElementById('filterSeverity').value;
  let url = '/alerts/user/';
  if (severity) url += `?severity=${encodeURIComponent(severity)}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-CSRFToken': getCSRFToken()
      }
    });
    
    if (!response.ok) throw new Error('Error fetching alerts');

    const alerts = await response.json();
    const alertsContainer = document.getElementById('alerts');
    alertsContainer.innerHTML = '';

    if (alerts.length === 0) {
      alertsContainer.innerHTML = '<p>No alerts found.</p>';
      return;
    }

    alerts.forEach(alert => {
      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert-card p-4 rounded shadow';
      
      // Determine appropriate styling based on severity
      let backgroundColor = '';
      let textColor = '';
      let borderColor = '';
      
      switch(alert.severity) {
        case 'INFO':
          backgroundColor = '#eff6ff';
          textColor = '#1d4ed8';
          borderColor = '#dbeafe';
          break;
        case 'WARNING':
          backgroundColor = '#fffbeb';
          textColor = '#854d0e';
          borderColor = '#fef3c7';
          break;
        case 'CRITICAL':
          backgroundColor = '#fef2f2';
          textColor = '#b91c1c';
          borderColor = '#fee2e2';
          break;
        default:
          backgroundColor = '#f9fafb';
          textColor = '#374151';
          borderColor = '#e5e7eb';
      }

      alertDiv.style.backgroundColor = backgroundColor;
      alertDiv.style.border = `1px solid ${borderColor}`;
      alertDiv.style.borderRadius = '0.5rem';
      alertDiv.style.padding = '1rem';
      alertDiv.style.marginBottom = '1rem';
      alertDiv.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';

      alertDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <h3 style="font-weight: 600; color: ${textColor}; margin: 0;">${alert.title}</h3>
          <span style="background-color: ${borderColor}; color: ${textColor}; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;">
            ${alert.severity}
          </span>
        </div>
        <p style="margin: 0.5rem 0; color: #374151;">${alert.message}</p>
        <div style="font-size: 0.75rem; color: #6b7280;">
          <strong>Status:</strong> ${alert.read ? 'Read' : 'Unread'}
        </div>
        <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
          <button class="btn user-btn" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="snoozeAlert('${alert.id}')">
            ⏸️ Snooze
          </button>
          <button class="btn admin-btn" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="toggleRead('${alert.id}')">
            📖 ${alert.read ? 'Mark Unread' : 'Mark Read'}
          </button>
        </div>
      `;

      alertsContainer.appendChild(alertDiv);
    });
  } catch (error) {
    console.error('Failed to load alerts:', error);
    document.getElementById('alerts').innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;">Failed to load alerts</div>';
  }
}

function snoozeAlert(alertId) {
  fetch(`/alerts/user/${alertId}/snooze/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken(),
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.ok) {
      loadAlerts();
    } else {
      console.error('Failed to snooze alert');
      alert('Failed to snooze alert. Please try again.');
    }
  })
  .catch(error => {
    console.error('Error snoozing alert:', error);
    alert('Network error. Please try again.');
  });
}

function toggleRead(alertId) {
  fetch(`/alerts/user/${alertId}/mark_read/`, {
    method: 'PATCH',
    headers: {
      'X-CSRFToken': getCSRFToken(),
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.ok) {
      loadAlerts();
    } else {
      console.error('Failed to toggle read status');
      alert('Failed to toggle read status. Please try again.');
    }
  })
  .catch(error => {
    console.error('Error toggling read status:', error);
    alert('Network error. Please try again.');
  });
}

// Load alerts initially
document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  loadAlerts();
});

// Refresh button click
document.getElementById('refreshAlerts')?.addEventListener('click', loadAlerts);

// Change severity filter
document.getElementById('filterSeverity')?.addEventListener('change', loadAlerts);

// Add logout button event listener
document.getElementById('logoutBtn')?.addEventListener('click', function() {
  logout();
});