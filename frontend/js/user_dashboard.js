// Add logout button event listener
document.getElementById('logoutBtn')?.addEventListener('click', function() {
  logout();
});

async function loadAlerts() {
  try {
    const res = await fetch('/alerts/user/', {
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
      const container = document.getElementById('alerts');
      
      if (alerts.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-gray-500">No alerts available</div>';
        return;
      }
      
      container.innerHTML = alerts.map(alert => `
        <div class="border p-4 rounded-lg bg-white flex flex-col ${alert.is_active ? '' : 'opacity-70'}">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold">${alert.title}</h3>
            <span class="text-xs px-2 py-1 rounded ${getSeverityClass(alert.severity)}">${alert.severity}</span>
          </div>
          <p class="my-2">${alert.message}</p>
          <div class="text-xs text-gray-500 mb-2">
            Valid from ${new Date(alert.start_time).toLocaleString()} to ${new Date(alert.expiry_time).toLocaleString()}
          </div>
          <div class="flex gap-2 mt-2">
            <button class="bg-yellow-400 px-3 py-1 rounded text-sm" onclick="snoozeAlert('${alert.id}')">Snooze</button>
            <button class="bg-blue-400 px-3 py-1 rounded text-sm" onclick="toggleRead('${alert.id}')">${isAlertRead(alert.id) ? 'Mark Unread' : 'Mark Read'}</button>
          </div>
        </div>
      `).join('');
    } else {
      document.getElementById('alerts').innerHTML = '<div class="text-center py-4 text-red-500">Failed to load alerts</div>';
    }
  } catch (error) {
    console.error('Error loading alerts:', error);
    document.getElementById('alerts').innerHTML = '<div class="text-center py-4 text-red-500">Error loading alerts</div>';
  }
}

// Helper function to get appropriate class based on severity
function getSeverityClass(severity) {
  switch(severity) {
    case 'INFO': return 'bg-blue-100 text-blue-800';
    case 'WARNING': return 'bg-yellow-100 text-yellow-800';
    case 'CRITICAL': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Function to check if an alert is read
function isAlertRead(alertId) {
  // In a real implementation, this would check the user's preferences
  // For now, we'll assume it's not read
  return false;
}

function snoozeAlert(alertId) {
  fetch(`/alerts/user/${alertId}/snooze/`, {
    method: 'POST',
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
      console.error('Failed to snooze alert');
    }
  })
  .catch(error => {
    console.error('Error snoozing alert:', error);
  });
}

function toggleRead(alertId) {
  fetch(`/alerts/user/${alertId}/mark_read/`, {
    method: 'PATCH',
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
      console.error('Failed to toggle read status');
    }
  })
  .catch(error => {
    console.error('Error toggling read status:', error);
  });
}

// Load alerts on page load
document.addEventListener('DOMContentLoaded', function() {
  loadAlerts();
});
