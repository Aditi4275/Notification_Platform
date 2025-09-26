// Authentication utility functions

// Function to get CSRF token
function getCSRFToken() {
  // Get CSRF token from cookie
  let name = 'csrftoken';
  let value = '; ' + document.cookie;
  let parts = value.split('; ' + name + '=');
  if (parts.length === 2) return parts.pop().split(';').shift();
  
  // If not found in cookie, check for meta tag
  let token = document.querySelector('[name=csrfmiddlewaretoken]');
  if (token) return token.value;
  
  return '';
}

// Function to handle logout
function logout() {
  fetch('/alerts/accounts/logout/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken()
    }
  })
  .then(() => {
    window.location.href = '../index.html';
  })
  .catch(error => {
    console.error('Logout error:', error);
    // Redirect even if backend logout fails
    window.location.href = '../index.html';
  });
}

// Function to check if user is authenticated
async function isAuthenticated() {
  try {
    const response = await fetch('/alerts/user/', {
      method: 'GET',
      headers: {
        'X-CSRFToken': getCSRFToken()
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}

// Helper function to handle API responses
function handleApiResponse(response) {
  if (response.status === 401 || response.status === 403) {
    // Unauthorized - redirect to login
    window.location.href = '../index.html';
    return null;
  }
  return response;
}