import { useEffect, useMemo, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { listGroups } from "../../../services/groupService";
import { listUsers } from "../../../services/userService";
import { createSurvey, getSurveyById, publishSurvey, updateSurvey as updateSurveyApi } from "../../../services/surveyApi";
import BuilderHeader from "../components/builder/BuilderHeader";
import BuilderPageSection from "../components/builder/BuilderPageSection";
import BuilderRightPanel from "../components/builder/BuilderRightPanel";
import PaletteQuestionType from "../components/builder/PaletteQuestionType";
import {
    BUILDER_AUTOSAVE_KEY,
    LOGIC_OPERATORS,
    QUESTION_TYPES,
    buildQuestionMap,
    createId,
    createPage,
    createQuestion,
    defaultSurveyState,
    flattenQuestions,
    normalizeApiSurvey,
    normalizeQuestion,
} from "../utils/builderSchema";

const SurveyBuilderPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const { user, token } = useAuth();

    const surveyId = params.surveyId || params.id || "new";
    const isNewSurvey = surveyId === "new" || surveyId === "create";

    const roleBasePath = user?.role === "APPROVER" ? "/approver" : "/admin";
    const listPath = `${roleBasePath}/surveys`;

    const [survey, setSurvey] = useState(defaultSurveyState);
    const [selectedQuestionRef, setSelectedQuestionRef] = useState(null);
    const [activePanelTab, setActivePanelTab] = useState("question");
    const [groupOptions, setGroupOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [loading, setLoading] = useState(!isNewSurvey);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState("");
    const [autosaveText, setAutosaveText] = useState("");
    const [activeDrag, setActiveDrag] = useState(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    useEffect(() => {
        let active = true;

        const loadFilters = async () => {
            if (!token) return;
            try {
                const [groupResponse, userResponse] = await Promise.all([
                    listGroups(token),
                    listUsers(token),
                ]);
                if (!active) return;
                const groups = Array.isArray(groupResponse) ? groupResponse : [];
                const users = Array.isArray(userResponse) ? userResponse : [];
                setGroupOptions(
                    groups.map((group) => ({
                        value: String(group.name || ""),
                        id: Number(group.group_id),
                        label: group.type ? `${group.name} (${group.type})` : String(group.name || ""),
                    }))
                );
                setUserOptions(
                    users
                        .filter((user) => Number.isInteger(Number(user.user_id)))
                        .map((user) => ({
                            id: Number(user.user_id),
                            value: String(user.user_id),
                            label: `${user.name || "User"}${user.email ? ` (${user.email})` : ""}`,
                        }))
                );
            } catch {
                if (active) {
                    setGroupOptions([]);
                    setUserOptions([]);
                }
            }
        };

        loadFilters();
        return () => {
            active = false;
        };
    }, [token]);

    useEffect(() => {
        let alive = true;

        const hydrateSurvey = async () => {
            setError("");

            if (isNewSurvey) {
                const incomingDraft = location.state?.draft;
                if (incomingDraft?.pages) {
                    setSurvey(incomingDraft);
                    return;
                }

                try {
                    const raw = localStorage.getItem(BUILDER_AUTOSAVE_KEY);
                    if (!raw) return;
                    const parsed = JSON.parse(raw);
                    if (parsed?.survey?.pages) {
                        setSurvey(parsed.survey);
                        setAutosaveText("Recovered from autosave");
                    }
                } catch {
                    localStorage.removeItem(BUILDER_AUTOSAVE_KEY);
                }
                return;
            }

            try {
                setLoading(true);
                const response = await getSurveyById(surveyId);
                if (!alive) return;
                setSurvey(normalizeApiSurvey(response));
            } catch (err) {
                if (!alive) return;
                setError(err?.message || "Failed to load survey");
            } finally {
                if (alive) setLoading(false);
            }
        };

        hydrateSurvey();

        return () => {
            alive = false;
        };
    }, [isNewSurvey, location.state, surveyId]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            try {
                localStorage.setItem(
                    BUILDER_AUTOSAVE_KEY,
                    JSON.stringify({
                        survey,
                        updatedAt: Date.now(),
                    })
                );
                setAutosaveText(`Autosaved ${new Date().toLocaleTimeString()}`);
            } catch {
                setAutosaveText("Autosave failed");
            }
        }, 7000);

        return () => window.clearInterval(timer);
    }, [survey]);

    const allQuestions = useMemo(() => flattenQuestions(survey.pages), [survey.pages]);
    const questionMap = useMemo(() => buildQuestionMap(allQuestions), [allQuestions]);

    const numberedQuestionMap = useMemo(() => {
        const map = new Map();
        let counter = 0;
        survey.pages.forEach((page) => {
            page.questions.forEach((question) => {
                counter += 1;
                map.set(String(question.id), `Q${counter}`);
            });
        });
        return map;
    }, [survey.pages]);

    const selectedQuestion = useMemo(() => {
        if (!selectedQuestionRef) return null;
        const page = survey.pages.find((entry) => entry.id === selectedQuestionRef.pageId);
        if (!page) return null;
        return page.questions.find((entry) => entry.id === selectedQuestionRef.questionId) || null;
    }, [selectedQuestionRef, survey.pages]);

    const updateSurveyState = (patch) => {
        setSurvey((prev) => ({ ...prev, ...patch }));
    };

    const updatePage = (pageId, patch) => {
        setSurvey((prev) => ({
            ...prev,
            pages: prev.pages.map((page) => (page.id === pageId ? { ...page, ...patch } : page)),
        }));
    };

    const addPage = () => {
        setSurvey((prev) => ({
            ...prev,
            pages: [...prev.pages, createPage(`Page ${prev.pages.length + 1}`)],
        }));
    };

    const removePage = (pageId) => {
        setSurvey((prev) => {
            const nextPages = prev.pages.filter((page) => page.id !== pageId);
            const safePages = nextPages.length ? nextPages : [createPage("Page 1")];
            return {
                ...prev,
                pages: safePages,
            };
        });

        if (selectedQuestionRef?.pageId === pageId) {
            setSelectedQuestionRef(null);
        }
    };

    const addQuestionToPage = (pageId, type = "short_text", insertAt = null) => {
        const question = createQuestion(type);
        setSurvey((prev) => {
            const nextPages = prev.pages.map((page) => {
                if (page.id !== pageId) return page;
                const nextQuestions = [...page.questions];
                const index = insertAt == null ? nextQuestions.length : insertAt;
                nextQuestions.splice(index, 0, question);
                return {
                    ...page,
                    questions: nextQuestions,
                };
            });
            return {
                ...prev,
                pages: nextPages,
            };
        });
        setSelectedQuestionRef({ pageId, questionId: question.id });
        setActivePanelTab("question");
    };

    const duplicateQuestion = (pageId, questionId) => {
        setSurvey((prev) => ({
            ...prev,
            pages: prev.pages.map((page) => {
                if (page.id !== pageId) return page;
                const index = page.questions.findIndex((question) => question.id === questionId);
                if (index < 0) return page;
                const copy = {
                    ...page.questions[index],
                    id: createId("q"),
                    text: `${page.questions[index].text || "Untitled"} (Copy)`,
                };
                const nextQuestions = [...page.questions];
                nextQuestions.splice(index + 1, 0, copy);
                return { ...page, questions: nextQuestions };
            }),
        }));
    };

    const deleteQuestion = (pageId, questionId) => {
        setSurvey((prev) => ({
            ...prev,
            pages: prev.pages.map((page) => {
                if (page.id !== pageId) return page;
                return {
                    ...page,
                    questions: page.questions.filter((question) => question.id !== questionId),
                };
            }),
        }));

        if (selectedQuestionRef?.questionId === questionId) {
            setSelectedQuestionRef(null);
        }
    };

    const updateQuestion = (pageId, questionId, patch) => {
        setSurvey((prev) => ({
            ...prev,
            pages: prev.pages.map((page) => {
                if (page.id !== pageId) return page;
                return {
                    ...page,
                    questions: page.questions.map((question) => {
                        if (question.id !== questionId) return question;
                        const nextType = patch.type || question.type;
                        return normalizeQuestion({ ...question, ...patch, type: nextType });
                    }),
                };
            }),
        }));
    };

    const findQuestionLocation = (questionId) => {
        for (const page of survey.pages) {
            const index = page.questions.findIndex((question) => String(question.id) === String(questionId));
            if (index >= 0) {
                return { pageId: page.id, index };
            }
        }
        return null;
    };

    const resolveDropTarget = (over) => {
        if (!over) return null;

        const overData = over.data?.current;
        if (!overData) return null;

        if (overData.kind === "question") {
            return {
                pageId: overData.pageId,
                index: overData.index,
            };
        }

        if (overData.kind === "page-drop") {
            return {
                pageId: overData.pageId,
                index: overData.index,
            };
        }

        if (overData.kind === "page") {
            const targetPage = survey.pages.find((entry) => entry.id === overData.pageId);
            return {
                pageId: overData.pageId,
                index: targetPage ? targetPage.questions.length : 0,
            };
        }

        return null;
    };

    const handleDragStart = (event) => {
        setActiveDrag(event.active.data?.current || null);
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveDrag(null);
        if (!over) return;

        const activeData = active.data?.current;
        const overData = over.data?.current;
        if (!activeData || !overData) return;

        if (activeData.kind === "page" && overData.kind === "page") {
            const fromIndex = survey.pages.findIndex((page) => page.id === activeData.pageId);
            const toIndex = survey.pages.findIndex((page) => page.id === overData.pageId);
            if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

            setSurvey((prev) => ({
                ...prev,
                pages: arrayMove(prev.pages, fromIndex, toIndex),
            }));
            return;
        }

        if (activeData.kind === "palette") {
            const target = resolveDropTarget(over);
            if (!target?.pageId) return;
            addQuestionToPage(target.pageId, activeData.questionType, target.index);
            return;
        }

        if (activeData.kind === "question") {
            const source = findQuestionLocation(activeData.questionId);
            const target = resolveDropTarget(over);
            if (!source || !target) return;

            if (source.pageId === target.pageId) {
                setSurvey((prev) => ({
                    ...prev,
                    pages: prev.pages.map((page) => {
                        if (page.id !== source.pageId) return page;
                        const newIndex = target.index;
                        if (source.index === newIndex) return page;
                        return {
                            ...page,
                            questions: arrayMove(page.questions, source.index, newIndex),
                        };
                    }),
                }));
                return;
            }

            setSurvey((prev) => {
                const nextPages = prev.pages.map((page) => ({ ...page, questions: [...page.questions] }));
                const sourcePage = nextPages.find((page) => page.id === source.pageId);
                const targetPage = nextPages.find((page) => page.id === target.pageId);
                if (!sourcePage || !targetPage) return prev;

                const [moved] = sourcePage.questions.splice(source.index, 1);
                if (!moved) return prev;

                const insertionIndex = Math.min(target.index, targetPage.questions.length);
                targetPage.questions.splice(insertionIndex, 0, moved);

                return {
                    ...prev,
                    pages: nextPages,
                };
            });

            setSelectedQuestionRef({ pageId: target.pageId, questionId: activeData.questionId });
        }
    };

    const buildPayload = () => {
        const pages = survey.pages.map((page) => ({
            id: page.id,
            title: page.title,
            questions: page.questions,
        }));

        const all = flattenQuestions(pages);

        return {
            title: survey.title,
            summary: survey.description,
            category: survey.category,
            startDate: survey.startDate || null,
            endDate: survey.endDate || null,
            otpRequired: survey.otpRequired,
            responseCategoryLimits: Array.isArray(survey.responseCategoryLimits)
                ? survey.responseCategoryLimits
                : [],
            targetGroups: survey.targetGroups,
            targetUserIds: (Array.isArray(survey.targetUserIds) ? survey.targetUserIds : [])
                .map((value) => Number(value))
                .filter((value) => Number.isInteger(value) && value > 0),
            targetGroupIds: groupOptions
                .filter((group) => survey.targetGroups.includes(group.value))
                .map((group) => group.id)
                .filter((value) => Number.isInteger(value)),
            maxResponses: survey.maxResponses === "" ? null : Number(survey.maxResponses),
            pages,
            questions: all,
            config: {
                randomizeQuestions: survey.randomizeQuestions,
                themeColor: survey.themeColor,
            },
        };
    };

    const validateBeforeSave = () => {
        if (!String(survey.title || "").trim()) {
            return "Survey title is required.";
        }

        if (!flattenQuestions(survey.pages).length) {
            return "Add at least one question to save the survey.";
        }

        return "";
    };

    const saveSurvey = async () => {
        const message = validateBeforeSave();
        if (message) {
            setError(message);
            return null;
        }

        const payload = buildPayload();

        try {
            setSaving(true);
            setError("");
            let targetId = survey.id;

            if (isNewSurvey || !survey.id) {
                const created = await createSurvey(payload);
                targetId = created?.survey_id;
                setSurvey((prev) => ({ ...prev, id: targetId }));
                if (targetId) {
                    navigate(`${roleBasePath}/surveys/builder/${targetId}`, { replace: true });
                }
            } else {
                await updateSurveyApi(survey.id, payload);
            }

            localStorage.setItem(BUILDER_AUTOSAVE_KEY, JSON.stringify({ survey, updatedAt: Date.now() }));
            setAutosaveText("Saved draft");

            return targetId;
        } catch (err) {
            setError(err?.message || "Failed to save survey.");
            return null;
        } finally {
            setSaving(false);
        }
    };

    const publishCurrentSurvey = async () => {
        const savedId = await saveSurvey();
        if (!savedId) return;

        try {
            setPublishing(true);
            setError("");
            await publishSurvey(savedId, {
                release_name: `${survey.title || "Survey"} Release`,
                opens_at: survey.startDate || null,
                closes_at: survey.endDate || null,
            });
            navigate(listPath);
        } catch (err) {
            setError(err?.message || "Failed to publish survey.");
        } finally {
            setPublishing(false);
        }
    };

    const previewSurvey = () => {
        localStorage.setItem(BUILDER_AUTOSAVE_KEY, JSON.stringify({ survey, updatedAt: Date.now() }));
        navigate(`${roleBasePath}/surveys/preview`, { state: { draft: survey } });
    };

    if (loading) {
        return <div className="text-sm text-slate-500">Loading survey builder...</div>;
    }

    return (
        <div className="space-y-4">
            <BuilderHeader
                survey={survey}
                autosaveText={autosaveText}
                saving={saving}
                publishing={publishing}
                error={error}
                onTitleChange={(value) => updateSurveyState({ title: value })}
                onPreview={previewSurvey}
                onSave={saveSurvey}
                onPublish={publishCurrentSurvey}
            />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(220px,240px)_minmax(0,1fr)_minmax(280px,320px)]">
                    <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-slate-900">Question Types</h2>
                        <p className="mt-1 text-xs text-slate-500">Drag these onto any page.</p>
                        <div className="mt-4 space-y-2">
                            {QUESTION_TYPES.map((type) => (
                                <PaletteQuestionType key={type.value} type={type} />
                            ))}
                        </div>
                    </aside>

                    <main className="min-w-0 space-y-3">
                        <SortableContext
                            items={survey.pages.map((page) => `page:${page.id}`)}
                            strategy={verticalListSortingStrategy}
                        >
                            {survey.pages.map((page) => (
                                <BuilderPageSection
                                    key={page.id}
                                    page={page}
                                    numberedQuestionMap={numberedQuestionMap}
                                    selectedQuestionRef={selectedQuestionRef}
                                    setSelectedQuestionRef={setSelectedQuestionRef}
                                    setActivePanelTab={setActivePanelTab}
                                    updatePage={updatePage}
                                    addQuestionToPage={addQuestionToPage}
                                    removePage={removePage}
                                    duplicateQuestion={duplicateQuestion}
                                    deleteQuestion={deleteQuestion}
                                    updateQuestion={updateQuestion}
                                />
                            ))}
                        </SortableContext>

                        <button
                            type="button"
                            onClick={addPage}
                            className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                        >
                            + Add New Page
                        </button>
                    </main>

                    <BuilderRightPanel
                        activePanelTab={activePanelTab}
                        setActivePanelTab={setActivePanelTab}
                        selectedQuestion={selectedQuestion}
                        selectedQuestionRef={selectedQuestionRef}
                        numberedQuestionMap={numberedQuestionMap}
                        QUESTION_TYPES={QUESTION_TYPES}
                        LOGIC_OPERATORS={LOGIC_OPERATORS}
                        survey={survey}
                        groupOptions={groupOptions}
                        userOptions={userOptions}
                        allQuestions={allQuestions}
                        questionMap={questionMap}
                        updateSurveyState={updateSurveyState}
                        updateQuestion={updateQuestion}
                    />
                </div>

                <DragOverlay>
                    {activeDrag?.kind === "palette" && (
                        <div className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 shadow-lg">
                            {QUESTION_TYPES.find((type) => type.value === activeDrag.questionType)?.label || "Question"}
                        </div>
                    )}
                    {activeDrag?.kind === "question" && (
                        <div className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-lg">
                            Moving question
                        </div>
                    )}
                    {activeDrag?.kind === "page" && (
                        <div className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-lg">
                            Moving page
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default SurveyBuilderPage;
