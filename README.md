# Chemical Equipment Parameter Visualizer

A full-stack web application for visualizing and analyzing chemical equipment parameters from CSV data. The application provides interactive dashboards, data history management, PDF report generation, and secure authentication.

## Features

- 📊 **Interactive Data Visualization**: Upload CSV files and view equipment data with interactive charts
- 📈 **Real-time Analytics**: View summary statistics including averages for temperature, pressure, and flowrate
- 📋 **History Management**: Access the last 5 uploaded datasets with quick loading
- 📄 **PDF Report Generation**: Download comprehensive PDF reports with statistics and data tables
- 🔐 **Secure Authentication**: Token-based authentication system
- 🎨 **Modern UI**: Clean, responsive interface built with React

## Tech Stack

### Backend
- **Django 6.0.1**: Web framework
- **Django REST Framework**: API development
- **SQLite**: Database
- **Pandas**: Data processing
- **ReportLab**: PDF generation
- **Django CORS Headers**: Cross-origin resource sharing

### Frontend
- **React 18.3.1**: UI library
- **Chart.js / react-chartjs-2**: Data visualization
- **Axios**: HTTP client
- **React Scripts**: Build tooling

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** (Python 3.12 recommended)
- **Node.js 14+** and npm
- **Git** (optional, for cloning)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chemical_equip_parameter_visualizer
```

### 2. Backend Setup

#### Step 1: Navigate to Backend Directory

```bash
cd backend
```

#### Step 2: Create Virtual Environment (if not already created)

**Windows:**
```bash
python -m venv ..\Venv
..\Venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv ../venv
source ../venv/bin/activate
```

#### Step 3: Install Dependencies

```bash
pip install django==6.0.1
pip install djangorestframework
pip install django-cors-headers
pip install pandas
pip install reportlab
```

Or install from requirements file (if available):
```bash
pip install -r requirements.txt
```

#### Step 4: Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

#### Step 5: Create Default User

Create a default admin user for authentication:

```bash
python manage.py shell -c "from django.contrib.auth.models import User; from rest_framework.authtoken.models import Token; u, created = User.objects.get_or_create(username='admin', defaults={'email': 'admin@example.com'}); u.set_password('admin'); u.save(); token, _ = Token.objects.get_or_create(user=u); print(f'User: {u.username}, Password: admin')"
```

**Default Credentials:**
- Username: `admin`
- Password: `admin`

Alternatively, create a superuser:
```bash
python manage.py createsuperuser
```

#### Step 6: Start Backend Server

```bash
python manage.py runserver
```

The backend will run on `http://localhost:8000`

### 3. Frontend Setup

#### Step 1: Navigate to Frontend Directory

Open a new terminal window:

```bash
cd frontend-web
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Start Development Server

```bash
npm start
```

The frontend will run on `http://localhost:3000` and automatically open in your browser.

## Project Structure

```
chemical_equip_parameter_visualizer/
├── backend/
│   ├── api/
│   │   ├── models.py          # Dataset and Equipment models
│   │   ├── views.py           # API views (upload, summary, history, PDF, auth)
│   │   ├── urls.py            # API URL routing
│   │   └── serializers.py     # Data serializers
│   ├── config/
│   │   ├── settings.py        # Django settings
│   │   └── urls.py            # Main URL configuration
│   ├── manage.py
│   └── db.sqlite3             # SQLite database
├── frontend-web/
│   ├── src/
│   │   ├── App.js             # Main React component
│   │   ├── index.js           # React entry point
│   │   └── index.css          # Global styles
│   ├── public/
│   ├── package.json
│   └── package-lock.json
├── frontend-desktop/          # Desktop application (optional)
└── Venv/                      # Python virtual environment
```

## Usage

### 1. Access the Application

1. Open your browser and navigate to `http://localhost:3000`
2. You'll see the login page

### 2. Login

- Enter username: `admin`
- Enter password: `admin`
- Click "Login"

### 3. Upload CSV File

**CSV Format Requirements:**
Your CSV file must contain the following columns:
- `Equipment Name`
- `Type`
- `Flowrate`
- `Pressure`
- `Temperature`

**Example CSV:**
```csv
Equipment Name,Type,Flowrate,Pressure,Temperature
Reactor-001,Reactor,150.5,101325,85.2
Distillation-001,Distillation,200.0,95000,120.5
```

**Steps:**
1. Click "Choose File" in the sidebar
2. Select your CSV file
3. Click "Upload & Sync"
4. Wait for processing to complete

### 4. View Dashboard

After upload, you'll see:
- **Summary Statistics**: Total units, average temperature, average pressure
- **Distribution Chart**: Pie chart showing equipment distribution by type
- **Data Preview**: Table showing sample equipment data

### 5. Access History

- Scroll down in the sidebar to see "History (Last 5)"
- Click any history item to load that dataset
- View upload date and equipment count for each item

### 6. Download PDF Report

1. Ensure you have a dataset loaded (upload or select from history)
2. Click the "📄 Download PDF Report" button in the dashboard header
3. PDF will be automatically downloaded with:
   - Summary statistics
   - Equipment distribution
   - Sample data table

### 7. Logout

Click the "Logout" button in the sidebar to end your session.

## API Endpoints

### Authentication
- `POST /api/login/` - User login (returns token)
- `POST /api/logout/` - User logout (requires authentication)

### Data Management
- `POST /api/upload/` - Upload CSV file (requires authentication)
- `GET /api/summary/<dataset_id>/` - Get dataset summary (requires authentication)
- `GET /api/history/` - Get last 5 datasets (requires authentication)
- `GET /api/pdf/<dataset_id>/` - Generate PDF report (requires authentication)

### Example API Usage

**Login:**
```bash
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

**Upload File (with token):**
```bash
curl -X POST http://localhost:8000/api/upload/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -F "file=@equipment_data.csv"
```

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Windows: Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac: Find and kill process
lsof -ti:8000 | xargs kill
```

**Migration errors:**
```bash
python manage.py makemigrations
python manage.py migrate
```

**Database reset (if needed):**
```bash
# Delete database and recreate
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Frontend Issues

**Port 3000 already in use:**
- The React dev server will prompt you to use a different port
- Or manually specify: `PORT=3001 npm start`

**Module not found errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**CORS errors:**
- Ensure backend CORS settings in `backend/config/settings.py` include your frontend URL
- Verify backend server is running

### Authentication Issues

**Token expired:**
- Simply log out and log back in
- Tokens are automatically refreshed on login

**Cannot login:**
- Verify user exists: `python manage.py shell` then `User.objects.all()`
- Create new user if needed (see Installation Step 5)

## Development

### Running in Development Mode

**Backend:**
```bash
cd backend
python manage.py runserver
```

**Frontend:**
```bash
cd frontend-web
npm start
```

### Building for Production

**Frontend:**
```bash
cd frontend-web
npm run build
```

The production build will be in `frontend-web/build/`

**Backend:**
- Set `DEBUG = False` in `backend/config/settings.py`
- Update `ALLOWED_HOSTS` with your domain
- Use a production WSGI server (e.g., Gunicorn)
- Configure a production database (PostgreSQL recommended)

## CSV File Format

Your CSV file must follow this exact format:

| Column Name | Description | Example |
|------------|-------------|---------|
| Equipment Name | Name of the equipment | Reactor-001 |
| Type | Equipment type | Reactor |
| Flowrate | Flow rate value | 150.5 |
| Pressure | Pressure in Pa | 101325 |
| Temperature | Temperature in °C | 85.2 |

## Security Notes

⚠️ **Important for Production:**
- Change the default `SECRET_KEY` in `settings.py`
- Use strong passwords for all users
- Enable HTTPS in production
- Set `DEBUG = False` in production
- Configure proper `ALLOWED_HOSTS`
- Use environment variables for sensitive data
- Consider using PostgreSQL instead of SQLite for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review Django and React documentation
- Open an issue on the repository

## Acknowledgments

- Built with Django REST Framework
- UI components powered by React and Chart.js
- PDF generation using ReportLab

---

**Happy Visualizing! 📊**
