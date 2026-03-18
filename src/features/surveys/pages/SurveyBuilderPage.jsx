import { useEffect, useMemo, useState } from "react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    closestCenter,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Copy,
    Eye,
    GripVertical,
    Plus,
    Save,
    Settings2,
    Trash2,
    WandSparkles,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { listGroups } from "../../../services/groupService";
import { createSurvey, getSurveyById, publishSurvey, updateSurvey } from "../../../services/surveyApi";

const BUILDER_AUTOSAVE_KEY = "surveyBuilderDraft.v2";

const QUESTION_TYPES = [
    { value: "short_text", label: "Short Text" },
    { value: "long_text", label: "Long Text" },
    { value: "single_choice", label: "Single Choice" },
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "dropdown", label: "Dropdown" },
    { value: "rating", label: "Rating" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "file_upload", label: "File Upload" },
    { value: "matrix", label: "Matrix" },
];

const LOGIC_OPERATORS = [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "contains_any", label: "Contains any" },
    { value: "answered", label: "Is answered" },
    { value: "not_answered", label: "Is not answered" },
];

const createId = (prefix) => {
    const safePrefix = String(prefix || "id");
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `${safePrefix}-${crypto.randomUUID()}`;
    }
    return `${safePrefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createQuestion = (type = "short_text") => {
    const isChoice = ["single_choice", "multiple_choice", "dropdown"].includes(type);

    return {
        id: createId("q"),
        text: "",
        description: "",
        type,
        required: false,
        randomizeOptions: false,
        options: isChoice ? ["Option 1", "Option 2"] : [],
        scaleMin: 1,
        scaleMax: 5,
        min: "",
        max: "",
        rows: type === "matrix" ? ["Row 1", "Row 2"] : [],
        columns: type === "matrix" ? ["Column 1", "Column 2"] : [],
        displayLogic: {
            enabled: false,
            sourceQuestionId: "",
            operator: "equals",
            expectedValue: "",
        },
        skipLogic: {
            enabled: false,
            sourceQuestionId: "",
            operator: "equals",
            expectedValue: "",
            action: "jumpToPage",
            targetId: "",
        },
        validation: {
            minLength: "",
            maxLength: "",
            regex: "",
            email: false,
            min: "",
            max: "",
        },
    };
};

const createPage = (title = "New Page") => ({
    id: createId("page"),
    title,
    collapsed: false,
    questions: [],
});

const defaultSurveyState = {
    id: null,
    title: "",
    description: "",
    category: "PICK_N",
    startDate: "",
    endDate: "",
    otpRequired: false,
    randomizeQuestions: false,
    themeColor: "#0ea5e9",
    maxResponses: "",
    targetGroups: [],
    pages: [createPage("Page 1")],
};

const normalizeQuestion = (rawQuestion) => {
    const base = createQuestion(rawQuestion?.type || "short_text");
    const question = { ...base, ...(rawQuestion || {}) };

    if (!["single_choice", "multiple_choice", "dropdown"].includes(question.type)) {
        question.options = [];
    } else if (!Array.isArray(question.options) || !question.options.length) {
        question.options = ["Option 1", "Option 2"];
    }

    if (question.type !== "matrix") {
        question.rows = [];
        question.columns = [];
    } else {
        question.rows = Array.isArray(question.rows) && question.rows.length ? question.rows : ["Row 1", "Row 2"];
        question.columns = Array.isArray(question.columns) && question.columns.length ? question.columns : ["Column 1", "Column 2"];
    }

    question.validation = {
        ...base.validation,
        ...(rawQuestion?.validation || {}),
    };

    question.displayLogic = {
        ...base.displayLogic,
        ...(rawQuestion?.displayLogic || {}),
    };

    question.skipLogic = {
        ...base.skipLogic,
        ...(rawQuestion?.skipLogic || {}),
    };

    return question;
};

const buildQuestionMap = (questions = []) => {
    const map = new Map();
    questions.forEach((question, index) => {
        map.set(String(question.id), {
            index,
            label: `Q${index + 1}`,
            text: question.text || "Untitled question",
            type: question.type,
            options: Array.isArray(question.options) ? question.options : [],
        });
    });
    return map;
};

const flattenQuestions = (pages = []) => {
    const all = [];
    (pages || []).forEach((page) => {
        (page.questions || []).forEach((question) => {
            all.push(question);
        });
    });
    return all;
};

const normalizeApiSurvey = (survey) => {
    const config = survey?.config && typeof survey.config === "string" ? JSON.parse(survey.config) : (survey?.config || {});
    const existingQuestions = Array.isArray(survey?.questions) ? survey.questions.map(normalizeQuestion) : [];
    const questionById = new Map(existingQuestions.map((question) => [String(question.id), question]));

    let pages = [];
    if (Array.isArray(config.pages) && config.pages.length) {
        pages = config.pages.map((rawPage, index) => {
            const rawQuestions = Array.isArray(rawPage?.questions) ? rawPage.questions : [];
            const questions = rawQuestions.map((entry) => {
                if (typeof entry === "object" && entry) {
                    const existing = questionById.get(String(entry.id));
                    return normalizeQuestion(existing || entry);
                }
                const existing = questionById.get(String(entry));
                return normalizeQuestion(existing || createQuestion());
            });
            return {
                id: rawPage?.id || createId("page"),
                title: String(rawPage?.title || `Page ${index + 1}`),
                collapsed: Boolean(rawPage?.collapsed),
                questions,
            };
        });
    } else {
        pages = [{ ...createPage("Page 1"), questions: existingQuestions }];
    }

    if (!pages.length) pages = [createPage("Page 1")];

    return {
        id: survey?.survey_id || null,
        title: String(survey?.title || ""),
        description: String(config.summary || ""),
        category: String(survey?.type || "PICK_N"),
        startDate: config.startDate || "",
        endDate: config.endDate || "",
        otpRequired: Boolean(config.otpRequired),
        randomizeQuestions: Boolean(config.randomizeQuestions),
        themeColor: String(config.themeColor || "#0ea5e9"),
        maxResponses: config.maxResponses == null ? "" : String(config.maxResponses),
        targetGroups: Array.isArray(config.targetGroups) ? config.targetGroups : [],
        pages,
    };
};

function PaletteQuestionType({ type }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette:${type.value}`,
        data: {
            kind: "palette",
            questionType: type.value,
        },
    });

    return (
        <button
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            type="button"
            className={`w-full text-left rounded-xl border px-3 py-2 text-sm transition ${isDragging
                ? "border-sky-300 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                }`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{type.label}</span>
                <GripVertical size={14} className="text-slate-400" />
            </div>
        </button>
    );
}

function SortablePageContainer({ page, children }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `page:${page.id}`,
        data: {
            kind: "page",
            pageId: page.id,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <section
            ref={setNodeRef}
            style={style}
            className={`rounded-2xl border bg-white shadow-sm ${isDragging ? "border-sky-300" : "border-slate-200"}`}
        >
            {children({ dragHandleProps: { ...attributes, ...listeners } })}
        </section>
    );
}

function SortableQuestionCard({
    pageId,
    question,
    index,
    number,
    selected,
    onSelect,
    onDuplicate,
    onDelete,
    onInlineText,
}) {
    const sortable = useSortable({
        id: `question:${question.id}`,
        data: {
            kind: "question",
            pageId,
            questionId: question.id,
            index,
        },
    });

    const style = {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
    };

    return (
        <article
            ref={sortable.setNodeRef}
            style={style}
            className={`rounded-xl border bg-white p-3 transition ${selected ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200"
                } ${sortable.isDragging ? "opacity-60" : "opacity-100"}`}
            onClick={onSelect}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="rounded-md border border-slate-200 p-1 text-slate-400 hover:text-slate-600"
                        {...sortable.attributes}
                        {...sortable.listeners}
                        aria-label="Drag question"
                    >
                        <GripVertical size={14} />
                    </button>
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">{number}</div>
                        <div className="text-xs text-slate-500">{question.type.replaceAll("_", " ")}</div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDuplicate();
                        }}
                        className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                        title="Duplicate question"
                    >
                        <Copy size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete();
                        }}
                        className="rounded-md border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                        title="Delete question"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <input
                value={question.text || ""}
                onChange={(event) => onInlineText(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Type question text..."
            />

            {question.description && <p className="mt-2 text-xs text-slate-500">{question.description}</p>}
        </article>
    );
}

function BuilderPageSection({
    page,
    numberedQuestionMap,
    selectedQuestionRef,
    setSelectedQuestionRef,
    setActivePanelTab,
    updatePage,
    addQuestionToPage,
    removePage,
    duplicateQuestion,
    deleteQuestion,
    updateQuestion,
}) {
    const pageQuestionItems = page.questions.map((question, index) => ({
        id: `question:${question.id}`,
        question,
        index,
    }));

    const droppable = useDroppable({
        id: `page-drop:${page.id}`,
        data: {
            kind: "page-drop",
            pageId: page.id,
            index: page.questions.length,
        },
    });

    return (
        <SortablePageContainer key={page.id} page={page}>
            {({ dragHandleProps }) => (
                <div className="p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-slate-200 p-1 text-slate-400 hover:text-slate-700"
                                {...dragHandleProps}
                            >
                                <GripVertical size={14} />
                            </button>
                            <button
                                type="button"
                                className="rounded-md border border-slate-200 p-1 text-slate-500"
                                onClick={() => updatePage(page.id, { collapsed: !page.collapsed })}
                            >
                                {page.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <input
                                value={page.title}
                                onChange={(event) => updatePage(page.id, { title: event.target.value })}
                                className="rounded-lg border border-transparent px-2 py-1 text-sm font-semibold text-slate-900 outline-none hover:border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                placeholder="Page title"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => addQuestionToPage(page.id, "short_text")}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <Plus size={14} />
                                Question
                            </button>
                            <button
                                type="button"
                                onClick={() => removePage(page.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                            >
                                <Trash2 size={14} />
                                Page
                            </button>
                        </div>
                    </div>

                    {!page.collapsed && (
                        <div ref={droppable.setNodeRef} className="mt-4 space-y-2">
                            <SortableContext items={pageQuestionItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                                {pageQuestionItems.map((item) => (
                                    <SortableQuestionCard
                                        key={item.id}
                                        pageId={page.id}
                                        question={item.question}
                                        index={item.index}
                                        number={numberedQuestionMap.get(String(item.question.id)) || "Q?"}
                                        selected={
                                            selectedQuestionRef?.pageId === page.id &&
                                            selectedQuestionRef?.questionId === item.question.id
                                        }
                                        onSelect={() => {
                                            setSelectedQuestionRef({ pageId: page.id, questionId: item.question.id });
                                            setActivePanelTab("question");
                                        }}
                                        onDuplicate={() => duplicateQuestion(page.id, item.question.id)}
                                        onDelete={() => deleteQuestion(page.id, item.question.id)}
                                        onInlineText={(value) => updateQuestion(page.id, item.question.id, { text: value })}
                                    />
                                ))}
                            </SortableContext>

                            <div
                                className={`rounded-xl border-2 border-dashed p-3 text-center text-xs transition ${droppable.isOver
                                    ? "border-sky-300 bg-sky-50 text-sky-700"
                                    : "border-slate-200 text-slate-400"
                                    }`}
                            >
                                Drop question here
                            </div>
                        </div>
                    )}
                </div>
            )}
        </SortablePageContainer>
    );
}

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
    const [loading, setLoading] = useState(!isNewSurvey);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState("");
    const [autosaveText, setAutosaveText] = useState("");
    const [activeDrag, setActiveDrag] = useState(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    useEffect(() => {
        let active = true;

        const loadGroups = async () => {
            if (!token) return;
            try {
                const response = await listGroups(token);
                if (!active) return;
                const groups = Array.isArray(response) ? response : [];
                setGroupOptions(
                    groups.map((group) => ({
                        value: String(group.name || ""),
                        id: Number(group.group_id),
                        label: group.type ? `${group.name} (${group.type})` : String(group.name || ""),
                    }))
                );
            } catch {
                if (active) setGroupOptions([]);
            }
        };

        loadGroups();
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

    const updateSurvey = (patch) => {
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
            targetGroups: survey.targetGroups,
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
                await updateSurvey(survey.id, payload);
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
            <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Survey Builder</div>
                        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                            <input
                                value={survey.title}
                                onChange={(event) => updateSurvey({ title: event.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg font-semibold text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                placeholder="Untitled survey"
                            />
                            <span className="text-xs text-slate-500 whitespace-nowrap">{autosaveText || "Autosave every 7s"}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={previewSurvey}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <Eye size={16} />
                            Preview
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={saveSurvey}
                            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 disabled:opacity-60"
                        >
                            <Save size={16} />
                            {saving ? "Saving..." : "Save Draft"}
                        </button>
                        <button
                            type="button"
                            disabled={publishing}
                            onClick={publishCurrentSurvey}
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
                                        onChange={(event) => updateSurvey({ description: event.target.value })}
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
                                            onChange={(event) => updateSurvey({ startDate: event.target.value })}
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">End Date</label>
                                        <input
                                            type="date"
                                            value={survey.endDate}
                                            onChange={(event) => updateSurvey({ endDate: event.target.value })}
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
                                        onChange={(event) => updateSurvey({ maxResponses: event.target.value })}
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-slate-500">Theme Color</label>
                                    <input
                                        type="color"
                                        value={survey.themeColor}
                                        onChange={(event) => updateSurvey({ themeColor: event.target.value })}
                                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-2"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-slate-500">Target Groups</label>
                                    <select
                                        multiple
                                        value={survey.targetGroups}
                                        onChange={(event) => {
                                            const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                                            updateSurvey({ targetGroups: values });
                                        }}
                                        className="mt-1 h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                    >
                                        {groupOptions.map((group) => (
                                            <option key={group.id || group.value} value={group.value}>
                                                {group.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                    OTP Required
                                    <input
                                        type="checkbox"
                                        checked={survey.otpRequired}
                                        onChange={(event) => updateSurvey({ otpRequired: event.target.checked })}
                                    />
                                </label>
                                <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                    Randomize Questions
                                    <input
                                        type="checkbox"
                                        checked={survey.randomizeQuestions}
                                        onChange={(event) => updateSurvey({ randomizeQuestions: event.target.checked })}
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

                                {["single_choice", "multiple_choice", "dropdown"].includes(selectedQuestion.type) && (
                                    <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Options</div>
                                            <button
                                                type="button"
                                                className="text-xs text-sky-700 hover:underline"
                                                onClick={() =>
                                                    updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                        options: [...(selectedQuestion.options || []), `Option ${(selectedQuestion.options || []).length + 1}`],
                                                    })
                                                }
                                            >
                                                Add Option
                                            </button>
                                        </div>
                                        {(selectedQuestion.options || []).map((option, index) => (
                                            <div key={`${selectedQuestion.id}-option-${index}`} className="flex items-center gap-2">
                                                <input
                                                    value={option}
                                                    onChange={(event) => {
                                                        const next = [...(selectedQuestion.options || [])];
                                                        next[index] = event.target.value;
                                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                            options: next,
                                                        });
                                                    }}
                                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                                />
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                                                    onClick={() => {
                                                        const next = (selectedQuestion.options || []).filter((_, idx) => idx !== index);
                                                        updateQuestion(selectedQuestionRef.pageId, selectedQuestionRef.questionId, {
                                                            options: next.length ? next : ["Option 1"],
                                                        });
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}

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
