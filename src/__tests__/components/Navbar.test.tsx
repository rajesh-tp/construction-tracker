import { render, screen, fireEvent } from "@testing-library/react";
import { Navbar } from "@/components/Navbar";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock server action
jest.mock("@/lib/actions", () => ({
  logout: jest.fn(),
  switchConstruction: jest.fn(),
}));

const mockConstructions = [
  { id: 1, name: "Test Project", description: null, isActive: true, createdBy: 1, createdAt: new Date() },
];

describe("Navbar", () => {
  test("renders logo text", () => {
    render(<Navbar isAuthenticated={false} />);
    expect(screen.getByText("Construction Tracker")).toBeInTheDocument();
  });

  test("shows Login link when not authenticated", () => {
    render(<Navbar isAuthenticated={false} />);
    expect(screen.getAllByText("Login").length).toBeGreaterThan(0);
  });

  test("shows Logout button when authenticated", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Admin"
        userRole="superadmin"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    expect(screen.getAllByText("Logout").length).toBeGreaterThan(0);
  });

  test("shows user name when authenticated", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Rajesh"
        userRole="owner"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    expect(screen.getByText("Rajesh")).toBeInTheDocument();
  });

  test("shows navigation links when authenticated", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Admin"
        userRole="superadmin"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Contractors").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Accounts").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Transactions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reports").length).toBeGreaterThan(0);
  });

  test("shows Users link for superadmin only", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Admin"
        userRole="superadmin"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
  });

  test("hides Users link for owner role", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Owner"
        userRole="owner"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });

  test("shows limited links for contractor role", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Contractor"
        userRole="contractor"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    // Contractors should only see Dashboard and Transactions
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Transactions").length).toBeGreaterThan(0);
    expect(screen.queryByText("Contractors")).not.toBeInTheDocument();
    expect(screen.queryByText("Reports")).not.toBeInTheDocument();
  });

  test("hides Settings for contractor role", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Contractor"
        userRole="contractor"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });

  test("shows Settings for owner role", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Owner"
        userRole="owner"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    expect(screen.getAllByText("Settings").length).toBeGreaterThan(0);
  });

  test("toggles mobile menu on hamburger click", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Admin"
        userRole="superadmin"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    const toggleBtn = screen.getByLabelText("Toggle menu");
    fireEvent.click(toggleBtn);
    // Mobile menu should be expanded (max-h-96 class)
    const mobileMenu = toggleBtn.closest("nav")?.querySelector(".md\\:hidden.overflow-hidden");
    expect(mobileMenu).toHaveClass("max-h-96");
  });

  test("shows active construction name", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Admin"
        userRole="superadmin"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    expect(screen.getAllByText("Test Project").length).toBeGreaterThan(0);
  });

  test("collapses mobile menu on second hamburger click", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Admin"
        userRole="superadmin"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    const toggleBtn = screen.getByLabelText("Toggle menu");
    fireEvent.click(toggleBtn); // open
    fireEvent.click(toggleBtn); // close
    const mobileMenu = toggleBtn.closest("nav")?.querySelector(".md\\:hidden.overflow-hidden");
    expect(mobileMenu).toHaveClass("max-h-0");
  });

  test("mobile menu shows links for authenticated user", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Admin"
        userRole="superadmin"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    const toggleBtn = screen.getByLabelText("Toggle menu");
    fireEvent.click(toggleBtn);
    // Desktop and mobile links both render — just check they exist
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Logout").length).toBeGreaterThanOrEqual(2);
  });

  test("mobile menu shows Login when not authenticated", () => {
    render(<Navbar isAuthenticated={false} />);
    const toggleBtn = screen.getByLabelText("Toggle menu");
    fireEvent.click(toggleBtn);
    expect(screen.getAllByText("Login").length).toBeGreaterThanOrEqual(2);
  });

  test("shows Users link in both desktop and mobile for superadmin", () => {
    render(
      <Navbar
        isAuthenticated={true}
        userName="Admin"
        userRole="superadmin"
        constructions={mockConstructions}
        activeConstructionId={1}
      />
    );
    // Desktop + mobile versions
    expect(screen.getAllByText("Users").length).toBeGreaterThanOrEqual(2);
  });
});
