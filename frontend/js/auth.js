
// Handle user login
document.getElementById('loginForm')?.addEventListener('submit', async function(e){
  e.preventDefault();
  const username = e.target.username.value;
  const password = e.target.password.value;
  
  try {
    // Use fetch to send credentials to your Django backend
    const response = await fetch('/alerts/accounts/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&csrfmiddlewaretoken=${getCSRFToken()}`
    });
    
    if (response.ok) {
      window.location.href = 'user_dashboard.html';
    } else {
      document.getElementById('error-msg').innerText = 'Login failed. Check credentials.';
    }
  } catch (error) {
    document.getElementById('error-msg').innerText = 'Network error. Please try again.';
    console.error('Login error:', error);
  }
});

// Handle admin login
document.getElementById('adminLoginForm')?.addEventListener('submit', async function(e){
  e.preventDefault();
  const username = e.target.username.value;
  const password = e.target.password.value;
  
  try {
    const response = await fetch('/alerts/accounts/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&csrfmiddlewaretoken=${getCSRFToken()}`
    });
    
    if (response.ok) {
      // Check if user is admin by attempting to access admin-only endpoint
      const adminCheck = await fetch('/alerts/analytics/', {
        method: 'GET',
        headers: {
          'X-CSRFToken': getCSRFToken()
        }
      });
      
      if (adminCheck.ok) {
        window.location.href = 'admin_dashboard.html';
      } else {
        document.getElementById('admin-error-msg').innerText = 'Access denied. Admin privileges required.';
      }
    } else {
      document.getElementById('admin-error-msg').innerText = 'Login failed. Check credentials.';
    }
  } catch (error) {
    document.getElementById('admin-error-msg').innerText = 'Network error. Please try again.';
    console.error('Admin login error:', error);
  }
});

// Handle user signup
document.getElementById('signupForm')?.addEventListener('submit', async function(e){
  e.preventDefault();
  const formData = new FormData(e.target);
  const username = formData.get('username');
  const password = formData.get('password');
  const email = formData.get('email');
  
  try {
    // Django REST Framework endpoint for user creation
    const response = await fetch('/alerts/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
        email: email
      })
    });
    
    if (response.ok) {
      // Automatically log in after successful signup
      const loginResponse = await fetch('/alerts/accounts/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&csrfmiddlewaretoken=${getCSRFToken()}`
      });
      
      if (loginResponse.ok) {
        window.location.href = 'user_dashboard.html';
      } else {
        document.getElementById('error-msg').innerText = 'Signup successful, but login failed. Please try logging in.';
      }
    } else {
      const errorData = await response.json();
      let errorMessage = 'Signup failed.';
      if (errorData.username) {
        errorMessage += ' ' + errorData.username.join(', ');
      }
      if (errorData.email) {
        errorMessage += ' ' + errorData.email.join(', ');
      }
      if (errorData && typeof errorData === 'object' && errorData.error) {
        errorMessage += ' ' + errorData.error;
      }
      document.getElementById('error-msg').innerText = errorMessage;
    }
  } catch (error) {
    document.getElementById('error-msg').innerText = 'Network error. Please try again.';
    console.error('Signup error:', error);
  }
});

// Helper function to get CSRF token
function getCSRFToken() {
  let name = 'csrftoken';
  let value = '; ' + document.cookie;
  let parts = value.split('; ' + name + '=');
  if (parts.length === 2) return parts.pop().split(';').shift();
  
  let token = document.querySelector('[name=csrfmiddlewaretoken]');
  if (token) return token.value;
  
  return '';
}