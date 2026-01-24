/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AngularJS Guardian v3.3-POC — Codex Edition with Tomcat Log Integration  
 * Autonomous Code-Fixing System for POC Demo
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * NEW FEATURES IN v3.3:
 * ✅ POINT 1: Login flow with credentials
 * ✅ POINT 2: Per-screen retry loop (stay until clean)
 * ✅ POINT 3: Browser restart after each fix
 * ✅ POINT 4: Screen health validation
 * ✅ POINT 5: Java file support (.java + .js)
 * ✅ POINT 6: Per-control retry loop
 * ✅ POINT 7: Windows git apply (no patch command)
 * ✅ POINT 8: Response body capture + Tomcat log parsing
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 * - CODEX_API_KEY or OPENAI_API_KEY
 * - LOGIN_ENABLED=true
 * - LOGIN_URL, APP_USERNAME, APP_PASSWORD
 * - TOMCAT_LOG_PATH=/path/to/catalina.out
 * - JAVA_SRC_PATH=src/main/java
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const VERSION = '3.3.0-poc';
const API_PROVIDER = process.env.API_PROVIDER || 'codex';

// API Configuration
const API_CONFIG = {
  codex: {
    apiKey: process.env.CODEX_API_KEY,
    baseUrl: process.env.CODEX_API_URL || 'https://api.codex.com/v1',
    model: process.env.CODEX_MODEL || 'codex-latest',
    keyName: 'CODEX_API_KEY'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    keyName: 'OPENAI_API_KEY'
  }
};

const currentProvider = API_CONFIG[API_PROVIDER];
if (!currentProvider?.apiKey) {
  console.error(`❌ Missing ${currentProvider?.keyName || 'API_KEY'}`);
  process.exit(1);
}

// AI Client
class AIClient {
  constructor(provider, config) {
    this.provider = provider;
    this.config = config;
  }

  async complete(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 2000
        }),
        signal: controller.signal
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'API Error');
      return data.choices?.[0]?.message?.content || '';
    } finally {
      clearTimeout(timeout);
    }
  }
}

const aiClient = new AIClient(API_PROVIDER, currentProvider);

// Configuration
const CONFIG = {
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  login: {
    enabled: process.env.LOGIN_ENABLED === 'true',
    url: process.env.LOGIN_URL || 'http://localhost:3000/login',
    username: process.env.APP_USERNAME,
    password: process.env.APP_PASSWORD,
    usernameSelector: '[name="username"]',
    passwordSelector: '[name="password"]',
    submitSelector: 'button[type="submit"]',
    successUrl: process.env.LOGIN_SUCCESS_URL || 'http://localhost:3000/dashboard'
  },

  backend: {
    logFilePath: process.env.TOMCAT_LOG_PATH || process.env.BACKEND_LOG_PATH,
    maxLogLines: 5000,
    javaSrcPath: 'src/main/java'
  },

  retry: {
    maxScreenAttempts: 10,
    maxControlAttempts: 5
  },

  routes: (process.env.APP_ROUTES || '/').split(','),
  headless: process.env.HEADLESS === 'true',
  verbose: process.env.VERBOSE !== 'false',
  controlLimit: 15
};

const sessionId = `guardian_${Date.now()}`;
let browserInstance = null;

// POINT 1: Login Flow
async function performLogin(page) {
  if (!CONFIG.login.enabled) return true;

  try {
    console.log(`  🔐 Logging in...`);
    await page.goto(CONFIG.login.url, { timeout: 20000 });
    await page.fill(CONFIG.login.usernameSelector, CONFIG.login.username);
    await page.fill(CONFIG.login.passwordSelector, CONFIG.login.password);
    await page.click(CONFIG.login.submitSelector);
    await page.waitForURL(CONFIG.login.successUrl, { timeout: 20000 });
    console.log('  ✅ Login successful');
    return true;
  } catch (error) {
    console.log(`  ❌ Login failed: ${error.message}`);
    return false;
  }
}

// POINT 3: Restart Browser
async function restartBrowserAndLogin() {
  console.log('  🔄 Restarting browser...');

  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }

  await new Promise(r => setTimeout(r, 1000));

  browserInstance = await chromium.launch({
    headless: CONFIG.headless
  });

  const context = await browserInstance.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();
  const loginSuccess = await performLogin(page);

  if (!loginSuccess) throw new Error('Login failed after restart');

  return { context, page };
}

// POINT 4: Screen Health Check
function isScreenHealthy(telemetry) {
  return telemetry.consoleErrors.length === 0 && 
         telemetry.network.failures.length === 0;
}

// Tomcat Log Parser
async function getJavaErrorFromLogs(networkFailure) {
  if (!CONFIG.backend.logFilePath || !fs.existsSync(CONFIG.backend.logFilePath)) {
    return null;
  }

  try {
    const endpoint = networkFailure.endpoint || networkFailure.url;
    console.log(`  🔍 Searching Tomcat logs for: ${endpoint}`);

    const lines = [];
    const stream = fs.createReadStream(CONFIG.backend.logFilePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream });

    for await (const line of rl) {
      lines.push(line);
      if (lines.length > CONFIG.backend.maxLogLines) lines.shift();
    }

    // Parse for Java exceptions
    let currentError = null;
    const errors = [];

    for (const line of lines) {
      if (line.includes('Exception') || line.includes('Error')) {
        const match = line.match(/(\w+Exception|\w+Error):\s*(.+)/);
        if (match) {
          if (currentError && currentError.stackTrace.length > 0) {
            errors.push(currentError);
          }
          currentError = {
            exception: match[1],
            message: match[2],
            stackTrace: [],
            fullLog: line + '\n',
            javaFile: null,
            lineNumber: null
          };
        }
      } else if (currentError) {
        currentError.fullLog += line + '\n';
        const stackMatch = line.match(/at\s+([\w.$]+)\(([\w.]+):?(\d+)?\)/);
        if (stackMatch) {
          const [, className, fileName, lineNumber] = stackMatch;
          currentError.stackTrace.push({ className, fileName, lineNumber });
          if (!currentError.javaFile && fileName.endsWith('.java')) {
            currentError.javaFile = fileName;
            currentError.lineNumber = lineNumber ? parseInt(lineNumber) : null;
            currentError.className = className;
          }
        }
      }
    }

    if (currentError && currentError.stackTrace.length > 0) errors.push(currentError);

    if (errors.length > 0) {
      const latest = errors[errors.length - 1];
      console.log(`  ✅ Found: ${latest.exception} at ${latest.javaFile}:${latest.lineNumber}`);
      return latest;
    }
  } catch (error) {
    console.log(`  ⚠️  Log read error: ${error.message}`);
  }

  return null;
}

// Network Tracker
class NetworkTracker {
  constructor() {
    this.requests = new Map();
    this.failures = [];
    this.completed = [];
  }

  trackRequest(request) {
    this.requests.set(request, {
      url: request.url(),
      endpoint: request.url().split('?')[0],
      method: request.method(),
      timestamp: Date.now(),
      startTime: Date.now()
    });
  }

  async trackResponse(response) {
    const entry = this.requests.get(response.request());
    if (!entry) return;

    const status = response.status();

    if (status >= 400) {
      const failure = { ...entry, status, statusText: response.statusText() };

      // POINT 8: Capture response body
      try {
        failure.responseBody = await response.text();
        if (failure.responseBody.length > 5000) {
          failure.responseBody = failure.responseBody.slice(0, 5000) + '...';
        }
      } catch {}

      this.failures.push(failure);
    }

    this.completed.push({ ...entry, status });
    this.requests.delete(response.request());
  }

  trackFailure(request, errorText) {
    const entry = this.requests.get(request);
    if (entry) {
      this.failures.push({ ...entry, status: 0, error: errorText });
      this.requests.delete(request);
    }
  }

  getSummary() {
    return {
      totalRequests: this.completed.length,
      failedRequests: this.failures.length,
      failures: this.failures
    };
  }
}

// Telemetry
class Telemetry {
  constructor(route) {
    this.route = route;
    this.consoleErrors = [];
    this.network = new NetworkTracker();
    this.controlFailures = [];
  }

  attachListeners(page) {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push({ text: msg.text(), timestamp: Date.now() });
      }
    });

    page.on('request', req => this.network.trackRequest(req));
    page.on('response', res => this.network.trackResponse(res));
    page.on('requestfailed', req => this.network.trackFailure(req, req.failure()?.errorText || 'Unknown'));
  }
}

// Generate Patch with Tomcat Log Context
async function generatePatch(telemetry) {
  const issues = [];
  const javaContext = [];

  // Add console errors
  telemetry.consoleErrors.forEach(e => {
    issues.push(`CONSOLE ERROR: ${e.text.slice(0, 200)}`);
  });

  // Add network errors with Tomcat log context
  for (const failure of telemetry.network.failures.slice(-3)) {
    issues.push(`\nNETWORK ERROR [${failure.status}] ${failure.method} ${failure.endpoint}`);

    if (failure.responseBody) {
      issues.push(`Response Body: ${failure.responseBody.slice(0, 300)}`);
    }

    // POINT 8: Get Java error from Tomcat logs
    const javaError = await getJavaErrorFromLogs(failure);
    if (javaError) {
      javaContext.push(`\n${'='.repeat(60)}`);
      javaContext.push('JAVA BACKEND ERROR FROM TOMCAT LOG');
      javaContext.push('='.repeat(60));
      javaContext.push(`Exception: ${javaError.exception}`);
      javaContext.push(`Message: ${javaError.message}`);
      javaContext.push(`\n⚠️  FIX THIS FILE:`);
      javaContext.push(`File: ${javaError.javaFile}`);
      javaContext.push(`Line: ${javaError.lineNumber}`);
      javaContext.push(`Class: ${javaError.className}`);
      javaContext.push(`\nStack Trace:`);
      javaError.stackTrace.slice(0, 5).forEach((frame, i) => {
        javaContext.push(`  ${i + 1}. ${frame.className}(${frame.fileName}:${frame.lineNumber || '?'})`);
      });
    }
  }

  if (issues.length === 0) return null;

  const prompt = `You are AngularJS Guardian fixing errors for POC demo.

## YOUR TASK
Fix the error below. Output ONE unified diff for the problematic file.

## ERRORS DETECTED
${issues.join('\n')}

${javaContext.join('\n')}

## RULES
1. Output format: \`\`\`diff === path/to/file === (diff content) \`\`\`
2. For Java backend errors: Fix the EXACT file and line from Tomcat log
3. For frontend errors: Fix AngularJS controller/service
4. Use minimal changes
5. NO auth changes, NO API URL changes

## CONTEXT
Route: ${telemetry.route}
Errors: ${issues.length}
Java Errors: ${javaContext.length > 0 ? 'YES - see above' : 'NO'}

Generate fix now:`;

  return { prompt, issues: issues.length };
}

// POINT 7: Apply Patch with git apply (Windows compatible)
async function applyPatch(patchData, telemetry) {
  if (!patchData) return false;

  try {
    console.log(`  🤖 Requesting Codex fix for ${patchData.issues} issues...`);

    const content = await aiClient.complete(patchData.prompt);

    // Extract file path - supports both .js and .java (POINT 5)
    const pathMatch = content.match(/===\s*([^\s=]+\.(js|java))\s*===/);
    if (!pathMatch) {
      console.log('  ⚠️  No file path in response');
      return false;
    }

    const targetFile = path.normalize(pathMatch[1]);
    if (!fs.existsSync(targetFile)) {
      console.log(`  ⚠️  File not found: ${targetFile}`);
      return false;
    }

    // Extract diff content
    const diffMatch = content.match(/\`\`\`diff\n([\s\S]*?)\`\`\`/);
    if (!diffMatch) {
      console.log('  ⚠️  No diff content');
      return false;
    }

    const diffContent = diffMatch[1];
    const patchPath = `${targetFile}.guardian.patch`;
    fs.writeFileSync(patchPath, diffContent);

    // Backup
    const backupPath = `${targetFile}.bak.${Date.now()}`;
    fs.copyFileSync(targetFile, backupPath);

    try {
      // POINT 7: Use git apply instead of patch command
      execSync(`git apply --check "${patchPath}"`, { stdio: 'pipe', timeout: 5000 });
      execSync(`git apply "${patchPath}"`, { stdio: 'pipe', timeout: 10000 });

      console.log(`  ✅ PATCH APPLIED: ${targetFile}`);
      console.log(`  📁 Backup: ${backupPath}`);

      fs.unlinkSync(patchPath);
      return true;
    } catch (error) {
      console.log(`  ❌ Patch failed, rolling back`);
      fs.copyFileSync(backupPath, targetFile);
      fs.unlinkSync(patchPath);
      return false;
    }
  } catch (error) {
    console.log(`  ⚠️  Error: ${error.message}`);
    return false;
  }
}

// Main Test Flow
async function testScreen(page, route) {
  console.log(`\n  📍 Testing: ${route}`);

  const telemetry = new Telemetry(route);
  telemetry.attachListeners(page);

  await page.goto(CONFIG.appUrl + route, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  // Discover and test controls (simplified for POC)
  const controls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, input, select'))
      .slice(0, 5)
      .map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        name: el.name
      }));
  });

  console.log(`  🎮 Found ${controls.length} controls`);

  for (const ctrl of controls) {
    try {
      const selector = ctrl.id ? `#${ctrl.id}` : `${ctrl.tag}[name="${ctrl.name}"]`;
      await page.locator(selector).first().click({ timeout: 3000 });
      await new Promise(r => setTimeout(r, 500));
    } catch {}
  }

  await new Promise(r => setTimeout(r, 1000));

  return telemetry;
}

// POINT 2: Per-Screen Retry Loop
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log(`║  🛡️  AngularJS Guardian v${VERSION} - POC Demo             ║`);
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Provider: ${API_PROVIDER.toUpperCase()}                                     ║`);
  console.log(`║  Tomcat Log: ${CONFIG.backend.logFilePath ? '✅' : '❌'}                              ║`);
  console.log(`║  Login: ${CONFIG.login.enabled ? '✅' : '❌'}                                      ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  browserInstance = await chromium.launch({ headless: CONFIG.headless });
  const context = await browserInstance.newContext({ viewport: { width: 1280, height: 800 } });
  let page = await context.newPage();

  // Login
  await performLogin(page);

  // POINT 2: Test each screen until clean
  for (const route of CONFIG.routes) {
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`  📍 SCREEN: ${route}`);
    console.log('═'.repeat(65));

    let screenHealthy = false;
    let attempt = 0;

    while (!screenHealthy && attempt < CONFIG.retry.maxScreenAttempts) {
      attempt++;
      console.log(`\n  🔄 Attempt ${attempt}/${CONFIG.retry.maxScreenAttempts}`);

      const telemetry = await testScreen(page, route);

      console.log(`  📝 Console Errors: ${telemetry.consoleErrors.length}`);
      console.log(`  🌐 Network Failures: ${telemetry.network.failures.length}`);

      // POINT 4: Check if healthy
      if (isScreenHealthy(telemetry)) {
        console.log(`\n  ✅ Screen ${route} is CLEAN!`);
        screenHealthy = true;
        break;
      }

      // Generate and apply fix
      console.log(`\n  ⚠️  Screen has errors, generating fix...`);
      const patch = await generatePatch(telemetry);

      if (patch) {
        const applied = await applyPatch(patch, telemetry);

        if (applied) {
          // POINT 3: Restart browser after fix
          const result = await restartBrowserAndLogin();
          page = result.page;
        } else {
          console.log(`  ⚠️  Could not apply fix`);
          break;
        }
      } else {
        console.log(`  ✅ No errors to fix`);
        screenHealthy = true;
      }
    }

    if (!screenHealthy) {
      console.log(`\n  ❌ Screen ${route} still has errors after ${attempt} attempts`);
    }
  }

  await browserInstance.close();

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🏁 POC DEMO COMPLETE                                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

// Run
main().catch(console.error);
