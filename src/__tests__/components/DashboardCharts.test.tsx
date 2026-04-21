import { render, screen } from "@testing-library/react";
import { DashboardCharts } from "@/components/DashboardCharts";

describe("DashboardCharts", () => {
  test("renders empty state when no monthly data", () => {
    render(<DashboardCharts monthlyData={[]} categoryData={[]} />);
    expect(screen.getByText("No transaction data yet.")).toBeInTheDocument();
    expect(screen.getByText("No expense data yet.")).toBeInTheDocument();
  });

  test("renders monthly chart section title", () => {
    render(<DashboardCharts monthlyData={[]} categoryData={[]} />);
    expect(screen.getByText("Monthly Expenses & Payments")).toBeInTheDocument();
    expect(screen.getByText("Expense by Category")).toBeInTheDocument();
  });

  test("renders monthly data with formatted months", () => {
    const monthlyData = [
      { month: "2025-01", totalExpenses: 100000, totalPayments: 50000 },
      { month: "2025-02", totalExpenses: 200000, totalPayments: 75000 },
    ];
    render(<DashboardCharts monthlyData={monthlyData} categoryData={[]} />);
    expect(screen.getByText("Jan 25")).toBeInTheDocument();
    expect(screen.getByText("Feb 25")).toBeInTheDocument();
  });

  test("renders category breakdown with percentages", () => {
    const categoryData = [
      { category: "Material Purchase", total: 300000 },
      { category: "Labour Payment", total: 200000 },
    ];
    render(<DashboardCharts monthlyData={[]} categoryData={categoryData} />);
    expect(screen.getByText("Material Purchase")).toBeInTheDocument();
    expect(screen.getByText("Labour Payment")).toBeInTheDocument();
    // 300000 / 500000 = 60.0%
    expect(screen.getByText(/60\.0%/)).toBeInTheDocument();
    // 200000 / 500000 = 40.0%
    expect(screen.getByText(/40\.0%/)).toBeInTheDocument();
  });

  test("renders legend for monthly chart", () => {
    const monthlyData = [
      { month: "2025-01", totalExpenses: 100000, totalPayments: 50000 },
    ];
    render(<DashboardCharts monthlyData={monthlyData} categoryData={[]} />);
    expect(screen.getByText("Expenses")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
  });

  test("limits to last 12 months", () => {
    const monthlyData = Array.from({ length: 15 }, (_, i) => ({
      month: `2024-${String(i + 1).padStart(2, "0")}`,
      totalExpenses: (i + 1) * 10000,
      totalPayments: (i + 1) * 5000,
    }));
    render(<DashboardCharts monthlyData={monthlyData} categoryData={[]} />);
    // Should show months 4-15 (last 12), not months 1-3
    expect(screen.queryByText("Jan 24")).not.toBeInTheDocument(); // month 1 excluded
    expect(screen.getByText("Apr 24")).toBeInTheDocument(); // month 4 included
  });

  test("renders formatted currency values", () => {
    const monthlyData = [
      { month: "2025-06", totalExpenses: 150000, totalPayments: 75000 },
    ];
    render(<DashboardCharts monthlyData={monthlyData} categoryData={[]} />);
    // INR format
    expect(screen.getByText("Jun 25")).toBeInTheDocument();
  });

  test("handles single category at 100%", () => {
    const categoryData = [
      { category: "Material Purchase", total: 500000 },
    ];
    render(<DashboardCharts monthlyData={[]} categoryData={categoryData} />);
    expect(screen.getByText(/100\.0%/)).toBeInTheDocument();
  });
});
