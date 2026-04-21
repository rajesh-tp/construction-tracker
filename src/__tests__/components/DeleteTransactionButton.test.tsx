import { render, screen, fireEvent, act } from "@testing-library/react";
import { DeleteTransactionButton } from "@/app/accounts/[id]/_components/DeleteTransactionButton";

// Mock server action
const mockDeleteTransaction = jest.fn();
jest.mock("@/lib/actions", () => ({
  deleteTransaction: (...args: unknown[]) => mockDeleteTransaction(...args),
}));

// Mock sonner toast
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

describe("DeleteTransactionButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders delete button", () => {
    render(<DeleteTransactionButton id={1} />);
    const button = screen.getByTitle("Delete transaction");
    expect(button).toBeInTheDocument();
  });

  test("shows Delete text on desktop", () => {
    render(<DeleteTransactionButton id={1} />);
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  test("opens confirmation modal on click", () => {
    render(<DeleteTransactionButton id={1} />);
    fireEvent.click(screen.getByTitle("Delete transaction"));
    expect(screen.getByText("Delete Transaction")).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  test("shows confirmation text in modal", () => {
    render(<DeleteTransactionButton id={1} />);
    fireEvent.click(screen.getByTitle("Delete transaction"));
    expect(screen.getByText(/account balance will be recalculated/)).toBeInTheDocument();
  });

  test("shows Cancel and Delete buttons in modal", () => {
    render(<DeleteTransactionButton id={1} />);
    fireEvent.click(screen.getByTitle("Delete transaction"));
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    // The delete button in the modal (different from the trigger)
    const deleteButtons = screen.getAllByRole("button");
    const modalDelete = deleteButtons.find((btn) => btn.textContent === "Delete");
    expect(modalDelete).toBeInTheDocument();
  });

  test("closes modal on Cancel click", () => {
    render(<DeleteTransactionButton id={1} />);
    fireEvent.click(screen.getByTitle("Delete transaction"));
    expect(screen.getByText("Delete Transaction")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Delete Transaction")).not.toBeInTheDocument();
  });

  test("closes modal on Escape key", () => {
    render(<DeleteTransactionButton id={1} />);
    fireEvent.click(screen.getByTitle("Delete transaction"));
    expect(screen.getByText("Delete Transaction")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Delete Transaction")).not.toBeInTheDocument();
  });

  test("closes modal on backdrop click", () => {
    render(<DeleteTransactionButton id={1} />);
    fireEvent.click(screen.getByTitle("Delete transaction"));
    // Click the backdrop (the outer div with bg-black/50)
    const backdrop = screen.getByText("Delete Transaction").closest(".fixed");
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(screen.queryByText("Delete Transaction")).not.toBeInTheDocument();
  });

  test("does not close modal when clicking inside dialog", () => {
    render(<DeleteTransactionButton id={1} />);
    fireEvent.click(screen.getByTitle("Delete transaction"));
    // Click inside the dialog content
    fireEvent.click(screen.getByText("This action cannot be undone."));
    expect(screen.getByText("Delete Transaction")).toBeInTheDocument();
  });

  test("calls deleteTransaction and shows success toast on confirm", async () => {
    mockDeleteTransaction.mockResolvedValueOnce({ status: "success", message: "Transaction deleted." });
    render(<DeleteTransactionButton id={42} />);
    fireEvent.click(screen.getByTitle("Delete transaction"));
    // Find the modal's red delete button (has bg-accent-red class)
    const modal = screen.getByText("Delete Transaction").closest(".fixed")!;
    const confirmBtn = modal.querySelector("button.bg-accent-red") as HTMLElement;
    fireEvent.click(confirmBtn);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(mockDeleteTransaction).toHaveBeenCalledWith(42);
    expect(mockToastSuccess).toHaveBeenCalledWith("Transaction deleted.");
  });

  test("shows error toast on failed deletion", async () => {
    mockDeleteTransaction.mockResolvedValueOnce({ status: "error", message: "Cannot delete." });
    render(<DeleteTransactionButton id={1} />);
    fireEvent.click(screen.getByTitle("Delete transaction"));
    const modal = screen.getByText("Delete Transaction").closest(".fixed")!;
    const confirmBtn = modal.querySelector("button.bg-accent-red") as HTMLElement;
    fireEvent.click(confirmBtn);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(mockToastError).toHaveBeenCalledWith("Cannot delete.");
  });
});
