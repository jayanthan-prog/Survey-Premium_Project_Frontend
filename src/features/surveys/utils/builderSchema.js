export const BUILDER_AUTOSAVE_KEY = "surveyBuilderDraft.v2";

export const QUESTION_TYPES = [
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

export const LOGIC_OPERATORS = [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "contains_any", label: "Contains any" },
    { value: "answered", label: "Is answered" },
    { value: "not_answered", label: "Is not answered" },
];

export const createId = (prefix) => {
    const safePrefix = String(prefix || "id");
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `${safePrefix}-${crypto.randomUUID()}`;
    }
    return `${safePrefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createQuestion = (type = "short_text") => {
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

export const createPage = (title = "New Page") => ({
    id: createId("page"),
    title,
    collapsed: false,
    questions: [],
});

export const defaultSurveyState = {
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
    responseCategoryLimits: [],
    mailDraft: {
        subject: "",
        body: "",
    },
    targetGroups: [],
    targetUserIds: [],
    pages: [createPage("Page 1")],
};

export const normalizeQuestion = (rawQuestion) => {
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

export const buildQuestionMap = (questions = []) => {
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

export const flattenQuestions = (pages = []) => {
    const all = [];
    (pages || []).forEach((page) => {
        (page.questions || []).forEach((question) => {
            all.push(question);
        });
    });
    return all;
};

const parseConfig = (config) => {
    if (!config) return {};
    if (typeof config === "object") return config;
    try {
        return JSON.parse(config);
    } catch {
        return {};
    }
};

export const normalizeApiSurvey = (survey) => {
    const config = parseConfig(survey?.config);
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
        responseCategoryLimits: Array.isArray(config.responseCategoryLimits)
            ? config.responseCategoryLimits
            : (Array.isArray(config.responseQuotas) ? config.responseQuotas : []),
        mailDraft: {
            subject: String(config?.mailDraft?.subject || ""),
            body: String(config?.mailDraft?.body || ""),
        },
        targetGroups: Array.isArray(config.targetGroups) ? config.targetGroups : [],
        targetUserIds: Array.isArray(config.targetUserIds)
            ? config.targetUserIds.map((value) => String(value))
            : [],
        pages,
    };
};
