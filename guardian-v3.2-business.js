/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AngularJS Guardian v3.2 — Business Edition
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
 * THIRD-PARTY DEPENDENCIES AND LICENSES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This software uses the following open-source packages:
 * 
 * 1. Playwright (Apache-2.0 License)
 *    Copyright (c) Microsoft Corporation
 *    https://github.com/microsoft/playwright
 *    Commercial use: ✅ Permitted
 * 
 * 2. OpenAI Node.js SDK (MIT License)  
 *    Copyright (c) OpenAI
 *    https://github.com/openai/openai-node
 *    Commercial use: ✅ Permitted
 * 
 * 3. Node.js Built-in Modules (MIT License)
 *    fs, path, child_process
 *    Commercial use: ✅ Permitted
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * PRIVACY & DATA DISCLOSURE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️ IMPORTANT: This tool sends data to external services:
 * 
 * 1. OpenAI API (api.openai.com)
 *    - Console error messages from your application
 *    - Network error details (URLs, status codes, error messages)
 *    - Route/path information
 *    - AngularJS version and watcher counts
 *    
 *    Data is sent to generate automated code fixes. Please review OpenAI's
 *    data usage policy: https://openai.com/policies/api-data-usage-policies
 *    
 *    For enterprise users: Consider using Azure OpenAI Service for data
 *    residency requirements.
 * 
 * 2. Local File System
 *    - Creates backup files in .guardian-backups/
 *    - Creates JSON reports with session data
 *    - May modify source code files (with backups)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * DISCLAIMER & LIMITATION OF LIABILITY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This tool automatically modifies source code files. While backups are
 * created, the authors are NOT responsible for:
 * 
 * - Data loss or corruption
 * - Application downtime or failures
 * - Security vulnerabilities introduced by AI-generated patches
 * - Any damages arising from use of this software
 * 
 * RECOMMENDED: 
 * - Always use version control (git) before running
 * - Run in DRY_RUN=true mode first to preview changes
 * - Review all patches before deploying to production
 * - Test thoroughly after any automated modifications
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPLIANCE NOTES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * - GDPR: If testing applications with personal data, ensure compliance
 * - SOC2: Review data sent to OpenAI API for sensitive information
 * - HIPAA: Do NOT use on systems containing PHI without proper review
 * - PCI-DSS: Blocked paths include 'payment', 'billing' by default
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * ATTRIBUTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CSS.escape polyfill implementation based on:
 * - CSSOM Specification: https://drafts.csswg.org/cssom/#serialize-an-identifier
 * - Original polyfill by Mathias Bynens (MIT License)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const OpenAI = require('openai');
const { execSync } = require('child_process');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// VERSION INFO
// ═══════════════════════════════════════════════════════════════════════════
const VERSION = '3.2.0';
const BUILD_DATE = '2024-01-15';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG = {
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  
  // Safe parseInt with radix and validation
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
    openaiApi: 60000
  },
  
  // Security: Paths that should NEVER be modified
  blockedPaths: [
    'auth', 
    'authentication',
    'billing', 
    'license', 
    'security', 
    'payment',
    'checkout',
    'admin',
    'password',
    'credential',
    'secret',
    'key',
    'token',
    'oauth',
    'sso',
    'saml',
    'ldap',
    'encryption',
    'decrypt',
    'private'
  ],
  
  routes: ['/'],
  headless: process.env.HEADLESS === 'true',
  verbose: process.env.VERBOSE !== 'false',
  
  // Dry-run mode (recommended for first run)
  dryRun: process.env.DRY_RUN === 'true',
  
  // Metrics export option
  exportMetrics: process.env.EXPORT_METRICS === 'true',
  
  // Network monitoring config
  network: {
    trackAPIs: true,
    ignorePatterns: [
      /favicon/i,
      /analytics/i,
      /google/i,
      /facebook/i,
      /hotjar/i,
      /\.png$/i,
      /\.jpg$/i,
      /\.gif$/i,
      /\.svg$/i,
      /\.css$/i,
      /\.woff/i
    ],
    slowThresholdMs: 3000,
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
    
    // Response body capture options
    captureResponseBody: false,
    maxBodySize: 10000,
    
    // Limits to prevent memory leaks
    maxCompletedEntries: 1000,
    maxFailureEntries: 500,
    maxSlowEntries: 100
  },
  
  // Configurable health impact values
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
  
  // Backup management
  backup: {
    maxBackupsPerFile: 10,
    directory: '.guardian-backups'
  },
  
  // Data sanitization for privacy
  privacy: {
    // Redact these patterns before sending to OpenAI
    redactPatterns: [
      /password['":\s]*['"][^'"]+['"]/gi,
      /api[_-]?key['":\s]*['"][^'"]+['"]/gi,
      /secret['":\s]*['"][^'"]+['"]/gi,
      /token['":\s]*['"][^'"]+['"]/gi,
      /bearer\s+[a-zA-Z0-9\-_.]+/gi,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // emails
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // phone numbers
      /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, // SSN pattern
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/g // credit card pattern
    ],
    enableRedaction: true
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION & VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY environment variable');
  console.error('   Set it with: export OPENAI_API_KEY="sk-..."');
  process.exit(1);
}

// Validate API key format (basic check)
if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
  console.warn('⚠️ Warning: OPENAI_API_KEY does not start with "sk-". Verify it is correct.');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const baselines = new Map();
const sessionId = `guardian_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const reports = [];

// Track browser for graceful shutdown
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
// Based on CSSOM specification: https://drafts.csswg.org/cssom/#serialize-an-identifier
// Attribution: Implementation approach inspired by Mathias Bynens' CSS.escape polyfill
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
        // Sanitize before storing
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
      this.failures.push(completed);
    } else if (duration > CONFIG.network.slowThresholdMs) {
      completed.category = 'slow';
      this.slowRequests.push(completed);
    }

    this.completed.push(completed);
    this.requests.delete(request);
    this.pruneOldEntries();
    
    if (CONFIG.network.captureResponseBody && 
        response.headers()['content-type']?.includes('json')) {
      this.captureResponseBody(response, completed).catch(() => {});
    }
  }
  
  async captureResponseBody(response, completedEntry) {
    try {
      const body = await response.text();
      // Sanitize response body before storing
      completedEntry.responseBody = sanitizeForExternalAPI(body.slice(0, CONFIG.network.maxBodySize));
      if (body.length > CONFIG.network.maxBodySize) {
        completedEntry.responseBodyTruncated = true;
      }
    } catch {
      // Ignore
    }
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
        try {
          page.off(event, fn);
        } catch {
          // Ignore
        }
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
      try {
        this.network.trackResponse(response);
      } catch {
        // Silently ignore
      }
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
      try {
        page.off(event, fn);
      } catch {
        // Ignore
      }
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
  } catch {
    // Timeout acceptable
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WAIT FOR NETWORK IDLE
// ═══════════════════════════════════════════════════════════════════════════
async function waitForNetworkIdle(page, timeout = 2000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    // Continue if timeout
  }
}

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
          try {
            await locator.selectOption({ index: 1 });
          } catch {
            // Select might not have options
          }
          await waitForAngularDigest(page);
          await waitForNetworkIdle(page);
          telemetry.controlsTested++;
          return true;
        } else if (control.fingerprint.tag === 'textarea') {
          testValue = 'Guardian automated test input.';
        } else {
          testValue = 'TestValue123';
        }

        try {
          await locator.clear();
        } catch {
          // Input might not be clearable
        }
        
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

  // Sanitize all issues before sending to API
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
    } else if (f.status >= 400) {
      issues.push(`CLIENT ERROR [${f.status}] ${f.method} ${f.endpoint}: ${f.statusText}`);
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

## COMMON FIXES
- Add .catch() or error callback to $http calls
- Add timeout configuration: { timeout: 30000 }
- Add $http interceptor for global error handling
- Add retry logic with $timeout for 5xx errors
- Add null checks for response.data

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
      } catch {
        // Ignore
      }
    });
  } catch {
    // Ignore
  }
}

function cleanupPatchFile(patchPath) {
  try {
    if (fs.existsSync(patchPath)) {
      fs.unlinkSync(patchPath);
    }
  } catch {
    // Ignore
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED SECURITY: PATH VALIDATION
// ═══════════════════════════════════════════════════════════════════════════
function isPathSafe(targetFile) {
  const resolvedPath = path.resolve(targetFile);
  const projectRoot = path.resolve('.');
  
  // Check 1: Must be within project root
  if (!resolvedPath.startsWith(projectRoot + path.sep)) {
    return { safe: false, reason: 'Path outside project directory' };
  }
  
  // Check 2: No path traversal
  if (targetFile.includes('..')) {
    return { safe: false, reason: 'Path traversal detected' };
  }
  
  // Check 3: Not a hidden file/directory (except node_modules)
  const parts = targetFile.split(path.sep);
  for (const part of parts) {
    if (part.startsWith('.') && part !== '.') {
      return { safe: false, reason: 'Hidden file/directory' };
    }
  }
  
  // Check 4: Not in blocked paths
  const lowerPath = targetFile.toLowerCase();
  for (const blocked of CONFIG.blockedPaths) {
    if (lowerPath.includes(blocked)) {
      return { safe: false, reason: `Security-sensitive path (${blocked})` };
    }
  }
  
  // Check 5: Must be a JavaScript file
  if (!targetFile.endsWith('.js')) {
    return { safe: false, reason: 'Not a JavaScript file' };
  }
  
  return { safe: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// APPLY PATCH
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
    console.log(`   🤖 Requesting AI fix for ${patchRequest.type} issues...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeouts.openaiApi);
    
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: patchRequest.prompt }],
        temperature: 0.2,
        max_tokens: 2000
      }, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    const content = response.choices[0]?.message?.content || '';
    
    const pathMatch = content.match(/===\s*([^\s=]+\.js)\s*===/);
    if (!pathMatch) {
      console.log('   ⚠️ No valid file path in AI response');
      return false;
    }

    let targetFile = path.normalize(pathMatch[1]);
    
    // Enhanced security validation
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

    try {
      execSync(`patch --dry-run "${targetFile}" < "${patchPath}"`, {
        stdio: 'pipe',
        timeout: 5000
      });
    } catch {
      console.log('   ❌ Patch dry-run failed');
      cleanupPatchFile(patchPath);
      return false;
    }

    try {
      execSync(`patch "${targetFile}" < "${patchPath}"`, {
        stdio: 'pipe',
        timeout: 10000
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
      console.log(`   ⚠️ OpenAI API timeout after ${CONFIG.timeouts.openaiApi}ms`);
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
// EXPORT METRICS (Prometheus format)
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
  console.log('║      🛡️  AngularJS Guardian v3.2 — Business Edition           ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  Version: ${VERSION.padEnd(52)}║`);
  console.log(`║  Session: ${sessionId.padEnd(51)}║`);
  console.log(`║  Target:  ${CONFIG.appUrl.padEnd(51)}║`);
  console.log(`║  Mode:    ${(CONFIG.dryRun ? 'DRY RUN (no changes)' : 'ACTIVE').padEnd(51)}║`);
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log('║  ⚠️  Data is sent to OpenAI API. Review privacy policy.       ║');
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
