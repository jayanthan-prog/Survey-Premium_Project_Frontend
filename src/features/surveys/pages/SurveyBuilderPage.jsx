import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import UserListInput from "../../groups/components/UserListInput";

const createQuestion = () => ({
    id: `q-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: "",
    type: "short_text",
    required: true,
    options: ["Option 1", "Option 2"],
    scaleMin: 1,
    scaleMax: 5,
    fileName: "",
});

const QUESTION_TYPES = [
    { value: "short_text", label: "Short answer" },
    { value: "long_text", label: "Paragraph" },
    { value: "single_choice", label: "Single choice" },
    { value: "multiple_choice", label: "Multiple choice" },
    { value: "rating", label: "Rating" },
    { value: "file_upload", label: "File upload" },
];

const SurveyBuilderPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const release = location.state?.release || null;
    const [isReleaseEdit, setIsReleaseEdit] = useState(false);

    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [category, setCategory] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [otpRequired, setOtpRequired] = useState(false);
    const [fileRequired, setFileRequired] = useState(false);
    const [anonymous, setAnonymous] = useState(false);
    const [targetGroups, setTargetGroups] = useState([]);
    const [questions, setQuestions] = useState([createQuestion()]);

    const inputClassName =
        "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none";
    const labelClassName = "text-xs font-medium text-gray-500";

    const roleBasePath = useMemo(
        () => (user?.role === "APPROVER" ? "/approver" : "/admin"),
        [user]
    );

    const basePath = `${roleBasePath}/surveys`;
    const cancelPath = isReleaseEdit ? `${roleBasePath}/releases` : basePath;

    const parseWindow = (windowValue) => {
        if (!windowValue) {
            return { startDate: "", endDate: "" };
        }
        const [start, end] = windowValue.split("→").map((value) => value.trim());
        return {
            startDate: start || "",
            endDate: end || "",
        };
    };

    useEffect(() => {
        if (!release || isReleaseEdit) {
            return;
        }

        const { startDate: releaseStart, endDate: releaseEnd } = parseWindow(release.window);

        setTitle(release.survey || "");
        setSummary(release.audience ? `Audience: ${release.audience}` : "");
        setStartDate(releaseStart);
        setEndDate(releaseEnd);
        setIsReleaseEdit(true);
    }, [release, isReleaseEdit]);

    const updateQuestion = (id, patch) => {
        setQuestions((prev) =>
            prev.map((question) => (question.id === id ? { ...question, ...patch } : question))
        );
    };

    const addQuestion = () => {
        setQuestions((prev) => [...prev, createQuestion()]);
    };

    const removeQuestion = (id) => {
        setQuestions((prev) => prev.filter((question) => question.id !== id));
    };

    const addOption = (id) => {
        setQuestions((prev) =>
            prev.map((question) =>
                question.id === id
                    ? {
                        ...question,
                        options: [...question.options, `Option ${question.options.length + 1}`],
                    }
                    : question
            )
        );
    };

    const updateOption = (id, optionIndex, value) => {
        setQuestions((prev) =>
            prev.map((question) => {
                if (question.id !== id) return question;
                const nextOptions = question.options.map((opt, idx) => (idx === optionIndex ? value : opt));
                return { ...question, options: nextOptions };
            })
        );
    };

    const removeOption = (id, optionIndex) => {
        setQuestions((prev) =>
            prev.map((question) => {
                if (question.id !== id) return question;
                const nextOptions = question.options.filter((_, idx) => idx !== optionIndex);
                return {
                    ...question,
                    options: nextOptions.length ? nextOptions : ["Option 1"],
                };
            })
        );
    };

    const handlePreview = () => {
        const draft = {
            title,
            summary,
            category,
            startDate,
            endDate,
            otpRequired,
            fileRequired,
            anonymous,
            targetGroups,
            questions,
        };

        localStorage.setItem("surveyDraft", JSON.stringify(draft));
        navigate(`${basePath}/preview`);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const payload = {
            title,
            summary,
            category,
            startDate,
            endDate,
            otpRequired,
            fileRequired,
            anonymous,
            targetGroups,
            questions,
        };

        console.log("Survey payload", payload);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {isReleaseEdit ? "Update Release" : "Survey Builder"}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {isReleaseEdit
                            ? "Update release details and save changes."
                            : "Create a survey, add questions, and preview before publishing."}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(cancelPath)}
                        className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="survey-builder-form"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                    >
                        {isReleaseEdit ? "Update Release" : "Save Survey"}
                    </button>
                </div>
            </div>

            <form id="survey-builder-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                            <h2 className="text-sm font-semibold text-gray-800">Survey Details</h2>
                            <div>
                                <label className={labelClassName}>Survey Title</label>
                                <input
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    className={inputClassName}
                                    placeholder="Hostel Preference 2026"
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Summary</label>
                                <textarea
                                    value={summary}
                                    onChange={(event) => setSummary(event.target.value)}
                                    className={inputClassName}
                                    rows="3"
                                    placeholder="Share the purpose and expected responses."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClassName}>Category</label>
                                    <select
                                        value={category}
                                        onChange={(event) => setCategory(event.target.value)}
                                        className={inputClassName}
                                    >
                                        <option value="">Select category</option>
                                        <option value="PICK_N">PICK_N</option>
                                        <option value="PRIORITY">PRIORITY</option>
                                        <option value="WORKFLOW_RELAY">WORKFLOW_RELAY</option>
                                        <option value="CALENDAR_SLOT">CALENDAR_SLOT</option>
                                        <option value="ACTION_PLAN">ACTION_PLAN</option>
                                        <option value="VERIFICATION">VERIFICATION</option>
                                        <option value="AUTH">AUTH</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClassName}>Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(event) => setStartDate(event.target.value)}
                                        className={inputClassName}
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName}>End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(event) => setEndDate(event.target.value)}
                                        className={inputClassName}
                                    />
                                </div>
                            </div>
                        </div>

                        <UserListInput
                            label="Target Groups"
                            items={targetGroups}
                            setItems={setTargetGroups}
                            placeholder="Type group name and press Enter..."
                        />

                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                            <h2 className="text-sm font-semibold text-gray-800">Questions</h2>
                            <div className="space-y-4">
                                {questions.map((question, index) => {
                                    const isChoice =
                                        question.type === "single_choice" || question.type === "multiple_choice";
                                    const isRating = question.type === "rating";
                                    const isFileUpload = question.type === "file_upload";

                                    return (
                                        <div key={question.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                <div className="text-sm font-semibold text-gray-800">
                                                    Question {index + 1}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <label className="text-xs text-gray-500 flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={question.required}
                                                            onChange={(event) =>
                                                                updateQuestion(question.id, { required: event.target.checked })
                                                            }
                                                        />
                                                        Required
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeQuestion(question.id)}
                                                        className="text-xs text-red-500 hover:underline"
                                                        disabled={questions.length === 1}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className={labelClassName}>Question Text</label>
                                                <input
                                                    value={question.text}
                                                    onChange={(event) => updateQuestion(question.id, { text: event.target.value })}
                                                    className={inputClassName}
                                                    placeholder="Type the question..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className={labelClassName}>Answer Type</label>
                                                    <select
                                                        value={question.type}
                                                        onChange={(event) => updateQuestion(question.id, { type: event.target.value })}
                                                        className={inputClassName}
                                                    >
                                                        {QUESTION_TYPES.map((type) => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {isRating && (
                                                    <>
                                                        <div>
                                                            <label className={labelClassName}>Scale Min</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="10"
                                                                value={question.scaleMin}
                                                                onChange={(event) =>
                                                                    updateQuestion(question.id, { scaleMin: Number(event.target.value) })
                                                                }
                                                                className={inputClassName}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={labelClassName}>Scale Max</label>
                                                            <input
                                                                type="number"
                                                                min="2"
                                                                max="10"
                                                                value={question.scaleMax}
                                                                onChange={(event) =>
                                                                    updateQuestion(question.id, { scaleMax: Number(event.target.value) })
                                                                }
                                                                className={inputClassName}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {isFileUpload && (
                                                <div>
                                                    <label className={labelClassName}>Respondent Upload</label>
                                                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-purple-200 bg-purple-50 px-4 py-3">
                                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-purple-600 shadow-sm border border-purple-100">
                                                            <svg
                                                                width="20"
                                                                height="20"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                aria-hidden="true"
                                                            >
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                <polyline points="17 8 12 3 7 8" />
                                                                <line x1="12" y1="3" x2="12" y2="15" />
                                                            </svg>
                                                        </span>
                                                        <div>
                                                            <div className="text-sm font-medium text-purple-800">File upload</div>
                                                            <div className="text-xs text-purple-500">
                                                                Respondents will attach a file during submission.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {isChoice && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className={labelClassName}>Options</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => addOption(question.id)}
                                                            className="text-xs text-purple-600 hover:underline"
                                                        >
                                                            Add option
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {question.options.map((option, optionIndex) => (
                                                            <div key={`${question.id}-option-${optionIndex}`} className="space-y-2">
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        value={option}
                                                                        onChange={(event) =>
                                                                            updateOption(question.id, optionIndex, event.target.value)
                                                                        }
                                                                        className={inputClassName}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeOption(question.id, optionIndex)}
                                                                        className="px-3 rounded-xl border border-gray-200 text-xs text-gray-500 hover:bg-gray-50"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="text-sm text-purple-600 hover:underline"
                            >
                                Add another question
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                            <h2 className="text-sm font-semibold text-gray-800">Submission Rules</h2>
                            <label className="flex items-center justify-between text-sm text-gray-600">
                                OTP Required
                                <input
                                    type="checkbox"
                                    checked={otpRequired}
                                    onChange={(event) => setOtpRequired(event.target.checked)}
                                />
                            </label>
                            <label className="flex items-center justify-between text-sm text-gray-600">
                                File Upload Required
                                <input
                                    type="checkbox"
                                    checked={fileRequired}
                                    onChange={(event) => setFileRequired(event.target.checked)}
                                />
                            </label>
                            <label className="flex items-center justify-between text-sm text-gray-600">
                                Anonymous Responses
                                <input
                                    type="checkbox"
                                    checked={anonymous}
                                    onChange={(event) => setAnonymous(event.target.checked)}
                                />
                            </label>
                        </div>

                        <div className="bg-purple-50 rounded-2xl p-5 text-gray-900 shadow-sm border border-purple-100">
                            <div className="text-xs uppercase tracking-wide text-purple-500">Preview Ready</div>
                            <div className="text-lg font-semibold mt-2">Generate a preview before publishing.</div>
                            <button
                                type="button"
                                onClick={handlePreview}
                                className="mt-4 w-full rounded-xl bg-purple-500 text-white py-2 text-sm font-medium"
                            >
                                Preview Survey
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SurveyBuilderPage;
