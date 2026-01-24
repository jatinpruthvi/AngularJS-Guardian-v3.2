/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AngularJS Guardian v3.3 — Codex Edition with Tomcat Log Integration
 * Autonomous Code-Fixing System for AngularJS + Java Backend
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * @license MIT
 * @copyright (c) 2026 Your Company Name
 * 
 * FEATURES:
 * - Automated login and navigation
 * - Per-screen retry until clean
 * - Per-control testing with retry
 * - Tomcat log parsing for Java backend errors
 * - Windows 11 compatible (git apply)
 * - Codex API integration for autonomous fixing
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// ═══════════════════════════════════════════════════════════════════════════
// VERSION INFO
// ═══════════════════════════════════════════════════════════════════════════
const VERSION = '3.3.0-codex-tomcat';
const BUILD_DATE = '2026-01-24';

// ═══════════════════════════════════════════════════════════════════════════
// API PROVIDER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
const API_PROVIDER = process.env.API_PROVIDER || 'codex';

const API_CONFIG = {
  codex: {
    apiKey: process.env.CODEX_API_KEY,
    baseUrl: process.env.CODEX_API_URL || 'https://api.codex.com/v1',
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

const currentProvider = API_CONFIG[API_PROVIDER];
if (!currentProvider) {
  console.error(`❌ Unknown API_PROVIDER: ${API_PROVIDER}`);
  process.exit(1);
}

if (!currentProvider.apiKey) {
  console.error(`❌ Missing ${currentProvider.keyName} environment variable`);
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// AI CLIENT
// ═══════════════════════════════════════════════════════════════════════════
class AIClient {
  constructor(provider, config) {
    this.provider = provider;
    this.config = config;
    this.timeout = 60000;
  }

  async complete(prompt, options = {}) {
    const { temperature = 0.2, maxTokens = 2000 } = options;
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
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

const aiClient = new AIClient(API_PROVIDER, currentProvider);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG = {
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  // POINT 1: Login configuration
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

  // POINT 5: Java backend support with Tomcat log parsing
  backend: {
    javaSrcPath: process.env.JAVA_SRC_PATH || 'src/main/java',
    enableJavaFixes: process.env.ENABLE_JAVA_FIXES !== 'false',
    logFilePath: process.env.TOMCAT_LOG_PATH || process.env.BACKEND_LOG_PATH,
    maxLogLines: parseInt(process.env.MAX_LOG_LINES, 10) || 5000,
    logLookbackSeconds: parseInt(process.env.LOG_LOOKBACK_SECONDS, 10) || 300
  },

  // POINT 2, 4, 6: Retry configuration
  retry: {
    maxScreenAttempts: parseInt(process.env.MAX_SCREEN_ATTEMPTS, 10) || 10,
    maxControlAttempts: parseInt(process.env.MAX_CONTROL_ATTEMPTS, 10) || 5,
    screenHealthThreshold: 100,
    restartBrowserAfterFix: true
  },

  healthThreshold: 80,
  controlLimit: 15,
  timeouts: {
    navigation: 20000,
    element: 3000,
    digest: 5000,
    networkIdle: 10000
  },

  routes: (process.env.APP_ROUTES || '/').split(','),
  headless: process.env.HEADLESS === 'true',
  verbose: process.env.VERBOSE !== 'false',
  dryRun: process.env.DRY_RUN === 'true',

  network: {
    trackAPIs: true,
    ignorePatterns: [
      /favicon/i, /analytics/i, /\.png$/i, /\.jpg$/i, /\.css$/i
    ],
    slowThresholdMs: 3000,
    retryStatusCodes: [408, 429, 500, 502, 503, 504, 505], // Added 505
    captureResponseBody: true, // POINT 8: Enable response body capture
    maxBodySize: 10000
  },

  healthImpact: {
    consoleError: 10,
    controlFailure: 12,
    serverError: 15,
    clientError: 8,
    networkError: 12
  },

  backup: {
    maxBackupsPerFile: 10,
    directory: '.guardian-backups'
  },

  privacy: {
    redactPatterns: [
      /password['":\s]*['"'][^'"]+['"']/gi,
      /api[_-]?key['":\s]*['"'][^'"]+['"']/gi,
      /token['":\s]*['"'][^'"]+['"']/gi
    ],
    enableRedaction: true
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════════════
const sessionId = `guardian_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const reports = [];
let browserInstance = null;

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function sanitizeForExternalAPI(text) {
  if (!CONFIG.privacy.enableRedaction || typeof text !== 'string') return text;
  let sanitized = text;
  CONFIG.privacy.redactPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  return sanitized;
}

async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down...`);
  if (browserInstance) await browserInstance.close();
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Save to file
fs.writeFileSync('guardian-v3.3-codex-tomcat-PART1.js', full_code);
print("Part 1 created (setup code)")
