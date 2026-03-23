import { AlertTriangle, Eye, Save, WandSparkles } from "lucide-react";

const BuilderHeader = ({
    survey,
    autosaveText,
    saving,
    publishing,
    error,
    onTitleChange,
    onPreview,
    onSave,
    onPublish,
}) => {
    return (
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Survey Builder</div>
                    <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                        <input
                            value={survey.title}
                            onChange={(event) => onTitleChange(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg font-semibold text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            placeholder="Untitled survey"
                        />
                        <span className="text-xs text-slate-500 whitespace-nowrap">{autosaveText || "Autosave every 7s"}</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onPreview}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        <Eye size={16} />
                        Preview
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={onSave}
                        className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 disabled:opacity-60"
                    >
                        <Save size={16} />
                        {saving ? "Saving..." : "Save Draft"}
                    </button>
                    <button
                        type="button"
                        disabled={publishing}
                        onClick={onPublish}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
                    >
                        <WandSparkles size={16} />
                        {publishing ? "Publishing..." : "Publish Survey"}
                    </button>
                </div>
            </div>
            {error && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    <AlertTriangle size={14} />
                    {error}
                </div>
            )}
        </header>
    );
};

export default BuilderHeader;
