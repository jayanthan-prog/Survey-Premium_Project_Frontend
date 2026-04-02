import { useMemo, useState } from "react";
import { Plus, Settings2, Trash2, X } from "lucide-react";
import HoverProfile from "../../../../components/profile/HoverProfile";
import UserCard from "../../../../components/profile/UserCard";
import { createChoiceOption } from "../../utils/builderSchema";

const toOptionValue = (label, fallback = "option") => {
    const slug = String(label || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    return slug || fallback;
};

const isDefaultOptionLabel = (label) => /^option\s*\d*$/i.test(String(label || "").trim());

const BuilderRightPanel = ({
    activePanelTab,
    setActivePanelTab,
    selectedQuestion,
    selectedQuestionRef,
    numberedQuestionMap,
    QUESTION_TYPES,
    LOGIC_OPERATORS,
    survey,
    groupOptions,
    userOptions,
    allQuestions,
    questionMap,
    updateSurveyState,
    updateQuestion,
}) => {
    const [groupSearch, setGroupSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");

    const selectedGroupValues = Array.isArray(survey.targetGroups) ? survey.targetGroups : [];
    const selectedUserValues = Array.isArray(survey.targetUserIds) ? survey.targetUserIds.map(String) : [];

    const selectedGroupSet = useMemo(() => new Set(selectedGroupValues), [selectedGroupValues]);
    const selectedUserSet = useMemo(() => new Set(selectedUserValues), [selectedUserValues]);

    const filteredGroupOptions = useMemo(() => {
        const keyword = groupSearch.trim().toLowerCase();
        return (groupOptions || []).filter((group) => {
            if (selectedGroupSet.has(group.value)) return false;
            if (!keyword) return true;
            return String(group.label || "").toLowerCase().includes(keyword);
        });
    }, [groupOptions, groupSearch, selectedGroupSet]);

    const filteredUserOptions = useMemo(() => {
        const keyword = userSearch.trim().toLowerCase();
        return (userOptions || []).filter((user) => {
            if (selectedUserSet.has(String(user.value))) return false;
            if (!keyword) return true;
            return String(user.label || "").toLowerCase().includes(keyword);
        });
    }, [userOptions, userSearch, selectedUserSet]);

    const addTargetGroup = (groupValue) => {
        if (!groupValue || selectedGroupSet.has(groupValue)) return;
        updateSurveyState({ targetGroups: [...selectedGroupValues, groupValue] });
        setGroupSearch("");
    };

    const removeTargetGroup = (groupValue) => {
        updateSurveyState({
            targetGroups: selectedGroupValues.filter((value) => value !== groupValue),
        });
    };

    const addTargetUser = (userValue) => {
        const normalized = String(userValue || "");
        if (!normalized || selectedUserSet.has(normalized)) return;
        updateSurveyState({ targetUserIds: [...selectedUserValues, normalized] });
        setUserSearch("");
    };

    const removeTargetUser = (userValue) => {
        const normalized = String(userValue || "");
        updateSurveyState({
            targetUserIds: selectedUserValues.filter((value) => String(value) !== normalized),
        });
    };

    return (
        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                <button
                    type="button"
                    onClick={() => setActivePanelTab("question")}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${activePanelTab === "question"
                        ? "bg-sky-100 text-sky-700"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                >
                    Question
                </button>
                <button
                    type="button"
                    onClick={() => setActivePanelTab("survey")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${activePanelTab === "survey"
                        ? "bg-sky-100 text-sky-700"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                >
                    <Settings2 size={13} />
                    Survey Settings
                </button>
            </div>

            {activePanelTab === "survey" && (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-slate-500">Description</label>
                        <textarea
                            rows={3}
                            value={survey.description}
                            onChange={(event) => updateSurveyState({ description: event.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            placeholder="Add admin-facing summary"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500">Start Date</label>
                            <input
                                type="date"
                                value={survey.startDate}
                                onChange={(event) => updateSurveyState({ startDate: event.target.value })}
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500">End Date</label>
                            <input
                                type="date"
                                value={survey.endDate}
                                onChange={(event) => updateSurveyState({ endDate: event.target.value })}
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-500">Max Responses</label>
                        <input
                            type="number"
                            min="0"
                            value={survey.maxResponses}
                            onChange={(event) => updateSurveyState({ maxResponses: event.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        />
                    </div>

                    <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Category Response Limits</label>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = Array.isArray(survey.responseCategoryLimits)
                                        ? [...survey.responseCategoryLimits]
                                        : [];
                                    next.push({ field: "year", value: "", limit: "" });
                                    updateSurveyState({ responseCategoryLimits: next });
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                            >
                                <Plus size={12} />
                                Add
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-500">Example: Year=3 with limit 50, Gender=Male with limit 70.</p>

                        {(Array.isArray(survey.responseCategoryLimits) ? survey.responseCategoryLimits : []).map((row, index) => (
                            <div key={`quota-${index}`} className="space-y-2 rounded-lg border border-slate-200 p-2">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <select
                                        value={row?.field || "year"}
                                        onChange={(event) => {
                                            const next = [...(survey.responseCategoryLimits || [])];
                                            next[index] = { ...(next[index] || {}), field: event.target.value };
                                            updateSurveyState({ responseCategoryLimits: next });
                                        }}
                                        className="min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                                    >
                                        <option value="year">Year</option>
                                        <option value="category">Category</option>
                                        <option value="department">Department</option>
                                        <option value="section">Section</option>
                                        <option value="attributes.gender">Gender</option>
                                    </select>

                                    <input
                                        value={row?.value || ""}
                                        onChange={(event) => {
                                            const next = [...(survey.responseCategoryLimits || [])];
                                            next[index] = { ...(next[index] || {}), value: event.target.value };
                                            updateSurveyState({ responseCategoryLimits: next });
                                        }}
                                        className="min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                                        placeholder="value"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={row?.limit || ""}
                                        onChange={(event) => {
                                            const next = [...(survey.responseCategoryLimits || [])];
                                            next[index] = { ...(next[index] || {}), limit: event.target.value };
                                            updateSurveyState({ responseCategoryLimits: next });
                                        }}
                                        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                                        placeholder="limit"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = [...(survey.responseCategoryLimits || [])];
                                            next.splice(index, 1);
                                            updateSurveyState({ responseCategoryLimits: next });
                                        }}
                                        className="h-7 w-7 inline-flex shrink-0 items-center justify-center rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50"
                                        title="Remove quota"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-500">Theme Color</label>
                        <input
                            type="color"
                            value={survey.themeColor}
                            onChange={(event) => updateSurveyState({ themeColor: event.target.value })}
                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-2"
                        />
                    </div>

                    <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                        <label className="text-xs font-medium text-slate-500">Target Groups</label>
                        <input
                            value={groupSearch}
                            onChange={(event) => setGroupSearch(event.target.value)}
                            placeholder="Search groups..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        />
                        <div className="max-h-24 overflow-auto rounded-lg border border-slate-200 bg-white">
                            {filteredGroupOptions.slice(0, 20).map((group) => (
                                <button
                                    key={group.id || group.value}
                                    type="button"
                                    onClick={() => addTargetGroup(group.value)}
                                    className="block w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
                                >
                                    {group.label}
                                </button>
                            ))}
                            {filteredGroupOptions.length === 0 && (
                                <div className="px-3 py-2 text-xs text-slate-400">No matching groups</div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {selectedGroupValues.map((value) => {
                                const group = (groupOptions || []).find((entry) => entry.value === value);
                                const label = group ? group.label : value;
                                return (
                                    <span key={value} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-[11px] text-sky-700">
                                        {label}
                                        <button
                                            type="button"
                                            onClick={() => removeTargetGroup(value)}
                                            className="text-sky-700 hover:text-sky-900"
                                            title="Remove group"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                );
                            })}
                            {selectedGroupValues.length === 0 && (
                                <div className="text-[11px] text-slate-400">No groups selected</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                        <label className="text-xs font-medium text-slate-500">Target Users (Individual)</label>
                        <input
                            value={userSearch}
                            onChange={(event) => setUserSearch(event.target.value)}
                            placeholder="Search students by name/email..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        />
                        <div className="max-h-28 overflow-auto rounded-lg border border-slate-200 bg-white">
                            {filteredUserOptions.slice(0, 30).map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => addTargetUser(user.value)}
                                    className="block w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
                                >
                                    {user.label}
                                </button>
                            ))}
                            {filteredUserOptions.length === 0 && (
                                <div className="px-3 py-2 text-xs text-slate-400">No matching users</div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {selectedUserValues.map((value) => {
                                const user = (userOptions || []).find((entry) => String(entry.value) === String(value));
                                const label = user ? user.label : String(value);
                                return (
                                    <HoverProfile key={String(value)} user={user?.user}>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">
                                            {label}
                                            <button
                                                type="button"
                                                onClick={() => removeTargetUser(value)}
                                                className="text-emerald-700 hover:text-emerald-900"
                                                title="Remove user"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    </HoverProfile>
                                );
                            })}
                            {selectedUserValues.length === 0 && (
                                <div className="text-[11px] text-slate-400">No students selected</div>
                            )}
                        </div>
                    </div>

                    <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                        OTP Required
                        <input
                            type="checkbox"
                            checked={survey.otpRequired}
                            onChange={(event) => updateSurveyState({ otpRequired: event.target.checked })}
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                        Randomize Questions
                        <input
                            type="checkbox"
                            checked={survey.randomizeQuestions}
                            onChange={(event) => updateSurveyState({ randomizeQuestions: event.target.checked })}
                        />
                    </label>
                </div>
            )}

            {activePanelTab === "question" && !selectedQuestion && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    Select a question to edit its settings, logic, and validation.
                </div>
            )}

            {activePanelTab === "question" && selectedQuestion && selectedQuestionRef && (
                <div className="space-y-4">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                            {numberedQuestionMap.get(String(selectedQuestion.id)) || "Question"}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 mt-1">Question Settings</div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-500">Question Type</label>
                        <select
                            value={selectedQuestion.type}
                            onChange={(event) =>
                                updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                    type: event.target.value,
                                })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        >
                            {QUESTION_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-500">Question Text</label>
                        <input
                            value={selectedQuestion.text}
                            onChange={(event) =>
                                updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                    text: event.target.value,
                                })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            placeholder="Type question text"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-500">Description</label>
                        <textarea
                            rows={2}
                            value={selectedQuestion.description || ""}
                            onChange={(event) =>
                                updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                    description: event.target.value,
                                })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            placeholder="Optional help text"
                        />
                    </div>

                    <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                        Required
                        <input
                            type="checkbox"
                            checked={selectedQuestion.required}
                            onChange={(event) =>
                                updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                    required: event.target.checked,
                                })
                            }
                        />
                    </label>

                    {["single_choice", "multiple_choice", "dropdown", "limited_dropdown", "priority_select", "multi_level_selection"].includes(selectedQuestion.type) && (
                        <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Options</div>
                                <button
                                    type="button"
                                    className="text-xs text-sky-700 hover:underline"
                                    onClick={() =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            options: [...(selectedQuestion.options || []), createChoiceOption("")],
                                        })
                                    }
                                >
                                    Add Option
                                </button>
                            </div>
                            {(selectedQuestion.options || []).map((option, index) => {
                                const showSeatControls = ["limited_dropdown", "priority_select", "multi_level_selection"].includes(selectedQuestion.type);
                                return (
                                    <div key={`${selectedQuestion.id}-option-${index}`} className="grid gap-2 rounded-lg border border-slate-200 p-2">
                                        <div className="grid min-w-0 gap-2 sm:grid-cols-1">
                                            <input
                                                value={option?.label ?? ""}
                                                onChange={(event) => {
                                                    const next = [...(selectedQuestion.options || [])];
                                                    const previousValue = String(option?.value || "");
                                                    const nextLabel = event.target.value;
                                                    next[index] = {
                                                        ...option,
                                                        label: nextLabel,
                                                        // Keep custom value if user previously had one; otherwise follow label slug.
                                                        value: previousValue && previousValue !== toOptionValue(option?.label || "", `option_${index + 1}`)
                                                            ? previousValue
                                                            : (nextLabel ? toOptionValue(nextLabel) : ""),
                                                    };
                                                    updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                        options: next,
                                                    });
                                                }}

                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                                placeholder="Label"
                                            />
                                        </div>
                                        <div className={showSeatControls ? "grid items-center gap-2 grid-cols-[minmax(0,1fr)_auto_auto]" : "flex items-center justify-end"}>
                                            {showSeatControls && (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={option?.limit ?? ""}
                                                    onChange={(event) => {
                                                        const next = [...(selectedQuestion.options || [])];
                                                        next[index] = {
                                                            ...option,
                                                            limit: event.target.value === "" ? null : Number(event.target.value),
                                                        };
                                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                            options: next,
                                                        });
                                                    }}
                                                    className="min-w-[96px] rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                                    placeholder="Limit"
                                                    title="Seat limit"
                                                />
                                            )}
                                            {showSeatControls && (
                                                <span className="whitespace-nowrap rounded-lg bg-slate-50 px-2 py-2 text-[11px] text-slate-500">
                                                    {option?.selectedCount || 0} used
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                className="rounded-md border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                                                onClick={() => {
                                                    const next = (selectedQuestion.options || []).filter((_, idx) => idx !== index);
                                                    updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                        options: next.length ? next : [createChoiceOption("")],
                                                    });
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="grid gap-2 sm:grid-cols-2">
                                <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
                                    Randomize options
                                    <input
                                        type="checkbox"
                                        checked={Boolean(selectedQuestion.randomizeOptions)}
                                        onChange={(event) =>
                                            updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                randomizeOptions: event.target.checked,
                                            })
                                        }
                                    />
                                </label>
                                {selectedQuestion.type === "limited_dropdown" && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                                        Hide options whose limit is 0 or already full.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {["priority_select", "multi_level_selection"].includes(selectedQuestion.type) && (
                        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Selection Rules</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Primary max</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={selectedQuestion.selectionRules?.maxPrimary ?? ""}
                                        onChange={(event) =>
                                            updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                selectionRules: {
                                                    ...(selectedQuestion.selectionRules || {}),
                                                    maxPrimary: event.target.value === "" ? 0 : Number(event.target.value),
                                                },
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Secondary max</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={selectedQuestion.selectionRules?.maxSecondary ?? ""}
                                        onChange={(event) =>
                                            updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                selectionRules: {
                                                    ...(selectedQuestion.selectionRules || {}),
                                                    maxSecondary: event.target.value === "" ? 0 : Number(event.target.value),
                                                },
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            {selectedQuestion.type === "multi_level_selection" && (
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Special max</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={selectedQuestion.selectionRules?.maxSpecial ?? ""}
                                        onChange={(event) =>
                                            updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                selectionRules: {
                                                    ...(selectedQuestion.selectionRules || {}),
                                                    maxSpecial: event.target.value === "" ? 0 : Number(event.target.value),
                                                },
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                            )}
                            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
                                Prevent duplicate selections
                                <input
                                    type="checkbox"
                                    checked={Boolean(selectedQuestion.selectionRules?.preventDuplicate)}
                                    onChange={(event) =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            selectionRules: {
                                                ...(selectedQuestion.selectionRules || {}),
                                                preventDuplicate: event.target.checked,
                                            },
                                        })
                                    }
                                />
                            </label>
                            {selectedQuestion.type === "priority_select" && (
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Max rank</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={selectedQuestion.maxRank || 3}
                                        onChange={(event) =>
                                            updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                maxRank: event.target.value === "" ? 0 : Number(event.target.value),
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {selectedQuestion.type === "number" && (
                        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3">
                            <div>
                                <label className="text-xs font-medium text-slate-500">Min value</label>
                                <input
                                    type="number"
                                    value={selectedQuestion.min}
                                    onChange={(event) =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            min: event.target.value,
                                            validation: {
                                                ...(selectedQuestion.validation || {}),
                                                min: event.target.value,
                                            },
                                        })
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Max value</label>
                                <input
                                    type="number"
                                    value={selectedQuestion.max}
                                    onChange={(event) =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            max: event.target.value,
                                            validation: {
                                                ...(selectedQuestion.validation || {}),
                                                max: event.target.value,
                                            },
                                        })
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {selectedQuestion.type === "matrix" && (
                        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                            <div>
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Rows</div>
                                {(selectedQuestion.rows || []).map((row, index) => (
                                    <div key={`${selectedQuestion.id}-row-${index}`} className="mb-2 flex items-center gap-2">
                                        <input
                                            value={row}
                                            onChange={(event) => {
                                                const nextRows = [...(selectedQuestion.rows || [])];
                                                nextRows[index] = event.target.value;
                                                updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                    rows: nextRows,
                                                });
                                            }}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        />
                                        <button
                                            type="button"
                                            className="rounded-md border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                                            onClick={() => {
                                                const nextRows = (selectedQuestion.rows || []).filter((_, idx) => idx !== index);
                                                updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                    rows: nextRows,
                                                });
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="text-xs text-sky-700 hover:underline"
                                    onClick={() =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            rows: [...(selectedQuestion.rows || []), `Row ${(selectedQuestion.rows || []).length + 1}`],
                                        })
                                    }
                                >
                                    + Add row
                                </button>
                            </div>

                            <div>
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Columns</div>
                                {(selectedQuestion.columns || []).map((column, index) => (
                                    <div key={`${selectedQuestion.id}-column-${index}`} className="mb-2 flex items-center gap-2">
                                        <input
                                            value={column}
                                            onChange={(event) => {
                                                const nextColumns = [...(selectedQuestion.columns || [])];
                                                nextColumns[index] = event.target.value;
                                                updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                    columns: nextColumns,
                                                });
                                            }}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        />
                                        <button
                                            type="button"
                                            className="rounded-md border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                                            onClick={() => {
                                                const nextColumns = (selectedQuestion.columns || []).filter((_, idx) => idx !== index);
                                                updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                    columns: nextColumns,
                                                });
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="text-xs text-sky-700 hover:underline"
                                    onClick={() =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            columns: [...(selectedQuestion.columns || []), `Column ${(selectedQuestion.columns || []).length + 1}`],
                                        })
                                    }
                                >
                                    + Add column
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Display Logic</div>
                        <label className="flex items-center justify-between text-xs text-slate-700">
                            Enable display logic
                            <input
                                type="checkbox"
                                checked={Boolean(selectedQuestion.displayLogic?.enabled)}
                                onChange={(event) =>
                                    updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                        displayLogic: {
                                            ...(selectedQuestion.displayLogic || {}),
                                            enabled: event.target.checked,
                                        },
                                    })
                                }
                            />
                        </label>
                        {selectedQuestion.displayLogic?.enabled && (
                            <>
                                <select
                                    value={selectedQuestion.displayLogic?.sourceQuestionId || ""}
                                    onChange={(event) =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            displayLogic: {
                                                ...(selectedQuestion.displayLogic || {}),
                                                sourceQuestionId: event.target.value,
                                            },
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="">Source question</option>
                                    {allQuestions
                                        .filter((question) => String(question.id) !== String(selectedQuestion.id))
                                        .map((question) => (
                                            <option key={question.id} value={question.id}>
                                                {(questionMap.get(String(question.id)) || {}).label}: {question.text || "Untitled"}
                                            </option>
                                        ))}
                                </select>
                                <select
                                    value={selectedQuestion.displayLogic?.operator || "equals"}
                                    onChange={(event) =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            displayLogic: {
                                                ...(selectedQuestion.displayLogic || {}),
                                                operator: event.target.value,
                                            },
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    {LOGIC_OPERATORS.map((operator) => (
                                        <option key={operator.value} value={operator.value}>
                                            {operator.label}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    value={selectedQuestion.displayLogic?.expectedValue || ""}
                                    onChange={(event) =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            displayLogic: {
                                                ...(selectedQuestion.displayLogic || {}),
                                                expectedValue: event.target.value,
                                            },
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Expected value"
                                />
                            </>
                        )}
                    </div>

                    <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Skip Logic</div>
                        <label className="flex items-center justify-between text-xs text-slate-700">
                            Enable skip logic
                            <input
                                type="checkbox"
                                checked={Boolean(selectedQuestion.skipLogic?.enabled)}
                                onChange={(event) =>
                                    updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                        skipLogic: {
                                            ...(selectedQuestion.skipLogic || {}),
                                            enabled: event.target.checked,
                                        },
                                    })
                                }
                            />
                        </label>
                        {selectedQuestion.skipLogic?.enabled && (
                            <>
                                <select
                                    value={selectedQuestion.skipLogic?.sourceQuestionId || ""}
                                    onChange={(event) =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            skipLogic: {
                                                ...(selectedQuestion.skipLogic || {}),
                                                sourceQuestionId: event.target.value,
                                            },
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="">Condition question</option>
                                    {allQuestions
                                        .filter((question) => String(question.id) !== String(selectedQuestion.id))
                                        .map((question) => (
                                            <option key={question.id} value={question.id}>
                                                {(questionMap.get(String(question.id)) || {}).label}: {question.text || "Untitled"}
                                            </option>
                                        ))}
                                </select>
                                <select
                                    value={selectedQuestion.skipLogic?.operator || "equals"}
                                    onChange={(event) =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            skipLogic: {
                                                ...(selectedQuestion.skipLogic || {}),
                                                operator: event.target.value,
                                            },
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    {LOGIC_OPERATORS.map((operator) => (
                                        <option key={operator.value} value={operator.value}>
                                            {operator.label}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    value={selectedQuestion.skipLogic?.expectedValue || ""}
                                    onChange={(event) =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            skipLogic: {
                                                ...(selectedQuestion.skipLogic || {}),
                                                expectedValue: event.target.value,
                                            },
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Condition value"
                                />
                                <select
                                    value={selectedQuestion.skipLogic?.action || "jumpToPage"}
                                    onChange={(event) =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            skipLogic: {
                                                ...(selectedQuestion.skipLogic || {}),
                                                action: event.target.value,
                                                targetId: "",
                                            },
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="jumpToPage">Jump to page</option>
                                    <option value="jumpToQuestion">Jump to question</option>
                                </select>
                                <select
                                    value={selectedQuestion.skipLogic?.targetId || ""}
                                    onChange={(event) =>
                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                            skipLogic: {
                                                ...(selectedQuestion.skipLogic || {}),
                                                targetId: event.target.value,
                                            },
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="">Target</option>
                                    {(selectedQuestion.skipLogic?.action || "jumpToPage") === "jumpToPage"
                                        ? survey.pages.map((page, index) => (
                                            <option key={page.id} value={page.id}>
                                                Page {index + 1}: {page.title}
                                            </option>
                                        ))
                                        : allQuestions.map((question) => (
                                            <option key={question.id} value={question.id}>
                                                {(questionMap.get(String(question.id)) || {}).label}: {question.text || "Untitled"}
                                            </option>
                                        ))}
                                </select>
                            </>
                        )}
                    </div>

                    <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Validation</div>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                value={selectedQuestion.validation?.minLength || ""}
                                onChange={(event) =>
                                    updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                        validation: {
                                            ...(selectedQuestion.validation || {}),
                                            minLength: event.target.value,
                                        },
                                    })
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="minLength"
                            />
                            <input
                                type="number"
                                value={selectedQuestion.validation?.maxLength || ""}
                                onChange={(event) =>
                                    updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                        validation: {
                                            ...(selectedQuestion.validation || {}),
                                            maxLength: event.target.value,
                                        },
                                    })
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="maxLength"
                            />
                        </div>
                        <input
                            value={selectedQuestion.validation?.regex || ""}
                            onChange={(event) =>
                                updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                    validation: {
                                        ...(selectedQuestion.validation || {}),
                                        regex: event.target.value,
                                    },
                                })
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Regex pattern"
                        />
                        <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
                            Email validation
                            <input
                                type="checkbox"
                                checked={Boolean(selectedQuestion.validation?.email)}
                                onChange={(event) =>
                                    updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                        validation: {
                                            ...(selectedQuestion.validation || {}),
                                            email: event.target.checked,
                                        },
                                    })
                                }
                            />
                        </label>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default BuilderRightPanel;
