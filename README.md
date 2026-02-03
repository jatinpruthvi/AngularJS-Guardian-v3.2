<div align="center">

# 🛡️ AngularJS Guardian v3.3

**Autonomous AI-Powered Code Fixing System**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-1.40+-orange)](https://playwright.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

*Automatically detect, diagnose, and fix errors in your AngularJS applications with AI*

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Examples](#-examples) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Examples](#-examples)
- [Documentation](#-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

AngularJS Guardian is an autonomous system that monitors your web application for errors, analyzes them using AI (OpenAI/Codex), and automatically applies fixes to your codebase. It's like having a tireless QA engineer and developer working 24/7 to keep your application error-free.

### What Makes It Special?

✨ **Fully Autonomous** - No human intervention needed
🧠 **AI-Powered** - Uses OpenAI/Codex for intelligent code fixes  
🔄 **Self-Healing** - Applies fixes and validates they work  
🎯 **Full-Stack** - Fixes both frontend JavaScript and backend Java code  
📊 **Smart Detection** - Monitors console errors, network failures, and Tomcat logs  
🔒 **Safe** - Uses git patches for easy rollback  

## ✨ Features

### Core Capabilities

- 🔐 **Login Flow Support** - Automatically logs into protected applications
- 🎯 **Per-Screen Testing** - Tests each route systematically
- 🔄 **Retry Loops** - Keeps trying until errors are fixed
- 🌐 **Network Monitoring** - Detects 4xx and 5xx HTTP errors
- 📱 **Interactive Testing** - Clicks buttons, fills forms, tests all controls
- 🔍 **Tomcat Log Analysis** - Parses Java stack traces from catalina.out
- 🤖 **AI-Powered Fixes** - Sends full context to OpenAI/Codex for smart solutions
- ⚡ **Automatic Application** - Applies fixes via git patches
- 🔄 **Browser Restart** - Fresh browser session after each fix
- ✅ **Health Validation** - Confirms fixes work before moving on

### Supported Technologies

| Category | Technologies |
|----------|-------------|
| **Frontend** | AngularJS, JavaScript (ES6+) |
| **Backend** | Java, Apache Tomcat |
| **AI Providers** | OpenAI GPT-4, Codex API |
| **Automation** | Playwright (Chromium) |
| **Version Control** | Git |

## 🔧 How It Works

```
┌─────────────────┐
│  Start Browser  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Login to App   │◄─────────┐
└────────┬────────┘          │
         │                   │
         ▼                   │
┌─────────────────┐          │
│ Navigate Route  │          │
└────────┬────────┘          │
         │                   │
         ▼                   │
┌─────────────────┐          │
│ Test Controls   │          │
│ Monitor Errors  │          │
└────────┬────────┘          │
         │                   │
    ┌────▼────┐              │
    │ Errors? │──No──────────┤
    └────┬────┘              │
         │Yes                │
         ▼                   │
┌─────────────────┐          │
│ Analyze Logs    │          │
│ (Tomcat/Console)│          │
└────────┬────────┘          │
         │                   │
         ▼                   │
┌─────────────────┐          │
│ Send to AI      │          │
│ Get Fix Code    │          │
└────────┬────────┘          │
         │                   │
         ▼                   │
┌─────────────────┐          │
│ Apply Fix       │          │
│ (git patch)     │          │
└────────┬────────┘          │
         │                   │
         ▼                   │
┌─────────────────┐          │
│ Restart Browser │──────────┘
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Git** (for applying patches)
- **OpenAI API key** or Codex API key

### Installation

```bash
# Clone the repository
git clone https://github.com/jatinpruthvi/AngularJS-Guardian-v3.2.git
cd AngularJS-Guardian-v3.2

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your favorite editor
```

### Minimal Configuration

Edit `.env` with your settings:

```bash
# Required
OPENAI_API_KEY=sk-your-api-key-here
APP_URL=http://localhost:3000

# Optional (for apps with login)
LOGIN_ENABLED=true
LOGIN_URL=http://localhost:3000/login
APP_USERNAME=your-username
APP_PASSWORD=your-password
```

### Run

```bash
npm start
```

That's it! Guardian will now monitor and fix your application autonomously.

## ⚙️ Configuration

### Environment Variables

Guardian is configured through environment variables in your `.env` file:

#### Essential Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_PROVIDER` | No | `openai` | AI provider: `openai` or `codex` |
| `OPENAI_API_KEY` | Yes* | - | Your OpenAI API key |
| `CODEX_API_KEY` | Yes* | - | Your Codex API key (if using Codex) |
| `APP_URL` | Yes | - | Base URL of your application |
| `APP_ROUTES` | No | `/` | Comma-separated routes to test |

*One of OPENAI_API_KEY or CODEX_API_KEY is required

#### Login Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOGIN_ENABLED` | No | `false` | Enable login flow |
| `LOGIN_URL` | If login enabled | - | Login page URL |
| `APP_USERNAME` | If login enabled | - | Application username |
| `APP_PASSWORD` | If login enabled | - | Application password |
| `LOGIN_SUCCESS_URL` | No | - | URL to verify successful login |

#### Advanced Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `HEADLESS` | `false` | Run browser in headless mode |
| `MAX_SCREEN_ATTEMPTS` | `10` | Max retry attempts per screen |
| `MAX_CONTROL_ATTEMPTS` | `3` | Max retry attempts per control |
| `RETRY_DELAY` | `2000` | Delay between retries (ms) |
| `DEBUG` | `false` | Enable verbose logging |
| `TOMCAT_LOG_PATH` | - | Path to catalina.out for Java errors |
| `JAVA_SRC_PATH` | `src/main/java` | Path to Java source files |

📖 **See [.env.example](.env.example) for complete configuration reference**

## 📚 Examples

### Basic Usage (No Login)

```bash
# .env
OPENAI_API_KEY=sk-xxx
APP_URL=http://localhost:3000
APP_ROUTES=/,/about,/contact
```

[📄 Full example →](examples/basic-config.md)

### Full-Stack App with Login

```bash
# .env
OPENAI_API_KEY=sk-xxx
APP_URL=http://localhost:8080
APP_ROUTES=/dashboard,/users,/settings
LOGIN_ENABLED=true
LOGIN_URL=http://localhost:8080/login
APP_USERNAME=admin@example.com
APP_PASSWORD=SecurePass123
TOMCAT_LOG_PATH=/var/log/tomcat/catalina.out
JAVA_SRC_PATH=src/main/java
```

[📄 Full example →](examples/full-stack-config.md)

### Docker Deployment

```yaml
# docker-compose.yml
services:
  guardian:
    build: .
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - APP_URL=http://host.docker.internal:8080
      - HEADLESS=true
    volumes:
      - ./src:/app/src
      - ./.git:/app/.git
```

[📄 Full example →](examples/docker-config.md)

## 📖 Documentation

- [📘 Getting Started Guide](docs/getting-started.md) *(coming soon)*
- [🔧 Configuration Reference](docs/configuration.md) *(coming soon)*
- [🎯 Best Practices](docs/best-practices.md) *(coming soon)*
- [🐛 Troubleshooting Guide](docs/troubleshooting.md) *(coming soon)*
- [🔌 API Integration](docs/api-integration.md) *(coming soon)*

## 🐛 Troubleshooting

### Common Issues

<details>
<summary><strong>Error: "Missing API key"</strong></summary>

Ensure you've set either `OPENAI_API_KEY` or `CODEX_API_KEY` in your `.env` file:

```bash
OPENAI_API_KEY=sk-your-actual-api-key
```
</details>

<details>
<summary><strong>Login fails</strong></summary>

Verify your login selectors match your application:

```bash
# Test in browser console
document.querySelector('[name="username"]')
document.querySelector('[name="password"]')
```

Update `.env` with correct selectors:
```bash
LOGIN_USERNAME_SELECTOR=[name="email"]
LOGIN_PASSWORD_SELECTOR=[name="pwd"]
```
</details>

<details>
<summary><strong>Tomcat log not found</strong></summary>

Check the file path exists:

```bash
# Windows
dir C:\tomcat\logs\catalina.out

# Linux/Mac
ls -la /var/lib/tomcat/logs/catalina.out
```

Update `TOMCAT_LOG_PATH` in `.env` with correct path.
</details>

<details>
<summary><strong>Patches won't apply</strong></summary>

Ensure you're in a git repository:

```bash
git status
# If not initialized:
git init
git add .
git commit -m "Initial commit"
```
</details>

### Getting Help

- 📖 Check the [documentation](#-documentation)
- 🐛 [Open an issue](https://github.com/jatinpruthvi/AngularJS-Guardian-v3.2/issues)
- 💬 [Start a discussion](https://github.com/jatinpruthvi/AngularJS-Guardian-v3.2/discussions)

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. 🐛 **Report bugs** - [Open an issue](https://github.com/jatinpruthvi/AngularJS-Guardian-v3.2/issues)
2. 💡 **Suggest features** - [Start a discussion](https://github.com/jatinpruthvi/AngularJS-Guardian-v3.2/discussions)
3. 📝 **Improve documentation** - Submit a PR
4. 🔧 **Fix issues** - Check [good first issues](https://github.com/jatinpruthvi/AngularJS-Guardian-v3.2/labels/good%20first%20issue)
5. ⭐ **Star the repo** - Show your support!

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### What This Means

✅ Commercial use allowed  
✅ Modification allowed  
✅ Distribution allowed  
✅ Private use allowed  
❌ No liability  
❌ No warranty  

## 🙏 Acknowledgments

- **[Playwright](https://playwright.dev)** - Browser automation framework
- **[OpenAI](https://openai.com)** - AI-powered code generation
- All our [contributors](https://github.com/jatinpruthvi/AngularJS-Guardian-v3.2/graphs/contributors)

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/jatinpruthvi/AngularJS-Guardian-v3.2?style=social)
![GitHub forks](https://img.shields.io/github/forks/jatinpruthvi/AngularJS-Guardian-v3.2?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/jatinpruthvi/AngularJS-Guardian-v3.2?style=social)

## 🔗 Links

- [GitHub Repository](https://github.com/jatinpruthvi/AngularJS-Guardian-v3.2)
- [Issue Tracker](https://github.com/jatinpruthvi/AngularJS-Guardian-v3.2/issues)
- [Discussions](https://github.com/jatinpruthvi/AngularJS-Guardian-v3.2/discussions)

---

<div align="center">

**Made with ❤️ for the AngularJS community**

[⬆ Back to top](#-angularjs-guardian-v33)

</div>
