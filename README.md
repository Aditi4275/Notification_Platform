# Alertify 🔔

A comprehensive notification platform that allows users to receive alerts and administrators to manage and create alerts with various configurations.

- 🛠️ Admins can create, update, archive alerts with title, message, severity, delivery type, reminder frequency, visibility, and scheduling.
- 👥 Users receive alerts based on organization, team, or user visibility.
- ⏰ Recurring reminders every 2 hours until snoozed or expired.
- 🔕 Users can snooze alerts for the day and mark them read/unread.
- 📊 Analytics for alert delivery, read counts, and snooze stats.
- 🔐 Role-based access control for users and admins.


## API Endpoints 📡

### Authentication

- `GET /alerts/accounts/login/` - User login
- `POST /alerts/accounts/login/` - Submit login credentials
- `POST /alerts/accounts/logout/` - User logout
- `GET /alerts/register/` - User registration form
- `POST /alerts/register/` - Submit registration

### Alerts

- `GET /alerts/admin/` - Get all alerts (Admin only)
- `POST /alerts/admin/` - Create new alert (Admin only)
- `DELETE /alerts/admin/{id}/` - Archive alert (Admin only)
- `GET /alerts/user/` - Get user-specific alerts
- `POST /alerts/user/{id}/snooze/` - Snooze specific alert
- `PATCH /alerts/user/{id}/mark_read/` - Mark alert as read/unread
- `GET /alerts/analytics/` - Get analytics summary (Admin only)

## Setup Instructions ⚙️

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aditi4275/Alertify.git
   cd Alertify
   ```

2. **Create a virtual environment:**
   ```bash
   uv venv venv
   source venv/bin/activate  
   ```

3. **Install dependencies:**
   ```bash
   uv pip install -r requirements.txt
   ```

4. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser account (optional):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

7. **Access the application:**
   - Frontend: `http://127.0.0.1:8000/`
   - Admin panel: `http://127.0.0.1:8000/admin/`



## Usage

### For Admins 🛡️

1. **Login to Admin Dashboard**
   - Navigate to the root URL
   - Click "Admin" button
   - Enter admin credentials

2. **Create New Alerts**
   - Fill in alert details (title, message, severity, timing, etc.)
   - Set visibility (Organization, Team, User)
   - Configure reminder frequency

3. **Manage Existing Alerts**
   - View all alerts in the "Manage Alerts" table
   - Archive alerts using the "Archive" button
   - Apply filters to find specific alerts

### For Users 👤

1. **Login to User Dashboard**
   - Navigate to the root URL
   - Click "User" button
   - Enter user credentials

2. **View Alerts**
   - Alerts will be displayed based on visibility settings
   - Read/unread status is tracked
   - Alerts can be snoozed temporarily

3. **Manage Alerts**
   - Mark alerts as read/unread
   - Snooze alerts to temporarily hide them


