import { render, screen } from "@testing-library/react";
import { Pagination } from "@/components/Pagination";

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => ({
  usePathname: () => "/transactions",
  useSearchParams: () => new URLSearchParams("type=expense"),
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe("Pagination", () => {
  test("renders nothing when totalPages <= 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} totalItems={5} />
    );
    expect(container.innerHTML).toBe("");
  });

  test("renders nothing when totalPages is 0", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={0} totalItems={0} />
    );
    expect(container.innerHTML).toBe("");
  });

  test("shows total items count", () => {
    render(<Pagination currentPage={1} totalPages={3} totalItems={55} />);
    expect(screen.getByText("55 total")).toBeInTheDocument();
  });

  test("renders page numbers for small page count", () => {
    render(<Pagination currentPage={1} totalPages={5} totalItems={100} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  test("does not show Prev on first page", () => {
    render(<Pagination currentPage={1} totalPages={5} totalItems={100} />);
    expect(screen.queryByText("Prev")).not.toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  test("does not show Next on last page", () => {
    render(<Pagination currentPage={5} totalPages={5} totalItems={100} />);
    expect(screen.getByText("Prev")).toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  test("shows both Prev and Next on middle page", () => {
    render(<Pagination currentPage={3} totalPages={5} totalItems={100} />);
    expect(screen.getByText("Prev")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  test("generates correct href with page parameter", () => {
    render(<Pagination currentPage={1} totalPages={3} totalItems={60} />);
    const page2Link = screen.getByText("2").closest("a");
    expect(page2Link).toHaveAttribute("href", "/transactions?type=expense&page=2");
  });

  test("preserves existing search params in href", () => {
    render(<Pagination currentPage={1} totalPages={3} totalItems={60} />);
    const nextLink = screen.getByText("Next").closest("a");
    expect(nextLink?.getAttribute("href")).toContain("type=expense");
    expect(nextLink?.getAttribute("href")).toContain("page=2");
  });

  test("highlights current page", () => {
    render(<Pagination currentPage={2} totalPages={5} totalItems={100} />);
    const page2Link = screen.getByText("2").closest("a");
    expect(page2Link).toHaveClass("bg-primary");
  });

  test("shows ellipsis for large page counts", () => {
    render(<Pagination currentPage={5} totalPages={10} totalItems={200} />);
    // Should show: 1 ... 4 5 6 ... 10
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    const ellipses = screen.getAllByText("...");
    expect(ellipses.length).toBe(2);
  });

  test("does not show leading ellipsis on page 2", () => {
    render(<Pagination currentPage={2} totalPages={10} totalItems={200} />);
    // Should show: 1 2 3 ... 10
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    const ellipses = screen.getAllByText("...");
    expect(ellipses.length).toBe(1);
  });

  test("does not show trailing ellipsis near last page", () => {
    render(<Pagination currentPage={9} totalPages={10} totalItems={200} />);
    // Should show: 1 ... 8 9 10
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    const ellipses = screen.getAllByText("...");
    expect(ellipses.length).toBe(1);
  });
});
