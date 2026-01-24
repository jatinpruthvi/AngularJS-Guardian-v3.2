/** https://lmarena.ai/c/019be966-8486-71d4-9bce-c3366e1c4508
 * ═══════════════════════════════════════════════════════════════════════════
 * AngularJS Guardian v3.2 — Business Edition (Codex API Support)
 * With HTTP Network Monitoring & Auto-Fix Capabilities
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * @license MIT
 * @copyright (c) 2024 Your Company Name. All rights reserved.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * SUPPORTED API PROVIDERS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 1. Codex API (Default)
 *    - Set CODEX_API_KEY environment variable
 *    - Optionally set CODEX_API_URL for custom endpoint
 * 
 * 2. OpenAI API
 *    - Set OPENAI_API_KEY environment variable
 *    - Set API_PROVIDER=openai
 * 
 * 3. Azure OpenAI
 *    - Set AZURE_OPENAI_API_KEY environment variable
 *    - Set AZURE_OPENAI_ENDPOINT environment variable
 *    - Set API_PROVIDER=azure
 * 
 * 4. Custom API (OpenAI-compatible)
 *    - Set CUSTOM_API_KEY environment variable
 *    - Set CUSTOM_API_URL environment variable
 *    - Set API_PROVIDER=custom
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * PRIVACY & DATA DISCLOSURE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️ IMPORTANT: This tool sends data to external AI services:
 * 
 * Data sent includes:
 *    - Console error messages from your application
 *    - Network error details (URLs, status codes, error messages)
 *    - Route/path information
 *    - AngularJS version and watcher counts
 *    
 * Data is automatically sanitized to remove:
 *    - Passwords and secrets
 *    - API keys and tokens
 *    - Email addresses
 *    - Phone numbers, SSN, credit card patterns
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════
// VERSION INFO
// ═══════════════════════════════════════════════════════════════════════════
const VERSION = '3.2.0-codex';
const BUILD_DATE = '2024-01-15';

// ═══════════════════════════════════════════════════════════════════════════
// API PROVIDER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
const API_PROVIDER = process.env.API_PROVIDER || 'codex'; // codex, openai, azure, custom

const API_CONFIG = {
  codex: {
    apiKey: process.env.CODEX_API_KEY,
    baseUrl: process.env.CODEX_API_URL || 'https://api.codex.com/v1', // Update with actual Codex URL
    model: process.env.CODEX_MODEL || 'codex-latest',
    keyName: 'CODEX_API_KEY'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    keyName: 'OPENAI_API_KEY'
  },
  azure: {
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseUrl: process.env.AZURE_OPENAI_ENDPOINT,
    model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
    keyName: 'AZURE_OPENAI_API_KEY',
    apiVersion: process.env.AZURE_API_VERSION || '2024-02-15-preview'
  },
  custom: {
    apiKey: process.env.CUSTOM_API_KEY,
    baseUrl: process.env.CUSTOM_API_URL,
    model: process.env.CUSTOM_MODEL || 'default',
    keyName: 'CUSTOM_API_KEY'
  }
};

// Get current provider config
const currentProvider = API_CONFIG[API_PROVIDER];

if (!currentProvider) {
  console.error(`❌ Unknown API_PROVIDER: ${API_PROVIDER}`);
  console.error('   Supported providers: codex, openai, azure, custom');
  process.exit(1);
}

if (!currentProvider.apiKey) {
  console.error(`❌ Missing ${currentProvider.keyName} environment variable`);
  console.error(`   Set it with: export ${currentProvider.keyName}="your-api-key"`);
  process.exit(1);
}

if (API_PROVIDER === 'azure' && !currentProvider.baseUrl) {
  console.error('❌ Missing AZURE_OPENAI_ENDPOINT environment variable');
  process.exit(1);
}

if (API_PROVIDER === 'custom' && !currentProvider.baseUrl) {
  console.error('❌ Missing CUSTOM_API_URL environment variable');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// AI CLIENT - Unified interface for all providers
// ═══════════════════════════════════════════════════════════════════════════
class AIClient {
  constructor(provider, config) {
    this.provider = provider;
    this.config = config;
    this.timeout = 60000; // 60 second timeout
  }

  async complete(prompt, options = {}) {
    const { temperature = 0.2, maxTokens = 2000 } = options;

    switch (this.provider) {
      case 'codex':
        return this.callCodex(prompt, temperature, maxTokens);
      case 'openai':
        return this.callOpenAI(prompt, temperature, maxTokens);
      case 'azure':
        return this.callAzure(prompt, temperature, maxTokens);
      case 'custom':
        return this.callCustom(prompt, temperature, maxTokens);
      default:
        throw new Error(`Unknown provider: ${this.provider}`);
    }
  }

  async callCodex(prompt, temperature, maxTokens) {
    const response = await this.fetchWithTimeout(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `API error: ${response.status}`);
    }

    return data.choices?.[0]?.message?.content || '';
  }

  async callOpenAI(prompt, temperature, maxTokens) {
    // Use OpenAI SDK if available, otherwise use fetch
    try {
      const OpenAI = require('openai');
      const client = new OpenAI({ apiKey: this.config.apiKey });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      try {
        const response = await client.chat.completions.create({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens
        }, { signal: controller.signal });
        
        return response.choices?.[0]?.message?.content || '';
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (sdkError) {
      // Fallback to fetch if SDK not available
      if (sdkError.code === 'MODULE_NOT_FOUND') {
        return this.callCodex(prompt, temperature, maxTokens); // Same format as OpenAI
      }
      throw sdkError;
    }
  }

  async callAzure(prompt, temperature, maxTokens) {
    const url = `${this.config.baseUrl}/openai/deployments/${this.config.model}/chat/completions?api-version=${this.config.apiVersion}`;
    
    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.config.apiKey
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `Azure API error: ${response.status}`);
    }

    return data.choices?.[0]?.message?.content || '';
  }

  async callCustom(prompt, temperature, maxTokens) {
    // Generic OpenAI-compatible endpoint
    const response = await this.fetchWithTimeout(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `API error: ${response.status}`);
    }

    return data.choices?.[0]?.message?.content || '';
  }

  async fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Initialize AI client
const aiClient = new AIClient(API_PROVIDER, currentProvider);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG = {
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  
  maxCycles: (() => {
    const parsed = parseInt(process.env.MAX_CYCLES, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
  })(),
  
  healthThreshold: 80,
  controlLimit: 15,
  
  timeouts: {
    navigation: 20000,
    element: 3000,
    digest: 5000,
    networkIdle: 10000,
    apiResponse: 30000,
    aiApi: 60000
  },
  
  blockedPaths: [
    'auth', 'authentication', 'billing', 'license', 'security', 'payment',
    'checkout', 'admin', 'password', 'credential', 'secret', 'key', 'token',
    'oauth', 'sso', 'saml', 'ldap', 'encryption', 'decrypt', 'private'
  ],
  
  routes: ['/'],
  headless: process.env.HEADLESS === 'true',
  verbose: process.env.VERBOSE !== 'false',
  dryRun: process.env.DRY_RUN === 'true',
  exportMetrics: process.env.EXPORT_METRICS === 'true',
  
  network: {
    trackAPIs: true,
    ignorePatterns: [
      /favicon/i, /analytics/i, /google/i, /facebook/i, /hotjar/i,
      /\.png$/i, /\.jpg$/i, /\.gif$/i, /\.svg$/i, /\.css$/i, /\.woff/i
    ],
    slowThresholdMs: 3000,
    retryStatusCodes: [408, 429, 500, 502, 503, 504, 505], // Added 505 for HTTP Version Not Supported
    captureResponseBody: false,
    maxBodySize: 10000,
    maxCompletedEntries: 1000,
    maxFailureEntries: 500,
    maxSlowEntries: 100
  },
  
  healthImpact: {
    consoleError: 10,
    controlFailure: 12,
    consoleWarning: 2,
    serverError: 15,
    clientError: 8,
    networkError: 12,
    slowRequest: 3,
    watcherGrowth: 15,
    maxNetworkImpact: 50
  },
  

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN & AUTH CONFIGURATION (POINT 1)
  // ═══════════════════════════════════════════════════════════════════════════
  login: {
    enabled: process.env.LOGIN_ENABLED === 'true',
    url: process.env.LOGIN_URL || 'http://localhost:3000/login',
    username: process.env.APP_USERNAME,
    password: process.env.APP_PASSWORD,
    usernameSelector: process.env.LOGIN_USERNAME_SELECTOR || '[name="username"]',
    passwordSelector: process.env.LOGIN_PASSWORD_SELECTOR || '[name="password"]',
    submitSelector: process.env.LOGIN_SUBMIT_SELECTOR || 'button[type="submit"]',
    successUrl: process.env.LOGIN_SUCCESS_URL || 'http://localhost:3000/dashboard'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // JAVA BACKEND SUPPORT (POINT 5)
  // ═══════════════════════════════════════════════════════════════════════════
  backend: {
    javaSrcPath: process.env.JAVA_SRC_PATH || 'src/main/java',
    enableJavaFixes: process.env.ENABLE_JAVA_FIXES === 'true'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RETRY CONFIGURATION (POINTS 2, 4, 6)
  // ═══════════════════════════════════════════════════════════════════════════
  retry: {
    maxScreenAttempts: parseInt(process.env.MAX_SCREEN_ATTEMPTS, 10) || 10,
    maxControlAttempts: parseInt(process.env.MAX_CONTROL_ATTEMPTS, 10) || 5,
    screenHealthThreshold: 100, // Must be perfect to proceed
    restartBrowserAfterFix: true
  },
  backup: {
    maxBackupsPerFile: 10,
    directory: '.guardian-backups'
  },
  
  privacy: {
    redactPatterns: [
      /password['":\s]*['"][^'"]+['"]/gi,
      /api[_-]?key['":\s]*['"][^'"]+['"]/gi,
      /secret['":\s]*['"][^'"]+['"]/gi,
      /token['":\s]*['"][^'"]+['"]/gi,
      /bearer\s+[a-zA-Z0-9\-_.]+/gi,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/g
    ],
    enableRedaction: true
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════════════
const baselines = new Map();
const sessionId = `guardian_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const reports = [];
let browserInstance = null;

// ═══════════════════════════════════════════════════════════════════════════
// PRIVACY: DATA SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════
function sanitizeForExternalAPI(text) {
  if (!CONFIG.privacy.enableRedaction || typeof text !== 'string') {
    return text;
  }
  
  let sanitized = text;
  CONFIG.privacy.redactPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  return sanitized;
}

// ═══════════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN HANDLER
// ═══════════════════════════════════════════════════════════════════════════
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  try {
    if (browserInstance) {
      await browserInstance.close();
      browserInstance = null;
    }
    
    if (reports.length > 0) {
      const interruptedReportPath = `guardian-interrupted-${sessionId}.json`;
      fs.writeFileSync(interruptedReportPath, JSON.stringify({
        sessionId,
        timestamp: new Date().toISOString(),
        interrupted: true,
        signal,
        partialResults: reports
      }, null, 2));
      console.log(`📄 Partial report saved: ${interruptedReportPath}`);
    }
  } catch (err) {
    console.error('Error during shutdown:', err.message);
  }
  
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// ═══════════════════════════════════════════════════════════════════════════
// CSS ESCAPE UTILITY
// ═══════════════════════════════════════════════════════════════════════════
function cssEscape(str) {
  if (typeof str !== 'string') return '';
  
  const length = str.length;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const char = str.charAt(i);
    const code = str.charCodeAt(i);
    
    if (code === 0x0000) {
      result += '\uFFFD';
      continue;
    }
    
    if (
      (code >= 0x0001 && code <= 0x001F) ||
      code === 0x007F ||
      (i === 0 && code >= 0x0030 && code <= 0x0039) ||
      (i === 1 && code >= 0x0030 && code <= 0x0039 && str.charCodeAt(0) === 0x002D)
    ) {
      result += '\\' + code.toString(16) + ' ';
      continue;
    }
    
    if (
      code !== 0x002D &&
      code !== 0x005F &&
      !(code >= 0x0030 && code <= 0x0039) &&
      !(code >= 0x0041 && code <= 0x005A) &&
      !(code >= 0x0061 && code <= 0x007A) &&
      !(code >= 0x0080)
    ) {
      result += '\\' + char;
      continue;
    }
    
    result += char;
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// HTTP NETWORK TRACKER
// ═══════════════════════════════════════════════════════════════════════════
class NetworkTracker {
  constructor() {
    this.requests = new Map();
    this.completed = [];
    this.failures = [];
    this.slowRequests = [];
    this.statusCodeCounts = {};
    this.endpointHealth = new Map();
    
    this.ignoreRegex = new RegExp(
      CONFIG.network.ignorePatterns.map(p => p.source).join('|'),
      'i'
    );
  }

  shouldTrack(url) {
    return !this.ignoreRegex.test(url);
  }

  extractEndpoint(url) {
    try {
      const parsed = new URL(url);
      let pathname = parsed.pathname
        .replace(/\/\d+/g, '/:id')
        .replace(/\/[a-f0-9-]{36}/gi, '/:uuid')
        .replace(/\/[a-f0-9]{24}/gi, '/:objectId');
      return `${parsed.origin}${pathname}`;
    } catch {
      return url.split('?')[0];
    }
  }

  trackRequest(request) {
    const url = request.url();
    if (!this.shouldTrack(url)) return;

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: url,
      endpoint: this.extractEndpoint(url),
      method: request.method(),
      headers: request.headers(),
      postData: (() => {
        const data = request.postData();
        if (!data) return null;
        const sanitized = sanitizeForExternalAPI(data);
        if (sanitized.length <= 500) return sanitized;
        return sanitized.slice(0, 500) + `... [truncated ${sanitized.length - 500} chars]`;
      })(),
      startTime: Date.now(),
      resourceType: request.resourceType()
    };

    this.requests.set(request, entry);
  }

  trackResponse(response) {
    const request = response.request();
    const entry = this.requests.get(request);
    if (!entry) return;

    const endTime = Date.now();
    const duration = endTime - entry.startTime;
    const status = response.status();

    const completed = {
      ...entry,
      status,
      statusText: response.statusText(),
      duration,
      responseHeaders: response.headers(),
      endTime
    };

    this.statusCodeCounts[status] = (this.statusCodeCounts[status] || 0) + 1;
    this.updateEndpointHealth(entry.endpoint, status, duration);

    if (status >= 400) {
      completed.category = status >= 500 ? 'server_error' : 'client_error';
      completed.shouldRetry = CONFIG.network.retryStatusCodes.includes(status);

      // POINT 8: Capture response body for backend errors (contains Java stack traces)
      try {
        response.text().then(body => {
          if (body && body.length > 0) {
            completed.responseBody = body.length > 5000 ? body.slice(0, 5000) + '...[truncated]' : body;
          }
        }).catch(() => {});
      } catch {}

      this.failures.push(completed);
    } else if (duration > CONFIG.network.slowThresholdMs) {
      completed.category = 'slow';
      this.slowRequests.push(completed);
    }

    this.completed.push(completed);
    this.requests.delete(request);
    this.pruneOldEntries();
  }

  trackFailure(request, errorText) {
    const entry = this.requests.get(request);
    if (!entry) return;

    const failure = {
      ...entry,
      status: 0,
      error: sanitizeForExternalAPI(errorText),
      category: 'network_error',
      duration: Date.now() - entry.startTime
    };

    this.failures.push(failure);
    this.updateEndpointHealth(entry.endpoint, 0, failure.duration, errorText);
    this.requests.delete(request);
    this.pruneOldEntries();
  }

  pruneOldEntries() {
    const maxCompleted = CONFIG.network.maxCompletedEntries;
    const maxFailures = CONFIG.network.maxFailureEntries;
    const maxSlow = CONFIG.network.maxSlowEntries;
    
    if (this.completed.length > maxCompleted) {
      this.completed = this.completed.slice(-maxCompleted);
    }
    if (this.failures.length > maxFailures) {
      this.failures = this.failures.slice(-maxFailures);
    }
    if (this.slowRequests.length > maxSlow) {
      this.slowRequests = this.slowRequests.slice(-maxSlow);
    }
  }

  updateEndpointHealth(endpoint, status, duration, error = null) {
    if (!this.endpointHealth.has(endpoint)) {
      this.endpointHealth.set(endpoint, {
        endpoint,
        totalCalls: 0,
        successCount: 0,
        errorCount: 0,
        totalDuration: 0,
        errors: [],
        statusCodes: {}
      });
    }

    const health = this.endpointHealth.get(endpoint);
    health.totalCalls++;
    health.totalDuration += duration;
    health.statusCodes[status] = (health.statusCodes[status] || 0) + 1;

    if (status >= 200 && status < 400) {
      health.successCount++;
    } else {
      health.errorCount++;
      if (error || status >= 400) {
        health.errors.push({
          status,
          error: error || `HTTP ${status}`,
          timestamp: Date.now()
        });
        if (health.errors.length > 10) {
          health.errors = health.errors.slice(-10);
        }
      }
    }
  }

  getUnhealthyEndpoints() {
    const unhealthy = [];
    
    this.endpointHealth.forEach((health) => {
      if (health.totalCalls === 0) return;
      
      const errorRate = health.errorCount / health.totalCalls;
      const avgDuration = health.totalDuration / health.totalCalls;
      
      if (errorRate > 0.1 || avgDuration > CONFIG.network.slowThresholdMs) {
        unhealthy.push({
          ...health,
          errorRate: Math.round(errorRate * 100),
          avgDuration: Math.round(avgDuration)
        });
      }
    });

    return unhealthy.sort((a, b) => b.errorRate - a.errorRate);
  }

  getSummary() {
    const total = this.completed.length;
    const failedCount = this.failures.length;
    const slow = this.slowRequests.length;

    return {
      totalRequests: total,
      successfulRequests: Math.max(0, total - failedCount),
      failedRequests: failedCount,
      slowRequests: slow,
      statusCodeDistribution: { ...this.statusCodeCounts },
      unhealthyEndpoints: this.getUnhealthyEndpoints(),
      failures: this.failures.slice(-10),
      slowest: this.slowRequests.slice(-5)
    };
  }

  calculateHealthImpact() {
    const cfg = CONFIG.healthImpact;
    let impact = 0;
    
    this.failures.forEach(f => {
      if (f.status >= 500) impact += cfg.serverError;
      else if (f.status >= 400) impact += cfg.clientError;
      else if (f.status === 0) impact += cfg.networkError;
    });

    impact += this.slowRequests.length * cfg.slowRequest;

    return Math.min(impact, cfg.maxNetworkImpact);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TELEMETRY CLASS
// ═══════════════════════════════════════════════════════════════════════════
class AngularJSTelemetry {
  constructor(route) {
    this.route = route;
    this.startTime = Date.now();
    this.consoleErrors = [];
    this.consoleWarnings = [];
    this.controlFailures = [];
    this.digestHealth = null;
    this.controlsTested = 0;
    this.healthScore = 100;
    this.network = new NetworkTracker();
    this._listeners = [];
  }

  attachListeners(page) {
    if (this._listeners.length > 0) {
      this._listeners.forEach(({ event, fn }) => {
        try { page.off(event, fn); } catch {}
      });
      this._listeners = [];
    }

    const consoleHandler = (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        this.consoleErrors.push({ 
          text: sanitizeForExternalAPI(text.slice(0, 500)), 
          timestamp: Date.now() 
        });
      } else if (msg.type() === 'warning' && text.includes('$digest')) {
        this.consoleWarnings.push({ text, timestamp: Date.now() });
      }
    };
    page.on('console', consoleHandler);
    this._listeners.push({ event: 'console', fn: consoleHandler });

    const pageErrorHandler = (error) => {
      this.consoleErrors.push({ 
        text: sanitizeForExternalAPI(`Uncaught: ${error.message}`.slice(0, 500)), 
        timestamp: Date.now() 
      });
    };
    page.on('pageerror', pageErrorHandler);
    this._listeners.push({ event: 'pageerror', fn: pageErrorHandler });

    const requestHandler = (request) => {
      this.network.trackRequest(request);
    };
    page.on('request', requestHandler);
    this._listeners.push({ event: 'request', fn: requestHandler });

    const responseHandler = (response) => {
      try { this.network.trackResponse(response); } catch {}
    };
    page.on('response', responseHandler);
    this._listeners.push({ event: 'response', fn: responseHandler });

    const requestFailedHandler = (request) => {
      const failure = request.failure();
      this.network.trackFailure(request, failure?.errorText || 'Unknown error');
    };
    page.on('requestfailed', requestFailedHandler);
    this._listeners.push({ event: 'requestfailed', fn: requestFailedHandler });
  }

  detachListeners(page) {
    this._listeners.forEach(({ event, fn }) => {
      try { page.off(event, fn); } catch {}
    });
    this._listeners = [];
  }

  async captureAngularState(page) {
    this.digestHealth = await page.evaluate(() => {
      try {
        if (typeof window.angular === 'undefined') {
          return { available: false, reason: 'AngularJS not loaded' };
        }

        const body = angular.element(document.body);
        const injector = body.injector?.();
        
        if (!injector) {
          return { available: false, reason: 'Injector not ready' };
        }

        const $rootScope = injector.get('$rootScope');
        
        let watcherCount = 0;
        const countWatchers = (scope) => {
          if (scope) {
            watcherCount += (scope.$$watchers?.length || 0);
            countWatchers(scope.$$childHead);
            countWatchers(scope.$$nextSibling);
          }
        };
        countWatchers($rootScope);

        let pendingRequests = 0;
        try {
          const $http = injector.get('$http');
          pendingRequests = $http.pendingRequests?.length || 0;
        } catch {}

        return {
          available: true,
          version: angular.version?.full || 'unknown',
          watchers: watcherCount,
          phase: $rootScope.$$phase || 'idle',
          listeners: Object.keys($rootScope.$$listeners || {}).length,
          pendingHttpRequests: pendingRequests
        };
      } catch (e) {
        return { available: false, reason: e.message };
      }
    });

    return this.digestHealth;
  }

  calculateHealth() {
    const cfg = CONFIG.healthImpact;
    let score = 100;
    
    score -= this.consoleErrors.length * cfg.consoleError;
    score -= this.controlFailures.length * cfg.controlFailure;
    score -= this.consoleWarnings.length * cfg.consoleWarning;
    score -= this.network.calculateHealthImpact();

    if (baselines.has(this.route) && this.digestHealth?.watchers) {
      const baseline = baselines.get(this.route);
      if (baseline > 0) {
        const growth = this.digestHealth.watchers / baseline;
        if (growth > 1.5) {
          score -= cfg.watcherGrowth;
        }
      }
    }

    this.healthScore = Math.max(0, Math.min(100, Math.round(score)));
    return this.healthScore;
  }

  getNetworkIssues() {
    return this.network.getSummary();
  }

  toJSON() {
    return {
      sessionId,
      route: this.route,
      duration: Date.now() - this.startTime,
      healthScore: this.healthScore,
      angular: this.digestHealth,
      controlsTested: this.controlsTested,
      errors: this.consoleErrors,
      warnings: this.consoleWarnings,
      controlFailures: this.controlFailures,
      network: this.network.getSummary()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROL DISCOVERY
// ═══════════════════════════════════════════════════════════════════════════
async function discoverControls(page) {
  return await page.evaluate((limit) => {
    const controls = [];
    const seen = new Set();

    const selectors = [
      '[ng-click]:not([disabled])',
      '[ng-submit]:not([disabled])',
      '[ng-model]:not([disabled])',
      '[ng-change]:not([disabled])',
      'button:not([disabled])',
      'input:not([type="hidden"]):not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[data-ng-click]:not([disabled])',
      '[data-ng-model]:not([disabled])'
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;

        const fingerprint = {
          tag: el.tagName.toLowerCase(),
          type: el.type || null,
          id: el.id || null,
          name: el.name || null,
          ngModel: el.getAttribute('ng-model') || el.getAttribute('data-ng-model'),
          ngClick: el.getAttribute('ng-click') || el.getAttribute('data-ng-click'),
          ngChange: el.getAttribute('ng-change') || el.getAttribute('data-ng-change'),
          placeholder: el.placeholder || null,
          text: (el.innerText || '').trim().slice(0, 30) || null,
          classes: el.className?.split?.(' ').slice(0, 3).join(' ') || null
        };

        const key = JSON.stringify([
          fingerprint.ngModel,
          fingerprint.ngClick,
          fingerprint.id,
          fingerprint.name
        ]);

        if (!seen.has(key) && (fingerprint.ngModel || fingerprint.ngClick || fingerprint.id || fingerprint.name)) {
          seen.add(key);
          
          const isInput = ['input', 'textarea', 'select'].includes(fingerprint.tag) 
            && fingerprint.type !== 'submit' 
            && fingerprint.type !== 'button';

          controls.push({ fingerprint, isInput });
        }
      });
    });

    return controls.slice(0, limit);
  }, CONFIG.controlLimit);
}

// ═══════════════════════════════════════════════════════════════════════════
// SELECTOR BUILDER
// ═══════════════════════════════════════════════════════════════════════════
function buildSelector(fingerprint) {
  const candidates = [];

  if (fingerprint.id) {
    candidates.push(`#${cssEscape(fingerprint.id)}`);
  }

  if (fingerprint.ngModel) {
    const escaped = cssEscape(fingerprint.ngModel);
    candidates.push(`[ng-model="${escaped}"]`);
    candidates.push(`[data-ng-model="${escaped}"]`);
  }

  if (fingerprint.ngClick) {
    const escaped = cssEscape(fingerprint.ngClick.slice(0, 100));
    candidates.push(`[ng-click="${escaped}"]`);
  }

  if (fingerprint.name) {
    const escaped = cssEscape(fingerprint.name);
    candidates.push(`[name="${escaped}"]`);
  }

  if (fingerprint.tag && fingerprint.classes) {
    const mainClass = fingerprint.classes.split(' ')[0];
    if (mainClass && !mainClass.includes('ng-')) {
      candidates.push(`${fingerprint.tag}.${cssEscape(mainClass)}`);
    }
  }

  return candidates.length > 0 ? candidates : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANGULAR DIGEST WAIT
// ═══════════════════════════════════════════════════════════════════════════
async function waitForAngularDigest(page) {
  try {
    await page.waitForFunction(() => {
      if (typeof window.angular === 'undefined') return true;
      const injector = angular.element(document.body).injector?.();
      if (!injector) return true;
      const $rootScope = injector.get('$rootScope');
      return !$rootScope.$$phase;
    }, { timeout: CONFIG.timeouts.digest });
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════
// WAIT FOR NETWORK IDLE
// ═══════════════════════════════════════════════════════════════════════════
async function waitForNetworkIdle(page, timeout = 2000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════
// POINT 1: LOGIN FLOW
// ═══════════════════════════════════════════════════════════════════════════
async function performLogin(page) {
  if (!CONFIG.login.enabled) {
    if (CONFIG.verbose) console.log('  ⚪ Login disabled, skipping...');
    return true;
  }

  try {
    console.log(`  🔐 Logging in at ${CONFIG.login.url}...`);

    await page.goto(CONFIG.login.url, {
      waitUntil: 'networkidle',
      timeout: CONFIG.timeouts.navigation
    });

    // Fill username
    await page.fill(CONFIG.login.usernameSelector, CONFIG.login.username);

    // Fill password
    await page.fill(CONFIG.login.passwordSelector, CONFIG.login.password);

    // Submit
    await page.click(CONFIG.login.submitSelector);

    // Wait for redirect to success URL
    await page.waitForURL(CONFIG.login.successUrl, {
      timeout: CONFIG.timeouts.navigation
    });

    console.log('  ✅ Login successful');
    return true;
  } catch (error) {
    console.log(`  ❌ Login failed: ${error.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POINT 3: STATE RESET - RESTART BROWSER AND RE-LOGIN
// ═══════════════════════════════════════════════════════════════════════════
async function restartBrowserAndLogin() {
  console.log('  🔄 Restarting browser to apply fixes...');

  try {
    // Close current browser
    if (browserInstance) {
      await browserInstance.close();
      browserInstance = null;
    }

    // Wait a moment for file system to release locks
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Launch new browser
    browserInstance = await chromium.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.verbose ? 50 : 0
    });

    const context = await browserInstance.newContext({
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    // Re-login
    const loginSuccess = await performLogin(page);
    if (!loginSuccess) {
      throw new Error('Failed to login after browser restart');
    }

    return { context, page };
  } catch (error) {
    console.error(`  ❌ Failed to restart browser: ${error.message}`);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POINT 4: SCREEN HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════
function isScreenHealthy(telemetry) {
  // Screen is healthy only if:
  // 1. Health score meets threshold
  // 2. No console errors
  // 3. No network failures

  const healthy = 
    telemetry.healthScore >= CONFIG.retry.screenHealthThreshold &&
    telemetry.consoleErrors.length === 0 &&
    telemetry.network.failures.length === 0;

  if (CONFIG.verbose) {
    console.log(`  📊 Screen Health Check:`);
    console.log(`     Score: ${telemetry.healthScore}/${CONFIG.retry.screenHealthThreshold}`);
    console.log(`     Console Errors: ${telemetry.consoleErrors.length}`);
    console.log(`     Network Failures: ${telemetry.network.failures.length}`);
    console.log(`     Result: ${healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  }

  return healthy;
}

// ═══════════════════════════════════════════════════════════════════════════
// POINT 6: PER-CONTROL RETRY LOOP
// ═══════════════════════════════════════════════════════════════════════════
async function testControlUntilClean(page, control, route) {
  const maxAttempts = CONFIG.retry.maxControlAttempts;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;

    if (CONFIG.verbose) {
      const label = control.fingerprint.ngModel || control.fingerprint.ngClick || control.fingerprint.id || 'unknown';
      console.log(`    🎯 Testing control [${label}] - Attempt ${attempt}/${maxAttempts}`);
    }

    // Create fresh telemetry for this control test
    const telemetry = new AngularJSTelemetry(route);
    telemetry.attachListeners(page);

    const errorsBefore = telemetry.consoleErrors.length;
    const failuresBefore = telemetry.network.failures.length;

    // Interact with the control
    const interacted = await interactWithControl(page, control, telemetry);

    if (!interacted) {
      telemetry.detachListeners(page);
      return { success: false, reason: 'Could not interact with control' };
    }

    const newErrors = telemetry.consoleErrors.length - errorsBefore;
    const newFailures = telemetry.network.failures.length - failuresBefore;

    // Control is clean!
    if (newErrors === 0 && newFailures === 0) {
      telemetry.detachListeners(page);
      if (CONFIG.verbose) console.log(`    ✅ Control is clean`);
      return { success: true, attempts: attempt };
    }

    // Control caused errors - fix them
    console.log(`    ⚠️  Control caused ${newErrors} errors, ${newFailures} network failures`);

    // Generate and apply fix
    const uiPatch = await generateUIPatch(telemetry);
    const networkPatch = await generateNetworkPatch(telemetry);

    let fixApplied = false;
    if (uiPatch) {
      console.log(`    🤖 Applying UI fix via Codex...`);
      fixApplied = await applyPatch(uiPatch, telemetry) || fixApplied;
    }
    if (networkPatch) {
      console.log(`    🤖 Applying network fix via Codex...`);
      fixApplied = await applyPatch(networkPatch, telemetry) || fixApplied;
    }

    telemetry.detachListeners(page);

    if (!fixApplied) {
      console.log(`    ⚠️  No fix could be applied`);
      return { success: false, reason: 'No fix available', attempts: attempt };
    }

    // Restart browser and navigate back to screen
    console.log(`    🔄 Restarting to test fix...`);
    const { context: newContext, page: newPage } = await restartBrowserAndLogin();

    // Navigate back to the screen
    const targetUrl = CONFIG.appUrl + route;
    await newPage.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: CONFIG.timeouts.navigation
    });

    await waitForAngularDigest(newPage);

    // Update page reference for next attempt
    await page.close();
    Object.assign(page, newPage);
  }

  return { 
    success: false, 
    reason: `Max attempts (${maxAttempts}) reached`, 
    attempts: maxAttempts 
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// SAFE INTERACTION
// ═══════════════════════════════════════════════════════════════════════════
async function interactWithControl(page, control, telemetry) {
  const selectors = buildSelector(control.fingerprint);
  if (!selectors) return false;

  const errorsBefore = telemetry.consoleErrors.length;
  const networkFailuresBefore = telemetry.network.failures.length;

  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      
      const isVisible = await locator.isVisible({ timeout: 1000 }).catch(() => false);
      if (!isVisible) continue;

      if (control.isInput) {
        const inputType = control.fingerprint.type || 'text';
        const ngModel = control.fingerprint.ngModel || '';
        
        let testValue;
        if (inputType === 'email' || ngModel.includes('email')) {
          testValue = 'guardian-test@example.com';
        } else if (inputType === 'number' || ngModel.includes('amount') || ngModel.includes('price')) {
          testValue = '42';
        } else if (inputType === 'tel' || ngModel.includes('phone')) {
          testValue = '555-0123';
        } else if (ngModel.includes('date')) {
          testValue = '2024-01-15';
        } else if (ngModel.includes('password')) {
          testValue = 'TestPass123!';
        } else if (control.fingerprint.tag === 'select') {
          try { await locator.selectOption({ index: 1 }); } catch {}
          await waitForAngularDigest(page);
          await waitForNetworkIdle(page);
          telemetry.controlsTested++;
          return true;
        } else if (control.fingerprint.tag === 'textarea') {
          testValue = 'Guardian automated test input.';
        } else {
          testValue = 'TestValue123';
        }

        try { await locator.clear(); } catch {}
        
        await locator.fill(testValue);
        await locator.dispatchEvent('input');
        await locator.dispatchEvent('change');
        
      } else {
        await locator.hover();
        await locator.click({ timeout: CONFIG.timeouts.element });
      }

      await waitForAngularDigest(page);
      await waitForNetworkIdle(page);
      telemetry.controlsTested++;

      const newErrors = telemetry.consoleErrors.slice(errorsBefore);
      const newNetworkFailures = telemetry.network.failures.slice(networkFailuresBefore);
      
      if (newErrors.length > 0 || newNetworkFailures.length > 0) {
        telemetry.controlFailures.push({
          control: control.fingerprint,
          selector,
          consoleErrors: newErrors.map(e => e.text),
          networkErrors: newNetworkFailures.map(f => ({
            url: f.url,
            status: f.status,
            error: f.error
          })),
          timestamp: Date.now()
        });
      }

      return true;

    } catch {
      continue;
    }
  }

  if (CONFIG.verbose) {
    const label = control.fingerprint.ngModel || control.fingerprint.ngClick || control.fingerprint.id;
    console.log(`   ⚪ Skipped: ${label?.slice(0, 40)}`);
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// PATCH GENERATION — UI ERRORS
// ═══════════════════════════════════════════════════════════════════════════
async function generateUIPatch(telemetry) {
  const issues = [];
  
  telemetry.controlFailures.slice(-5).forEach(f => {
    const ctrl = f.control.ngModel || f.control.ngClick || f.control.id || 'unknown';
    if (f.consoleErrors?.length) {
      issues.push(`CONTROL [${ctrl}]: ${f.consoleErrors[0]?.slice(0, 150)}`);
    }
  });
  
  telemetry.consoleErrors.slice(-5).forEach(e => {
    if (!issues.some(i => i.includes(e.text.slice(0, 50)))) {
      issues.push(`CONSOLE ERROR: ${e.text.slice(0, 150)}`);
    }
  });

  if (issues.length === 0) return null;

  const sanitizedIssues = issues.map(i => sanitizeForExternalAPI(i));

  return {
    type: 'ui',
    issues: sanitizedIssues,
    prompt: `You are AngularJS Guardian, fixing AngularJS 1.x UI/controller runtime errors.

## STRICT RULES
1. Output ONLY a unified diff for ONE file
2. NO refactoring, NO modernization
3. Use ONLY AngularJS 1.x patterns: $timeout, $applyAsync, null checks
4. FORBIDDEN: auth logic, payment logic, API schemas

## CONTEXT
Route: ${telemetry.route}
Health: ${telemetry.healthScore}/100
AngularJS: ${telemetry.digestHealth?.version || 'unknown'}

## UI/CONTROLLER ISSUES
${sanitizedIssues.join('\n')}

## OUTPUT FORMAT
\`\`\`diff
=== app/controllers/example.js ===
--- a/app/controllers/example.js
+++ b/app/controllers/example.js
@@ -10,3 +10,5 @@
 context
-old
+new
\`\`\`

Generate minimal fix for the most critical issue.`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PATCH GENERATION — NETWORK/HTTP ERRORS
// ═══════════════════════════════════════════════════════════════════════════
async function generateNetworkPatch(telemetry) {
  const networkSummary = telemetry.getNetworkIssues();
  const issues = [];

  networkSummary.failures.slice(-5).forEach(f => {
    if (f.status >= 500) {
      issues.push(`SERVER ERROR [${f.status}] ${f.method} ${f.endpoint}: Service returned ${f.statusText}`);
      // POINT 8: Include response body (Java stack trace) for backend errors
      if (f.responseBody) {
        issues.push(`Response Body: ${sanitizeForExternalAPI(f.responseBody.slice(0, 500))}`);
      }
    } else if (f.status >= 400) {
      issues.push(`CLIENT ERROR [${f.status}] ${f.method} ${f.endpoint}: ${f.statusText}`);
      if (f.responseBody) {
        issues.push(`Response Body: ${sanitizeForExternalAPI(f.responseBody.slice(0, 500))}`);
      }
    } else if (f.status === 0) {
      issues.push(`NETWORK FAILURE ${f.method} ${f.endpoint}: ${sanitizeForExternalAPI(f.error)}`);
    }
  });

  networkSummary.slowest.slice(-3).forEach(s => {
    issues.push(`SLOW REQUEST [${s.duration}ms] ${s.method} ${s.endpoint}`);
  });

  networkSummary.unhealthyEndpoints.slice(-3).forEach(ep => {
    issues.push(`UNHEALTHY ENDPOINT ${ep.endpoint}: ${ep.errorRate}% error rate, avg ${ep.avgDuration}ms`);
  });

  if (issues.length === 0) return null;

  return {
    type: 'network',
    issues,
    networkSummary,
    prompt: `You are AngularJS Guardian, fixing AngularJS 1.x HTTP/API error handling.

## STRICT RULES
1. Output ONLY a unified diff for ONE file
2. NO refactoring, NO modernization
3. Focus on: error callbacks, $http interceptors, retry logic, timeout config
4. Use AngularJS patterns: .then()/.catch(), $http config, $q
5. FORBIDDEN: changing API URLs, modifying request payloads, auth logic

## CONTEXT
Route: ${telemetry.route}
Failed Requests: ${networkSummary.failedRequests}
Slow Requests: ${networkSummary.slowRequests}

## NETWORK ISSUES DETECTED
${issues.join('\n')}

## OUTPUT FORMAT
\`\`\`diff
=== app/services/apiService.js ===
--- a/app/services/apiService.js
+++ b/app/services/apiService.js
@@ -20,5 +20,10 @@
\`\`\`

Generate minimal fix for the most critical network issue.`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
function cleanupOldBackups(targetFile) {
  const backupDir = CONFIG.backup.directory;
  const maxBackups = CONFIG.backup.maxBackupsPerFile;
  
  if (!fs.existsSync(backupDir)) return;
  
  try {
    const baseName = path.basename(targetFile);
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith(baseName) && f.endsWith('.bak'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        stat: fs.statSync(path.join(backupDir, f))
      }))
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
    
    backups.slice(maxBackups).forEach(backup => {
      try {
        fs.unlinkSync(backup.path);
        if (CONFIG.verbose) {
          console.log(`   🗑️ Removed old backup: ${backup.name}`);
        }
      } catch {}
    });
  } catch {}
}

function cleanupPatchFile(patchPath) {
  try {
    if (fs.existsSync(patchPath)) {
      fs.unlinkSync(patchPath);
    }
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════
// PATH VALIDATION
// ═══════════════════════════════════════════════════════════════════════════
function isPathSafe(targetFile) {
  const resolvedPath = path.resolve(targetFile);
  const projectRoot = path.resolve('.');
  
  if (!resolvedPath.startsWith(projectRoot + path.sep)) {
    return { safe: false, reason: 'Path outside project directory' };
  }
  
  if (targetFile.includes('..')) {
    return { safe: false, reason: 'Path traversal detected' };
  }
  
  const parts = targetFile.split(path.sep);
  for (const part of parts) {
    if (part.startsWith('.') && part !== '.') {
      return { safe: false, reason: 'Hidden file/directory' };
    }
  }
  
  const lowerPath = targetFile.toLowerCase();
  for (const blocked of CONFIG.blockedPaths) {
    if (lowerPath.includes(blocked)) {
      return { safe: false, reason: `Security-sensitive path (${blocked})` };
    }
  }
  
  // POINT 5: Allow both JavaScript and Java files
  if (!targetFile.endsWith('.js') && !targetFile.endsWith('.java')) {
    return { safe: false, reason: 'Not a JavaScript or Java file' };
  }
  
  return { safe: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// APPLY PATCH (Using AIClient)
// ═══════════════════════════════════════════════════════════════════════════
async function applyPatch(patchRequest, telemetry) {
  if (!patchRequest) return false;

  const reportPath = `guardian-report-${sessionId}-${telemetry.route.replace(/\//g, '_')}-${patchRequest.type}.json`;
  fs.writeFileSync(reportPath, JSON.stringify({
    ...telemetry.toJSON(),
    patchRequest: {
      type: patchRequest.type,
      issues: patchRequest.issues
    }
  }, null, 2));

  let patchPath = null;
  
  try {
    console.log(`   🤖 Requesting AI fix for ${patchRequest.type} issues via ${API_PROVIDER}...`);
    
    // Use the unified AI client
    const content = await aiClient.complete(patchRequest.prompt, {
      temperature: 0.2,
      maxTokens: 2000
    });
    
    const pathMatch = content.match(/===\s*([^\s=]+\.js)\s*===/);
    if (!pathMatch) {
      console.log('   ⚠️ No valid file path in AI response');
      return false;
    }

    let targetFile = path.normalize(pathMatch[1]);
    
    const pathCheck = isPathSafe(targetFile);
    if (!pathCheck.safe) {
      console.log(`   🚫 BLOCKED: ${pathCheck.reason}`);
      return false;
    }

    if (!fs.existsSync(targetFile)) {
      console.log(`   ⚠️ File not found: ${targetFile}`);
      return false;
    }

    let diffContent = content;
    const diffMatch = content.match(/```diff\n([\s\S]*?)```/);
    if (diffMatch) {
      diffContent = diffMatch[1];
    }

    if (CONFIG.dryRun) {
      console.log('\n   📄 DRY RUN - Patch preview:');
      console.log('   ' + '─'.repeat(60));
      console.log(diffContent.split('\n').map(l => '   ' + l).join('\n'));
      console.log('   ' + '─'.repeat(60));
      console.log('   (No changes applied - dry run mode)');
      return { wouldApply: true, file: targetFile, preview: diffContent };
    }

    const backupDir = CONFIG.backup.directory;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const backupPath = path.join(backupDir, `${path.basename(targetFile)}.${timestamp}.bak`);
    fs.copyFileSync(targetFile, backupPath);
    
    cleanupOldBackups(targetFile);

    patchPath = `${targetFile}.guardian.patch`;
    fs.writeFileSync(patchPath, diffContent);

    // POINT 7: Use git apply for Windows compatibility
    try {
      execSync(`git apply --check "${patchPath}"`, {
        stdio: 'pipe',
        timeout: 5000,
        cwd: process.cwd()
      });
    } catch {
      console.log('   ❌ Patch dry-run failed (git apply --check)');
      cleanupPatchFile(patchPath);
      return false;
    }

    // POINT 7: Apply patch using git apply
    try {
      execSync(`git apply "${patchPath}"`, {
        stdio: 'pipe',
        timeout: 10000,
        cwd: process.cwd()
      });
      console.log(`   ✅ ${patchRequest.type.toUpperCase()} PATCH APPLIED: ${targetFile}`);
      console.log(`   📁 Backup: ${backupPath}`);
      cleanupPatchFile(patchPath);
      return true;
      
    } catch {
      console.log('   ❌ Patch failed - rolling back');
      fs.copyFileSync(backupPath, targetFile);
      cleanupPatchFile(patchPath);
      return false;
    }

  } catch (apiError) {
    if (patchPath) {
      cleanupPatchFile(patchPath);
    }
    
    if (apiError.name === 'AbortError') {
      console.log(`   ⚠️ AI API timeout after ${CONFIG.timeouts.aiApi}ms`);
    } else {
      console.log(`   ⚠️ AI API error: ${apiError.message}`);
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CYCLE
// ═══════════════════════════════════════════════════════════════════════════
async function runGuardianCycle(page, route) {
  console.log(`\n   📍 Route: ${route}`);
  
  const telemetry = new AngularJSTelemetry(route);
  telemetry.attachListeners(page);

  try {
    const targetUrl = CONFIG.appUrl + route;
    try {
      await page.goto(targetUrl, { 
        waitUntil: 'networkidle', 
        timeout: CONFIG.timeouts.navigation 
      });
    } catch (navError) {
      console.log(`   ⚠️ Navigation: ${navError.message.slice(0, 50)}`);
    }

    await waitForAngularDigest(page);
    await telemetry.captureAngularState(page);

    if (!telemetry.digestHealth?.available) {
      console.log(`   ⚠️ AngularJS: ${telemetry.digestHealth?.reason}`);
    } else {
      console.log(`   📊 AngularJS ${telemetry.digestHealth.version} | ${telemetry.digestHealth.watchers} watchers`);
    }

    if (!baselines.has(route) && telemetry.digestHealth?.watchers) {
      baselines.set(route, telemetry.digestHealth.watchers);
    }

    const controls = await discoverControls(page);
    console.log(`   🎮 Found ${controls.length} controls`);

    for (const control of controls) {
      await interactWithControl(page, control, telemetry);
    }

    await telemetry.captureAngularState(page);
    telemetry.calculateHealth();
    
    const networkSummary = telemetry.getNetworkIssues();
    console.log(`   🌐 Network: ${networkSummary.totalRequests} requests | ${networkSummary.failedRequests} failed | ${networkSummary.slowRequests} slow`);
    
    if (networkSummary.unhealthyEndpoints.length > 0) {
      console.log(`   ⚠️ Unhealthy endpoints:`);
      networkSummary.unhealthyEndpoints.slice(0, 3).forEach(ep => {
        console.log(`      - ${ep.endpoint} (${ep.errorRate}% errors)`);
      });
    }

    reports.push(telemetry.toJSON());
    return telemetry;
    
  } finally {
    telemetry.detachListeners(page);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT METRICS
// ═══════════════════════════════════════════════════════════════════════════
function exportMetrics() {
  if (!CONFIG.exportMetrics || reports.length === 0) return;
  
  const latestReport = reports[reports.length - 1];
  
  const escapeLabel = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  };
  
  const totalNetworkErrors = reports.reduce((sum, r) => 
    sum + (r.network?.failedRequests || 0), 0);
  const totalConsoleErrors = reports.reduce((sum, r) => 
    sum + (r.errors?.length || 0), 0);
  
  const escapedSessionId = escapeLabel(sessionId);
  const escapedRoute = escapeLabel(latestReport.route || '/');
  
  const metrics = `# HELP guardian_health_score Application health score (0-100)
# TYPE guardian_health_score gauge
guardian_health_score{session="${escapedSessionId}",route="${escapedRoute}"} ${latestReport.healthScore || 0}

# HELP guardian_network_errors_total Total network errors across all cycles
# TYPE guardian_network_errors_total counter
guardian_network_errors_total{session="${escapedSessionId}"} ${totalNetworkErrors}

# HELP guardian_console_errors_total Total console errors across all cycles
# TYPE guardian_console_errors_total counter
guardian_console_errors_total{session="${escapedSessionId}"} ${totalConsoleErrors}

# HELP guardian_controls_tested_total Total UI controls tested
# TYPE guardian_controls_tested_total counter
guardian_controls_tested_total{session="${escapedSessionId}"} ${reports.reduce((sum, r) => sum + (r.controlsTested || 0), 0)}

# HELP guardian_watchers Current AngularJS watcher count
# TYPE guardian_watchers gauge
guardian_watchers{session="${escapedSessionId}",route="${escapedRoute}"} ${latestReport.angular?.watchers || 0}
`;

  const metricsPath = `guardian-metrics-${sessionId}.prom`;
  try {
    fs.writeFileSync(metricsPath, metrics);
    console.log(`📊 Metrics exported: ${metricsPath}`);
  } catch (err) {
    console.error(`⚠️ Failed to export metrics: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║      🛡️  AngularJS Guardian v3.2 — Codex Edition              ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  Version:  ${VERSION.padEnd(51)}║`);
  console.log(`║  Provider: ${API_PROVIDER.toUpperCase().padEnd(51)}║`);
  console.log(`║  Model:    ${currentProvider.model.padEnd(51)}║`);
  console.log(`║  Session:  ${sessionId.padEnd(51)}║`);
  console.log(`║  Target:   ${CONFIG.appUrl.padEnd(51)}║`);
  console.log(`║  Mode:     ${(CONFIG.dryRun ? 'DRY RUN (no changes)' : 'ACTIVE').padEnd(51)}║`);
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log('║  ⚠️  Data is sent to AI API. Review privacy policy.           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  let overallHealthy = true;

  try {
    browserInstance = await chromium.launch({ 
      headless: CONFIG.headless,
      slowMo: CONFIG.verbose ? 50 : 0
    });

    for (let cycle = 1; cycle <= CONFIG.maxCycles; cycle++) {
      console.log(`\n${'═'.repeat(65)}`);
      console.log(`   CYCLE ${cycle}/${CONFIG.maxCycles} — ${new Date().toLocaleTimeString()}`);
      console.log('═'.repeat(65));

      const context = await browserInstance.newContext({
        viewport: { width: 1280, height: 800 }
      });
      const page = await context.newPage();

      let cycleHealthy = true;

      for (const route of CONFIG.routes) {
        try {
          const telemetry = await runGuardianCycle(page, route);
          
          console.log(`\n   📈 Health Score: ${telemetry.healthScore}/100`);
          console.log(`   🔴 Console Errors: ${telemetry.consoleErrors.length}`);
          console.log(`   🌐 Network Failures: ${telemetry.network.failures.length}`);

          if (telemetry.healthScore < CONFIG.healthThreshold) {
            cycleHealthy = false;
            console.log(`\n   🔧 Health below ${CONFIG.healthThreshold} — Analyzing issues...`);
            
            const uiPatch = await generateUIPatch(telemetry);
            if (uiPatch) {
              console.log(`   📝 Found ${uiPatch.issues.length} UI issues`);
              await applyPatch(uiPatch, telemetry);
            }

            const networkPatch = await generateNetworkPatch(telemetry);
            if (networkPatch) {
              console.log(`   📝 Found ${networkPatch.issues.length} network issues`);
              await applyPatch(networkPatch, telemetry);
            }
          }
        } catch (routeError) {
          console.error(`\n   ❌ Route ${route} failed: ${routeError.message}`);
          reports.push({
            sessionId,
            route,
            error: routeError.message,
            healthScore: 0,
            timestamp: Date.now()
          });
          cycleHealthy = false;
          continue;
        }
      }

      await context.close();

      if (cycleHealthy) {
        console.log('\n   ✅ All routes healthy');
        overallHealthy = true;
        break;
      } else {
        overallHealthy = false;
        if (cycle < CONFIG.maxCycles) {
          console.log(`\n   ⏳ Waiting before retry...`);
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }

  } catch (fatalError) {
    console.error(`\n❌ Fatal: ${fatalError.message}`);
    console.error(fatalError.stack);
  } finally {
    if (browserInstance) {
      await browserInstance.close();
      browserInstance = null;
    }
  }

  exportMetrics();

  const finalReportPath = `guardian-session-${sessionId}.json`;
  fs.writeFileSync(finalReportPath, JSON.stringify({
    sessionId,
    version: VERSION,
    apiProvider: API_PROVIDER,
    model: currentProvider.model,
    timestamp: new Date().toISOString(),
    config: {
      appUrl: CONFIG.appUrl,
      routes: CONFIG.routes,
      maxCycles: CONFIG.maxCycles,
      dryRun: CONFIG.dryRun
    },
    baselines: Object.fromEntries(baselines),
    healthy: overallHealthy,
    cycles: reports
  }, null, 2));

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    🏁 SESSION COMPLETE                        ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  Status: ${(overallHealthy ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION').padEnd(52)}║`);
  console.log(`║  Report: ${finalReportPath.padEnd(52)}║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
