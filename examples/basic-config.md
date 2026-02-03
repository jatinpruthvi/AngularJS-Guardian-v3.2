# AngularJS Guardian - Basic Configuration Example

This example shows the minimal configuration needed to run AngularJS Guardian.

## Setup

1. Copy this configuration to your `.env` file:

```bash
# Basic Configuration
API_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
APP_URL=http://localhost:3000
APP_ROUTES=/,/dashboard,/users
HEADLESS=false
```

2. Install dependencies:
```bash
npm install
npx playwright install chromium
```

3. Run Guardian:
```bash
npm start
```

## What This Does

- Uses OpenAI API for code fixing
- Tests your application at http://localhost:3000
- Checks three routes: home, dashboard, and users pages
- Runs with visible browser (headless=false) so you can watch
- No login required (good for public pages or development mode)

## Expected Behavior

1. Browser opens and navigates to http://localhost:3000
2. Looks for console errors and network failures
3. If errors found, sends them to OpenAI for fix suggestions
4. Applies fixes to your code
5. Retries to verify the fix works
6. Moves to next route

## When to Use This Configuration

✅ **Good for:**
- Testing public pages
- Development environment
- Quick proof-of-concept
- Applications without authentication

❌ **Not suitable for:**
- Production applications with login
- Applications requiring authentication
- Java/Tomcat backend error tracking
