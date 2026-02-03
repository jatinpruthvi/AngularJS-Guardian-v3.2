# Contributing to AngularJS Guardian

First off, thank you for considering contributing to AngularJS Guardian! It's people like you that make this tool better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/AngularJS-Guardian-v3.2.git
   cd AngularJS-Guardian-v3.2
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/jatinpruthvi/AngularJS-Guardian-v3.2.git
   ```

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed** and what you expected
- **Include your environment details** (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the proposed functionality
- **Explain why this enhancement would be useful**
- **List any alternatives** you've considered

### Code Contributions

We welcome code contributions! Here are some areas where you can help:

- **Bug fixes**: Fix existing issues
- **New features**: Implement new functionality
- **Documentation**: Improve or add documentation
- **Tests**: Add test coverage
- **Performance**: Optimize existing code

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install chromium
   ```

3. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

4. **Configure your environment**: Edit `.env` with your settings

5. **Run the guardian**:
   ```bash
   npm start
   ```

## Coding Standards

- **Use ES6+ JavaScript** features
- **Follow existing code style** (use consistent indentation, naming)
- **Add comments** for complex logic
- **Keep functions focused** (single responsibility principle)
- **Handle errors gracefully** with try-catch blocks
- **Use meaningful variable names**
- **Avoid hardcoding values** (use configuration instead)

### Code Style Guidelines

```javascript
// Good: Descriptive function names
async function performLoginFlow(page, credentials) {
  // Implementation
}

// Good: Error handling
try {
  await page.click(selector);
} catch (error) {
  console.error(`Failed to click element: ${error.message}`);
  throw error;
}

// Good: Configuration over hardcoding
const timeout = CONFIG.network.timeout;
```

## Commit Guidelines

We follow conventional commit messages:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(login): add support for OAuth authentication

- Implement OAuth2 flow
- Add token storage mechanism
- Update documentation

Closes #123
```

```bash
fix(tomcat): handle missing log file gracefully

Previously, the application would crash if the Tomcat log file
didn't exist. Now it logs a warning and continues.

Fixes #456
```

## Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards

3. **Test your changes** thoroughly

4. **Commit your changes** with clear commit messages

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub with:
   - Clear title and description
   - Reference to related issues
   - Screenshots/examples if applicable
   - List of changes made

7. **Respond to review feedback** promptly

### PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows the project's coding standards
- [ ] Commits follow the commit message guidelines
- [ ] Documentation is updated if needed
- [ ] All tests pass (if applicable)
- [ ] No console errors or warnings
- [ ] PR description clearly explains the changes
- [ ] Related issues are linked

## Testing

Currently, the project doesn't have automated tests. If you'd like to contribute by adding tests, that would be greatly appreciated!

When testing manually:

1. Test with different configurations
2. Verify the fix application works correctly
3. Check that error detection is accurate
4. Ensure browser automation works smoothly
5. Test on different operating systems if possible

## Documentation

Good documentation is crucial! When contributing:

- Update README.md if you change functionality
- Add inline comments for complex code
- Update .env.example if you add new configuration options
- Consider adding examples for new features

## Questions?

If you have questions or need help:

- Open an issue with the "question" label
- Check existing issues for similar questions
- Review the documentation in the `/docs` directory

## Recognition

Contributors will be recognized in:

- The README.md file
- Release notes
- The project's contributors page

Thank you for contributing to AngularJS Guardian! 🎉
