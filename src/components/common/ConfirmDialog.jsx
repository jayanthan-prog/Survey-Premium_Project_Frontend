import { AlertCircle } from "lucide-react";

const toneClassByType = {
    danger: {
        icon: "bg-red-50 text-red-400",
        confirm: "bg-red-500 hover:bg-red-600 text-white",
    },
    warning: {
        icon: "bg-amber-50 text-amber-500",
        confirm: "bg-amber-500 hover:bg-amber-600 text-white",
    },
    info: {
        icon: "bg-blue-50 text-blue-500",
        confirm: "bg-blue-600 hover:bg-blue-700 text-white",
    },
};

export default function ConfirmDialog({
    open,
    title = "Confirm Action",
    message = "Are you sure you want to continue?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    tone = "danger",
    onCancel,
    onConfirm,
}) {
    if (!open) return null;

    const toneClass = toneClassByType[tone] || toneClassByType.danger;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[2px]">
            <div className="w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${toneClass.icon}`}>
                    <AlertCircle size={20} strokeWidth={2.25} />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${toneClass.confirm}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
