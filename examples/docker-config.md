# AngularJS Guardian - Docker Configuration Example

Run AngularJS Guardian in a Docker container for consistent, isolated testing.

## Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
FROM node:18-alpine

# Install Playwright dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Playwright to use installed Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Run the guardian
CMD ["node", "guardian-v3.3-codex-tomcat-POC-COMPLETE.js"]
```

## Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  guardian:
    build: .
    container_name: angularjs-guardian
    environment:
      # API Configuration
      - API_PROVIDER=openai
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_MODEL=gpt-4o
      
      # Application Configuration
      - APP_URL=http://host.docker.internal:8080
      - APP_ROUTES=/dashboard,/users,/settings
      - HEADLESS=true
      
      # Login Configuration
      - LOGIN_ENABLED=true
      - LOGIN_URL=http://host.docker.internal:8080/login
      - APP_USERNAME=${APP_USERNAME}
      - APP_PASSWORD=${APP_PASSWORD}
      - LOGIN_SUCCESS_URL=http://host.docker.internal:8080/dashboard
      
      # Tomcat Configuration
      - TOMCAT_LOG_PATH=/logs/catalina.out
      - JAVA_SRC_PATH=/app/src/main/java
      
      # Behavior
      - MAX_SCREEN_ATTEMPTS=10
      - DEBUG=true
    
    volumes:
      # Mount your source code
      - ./src:/app/src
      
      # Mount Tomcat logs
      - ${TOMCAT_LOG_PATH}:/logs/catalina.out:ro
      
      # Mount git directory to apply patches
      - ./.git:/app/.git
    
    network_mode: "host"  # Use host network to access localhost services
```

## Environment File for Docker

Create `.env.docker`:

```bash
# API Keys
OPENAI_API_KEY=sk-your-api-key-here

# Application Credentials
APP_USERNAME=admin@example.com
APP_PASSWORD=SecurePassword123

# Tomcat Log Path (on host machine)
# Windows
TOMCAT_LOG_PATH=C:\\apache-tomcat\\logs\\catalina.out

# Linux/Mac
# TOMCAT_LOG_PATH=/var/lib/tomcat9/logs/catalina.out
```

## Running with Docker

### Build the image:
```bash
docker-compose build
```

### Run Guardian:
```bash
# Using docker-compose
docker-compose --env-file .env.docker up

# Or using docker directly
docker build -t angularjs-guardian .
docker run --rm \
  --network host \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/.git:/app/.git \
  -e OPENAI_API_KEY=your-key \
  -e APP_URL=http://localhost:8080 \
  angularjs-guardian
```

### Run in background:
```bash
docker-compose --env-file .env.docker up -d
```

### View logs:
```bash
docker-compose logs -f guardian
```

### Stop Guardian:
```bash
docker-compose down
```

## Kubernetes Deployment

For running Guardian in Kubernetes:

### ConfigMap (`guardian-config.yaml`):
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: guardian-config
data:
  APP_URL: "http://your-app-service:8080"
  APP_ROUTES: "/dashboard,/users,/settings"
  HEADLESS: "true"
  LOGIN_ENABLED: "true"
  MAX_SCREEN_ATTEMPTS: "10"
  DEBUG: "true"
```

### Secret (`guardian-secret.yaml`):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: guardian-secrets
type: Opaque
stringData:
  OPENAI_API_KEY: "sk-your-api-key-here"
  APP_USERNAME: "admin@example.com"
  APP_PASSWORD: "SecurePassword123"
```

### Job (`guardian-job.yaml`):
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: guardian-test-run
spec:
  template:
    spec:
      containers:
      - name: guardian
        image: your-registry/angularjs-guardian:latest
        envFrom:
        - configMapRef:
            name: guardian-config
        - secretRef:
            name: guardian-secrets
        volumeMounts:
        - name: source-code
          mountPath: /app/src
        - name: git-repo
          mountPath: /app/.git
      volumes:
      - name: source-code
        persistentVolumeClaim:
          claimName: app-source-pvc
      - name: git-repo
        persistentVolumeClaim:
          claimName: app-git-pvc
      restartPolicy: OnFailure
```

### Deploy to Kubernetes:
```bash
kubectl apply -f guardian-config.yaml
kubectl apply -f guardian-secret.yaml
kubectl apply -f guardian-job.yaml

# Monitor job
kubectl get jobs
kubectl logs -f job/guardian-test-run
```

## CI/CD Integration

### GitHub Actions Example:

```yaml
name: Guardian Auto-Fix

on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM
  workflow_dispatch:  # Manual trigger

jobs:
  auto-fix:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        npm ci
        npx playwright install chromium --with-deps
    
    - name: Run Guardian
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        APP_USERNAME: ${{ secrets.APP_USERNAME }}
        APP_PASSWORD: ${{ secrets.APP_PASSWORD }}
        APP_URL: http://localhost:8080
        HEADLESS: true
      run: npm start
    
    - name: Create Pull Request
      if: success()
      uses: peter-evans/create-pull-request@v5
      with:
        commit-message: 'fix: Auto-fixes by Guardian'
        branch: guardian-auto-fixes
        title: 'Auto-fixes by Guardian'
        body: |
          Automated fixes applied by AngularJS Guardian.
          
          Please review the changes carefully before merging.
```

## Tips for Docker Usage

1. **Use host.docker.internal**: When accessing services on your host machine from Docker
2. **Mount volumes carefully**: Ensure source code and git directories are accessible
3. **Set HEADLESS=true**: For containerized environments
4. **Use health checks**: Add container health checks for monitoring
5. **Resource limits**: Set appropriate CPU/memory limits in production

## When to Use Docker

✅ **Best for:**
- CI/CD pipelines
- Consistent testing environments
- Production automation
- Team collaboration (same environment for everyone)
- Cloud deployments

❌ **Not ideal for:**
- Local development (unless you prefer it)
- Visual debugging (can't see browser)
- Quick one-off tests
