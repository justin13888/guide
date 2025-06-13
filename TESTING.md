# Testing Setup

This project uses [Vitest](https://vitest.dev/) for testing with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing.

## Available Scripts

- `pnpm test` - Run tests in watch mode (interactive)
- `pnpm test:run` - Run tests once and exit
- `pnpm test:ui` - Run tests with the Vitest UI interface
- `pnpm test:coverage` - Run tests with coverage report

## Test Structure

Tests are organized in the `src/test/` directory:

- `src/test/setup.ts` - Global test configuration and mocks
- `src/test/components/` - React component tests
- `src/test/` - Other test files (utilities, API routes, etc.)

## Writing Tests

### Component Tests

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyComponent } from "~/components/MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

### Utility Function Tests

```ts
import { describe, it, expect } from "vitest";
import { myUtilityFunction } from "~/utils/myUtility";

describe("myUtilityFunction", () => {
  it("should return expected result", () => {
    const result = myUtilityFunction("input");
    expect(result).toBe("expected output");
  });
});
```

## Test Configuration

The test configuration is in `vitest.config.ts` and includes:

- JSDOM environment for DOM testing
- React plugin for JSX support
- Path aliases matching your TypeScript config
- Global test setup with common mocks

## Mocks

Common mocks are set up in `src/test/setup.ts`:

- Next.js router (`useRouter`, `useSearchParams`, `usePathname`)
- Next.js Image component
- Browser APIs (`ResizeObserver`, `matchMedia`)

## Coverage

To generate a coverage report:

```bash
pnpm test:coverage
```

This will create a coverage report in the `coverage/` directory.
