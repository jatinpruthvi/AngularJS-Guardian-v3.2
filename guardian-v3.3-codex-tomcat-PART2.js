
// ═══════════════════════════════════════════════════════════════════════════
// NETWORK TRACKER (POINT 8: Response body capture)
// ═══════════════════════════════════════════════════════════════════════════
class NetworkTracker {
  constructor() {
    this.requests = new Map();
    this.completed = [];
    this.failures = [];
    this.statusCodeCounts = {};
  }

  trackRequest(request) {
    const url = request.url();
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url,
      endpoint: this.extractEndpoint(url),
      method: request.method(),
      startTime: Date.now(),
      timestamp: Date.now()
    };
    this.requests.set(request, entry);
  }

  async trackResponse(response) {
    const request = response.request();
    const entry = this.requests.get(request);
    if (!entry) return;

    const status = response.status();
    const completed = {
      ...entry,
      status,
      statusText: response.statusText(),
      duration: Date.now() - entry.startTime
    };

    this.statusCodeCounts[status] = (this.statusCodeCounts[status] || 0) + 1;

    // POINT 8: Capture response body for backend errors
    if (status >= 400 && CONFIG.network.captureResponseBody) {
      try {
        const body = await response.text();
        if (body && body.length > 0) {
          completed.responseBody = body.length > CONFIG.network.maxBodySize 
            ? body.slice(0, CONFIG.network.maxBodySize) + '...[truncated]'
            : body;
        }
      } catch {}
    }

    if (status >= 400) {
      completed.category = status >= 500 ? 'server_error' : 'client_error';
      this.failures.push(completed);
    }

    this.completed.push(completed);
    this.requests.delete(request);
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
    this.requests.delete(request);
  }

  extractEndpoint(url) {
    try {
      const parsed = new URL(url);
      let pathname = parsed.pathname
        .replace(/\/\d+/g, '/:id')
        .replace(/\/[a-f0-9-]{36}/gi, '/:uuid');
      return `${parsed.origin}${pathname}`;
    } catch {
      return url.split('?')[0];
    }
  }

  getSummary() {
    return {
      totalRequests: this.completed.length,
      failedRequests: this.failures.length,
      failures: this.failures.slice(-10),
      statusCodeDistribution: { ...this.statusCodeCounts }
    };
  }

  calculateHealthImpact() {
    let impact = 0;
    this.failures.forEach(f => {
      if (f.status >= 500) impact += CONFIG.healthImpact.serverError;
      else if (f.status >= 400) impact += CONFIG.healthImpact.clientError;
      else if (f.status === 0) impact += CONFIG.healthImpact.networkError;
    });
    return Math.min(impact, 50);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TOMCAT LOG FILE PARSER — Get Java Backend Errors
// ═══════════════════════════════════════════════════════════════════════════

async function getJavaErrorFromLogs(networkFailure) {
  if (!CONFIG.backend.logFilePath || !fs.existsSync(CONFIG.backend.logFilePath)) {
    if (CONFIG.verbose) {
      console.log('  ⚪ Tomcat log file not configured or not found');
    }
    return null;
  }

  try {
    const endpoint = networkFailure.endpoint || networkFailure.url;
    const errorTime = new Date(networkFailure.timestamp || Date.now());

    console.log(`  🔍 Searching Tomcat logs for Java errors: ${endpoint}`);

    const logLines = await readLastNLines(CONFIG.backend.logFilePath, CONFIG.backend.maxLogLines);
    const javaErrors = parseJavaErrors(logLines, endpoint);

    if (javaErrors.length > 0) {
      const latestError = javaErrors[0];
      console.log(`  ✅ Found Java error: ${latestError.exception} at ${latestError.javaFile}:${latestError.lineNumber}`);
      return latestError;
    } else {
      if (CONFIG.verbose) {
        console.log(`  ⚪ No matching Java errors in logs`);
      }
    }
  } catch (error) {
    console.log(`  ⚠️  Error reading log file: ${error.message}`);
  }

  return null;
}

async function readLastNLines(filePath, maxLines) {
  return new Promise((resolve, reject) => {
    const lines = [];
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream });

    rl.on('line', (line) => {
      lines.push(line);
      if (lines.length > maxLines) lines.shift();
    });

    rl.on('close', () => resolve(lines));
    rl.on('error', reject);
  });
}

function parseJavaErrors(logLines, endpoint) {
  const errors = [];
  let currentError = null;
  let inStackTrace = false;

  const exceptionPattern = /(\w+Exception|\w+Error):\s*(.+)/;
  const stackTracePattern = /^\s+at\s+([\w.$]+)\(([\w.]+):?(\d+)?\)/;
  const causedByPattern = /^Caused by:\s*(\w+(?:Exception|Error)):\s*(.+)/;

  for (let line of logLines) {
    // Check if line contains exception
    if (line.includes('Exception') || line.includes('Error') || line.includes('ERROR')) {
      if (currentError && currentError.stackTrace.length > 0) {
        const logText = currentError.fullLog.toLowerCase();
        const endpointSearch = endpoint.toLowerCase().replace(/:\d+/g, '');
        if (logText.includes(endpointSearch) || logText.includes('505') || logText.includes('http')) {
          errors.push(currentError);
        }
      }

      const exceptionMatch = line.match(exceptionPattern);
      if (exceptionMatch) {
        currentError = {
          timestamp: Date.now(),
          exception: exceptionMatch[1],
          message: exceptionMatch[2].trim(),
          stackTrace: [],
          fullLog: line + '\n',
          javaFile: null,
          lineNumber: null,
          className: null,
          causedBy: null
        };
        inStackTrace = true;
      }
    } else if (currentError && inStackTrace) {
      currentError.fullLog += line + '\n';

      const stackMatch = line.match(stackTracePattern);
      if (stackMatch) {
        const [, className, fileName, lineNumber] = stackMatch;
        currentError.stackTrace.push({
          className,
          fileName,
          lineNumber: lineNumber ? parseInt(lineNumber) : null
        });

        if (!currentError.javaFile && fileName.endsWith('.java')) {
          currentError.javaFile = fileName;
          currentError.lineNumber = lineNumber ? parseInt(lineNumber) : null;
          currentError.className = className;
        }
      }

      const causedByMatch = line.match(causedByPattern);
      if (causedByMatch) {
        currentError.causedBy = {
          exception: causedByMatch[1],
          message: causedByMatch[2].trim()
        };
      }
    }
  }

  // Last error
  if (currentError && currentError.stackTrace.length > 0) {
    const logText = currentError.fullLog.toLowerCase();
    const endpointSearch = endpoint.toLowerCase().replace(/:\d+/g, '');
    if (logText.includes(endpointSearch) || logText.includes('505')) {
      errors.push(currentError);
    }
  }

  return errors.sort((a, b) => b.timestamp - a.timestamp);
}

function formatJavaErrorForCodex(javaError) {
  if (!javaError) return '';

  const parts = [];
  parts.push('\n═══════════════════════════════════════════════════════════════');
  parts.push('JAVA BACKEND ERROR FROM TOMCAT LOG');
  parts.push('═══════════════════════════════════════════════════════════════');
  parts.push(`\nException: ${javaError.exception}`);
  parts.push(`Message: ${javaError.message}`);

  if (javaError.javaFile && javaError.lineNumber) {
    parts.push(`\n⚠️  ERROR LOCATION:`);
    parts.push(`File: ${javaError.javaFile}`);
    parts.push(`Line: ${javaError.lineNumber}`);
    parts.push(`Class: ${javaError.className || 'Unknown'}`);
  }

  if (javaError.causedBy) {
    parts.push(`\nRoot Cause: ${javaError.causedBy.exception}: ${javaError.causedBy.message}`);
  }

  parts.push('\nStack Trace (First 10 frames):');
  javaError.stackTrace.slice(0, 10).forEach((frame, idx) => {
    if (frame.fileName && frame.lineNumber) {
      parts.push(`  ${idx + 1}. ${frame.className}(${frame.fileName}:${frame.lineNumber})`);
    } else {
      parts.push(`  ${idx + 1}. ${frame.className}(${frame.fileName || 'Unknown'})`);
    }
  });

  parts.push('\nFull Log (truncated to 1000 chars):');
  parts.push(javaError.fullLog.slice(0, 1000));

  parts.push('═══════════════════════════════════════════════════════════════');

  return parts.join('\n');
}

