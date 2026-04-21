import { render, screen, fireEvent, act } from "@testing-library/react";
import { DeleteConstructionButton } from "@/app/constructions/[id]/_components/DeleteConstructionButton";

// Mock server action
const mockDeleteConstruction = jest.fn();
jest.mock("@/lib/actions", () => ({
  deleteConstruction: (...args: unknown[]) => mockDeleteConstruction(...args),
}));

// Mock sonner
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
  }),
}));

describe("DeleteConstructionButton", () => {
  beforeEach(() => jest.clearAllMocks());

  test("renders button with correct text", () => {
    render(<DeleteConstructionButton id={1} name="Test Project" />);
    expect(screen.getByText("Delete Construction")).toBeInTheDocument();
  });

  test("opens modal on click", () => {
    render(<DeleteConstructionButton id={1} name="Test Project" />);
    fireEvent.click(screen.getByText("Delete Construction"));
    expect(screen.getByText(/Test Project/)).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  test("shows construction name in confirmation message", () => {
    render(<DeleteConstructionButton id={1} name="Rajesh Home" />);
    fireEvent.click(screen.getByText("Delete Construction"));
    expect(screen.getByText(/Rajesh Home/)).toBeInTheDocument();
  });

  test("shows warning about associated data", () => {
    render(<DeleteConstructionButton id={1} name="Test" />);
    fireEvent.click(screen.getByText("Delete Construction"));
    expect(screen.getByText(/contractors, accounts, and user assignments/)).toBeInTheDocument();
  });

  test("closes modal on Cancel", () => {
    render(<DeleteConstructionButton id={1} name="Test" />);
    fireEvent.click(screen.getByText("Delete Construction"));
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("This action cannot be undone.")).not.toBeInTheDocument();
  });

  test("closes modal on Escape key", () => {
    render(<DeleteConstructionButton id={1} name="Test" />);
    fireEvent.click(screen.getByText("Delete Construction"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("This action cannot be undone.")).not.toBeInTheDocument();
  });

  test("calls deleteConstruction and redirects on success", async () => {
    mockDeleteConstruction.mockResolvedValueOnce({ status: "success", message: "Deleted." });
    render(<DeleteConstructionButton id={3} name="Old Project" />);
    fireEvent.click(screen.getByText("Delete Construction"));
    const modal = screen.getByText("This action cannot be undone.").closest(".fixed")!;
    const confirmBtn = modal.querySelector("button.bg-accent-red") as HTMLElement;
    fireEvent.click(confirmBtn);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(mockDeleteConstruction).toHaveBeenCalledWith(3);
    expect(mockToastSuccess).toHaveBeenCalledWith("Deleted.");
    expect(mockPush).toHaveBeenCalledWith("/constructions");
  });

  test("shows error toast on failed deletion", async () => {
    mockDeleteConstruction.mockResolvedValueOnce({ status: "error", message: "Has transactions." });
    render(<DeleteConstructionButton id={1} name="Test" />);
    fireEvent.click(screen.getByText("Delete Construction"));
    const modal = screen.getByText("This action cannot be undone.").closest(".fixed")!;
    const confirmBtn = modal.querySelector("button.bg-accent-red") as HTMLElement;
    fireEvent.click(confirmBtn);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(mockToastError).toHaveBeenCalledWith("Has transactions.");
  });
});
