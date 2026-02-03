# Architecture Overview

## System Architecture

AngularJS Guardian is built as a modular autonomous system with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                    AngularJS Guardian                        │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Browser    │    │   Monitor    │    │  AI Client   │ │
│  │  Automation  │◄──►│   Engine     │◄──►│  Interface   │ │
│  │  (Playwright)│    │              │    │  (OpenAI/    │ │
│  │              │    │              │    │   Codex)     │ │
│  └──────────────┘    └──────┬───────┘    └──────────────┘ │
│                             │                               │
│                             ▼                               │
│                      ┌──────────────┐                       │
│                      │   Analyzer   │                       │
│                      │   Engine     │                       │
│                      │              │                       │
│                      └──────┬───────┘                       │
│                             │                               │
│                             ▼                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  Log Parser  │◄──►│  Fix Engine  │◄──►│  Git Manager │ │
│  │  (Tomcat)    │    │              │    │              │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Browser Automation (Playwright)

**Purpose**: Controls browser and simulates user interactions

**Key Responsibilities**:
- Launch and manage browser instances
- Navigate to application routes
- Execute login flows
- Click interactive elements (buttons, links)
- Fill forms and submit data
- Capture console logs and network traffic

**Technologies**: Playwright, Chromium

### 2. Monitor Engine

**Purpose**: Observes application behavior and detects errors

**Key Responsibilities**:
- Listen for console errors (JavaScript exceptions)
- Monitor network requests and responses
- Track HTTP status codes (4xx, 5xx errors)
- Collect error context (stack traces, request details)
- Determine error severity

**Detection Methods**:
- Console API monitoring
- Network interception
- Response status validation
- Log file polling

### 3. Analyzer Engine

**Purpose**: Processes errors and prepares data for AI analysis

**Key Responsibilities**:
- Parse error messages and stack traces
- Extract relevant code context
- Identify affected files and line numbers
- Build comprehensive error reports
- Sanitize sensitive data
- Format data for AI consumption

**Analysis Flow**:
```
Error Detected → Stack Trace Parsing → File Identification →
Context Extraction → Data Sanitization → AI Prompt Generation
```

### 4. Log Parser (Tomcat)

**Purpose**: Extracts Java backend errors from Tomcat logs

**Key Responsibilities**:
- Read and tail catalina.out log file
- Detect Java exceptions and stack traces
- Parse error messages and exception types
- Extract file names and line numbers
- Correlate frontend errors with backend issues

**Supported Log Formats**:
- Standard Tomcat catalina.out
- Java stack traces
- Custom log patterns (configurable)

### 5. AI Client Interface

**Purpose**: Communicates with AI services for fix generation

**Supported Providers**:
- OpenAI GPT-4
- Codex API

**Key Responsibilities**:
- Format error context as AI prompts
- Send requests to AI APIs
- Parse AI responses
- Extract code fixes from AI suggestions
- Handle API rate limits and errors
- Retry on failures

**Prompt Structure**:
```javascript
{
  context: {
    error: "TypeError: Cannot read property 'name' of undefined",
    file: "src/controllers/UserController.js",
    line: 45,
    code: "// surrounding code context",
    stackTrace: "// full stack trace"
  },
  request: "Fix this error and provide complete corrected code"
}
```

### 6. Fix Engine

**Purpose**: Applies AI-generated fixes to codebase

**Key Responsibilities**:
- Parse AI-generated fix code
- Extract file paths and changes
- Create git patches
- Apply patches to repository
- Validate applied changes
- Rollback on failure

**Fix Application Flow**:
```
AI Response → Parse Fix Code → Generate Patch →
Test Patch → Apply Patch → Verify Changes
```

### 7. Git Manager

**Purpose**: Manages version control operations

**Key Responsibilities**:
- Create patch files from diffs
- Apply patches using `git apply`
- Commit changes with descriptive messages
- Create backup branches
- Rollback failed changes
- Track fix history

**Git Operations**:
- `git diff` - Generate patches
- `git apply` - Apply patches
- `git commit` - Save changes
- `git checkout` - Branch management

## Data Flow

### Complete Error-to-Fix Flow

```
1. User Interaction
   └──> Browser clicks button

2. Error Occurs
   └──> Console logs error
   └──> Network request fails (505)

3. Monitor Captures
   └──> Console error: "Cannot call API"
   └──> Network error: "POST /api/users → 505"

4. Analyzer Processes
   └──> Checks Tomcat logs
   └──> Finds: "HTTP/2 not supported in UserController.java:45"
   └──> Builds complete error context

5. AI Client Requests Fix
   └──> Sends error + context to OpenAI
   └──> Receives: "Change HTTP/2 to HTTP/1.1 in line 45"

6. Fix Engine Applies
   └──> Generates patch file
   └──> Applies to UserController.java
   └──> Commits change

7. Browser Restarts
   └──> Fresh browser session
   └──> Re-login
   └──> Retry same action

8. Validation
   └──> No console errors
   └──> Network request succeeds (200)
   └──> Screen marked as healthy
   └──> Move to next route
```

## Configuration System

Guardian uses environment variables for configuration:

```
Environment Variables (.env)
          ↓
Configuration Loader (startup)
          ↓
Runtime Config Object
          ↓
Used by all components
```

**Configuration Categories**:
- API credentials (OpenAI/Codex)
- Application settings (URL, routes)
- Login configuration (credentials, selectors)
- Behavior settings (retries, delays)
- File paths (Tomcat logs, Java source)

## Error Handling

Guardian implements multiple levels of error handling:

### Level 1: Component-Level
Each component handles its own errors gracefully:
```javascript
try {
  await page.click(selector);
} catch (error) {
  console.error(`Click failed: ${error.message}`);
  // Retry or skip
}
```

### Level 2: Operation-Level
Operations can retry on failure:
```javascript
for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
  try {
    await performOperation();
    break; // Success
  } catch (error) {
    if (attempt === MAX_ATTEMPTS - 1) throw error;
    await sleep(RETRY_DELAY);
  }
}
```

### Level 3: System-Level
Top-level error handler prevents crashes:
```javascript
process.on('uncaughtException', (error) => {
  console.error('Fatal error:', error);
  cleanup();
  process.exit(1);
});
```

## Performance Considerations

### Optimization Strategies

1. **Selective Monitoring**
   - Only monitor relevant console messages
   - Filter out known harmless warnings
   - Focus on actionable errors

2. **Efficient Log Parsing**
   - Tail logs instead of reading entire file
   - Use streaming for large files
   - Cache parsed results

3. **Smart Retries**
   - Exponential backoff for retries
   - Circuit breaker pattern for API calls
   - Skip screens that consistently fail

4. **Resource Management**
   - Close browser contexts when not needed
   - Limit concurrent operations
   - Clear memory between iterations

## Security Considerations

### Data Sanitization

Before sending to AI:
```javascript
function sanitizeContext(context) {
  return context
    .replace(/api[_-]?key['":].*?['"\s]/gi, 'API_KEY=***')
    .replace(/password['":].*?['"\s]/gi, 'password=***')
    .replace(/token['":].*?['"\s]/gi, 'token=***');
}
```

### Safe Patch Application

```javascript
// Always validate patch before applying
function validatePatch(patch) {
  // Check for suspicious operations
  if (patch.includes('rm -rf') || patch.includes('system(')) {
    throw new Error('Dangerous operation detected');
  }
  return true;
}
```

## Extensibility

Guardian is designed to be extensible:

### Adding New AI Providers

```javascript
// Add to API_CONFIG
const API_CONFIG = {
  myProvider: {
    apiKey: process.env.MY_PROVIDER_KEY,
    baseUrl: 'https://api.myprovider.com',
    model: 'my-model-v1'
  }
};
```

### Custom Log Parsers

```javascript
// Implement parser interface
class CustomLogParser {
  async parseLog(logPath) {
    // Read and parse custom format
    return { errors: [...] };
  }
}
```

### Additional Monitors

```javascript
// Add new error detection
page.on('pageerror', (error) => {
  // Custom handling
  logError(error);
});
```

## Testing Architecture

Guardian can be tested at multiple levels:

1. **Unit Tests** - Individual component functions
2. **Integration Tests** - Component interactions
3. **End-to-End Tests** - Full workflow validation
4. **Mock Tests** - With simulated AI responses

## Future Architecture Enhancements

Potential improvements:

- **Parallel Testing** - Multiple routes simultaneously
- **Machine Learning** - Learn from past fixes
- **Distributed Mode** - Multiple agents working together
- **Dashboard** - Real-time monitoring UI
- **Webhook Integration** - Notify external systems
- **Database Storage** - Persistent fix history
