import Button from "./Button.jsx";

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "primary",
    isLoading = false,
    onCancel,
    onConfirm,
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-on-surface/40 px-md py-lg backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            <div className="w-[min(100%,28rem)] min-w-0 rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-xl">
                <h2 id="confirm-dialog-title" className="text-headline-lg font-semibold text-on-surface">
                    {title}
                </h2>
                <p className="mt-sm min-w-0 break-words text-body-md text-on-surface-variant">{message}</p>

                <div className="mt-lg flex min-w-0 flex-col-reverse gap-sm sm:flex-row sm:justify-end">
                    <Button
                        className="w-full px-md py-sm sm:w-auto"
                        disabled={isLoading}
                        onClick={onCancel}
                        type="button"
                        variant="secondary"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        className="w-full px-md text-white py-sm sm:w-auto"
                        disabled={isLoading}
                        onClick={onConfirm}
                        type="button"
                        variant={variant === "danger" ? "danger" : "primary"}
                    >
                        {isLoading ? "Processing..." : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
