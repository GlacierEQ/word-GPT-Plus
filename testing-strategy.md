# Testing Strategy for Word-GPT-Plus

This document outlines a comprehensive testing approach to ensure reliability and stability of the Word-GPT-Plus add-in.

## Test Types

### 1. Unit Tests

Focus on testing individual functions and components in isolation:

```javascript
// Example Jest test for a utility function
describe('safelyLimitTextSize', () => {
  test('should return original text when under limit', () => {
    const text = 'Short text';
    expect(safelyLimitTextSize(text, 20)).toBe(text);
  });
  
  test('should truncate text when over limit', () => {
    const text = 'This is a very long text that should be truncated';
    const result = safelyLimitTextSize(text, 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toContain('...');
  });
  
  test('should handle null and undefined input', () => {
    expect(safelyLimitTextSize(null, 10)).toBe('');
    expect(safelyLimitTextSize(undefined, 10)).toBe('');
  });
});
```

#### Priority Unit Tests

1. **Utility Functions:**
   - Text processing utilities
   - API request formatters
   - Memory system functions
   - Safety protection functions

2. **React Hooks:**
   - Custom hooks for API requests
   - Settings management hooks
   - Memory management hooks

3. **Service Functions:**
   - API client methods
   - Settings storage operations
   - LocalStorage wrappers

### 2. Component Tests

Test React components with React Testing Library:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import EmbeddedModelPanel from './EmbeddedModelPanel';

describe('EmbeddedModelPanel', () => {
  test('renders model selection dropdown', () => {
    render(<EmbeddedModelPanel />);
    expect(screen.getByText(/Select Model/i)).toBeInTheDocument();
  });
  
  test('displays loading indicator when generating', async () => {
    render(<EmbeddedModelPanel />);
    
    // Fill prompt
    fireEvent.change(screen.getByLabelText(/Your prompt/i), {
      target: { value: 'Test prompt' }
    });
    
    // Click generate button
    fireEvent.click(screen.getByText(/Generate with Free Model/i));
    
    // Check for loading state
    expect(screen.getByText(/Generating/i)).toBeInTheDocument();
  });
});
```

#### Priority Component Tests

1. **Core Components:**
   - App.js main component
   - Tab navigation
   - Settings panels

2. **Interactive Components:**
   - Image selector and analyzer
   - Text generation forms
   - Model selection interfaces

3. **UI Elements:**
   - Error message displays
   - Loading indicators
   - Response formatters

### 3. Integration Tests

Test multiple components working together:

```javascript
describe('Text Generation Flow', () => {
  test('end-to-end text generation', async () => {
    // Mock API responses
    mockFetch.mockResponseOnce(JSON.stringify({
      choices: [{ text: 'Generated response' }]
    }));
    
    render(<App />);
    
    // Enter prompt
    fireEvent.change(screen.getByLabelText(/Enter your prompt/i), {
      target: { value: 'Test integration prompt' }
    });
    
    // Click generate button
    fireEvent.click(screen.getByText(/Generate/i));
    
    // Wait for response to appear
    await waitFor(() => {
      expect(screen.getByText(/Generated response/i)).toBeInTheDocument();
    });
    
    // Verify API was called correctly
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.openai.com'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Test integration prompt')
      })
    );
  });
});
```

### 4. E2E Tests

Test the add-in within Microsoft Word using Playwright or similar:

```javascript
test('add-in loads in Word Online', async ({ page }) => {
  await page.goto('https://www.office.com/launch/word');
  // Login flow
  
  // Open add-in
  await page.click('text=Add-ins');
  await page.click('text=Word-GPT-Plus');
  
  // Verify add-in loaded
  const addInFrame = page.frameLocator('iframe[name="Word-GPT-Plus-Frame"]');
  await expect(addInFrame.locator('h1:has-text("Word-GPT-Plus")')).toBeVisible();
});
```

## Test Coverage Goals

- **Utilities**: 90%+ coverage
- **Core Services**: 80%+ coverage
- **React Components**: 70%+ coverage
- **Integration Tests**: Cover all critical user flows

## Testing Tools

1. **Jest**: Core testing framework
2. **React Testing Library**: Component testing
3. **MSW (Mock Service Worker)**: API mocking
4. **Playwright/Cypress**: E2E testing
5. **Istanbul**: Code coverage reporting

## CI/CD Integration

Set up GitHub Actions workflow:

```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16.x'
      - run: npm ci
      - run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Testing Challenges & Solutions

### Challenge 1: Office JS API Testing

**Challenge**: Office JS API is not available in test environment.

**Solution**: Create mock implementations:

```javascript
// office-js-mock.js
global.Office = {
  context: {
    document: {
      getSelectedDataAsync: jest.fn((dataType, options, callback) => {
        callback({
          status: 'succeeded',
          value: 'Mocked selected text'
        });
      }),
      setSelectedDataAsync: jest.fn((data, options, callback) => {
        callback({ status: 'succeeded' });
      })
    }
  }
};
```

### Challenge 2: API Dependencies

**Challenge**: Tests dependent on external APIs.

**Solution**: Use consistent mock strategies:

```javascript
// setupTests.js
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('https://api.openai.com/v1/completions', (req, res, ctx) => {
    return res(
      ctx.json({
        choices: [
          {
            text: 'Mocked API response',
            finish_reason: 'stop'
          }
        ]
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Challenge 3: Async Component Testing

**Challenge**: Testing components with async operations.

**Solution**: Proper waitFor and async utilities:

```javascript
test('async component rendering', async () => {
  render(<AsyncComponent />);
  
  // Initial loading state
  expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  
  // Wait for data to load
  await waitFor(() => {
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
  });
  
  // Check final state
  expect(screen.getByText(/Data loaded/i)).toBeInTheDocument();
});
```

## Test-Driven Development

For new features, follow this TDD approach:

1. Write failing tests for the new feature
2. Implement minimal code to make tests pass
3. Refactor while keeping tests passing
4. Add integration tests for the feature
5. Document any testing edge cases

## Regression Testing Strategy

Before each release:

1. Run full test suite
2. Manually test core user flows
3. Test on different Word versions:
   - Word Online
   - Word for Windows
   - Word for Mac
4. Test with different API providers
5. Verify free options all work correctly
