import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Example component for testing
const ExampleComponent = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div>
      <h1>{title}</h1>
      <div>{children}</div>
    </div>
  );
};

describe("ExampleComponent", () => {
  it("should render title and children", () => {
    render(
      <ExampleComponent title="Test Title">
        <p>Test content</p>
      </ExampleComponent>,
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should have correct heading level", () => {
    render(
      <ExampleComponent title="Test Title">
        <p>Test content</p>
      </ExampleComponent>,
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Test Title");
  });
});
