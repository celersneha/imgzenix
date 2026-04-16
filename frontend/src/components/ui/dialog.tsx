import * as React from "react";
import { createPortal } from "react-dom";
import { Slot } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

const useDialogContext = () => {
  const context = React.useContext(DialogContext);

  if (!context) {
    throw new Error("Dialog components must be used inside Dialog");
  }

  return context;
};

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Dialog({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, setOpen]);

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({
  className,
  asChild = false,
  onClick,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
}) {
  const { setOpen } = useDialogContext();
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      className={className}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          setOpen(true);
        }
      }}
      {...props}
    />
  );
}

function DialogContent({
  children,
  className,
  hideClose = false,
}: React.ComponentProps<"div"> & {
  hideClose?: boolean;
}) {
  const { open, setOpen } = useDialogContext();

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-foreground/15 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        type="button"
      />
      <div
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl",
          className,
        )}
        role="dialog"
      >
        {!hideClose ? (
          <button
            aria-label="Close dialog"
            className="absolute top-4 right-4 rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X className="size-4" />
          </button>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}

function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("mb-5 space-y-2", className)} {...props} />;
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-xl font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

function DialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
