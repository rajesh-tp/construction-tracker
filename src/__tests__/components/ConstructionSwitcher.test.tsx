import { render, screen, fireEvent } from "@testing-library/react";
import { ConstructionSwitcher } from "@/components/ConstructionSwitcher";

// Mock server action
jest.mock("@/lib/actions", () => ({
  switchConstruction: jest.fn(),
}));

const mockConstructions = [
  {
    id: 1,
    name: "Rajesh Home",
    description: "3BHK project",
    isActive: true,
    createdBy: 1,
    createdAt: new Date(),
  },
  {
    id: 2,
    name: "Office Building",
    description: "Commercial",
    isActive: true,
    createdBy: 1,
    createdAt: new Date(),
  },
];

describe("ConstructionSwitcher", () => {
  beforeEach(() => jest.clearAllMocks());

  test("renders 'No constructions' when list is empty", () => {
    render(
      <ConstructionSwitcher
        constructions={[]}
        activeConstructionId={null}
        isSuperAdmin={false}
      />
    );
    expect(screen.getByText("No constructions")).toBeInTheDocument();
  });

  test("renders active construction name", () => {
    render(
      <ConstructionSwitcher
        constructions={mockConstructions}
        activeConstructionId={1}
        isSuperAdmin={false}
      />
    );
    expect(screen.getByText("Rajesh Home")).toBeInTheDocument();
  });

  test("shows 'Select...' when no construction is active", () => {
    render(
      <ConstructionSwitcher
        constructions={mockConstructions}
        activeConstructionId={null}
        isSuperAdmin={false}
      />
    );
    expect(screen.getByText("Select...")).toBeInTheDocument();
  });

  test("opens dropdown on click", () => {
    render(
      <ConstructionSwitcher
        constructions={mockConstructions}
        activeConstructionId={1}
        isSuperAdmin={false}
      />
    );
    fireEvent.click(screen.getByText("Rajesh Home"));
    // Should show both constructions in dropdown
    expect(screen.getByText("Office Building")).toBeInTheDocument();
  });

  test("shows Manage Constructions link for superadmin", () => {
    render(
      <ConstructionSwitcher
        constructions={mockConstructions}
        activeConstructionId={1}
        isSuperAdmin={true}
      />
    );
    fireEvent.click(screen.getByText("Rajesh Home"));
    expect(screen.getByText("Manage Constructions")).toBeInTheDocument();
  });

  test("does not show Manage Constructions for non-superadmin", () => {
    render(
      <ConstructionSwitcher
        constructions={mockConstructions}
        activeConstructionId={1}
        isSuperAdmin={false}
      />
    );
    fireEvent.click(screen.getByText("Rajesh Home"));
    expect(screen.queryByText("Manage Constructions")).not.toBeInTheDocument();
  });

  test("closes dropdown when clicking outside", () => {
    render(
      <div>
        <span>Outside</span>
        <ConstructionSwitcher
          constructions={mockConstructions}
          activeConstructionId={1}
          isSuperAdmin={false}
        />
      </div>
    );
    fireEvent.click(screen.getByText("Rajesh Home"));
    expect(screen.getByText("Office Building")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText("Outside"));
    expect(screen.queryByText("Office Building")).not.toBeInTheDocument();
  });

  test("highlights active construction in dropdown", () => {
    render(
      <ConstructionSwitcher
        constructions={mockConstructions}
        activeConstructionId={1}
        isSuperAdmin={false}
      />
    );
    fireEvent.click(screen.getByText("Rajesh Home"));
    // The active construction button in the dropdown should have check icon
    const buttons = screen.getAllByRole("button");
    const activeButton = buttons.find((b) => b.textContent?.includes("Rajesh Home") && b.closest(".p-1"));
    expect(activeButton).toHaveClass("font-medium");
  });

  test("calls switchConstruction when selecting different construction", () => {
    const { switchConstruction } = require("@/lib/actions");
    render(
      <ConstructionSwitcher
        constructions={mockConstructions}
        activeConstructionId={1}
        isSuperAdmin={false}
      />
    );
    fireEvent.click(screen.getByText("Rajesh Home"));
    // Click on "Office Building" in the dropdown
    const dropdownButtons = screen.getAllByRole("button");
    const officeButton = dropdownButtons.find((b) => b.textContent === "Office Building");
    if (officeButton) {
      fireEvent.click(officeButton);
    }
    expect(switchConstruction).toHaveBeenCalledWith(2);
  });

  test("does not call switchConstruction when selecting same construction", () => {
    const { switchConstruction } = require("@/lib/actions");
    render(
      <ConstructionSwitcher
        constructions={mockConstructions}
        activeConstructionId={1}
        isSuperAdmin={false}
      />
    );
    fireEvent.click(screen.getByText("Rajesh Home"));
    // Click on "Rajesh Home" (already active) in the dropdown
    const dropdownButtons = screen.getAllByRole("button");
    const activeButton = dropdownButtons.find((b) => b.textContent?.includes("Rajesh Home") && b.closest(".p-1"));
    if (activeButton) {
      fireEvent.click(activeButton);
    }
    expect(switchConstruction).not.toHaveBeenCalled();
  });
});
