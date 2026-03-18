import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FileUp, Paperclip, X } from "lucide-react";
import { getSurveyById, submitSurvey } from "../../services/surveyApi";

const normalizeQuestionType = (value) => String(value || "").trim().toLowerCase().replace(/[-\s]+/g, "_");

const normalizeDisplayLogic = (logic) => {
    if (!logic || typeof logic !== "object") {
        return {
            enabled: false,
            sourceQuestionId: "",
            operator: "equals",
            expectedValue: "",
        };
    }

    return {
        enabled: Boolean(logic.enabled),
        sourceQuestionId: logic.sourceQuestionId == null ? "" : String(logic.sourceQuestionId),
        operator: String(logic.operator || "equals").toLowerCase(),
        expectedValue: logic.expectedValue,
    };
};

const toArrayValue = (value) => {
    if (Array.isArray(value)) return value.map((entry) => String(entry));
    if (value == null || value === "") return [];
    return [String(value)];
};

const hasValue = (value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    return String(value ?? "").trim().length > 0;
};

const formatBytes = (value) => {
    const size = Number(value || 0);
    if (!Number.isFinite(size) || size <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    const normalized = size / Math.pow(1024, index);
    return `${normalized.toFixed(normalized >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const matchesCondition = (logic, sourceValue) => {
    const sourceArray = toArrayValue(sourceValue);
    const sourceText = sourceArray.join(",").toLowerCase();
    const expectedArray = Array.isArray(logic.expectedValue)
        ? logic.expectedValue.map((entry) => String(entry).toLowerCase())
        : String(logic.expectedValue || "")
            .split(",")
            .map((entry) => entry.trim().toLowerCase())
            .filter(Boolean);
    const expectedText = expectedArray[0] || "";

    if (logic.operator === "answered") return hasValue(sourceValue);
    if (logic.operator === "not_answered") return !hasValue(sourceValue);
    if (logic.operator === "contains_any") {
        return expectedArray.some((entry) => sourceArray.map((item) => item.toLowerCase()).includes(entry));
    }
    if (logic.operator === "not_equals") {
        return sourceText !== expectedText;
    }
    return sourceText === expectedText;
};

const normalizeGroups = (groups) => {
    if (!Array.isArray(groups)) return [];
    return groups.map((group) => ({
        id: String(group?.id || `group-${Date.now()}`),
        label: String(group?.label || "Group"),
        repeatBasedOn: group?.repeatBasedOn == null ? "" : String(group.repeatBasedOn),
        questions: Array.isArray(group?.questions) ? group.questions : [],
        minCount: Number(group?.minCount || 0),
        maxCount: Number(group?.maxCount || 100),
    }));
};

const normalizeSkipLogic = (logic) => {
    if (!logic || typeof logic !== "object") {
        return {
            enabled: false,
            sourceQuestionId: "",
            operator: "equals",
            expectedValue: "",
            action: "jumpToPage",
            targetId: "",
        };
    }

    return {
        enabled: Boolean(logic.enabled),
        sourceQuestionId: logic.sourceQuestionId == null ? "" : String(logic.sourceQuestionId),
        operator: String(logic.operator || "equals").toLowerCase(),
        expectedValue: logic.expectedValue,
        action: logic.action || "jumpToPage",
        targetId: logic.targetId == null ? "" : String(logic.targetId),
    };
};

const normalizePages = (pages, questions) => {
    if (Array.isArray(pages) && pages.length > 0) {
        return pages;
    }
    if (Array.isArray(questions) && questions.length > 0) {
        return [{ id: "page1", title: "Questions", questions }];
    }
    return [];
};

export default function TakeSurveyPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [answers, setAnswers] = useState({});
    const [otp, setOtp] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read selected file."));
        reader.readAsDataURL(file);
    });

    useEffect(() => {
        let active = true;

        const load = async () => {
            if (!id) {
                if (active) {
                    setLoading(false);
                    setError("Survey id is missing.");
                }
                return;
            }

            try {
                const response = await getSurveyById(id);
                if (!active) return;
                setSurvey(response);
            } catch (err) {
                if (!active) return;
                setError(err?.message || "Failed to load survey.");
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [id]);

    const handleChange = (qid, value) => {
        setAnswers((prev) => ({ ...prev, [String(qid)]: value }));

        // Check for skip logic after answer change
        const question = questions.find((q) => q.id === qid);
        if (question) {
            const skipLogic = normalizeSkipLogic(question.skipLogic);
            if (skipLogic.enabled && skipLogic.sourceQuestionId === String(qid) && matchesCondition(skipLogic, value)) {
                if (skipLogic.action === "jumpToPage" && skipLogic.targetId) {
                    const targetPageIdx = pages.findIndex((p) => p.id === skipLogic.targetId);
                    if (targetPageIdx >= 0) {
                        setCurrentPageIndex(targetPageIdx);
                    }
                }
            }
        }
    };

    const goToNextPage = () => {
        if (currentPageIndex < pages.length - 1) {
            setCurrentPageIndex(currentPageIndex + 1);
            setError("");
        }
    };

    const goToPreviousPage = () => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(currentPageIndex - 1);
            setError("");
        }
    };

    const handleFileChange = async (qid, file) => {
        if (!file) {
            handleChange(qid, null);
            return;
        }

        try {
            const dataUrl = await readFileAsDataUrl(file);
            handleChange(qid, {
                file_name: file.name,
                mime_type: file.type || "application/octet-stream",
                size_bytes: Number(file.size || 0),
                data_url: dataUrl,
            });
        } catch (err) {
            setError(err?.message || "Failed to process uploaded file.");
        }
    };

    const questions = useMemo(() => (Array.isArray(survey?.questions) ? survey.questions : []), [survey]);
    const config = useMemo(() => (survey?.config && typeof survey.config === "string" ? JSON.parse(survey.config) : (survey?.config || {})), [survey]);
    const groups = useMemo(() => normalizeGroups(survey?.groups), [survey?.groups]);
    const pages = useMemo(() => normalizePages(survey?.pages, survey?.questions), [survey?.pages, survey?.questions]);

    const currentPage = useMemo(() => pages[currentPageIndex] || pages[0] || { id: "default", title: "Questions", questions: [] }, [pages, currentPageIndex]);
    const pageQuestions = useMemo(() => {
        if (!currentPage) return [];
        if (Array.isArray(currentPage.questions)) {
            return currentPage.questions.map((q) => {
                const fullQ = questions.find((fq) => fq.id === q.id || fq.id === q);
                return fullQ || q;
            });
        }
        return [];
    }, [currentPage, questions]);

    const updateGroupMember = (groupId, index, field, value) => {
        setAnswers((prev) => {
            const groupKey = String(groupId);
            const groupArray = Array.isArray(prev[groupKey]) ? [...prev[groupKey]] : [];

            if (!groupArray[index]) {
                groupArray[index] = {};
            }

            groupArray[index][String(field)] = value;
            return { ...prev, [groupKey]: groupArray };
        });
    };

    useEffect(() => {
        for (const group of groups) {
            const sourceQuestionId = group.repeatBasedOn;
            if (!sourceQuestionId) continue;

            const repeatCount = Number(answers[sourceQuestionId] || 0);
            const minCount = Math.max(group.minCount, 0);
            const maxCount = Math.min(group.maxCount, 100);
            const targetCount = Math.max(minCount, Math.min(repeatCount, maxCount));

            setAnswers((prev) => {
                const groupKey = String(group.id);
                const existing = Array.isArray(prev[groupKey]) ? [...prev[groupKey]] : [];

                while (existing.length < targetCount) {
                    const memberTemplate = {};
                    for (const question of group.questions) {
                        memberTemplate[String(question.id || "")] = "";
                    }
                    existing.push(memberTemplate);
                }

                const resized = existing.slice(0, targetCount);
                if (JSON.stringify(resized) === JSON.stringify(Array.isArray(prev[groupKey]) ? prev[groupKey] : [])) {
                    return prev;
                }

                return { ...prev, [groupKey]: resized };
            });
        }
    }, [answers, groups]);
    const visibleQuestionIds = useMemo(() => {
        const visible = new Set();

        for (const question of pageQuestions) {
            const logic = normalizeDisplayLogic(question.displayLogic);
            const questionId = String(question.id);
            if (!logic.enabled || !logic.sourceQuestionId) {
                visible.add(questionId);
                continue;
            }

            const sourceId = String(logic.sourceQuestionId);
            const sourceQuestion = questions.find((q) => String(q.id) === sourceId);
            if (!sourceQuestion) {
                visible.add(questionId);
                continue;
            }

            const sourceValue = answers[sourceId];
            if (matchesCondition(logic, sourceValue)) {
                visible.add(questionId);
            }
        }

        return visible;
    }, [pageQuestions, questions, answers]);

    const visibleQuestions = useMemo(
        () => pageQuestions.filter((question) => visibleQuestionIds.has(String(question.id))),
        [pageQuestions, visibleQuestionIds]
    );

    useEffect(() => {
        setAnswers((prev) => {
            let changed = false;
            const next = { ...prev };

            for (const key of Object.keys(next)) {
                if (!visibleQuestionIds.has(String(key))) {
                    delete next[key];
                    changed = true;
                }
            }

            return changed ? next : prev;
        });
    }, [visibleQuestionIds]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate current page questions
        for (const question of visibleQuestions) {
            const questionId = String(question.id);
            const questionType = normalizeQuestionType(question.type);
            const value = answers[questionId];
            if (!question.required) {
                // Still validate constraints for optional fields
                if (questionType === "number" && value != null) {
                    if (question.min != null && Number(value) < question.min) {
                        setError(`${question.text} must be at least ${question.min}`);
                        return;
                    }
                    if (question.max != null && Number(value) > question.max) {
                        setError(`${question.text} must be at most ${question.max}`);
                        return;
                    }
                }
                continue;
            }

            if (questionType === "file_upload") {
                if (!value?.file_name) {
                    setError(`Please upload a file for: ${question.text}`);
                    return;
                }
                continue;
            }

            if (!hasValue(value)) {
                setError(`Please answer required question: ${question.text}`);
                return;
            }

            // Validate constraints for required fields
            if (questionType === "number") {
                if (question.min != null && Number(value) < question.min) {
                    setError(`${question.text} must be at least ${question.min}`);
                    return;
                }
                if (question.max != null && Number(value) > question.max) {
                    setError(`${question.text} must be at most ${question.max}`);
                    return;
                }
            }
        }

        // If not on last page, go to next
        if (currentPageIndex < pages.length - 1) {
            goToNextPage();
            return;
        }

        // On last page, validate groups and submit
        // Validate group members
        for (const group of groups) {
            const groupKey = String(group.id);
            const memberArray = Array.isArray(answers[groupKey]) ? answers[groupKey] : [];


            // Check member count
            const minCount = Math.max(group.minCount, 0);
            const maxCount = Math.min(group.maxCount, 100);
            if (memberArray.length < minCount) {
                setError(`${group.label} requires at least ${minCount} member(s). You have ${memberArray.length}.`);
                return;
            }
            if (memberArray.length > maxCount) {
                setError(`${group.label} allows at most ${maxCount} member(s). You have ${memberArray.length}.`);
                return;
            }

            // Check required fields per member
            for (let memberIdx = 0; memberIdx < memberArray.length; memberIdx++) {
                const member = memberArray[memberIdx];
                for (const question of group.questions) {
                    if (!question.required) continue;

                    const qId = String(question.id || "");
                    const memberValue = member[qId];
                    if (!hasValue(memberValue)) {
                        setError(`${group.label} - Item ${memberIdx + 1}: ${question.text} is required.`);
                        return;
                    }
                }
            }
        }

        const filteredAnswers = {};
        for (const question of visibleQuestions) {
            const questionId = String(question.id);
            if (Object.prototype.hasOwnProperty.call(answers, questionId)) {
                filteredAnswers[questionId] = answers[questionId];
            }
        }

        // Include group answers
        for (const group of groups) {
            const groupKey = String(group.id);
            if (Object.prototype.hasOwnProperty.call(answers, groupKey)) {
                filteredAnswers[groupKey] = answers[groupKey];
            }
        }

        try {
            setSubmitting(true);
            setError("");

            await submitSurvey(id, { answers: filteredAnswers, otp: config.otpRequired ? otp : undefined });
            setSubmitted(true);
            setTimeout(() => navigate("/student/surveys"), 1200);
        } catch (err) {
            setError(err?.message || "Failed to submit survey.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-sm text-gray-500">Loading survey...</div>;
    }

    if (error && !survey) {
        return (
            <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-8">
                <h1 className="text-xl font-semibold text-gray-800">Take Survey</h1>
                <div className="mt-2 text-sm text-red-600">{error}</div>
                <button
                    type="button"
                    onClick={() => navigate("/student/surveys")}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                    Back to Surveys
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{survey?.title || "Survey"}</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {visibleQuestions.map((q) => (
                    <div key={q.id} className="space-y-2">
                        {(() => {
                            const questionType = normalizeQuestionType(q.type);

                            return (
                                <>
                                    <label className="block text-sm font-medium text-gray-700">{q.text}{q.required && <span className="text-red-500">*</span>}</label>
                                    {questionType === "short_text" && (
                                        <input className="w-full border rounded-lg px-3 py-2" value={answers[String(q.id)] || ""} onChange={e => handleChange(q.id, e.target.value)} required={q.required} />
                                    )}
                                    {questionType === "long_text" && (
                                        <textarea
                                            rows={4}
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={answers[String(q.id)] || ""}
                                            onChange={(e) => handleChange(q.id, e.target.value)}
                                            required={q.required}
                                        />
                                    )}
                                    {questionType === "multiple_choice" && (
                                        <div className="flex flex-col gap-1">
                                            {(Array.isArray(q.options) ? q.options : []).map(opt => (
                                                <label key={opt} className="flex items-center gap-2">
                                                    <input type="checkbox" value={opt} checked={Array.isArray(answers[String(q.id)]) && answers[String(q.id)].includes(opt)} onChange={e => {
                                                        let arr = Array.isArray(answers[String(q.id)]) ? [...answers[String(q.id)]] : [];
                                                        if (e.target.checked) arr.push(opt); else arr = arr.filter(o => o !== opt);
                                                        handleChange(q.id, arr);
                                                    }} />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {questionType === "single_choice" && (
                                        <div className="flex flex-col gap-1">
                                            {(Array.isArray(q.options) ? q.options : []).map(opt => (
                                                <label key={opt} className="flex items-center gap-2">
                                                    <input type="radio" name={`q${q.id}`} value={opt} checked={answers[String(q.id)] === opt} onChange={e => handleChange(q.id, opt)} />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {questionType === "rating" && (
                                        <input
                                            type="number"
                                            min={q.scaleMin || 1}
                                            max={q.scaleMax || 5}
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={answers[String(q.id)] ?? ""}
                                            onChange={(e) => handleChange(q.id, Number(e.target.value))}
                                            required={q.required}
                                        />
                                    )}
                                    {questionType === "file_upload" && (
                                        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm border border-indigo-100">
                                                    <FileUp size={18} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-semibold text-indigo-900">Upload supporting file</div>
                                                    <div className="text-xs text-indigo-700">Allowed: PDF, images, docs. Max size depends on server limits.</div>
                                                </div>
                                            </div>

                                            <input
                                                id={`file-input-${q.id}`}
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => handleFileChange(q.id, e.target.files?.[0] || null)}
                                            />
                                            <label
                                                htmlFor={`file-input-${q.id}`}
                                                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                            >
                                                <Paperclip size={14} />
                                                Choose file
                                            </label>

                                            {answers[String(q.id)]?.file_name && (
                                                <div className="flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-white px-3 py-2">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium text-gray-800">{answers[String(q.id)].file_name}</div>
                                                        <div className="text-xs text-gray-500">{formatBytes(answers[String(q.id)].size_bytes)}</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFileChange(q.id, null)}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
                                                        aria-label="Remove selected file"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                ))}
                {questionType === "dropdown" && (
                    <select
                        className="w-full border rounded-lg px-3 py-2"
                        value={answers[String(q.id)] || ""}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                        required={q.required}
                    >
                        <option value="">-- Select an option --</option>
                        {(Array.isArray(q.options) ? q.options : []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                )}
                {questionType === "date" && (
                    <input
                        type="date"
                        className="w-full border rounded-lg px-3 py-2"
                        value={answers[String(q.id)] || ""}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                        required={q.required}
                    />
                )}
                {questionType === "number" && (
                    <input
                        type="number"
                        min={q.min}
                        max={q.max}
                        step="1"
                        className="w-full border rounded-lg px-3 py-2"
                        value={answers[String(q.id)] ?? ""}
                        onChange={(e) => handleChange(q.id, e.target.value ? Number(e.target.value) : "")}
                        required={q.required}
                        placeholder={q.min != null && q.max != null ? `${q.min}-${q.max}` : ""}
                    />
                )}
                {questionType === "matrix" && (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left text-sm font-medium"></th>
                                    {(Array.isArray(q.columns) ? q.columns : []).map((col) => (
                                        <th key={col.id || col} className="border border-gray-300 bg-gray-50 px-3 py-2 text-center text-sm font-medium">
                                            {col.text || col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(Array.isArray(q.rows) ? q.rows : []).map((row) => (
                                    <tr key={row.id || row}>
                                        <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium">
                                            {row.text || row}
                                        </td>
                                        {(Array.isArray(q.columns) ? q.columns : []).map((col) => (
                                            <td key={`${row.id || row}-${col.id || col}`} className="border border-gray-300 px-3 py-2 text-center">
                                                <input
                                                    type="radio"
                                                    name={`matrix-${q.id}-${row.id || row}`}
                                                    value={col.id || col}
                                                    checked={(answers[String(q.id)] || {})[String(row.id || row)] === (col.id || col)}
                                                    onChange={() => {
                                                        const matrixVal = answers[String(q.id)] || {};
                                                        handleChange(q.id, { ...matrixVal, [String(row.id || row)]: col.id || col });
                                                    }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {groups.map((group) => {
                    const groupKey = String(group.id);
                    const memberArray = Array.isArray(answers[groupKey]) ? answers[groupKey] : [];

                    return (
                        <div key={group.id} className="space-y-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                            <h3 className="text-lg font-semibold text-blue-900">{group.label}</h3>

                            {memberArray.map((member, memberIdx) => (
                                <div key={memberIdx} className="space-y-3 rounded-lg border border-blue-200 bg-white p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-semibold">
                                            {memberIdx + 1}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">
                                            Item {memberIdx + 1} of {memberArray.length}
                                        </span>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        {group.questions.map((q) => {
                                            const qType = normalizeQuestionType(q.type);
                                            const qId = String(q.id || "");
                                            const memberValue = member[qId] ?? "";

                                            return (
                                                <div key={qId} className="space-y-1">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        {q.text}
                                                        {q.required && <span className="text-red-500">*</span>}
                                                    </label>

                                                    {qType === "short_text" && (
                                                        <input
                                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                                            value={memberValue}
                                                            onChange={(e) => updateGroupMember(group.id, memberIdx, qId, e.target.value)}
                                                            required={q.required}
                                                            placeholder={q.placeholder || ""}
                                                        />
                                                    )}

                                                    {qType === "long_text" && (
                                                        <textarea
                                                            rows={3}
                                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                                            value={memberValue}
                                                            onChange={(e) => updateGroupMember(group.id, memberIdx, qId, e.target.value)}
                                                            required={q.required}
                                                            placeholder={q.placeholder || ""}
                                                        />
                                                    )}

                                                    {qType === "single_choice" && (
                                                        <select
                                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                                            value={memberValue}
                                                            onChange={(e) => updateGroupMember(group.id, memberIdx, qId, e.target.value)}
                                                            required={q.required}
                                                        >
                                                            <option value="">Select an option</option>
                                                            {(Array.isArray(q.options) ? q.options : []).map((opt) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {qType === "multiple_choice" && (
                                                        <div className="flex flex-col gap-1">
                                                            {(Array.isArray(q.options) ? q.options : []).map((opt) => (
                                                                <label key={opt} className="flex items-center gap-2 text-sm">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={Array.isArray(memberValue) && memberValue.includes(opt)}
                                                                        onChange={(e) => {
                                                                            let arr = Array.isArray(memberValue) ? [...memberValue] : [];
                                                                            if (e.target.checked) {
                                                                                arr.push(opt);
                                                                            } else {
                                                                                arr = arr.filter(o => o !== opt);
                                                                            }
                                                                            updateGroupMember(group.id, memberIdx, qId, arr);
                                                                        }}
                                                                    />
                                                                    {opt}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {qType === "rating" && (
                                                        <input
                                                            type="number"
                                                            min={q.scaleMin || 1}
                                                            max={q.scaleMax || 5}
                                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                                            value={memberValue ?? ""}
                                                            onChange={(e) => updateGroupMember(group.id, memberIdx, qId, Number(e.target.value))}
                                                            required={q.required}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}

                {config.otpRequired && (
                    <div className="space-y-2 rounded-xl border border-amber-100 bg-amber-50 p-4">
                        <label className="block text-sm font-medium text-amber-800">OTP Verification</label>
                        <input
                            className="w-full rounded-lg border border-amber-200 px-3 py-2"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter the 6-digit OTP"
                            required
                        />
                        <div className="text-xs text-amber-700">This survey requires a valid OTP generated by the admin within the last 10 seconds.</div>
                    </div>
                )}
                {error && <div className="text-sm text-red-600">{error}</div>}

                {pages.length > 1 && (
                    <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-700">Page {currentPageIndex + 1} of {pages.length}</span>
                            <div className="flex-1 ml-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${((currentPageIndex + 1) / pages.length) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 mt-6">
                    <button type="button" onClick={goToPreviousPage} disabled={currentPageIndex === 0 || submitting} className="px-6 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                    <button type="button" onClick={goToNextPage} disabled={currentPageIndex === pages.length - 1 || submitting} className="flex-1 px-6 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50">Next</button>
                    {currentPageIndex === pages.length - 1 && <button disabled={submitting} type="submit" className="flex-1 px-6 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60">{submitting ? "Submitting..." : "Submit"}</button>}
                </div>
                {submitted && <div className="text-green-600 mt-2">Survey submitted! Redirecting...</div>}
            </form>
        </div>
    );
}
