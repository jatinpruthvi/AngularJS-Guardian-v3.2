# AngularJS Guardian - Full Stack Configuration Example

This example shows a complete configuration for testing an AngularJS frontend with Java/Tomcat backend.

## Setup

1. Copy this configuration to your `.env` file:

```bash
# =============================================================================
# API Configuration
# =============================================================================
API_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o

# =============================================================================
# Application Configuration
# =============================================================================
APP_URL=http://localhost:8080
APP_ROUTES=/dashboard,/users,/settings,/reports,/profile
HEADLESS=false

# =============================================================================
# Login Configuration
# =============================================================================
LOGIN_ENABLED=true
LOGIN_URL=http://localhost:8080/login
APP_USERNAME=admin@example.com
APP_PASSWORD=SecurePassword123
LOGIN_SUCCESS_URL=http://localhost:8080/dashboard

# Custom selectors for your login form
LOGIN_USERNAME_SELECTOR=input[name="email"]
LOGIN_PASSWORD_SELECTOR=input[name="password"]
LOGIN_SUBMIT_SELECTOR=button[type="submit"]

# =============================================================================
# Java/Tomcat Configuration
# =============================================================================

# Windows example
TOMCAT_LOG_PATH=C:\\apache-tomcat-9.0.65\\logs\\catalina.out
JAVA_SRC_PATH=src\\main\\java

# Linux/Mac example (uncomment if using)
# TOMCAT_LOG_PATH=/var/lib/tomcat9/logs/catalina.out
# JAVA_SRC_PATH=src/main/java

# =============================================================================
# Advanced Configuration
# =============================================================================
MAX_SCREEN_ATTEMPTS=10
MAX_CONTROL_ATTEMPTS=3
RETRY_DELAY=2000
DEBUG=true
FAILURE_STATUS_CODES=400,401,403,404,500,502,503,504,505
```

2. Install dependencies:
```bash
npm install
npx playwright install chromium
```

3. Make sure your application is running:
```bash
# Start your Java/Tomcat application
./catalina.sh start  # Linux/Mac
catalina.bat start   # Windows
```

4. Run Guardian:
```bash
npm start
```

## What This Does

- Logs into your application with credentials
- Tests 5 different routes after login
- Monitors console errors AND network failures
- Parses Tomcat logs to find Java backend errors
- Sends complete error context to OpenAI
- Applies fixes to both JavaScript and Java files
- Retries until all pages are error-free

## Expected Behavior

1. Browser opens and goes to login page
2. Fills in credentials and submits
3. Waits for redirect to dashboard (validates login worked)
4. For each route:
   - Navigates to the page
   - Clicks all interactive elements
   - Monitors console and network
   - If error occurs:
     - Checks Tomcat logs for Java stack traces
     - Sends full context to OpenAI
     - Receives fix suggestion
     - Applies fix using git
     - Restarts browser and retries
5. Continues until all routes are clean

## Project Structure Example

```
your-project/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── example/
│       │           ├── controllers/
│       │           │   ├── UserController.java
│       │           │   └── DashboardController.java
│       │           └── services/
│       │               └── UserService.java
│       └── webapp/
│           ├── js/
│           │   ├── app.js
│           │   ├── controllers/
│           │   └── services/
│           └── views/
├── logs/  (if storing logs locally)
└── .env
```

## When to Use This Configuration

✅ **Perfect for:**
- Full-stack AngularJS + Java applications
- Production-like testing
- Applications with authentication
- Finding both frontend and backend errors
- Comprehensive autonomous testing

## Troubleshooting

### Login Fails

Check your selectors match your actual login form:
```bash
# Open browser console and test:
document.querySelector('input[name="email"]')
document.querySelector('input[name="password"]')
document.querySelector('button[type="submit"]')
```

### Tomcat Log Not Found

Verify the path:
```bash
# Windows
dir C:\apache-tomcat-9.0.65\logs\catalina.out

# Linux/Mac
ls -la /var/lib/tomcat9/logs/catalina.out
```

### Fixes Not Applying

Make sure you're in a git repository:
```bash
git status
# If not, initialize:
git init
git add .
git commit -m "Initial commit"
```

## Tips for Best Results

1. **Start with clean logs**: Clear your Tomcat logs before running
   ```bash
   # Linux/Mac
   > /var/lib/tomcat9/logs/catalina.out
   
   # Windows (PowerShell)
   Clear-Content C:\apache-tomcat-9.0.65\logs\catalina.out
   ```

2. **Use DEBUG mode**: Set `DEBUG=true` to see detailed output

3. **Test routes incrementally**: Start with 1-2 routes, then add more

4. **Monitor Tomcat console**: Watch Tomcat output in another terminal

5. **Create a backup branch**: Guardian creates patches, but having a backup is safer
   ```bash
   git checkout -b before-guardian-fixes
   git checkout main
   ```
