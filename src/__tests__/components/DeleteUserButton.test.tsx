import { render, screen, fireEvent, act } from "@testing-library/react";
import { DeleteUserButton } from "@/app/users/[id]/_components/DeleteUserButton";

// Mock server action
const mockDeleteUser = jest.fn();
jest.mock("@/lib/actions", () => ({
  deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
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

describe("DeleteUserButton", () => {
  beforeEach(() => jest.clearAllMocks());

  test("renders button with correct text", () => {
    render(<DeleteUserButton id={5} name="Test User" />);
    expect(screen.getByText("Delete User")).toBeInTheDocument();
  });

  test("opens modal on click", () => {
    render(<DeleteUserButton id={5} name="Test User" />);
    fireEvent.click(screen.getByText("Delete User"));
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  test("shows user name in confirmation message", () => {
    render(<DeleteUserButton id={5} name="Rajesh Kumar" />);
    fireEvent.click(screen.getByText("Delete User"));
    expect(screen.getByText(/Rajesh Kumar/)).toBeInTheDocument();
  });

  test("shows warning about construction assignments", () => {
    render(<DeleteUserButton id={5} name="Test" />);
    fireEvent.click(screen.getByText("Delete User"));
    expect(screen.getByText(/construction assignments/)).toBeInTheDocument();
  });

  test("closes modal on Cancel", () => {
    render(<DeleteUserButton id={5} name="Test" />);
    fireEvent.click(screen.getByText("Delete User"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("This action cannot be undone.")).not.toBeInTheDocument();
  });

  test("closes modal on Escape key", () => {
    render(<DeleteUserButton id={5} name="Test" />);
    fireEvent.click(screen.getByText("Delete User"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("This action cannot be undone.")).not.toBeInTheDocument();
  });

  test("shows Cancel and Delete buttons in modal", () => {
    render(<DeleteUserButton id={5} name="Test" />);
    fireEvent.click(screen.getByText("Delete User"));
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    // Find the modal's Delete button (not the trigger)
    const buttons = screen.getAllByRole("button");
    const deleteBtn = buttons.find((b) => b.textContent === "Delete");
    expect(deleteBtn).toBeInTheDocument();
  });

  test("calls deleteUser and redirects on success", async () => {
    mockDeleteUser.mockResolvedValueOnce({ status: "success", message: "User deleted." });
    render(<DeleteUserButton id={5} name="Test User" />);
    fireEvent.click(screen.getByText("Delete User"));
    const modal = screen.getByText("This action cannot be undone.").closest(".fixed")!;
    const confirmBtn = modal.querySelector("button.bg-accent-red") as HTMLElement;
    fireEvent.click(confirmBtn);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(mockDeleteUser).toHaveBeenCalledWith(5);
    expect(mockToastSuccess).toHaveBeenCalledWith("User deleted.");
    expect(mockPush).toHaveBeenCalledWith("/users");
  });

  test("shows error toast on failed deletion", async () => {
    mockDeleteUser.mockResolvedValueOnce({ status: "error", message: "Cannot delete." });
    render(<DeleteUserButton id={5} name="Test" />);
    fireEvent.click(screen.getByText("Delete User"));
    const modal = screen.getByText("This action cannot be undone.").closest(".fixed")!;
    const confirmBtn = modal.querySelector("button.bg-accent-red") as HTMLElement;
    fireEvent.click(confirmBtn);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(mockToastError).toHaveBeenCalledWith("Cannot delete.");
  });
});
