import { Mail, X } from "lucide-react";

const BuilderMailDraftModal = ({
    open,
    onClose,
    subject,
    body,
    onSubjectChange,
    onBodyChange,
    onReset,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-[2px]">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            <Mail size={14} />
                            Mail Draft
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-slate-900">Survey notification draft</h3>
                        <p className="mt-1 text-sm text-slate-500">Edit this subject and message before sending to users.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Close mail draft"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-4 space-y-3">
                    <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</span>
                        <input
                            type="text"
                            value={subject}
                            onChange={(event) => onSubjectChange(event.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            placeholder="Enter email subject"
                        />
                    </label>

                    <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Body</span>
                        <textarea
                            value={body}
                            onChange={(event) => onBodyChange(event.target.value)}
                            rows={8}
                            className="mt-1 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            placeholder="Write your email message"
                        />
                    </label>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={onReset}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Reset to Default
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BuilderMailDraftModal;
