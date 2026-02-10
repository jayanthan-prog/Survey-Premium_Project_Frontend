import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const SurveyPreviewPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const basePath = useMemo(
        () => (user?.role === "APPROVER" ? "/approver/surveys" : "/admin/surveys"),
        [user]
    );

    const draft = useMemo(() => {
        const raw = localStorage.getItem("surveyDraft");
        return raw ? JSON.parse(raw) : null;
    }, []);

    if (!draft) {
        return (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-gray-800">Survey Preview</h1>
                <p className="text-sm text-gray-500 mt-2">No draft found. Create a survey first.</p>
                <button
                    type="button"
                    onClick={() => navigate(`${basePath}/create`)}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm"
                >
                    Go to Builder
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Survey Preview</h1>
                    <p className="text-sm text-gray-500">Review the survey flow before publishing.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(`${basePath}/create`)}
                        className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Back to Builder
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(basePath)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm"
                    >
                        Publish Survey
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                    <div className="text-xs text-gray-400">Survey Title</div>
                    <div className="text-xl font-semibold text-gray-900">{draft.title || "Untitled Survey"}</div>
                    {draft.summary && <p className="text-sm text-gray-500 mt-1">{draft.summary}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                        <div className="text-xs text-gray-400">Category</div>
                        <div>{draft.category || "Not set"}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Start Date</div>
                        <div>{draft.startDate || "Not set"}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">End Date</div>
                        <div>{draft.endDate || "Not set"}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                        <div className="text-xs text-gray-400">OTP Required</div>
                        <div>{draft.otpRequired ? "Yes" : "No"}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">File Required</div>
                        <div>{draft.fileRequired ? "Yes" : "No"}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Anonymous</div>
                        <div>{draft.anonymous ? "Yes" : "No"}</div>
                    </div>
                </div>

                <div>
                    <div className="text-xs text-gray-400">Target Groups</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {(draft.targetGroups || []).length === 0 && (
                            <span className="text-xs text-gray-400">No groups added</span>
                        )}
                        {(draft.targetGroups || []).map((group, index) => (
                            <span
                                key={`${group}-${index}`}
                                className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs"
                            >
                                {group}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {(draft.questions || []).map((question, index) => (
                    <div key={question.id || index} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-xs text-gray-400">Question {index + 1}</div>
                                <div className="text-sm font-semibold text-gray-900 mt-1">
                                    {question.text || "Untitled question"}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Type: {question.type.replace("_", " ")}
                                </div>
                            </div>
                            <span className="text-xs text-gray-400">
                                {question.required ? "Required" : "Optional"}
                            </span>
                        </div>
                        {(question.type === "single_choice" || question.type === "multiple_choice") && (
                            <ul className="mt-3 space-y-2 text-sm text-gray-600">
                                {(question.options || []).map((option, optionIndex) => (
                                    <li key={`${question.id}-preview-${optionIndex}`} className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                                        <div>
                                            <div>{option}</div>
                                            {question.optionFiles?.[optionIndex] && (
                                                <div className="text-xs text-gray-400">
                                                    File: {question.optionFiles[optionIndex]}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {question.type === "rating" && (
                            <div className="mt-3 text-sm text-gray-600">
                                Scale {question.scaleMin} to {question.scaleMax}
                            </div>
                        )}
                        {question.type === "file_upload" && (
                            <div className="mt-3 text-sm text-gray-600">
                                <div className="text-xs text-gray-400">File upload</div>
                                <div className="mt-2 h-10 rounded-lg border border-dashed border-gray-200 bg-gray-50" />
                                {question.fileName && (
                                    <div className="text-xs text-gray-400 mt-1">Selected: {question.fileName}</div>
                                )}
                            </div>
                        )}
                        {question.type === "short_text" && (
                            <div className="mt-3 h-9 rounded-lg border border-dashed border-gray-200" />
                        )}
                        {question.type === "long_text" && (
                            <div className="mt-3 h-20 rounded-lg border border-dashed border-gray-200" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SurveyPreviewPage;
