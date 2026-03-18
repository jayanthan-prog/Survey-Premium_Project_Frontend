import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const BUILDER_AUTOSAVE_KEY = "surveyBuilderDraft.v2";

const typeLabel = (value) => String(value || "short_text").replaceAll("_", " ");

const renderPlaceholder = (question) => {
    if (question.type === "long_text") {
        return <div className="mt-2 h-24 rounded-lg border border-dashed border-slate-300" />;
    }

    if (["single_choice", "multiple_choice", "dropdown"].includes(question.type)) {
        return (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {(question.options || []).map((option, index) => (
                    <li key={`${question.id}-${index}`} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-sky-500" />
                        {option}
                    </li>
                ))}
            </ul>
        );
    }

    if (question.type === "rating") {
        return (
            <div className="mt-2 text-sm text-slate-600">
                Scale from {question.scaleMin || 1} to {question.scaleMax || 5}
            </div>
        );
    }

    if (question.type === "date") {
        return <div className="mt-2 h-10 w-56 rounded-lg border border-dashed border-slate-300" />;
    }

    if (question.type === "number") {
        return <div className="mt-2 h-10 w-40 rounded-lg border border-dashed border-slate-300" />;
    }

    if (question.type === "file_upload") {
        return <div className="mt-2 h-16 rounded-lg border border-dashed border-slate-300 bg-slate-50" />;
    }

    if (question.type === "matrix") {
        return (
            <div className="mt-3 overflow-x-auto">
                <table className="min-w-full border-collapse text-xs text-slate-700">
                    <thead>
                        <tr>
                            <th className="border border-slate-200 bg-slate-50 p-2 text-left">Row / Column</th>
                            {(question.columns || []).map((column, index) => (
                                <th key={`${question.id}-column-${index}`} className="border border-slate-200 bg-slate-50 p-2 text-left">
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(question.rows || []).map((row, rowIndex) => (
                            <tr key={`${question.id}-row-${rowIndex}`}>
                                <td className="border border-slate-200 p-2 font-medium">{row}</td>
                                {(question.columns || []).map((_, colIndex) => (
                                    <td key={`${question.id}-${rowIndex}-${colIndex}`} className="border border-slate-200 p-2">
                                        <div className="h-4 w-4 rounded border border-slate-300" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return <div className="mt-2 h-10 rounded-lg border border-dashed border-slate-300" />;
};

const SurveyPreviewPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const roleBasePath = user?.role === "APPROVER" ? "/approver" : "/admin";

    const draft = useMemo(() => {
        if (location.state?.draft) return location.state.draft;

        try {
            const raw = localStorage.getItem(BUILDER_AUTOSAVE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed?.survey || null;
        } catch {
            return null;
        }
    }, [location.state]);

    if (!draft) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-slate-900">Preview</h1>
                <p className="mt-1 text-sm text-slate-500">No builder draft found.</p>
                <button
                    type="button"
                    onClick={() => navigate(`${roleBasePath}/surveys/builder/new`)}
                    className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                    Open Builder
                </button>
            </div>
        );
    }

    let number = 0;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">Survey Preview</h1>
                    <p className="text-sm text-slate-500">This is how respondents will experience the current schema.</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    <ArrowLeft size={16} />
                    Back to Builder
                </button>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-sky-700">Survey</div>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">{draft.title || "Untitled survey"}</h2>
                {draft.description && <p className="mt-2 text-sm text-slate-600">{draft.description}</p>}
            </section>

            {(draft.pages || []).map((page, pageIndex) => (
                <section key={page.id || pageIndex} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 border-b border-slate-100 pb-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Page {pageIndex + 1}</div>
                        <h3 className="text-lg font-semibold text-slate-900">{page.title || `Page ${pageIndex + 1}`}</h3>
                    </div>

                    <div className="space-y-4">
                        {(page.questions || []).map((question) => {
                            number += 1;
                            return (
                                <article key={question.id || number} className="rounded-xl border border-slate-200 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Q{number}</div>
                                    <div className="mt-1 text-base font-medium text-slate-900">{question.text || "Untitled question"}</div>
                                    {question.description && <p className="mt-1 text-sm text-slate-500">{question.description}</p>}
                                    <div className="mt-1 text-xs text-slate-500">Type: {typeLabel(question.type)}</div>
                                    {renderPlaceholder(question)}
                                </article>
                            );
                        })}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default SurveyPreviewPage;
