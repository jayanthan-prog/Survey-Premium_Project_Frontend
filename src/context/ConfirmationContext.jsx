import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";

const ConfirmationContext = createContext(null);

const DEFAULT_OPTIONS = {
    title: "Confirm Action",
    message: "Are you sure you want to continue?",
    confirmText: "Confirm",
    cancelText: "Cancel",
    tone: "danger",
};

export function ConfirmationProvider({ children }) {
    const [dialog, setDialog] = useState(null);

    const confirm = useCallback((options = {}) => {
        return new Promise((resolve) => {
            const merged = { ...DEFAULT_OPTIONS, ...options };
            setDialog({
                ...merged,
                resolve,
            });
        });
    }, []);

    const closeWith = useCallback((result) => {
        setDialog((current) => {
            if (current?.resolve) current.resolve(result);
            return null;
        });
    }, []);

    const value = useMemo(
        () => ({ confirm }),
        [confirm]
    );

    return (
        <ConfirmationContext.Provider value={value}>
            {children}
            <ConfirmDialog
                open={Boolean(dialog)}
                title={dialog?.title}
                message={dialog?.message}
                confirmText={dialog?.confirmText}
                cancelText={dialog?.cancelText}
                tone={dialog?.tone}
                onCancel={() => closeWith(false)}
                onConfirm={() => closeWith(true)}
            />
        </ConfirmationContext.Provider>
    );
}

export function useConfirmation() {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error("useConfirmation must be used within a ConfirmationProvider.");
    }
    return context;
}
