import { render, screen } from "@testing-library/react";
import { SummaryCard } from "@/components/SummaryCard";

describe("SummaryCard", () => {
  const defaultIcon = <svg data-testid="test-icon" />;

  test("renders title and value", () => {
    render(<SummaryCard title="Total Expenses" value="₹50,000" icon={defaultIcon} />);
    expect(screen.getByText("Total Expenses")).toBeInTheDocument();
    expect(screen.getByText("₹50,000")).toBeInTheDocument();
  });

  test("renders subtitle when provided", () => {
    render(
      <SummaryCard
        title="Balance"
        value="₹5,00,000"
        subtitle="Initial: ₹10,00,000"
        icon={defaultIcon}
      />
    );
    expect(screen.getByText("Initial: ₹10,00,000")).toBeInTheDocument();
  });

  test("does not render subtitle when not provided", () => {
    const { container } = render(
      <SummaryCard title="Balance" value="₹5,00,000" icon={defaultIcon} />
    );
    // No subtitle element should exist
    expect(container.querySelectorAll("p").length).toBe(2); // title + value only
  });

  test("renders icon", () => {
    render(<SummaryCard title="Test" value="100" icon={defaultIcon} />);
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  test("applies default variant styling", () => {
    const { container } = render(
      <SummaryCard title="Test" value="100" icon={defaultIcon} />
    );
    expect(container.firstChild).toHaveClass("bg-surface");
  });

  test("applies green variant styling", () => {
    const { container } = render(
      <SummaryCard title="Test" value="100" icon={defaultIcon} variant="green" />
    );
    expect(container.firstChild).toHaveClass("bg-accent-green-bg");
  });

  test("applies red variant styling", () => {
    const { container } = render(
      <SummaryCard title="Test" value="100" icon={defaultIcon} variant="red" />
    );
    expect(container.firstChild).toHaveClass("bg-accent-red-bg");
  });

  test("applies amber variant styling", () => {
    const { container } = render(
      <SummaryCard title="Test" value="100" icon={defaultIcon} variant="amber" />
    );
    expect(container.firstChild).toHaveClass("bg-accent-amber-bg");
  });
});
