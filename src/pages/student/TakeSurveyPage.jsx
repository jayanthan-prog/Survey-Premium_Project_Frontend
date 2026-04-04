import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FileUp, Paperclip, Star, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import HoverProfile from "../../components/profile/HoverProfile";
import { getSurveyById, getSurveyParticipants, submitSurvey } from "../../services/surveyApi";

const normalizeQuestionType = (value) => String(value || "").trim().toLowerCase().replace(/[-\s]+/g, "_");
const normalizeTextKey = (value) => String(value || "").trim().toLowerCase();

const parseDateValue = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSurveyClosedForUser = (survey, isCompleted) => {
    if (!survey || isCompleted) return false;

    const surveyStatus = String(survey?.status || "").toUpperCase();
    if (surveyStatus !== "PUBLISHED") return true;

    const releases = Array.isArray(survey?.releases) ? survey.releases : [];
    const latestRelease = releases.length ? releases[0] : null;

    if (!latestRelease) {
        return true;
    }

    const isFrozen = Boolean(latestRelease?.is_frozen || latestRelease?.isFrozen);
    if (isFrozen) return true;

    const closesAt = parseDateValue(latestRelease?.closes_at || latestRelease?.closesAt);
    if (closesAt && closesAt.getTime() <= Date.now()) return true;

    return false;
};

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

const normalizeChoiceOption = (option) => {
    if (option == null) {
        return { label: "Option", value: "option", limit: null, selectedCount: 0 };
    }

    if (typeof option === "string" || typeof option === "number") {
        const label = String(option);
        return { label, value: label, limit: null, selectedCount: 0 };
    }

    return {
        label: String(option.label || option.text || option.option_text || option.value || "Option"),
        value: String(option.value || option.option_value || option.label || option.option_text || "option"),
        limit: option.limit == null ? null : Math.max(0, Number(option.limit) || 0),
        selectedCount: Math.max(0, Number(option.selectedCount ?? option.selected_count ?? 0) || 0),
        meta: option.meta && typeof option.meta === "object" ? option.meta : {},
    };
};

const choiceOptionLabel = (option) => {
    const normalized = normalizeChoiceOption(option);
    if (normalized.limit != null) {
        const remaining = Math.max(0, Number(normalized.limit) - Number(normalized.selectedCount || 0));
        return `${normalized.label} (${remaining} left)`;
    }
    return normalized.label;
};

const getChoiceOptions = (question) => (Array.isArray(question?.options) ? question.options : []).map((option) => normalizeChoiceOption(option));

const isChoiceType = (value) => ["single_choice", "multiple_choice", "dropdown", "limited_dropdown", "priority_select", "multi_level_selection"].includes(normalizeQuestionType(value));

const getAvailableChoiceOptions = (question, currentValues = []) => {
    const selectedSet = new Set((Array.isArray(currentValues) ? currentValues : [currentValues]).map((value) => String(value)).filter(Boolean));
    return getChoiceOptions(question).filter((option) => {
        const limit = option.limit;
        const available = limit == null || limit <= 0 || Number(option.selectedCount || 0) < Number(limit);
        if (!available) return false;
        if (selectedSet.has(String(option.value))) return true;
        return true;
    });
};

const toSelectionArray = (value) => (Array.isArray(value) ? value.map((entry) => String(entry)) : []);

const isImportedUserChoiceOption = (option) => {
    const meta = option?.meta && typeof option.meta === "object" ? option.meta : {};
    const metaSource = String(meta?.source || "").toLowerCase() === "imported_user";
    const valuePattern = /^user_\d+$/i.test(String(option?.value || ""));
    return metaSource || valuePattern;
};

const toImportedUserForHover = (option) => {
    const normalized = normalizeChoiceOption(option);
    const meta = normalized.meta || {};
    const fallbackIdMatch = String(normalized.value || "").match(/^user_(\d+)$/i);
    const fallbackUserId = fallbackIdMatch ? Number(fallbackIdMatch[1]) : null;
    return {
        user_id: meta.user_id || fallbackUserId,
        name: normalized.label,
        email: meta.email || "",
        department: meta.department || "",
        category: meta.gender || "",
        attributes: {
            department: meta.department || "",
            gender: meta.gender || "",
        },
    };
};

const normalizeSelectionObject = (value) => {
    if (!value || typeof value !== "object") {
        return { primary: [], secondary: [], special: [] };
    }
    return {
        primary: toSelectionArray(value.primary),
        secondary: toSelectionArray(value.secondary),
        special: toSelectionArray(value.special),
    };
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

const normalizeSelectionRules = (value) => {
    if (Array.isArray(value)) {
        const reduced = {};
        value.forEach((entry) => {
            const key = String(entry?.key ?? entry?.type ?? "").trim();
            if (!key) return;
            reduced[key] = entry?.value;
        });
        return reduced;
    }
    if (value && typeof value === "object") return value;
    return {};
};

const normalizePages = (pages, questions) => {
    const serverQuestions = Array.isArray(questions) ? questions : [];

    if (!Array.isArray(pages) || pages.length === 0) {
        return serverQuestions.length ? [{ id: "page1", title: "Questions", questions: serverQuestions }] : [];
    }

    if (!serverQuestions.length) {
        return pages;
    }

    const byId = new Map(serverQuestions.map((q) => [String(q.id), q]));
    const flatRefs = pages.flatMap((page) => (Array.isArray(page?.questions) ? page.questions : []));

    const canMapById = flatRefs.length > 0 && flatRefs.every((ref) => {
        const legacyId = ref && typeof ref === "object"
            ? (ref.id ?? ref.question_id ?? ref.questionId)
            : ref;
        return legacyId != null && byId.has(String(legacyId));
    });

    if (canMapById) {
        return pages.map((page) => ({
            ...page,
            questions: (Array.isArray(page?.questions) ? page.questions : [])
                .map((ref) => {
                    const legacyId = ref && typeof ref === "object"
                        ? (ref.id ?? ref.question_id ?? ref.questionId)
                        : ref;
                    return byId.get(String(legacyId));
                })
                .filter(Boolean),
        }));
    }

    if (flatRefs.length > 0 && flatRefs.length === serverQuestions.length) {
        let index = 0;
        return pages.map((page) => ({
            ...page,
            questions: (Array.isArray(page?.questions) ? page.questions : [])
                .map(() => serverQuestions[index++])
                .filter(Boolean),
        }));
    }

    return [{ id: "page1", title: "Questions", questions: serverQuestions }];
};

export default function TakeSurveyPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [answers, setAnswers] = useState({});
    const [otp, setOtp] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [alreadyCompleted, setAlreadyCompleted] = useState(false);
    const isCoreMember = Boolean(user?.isCoreMember || user?.is_core_member || user?.attributes?.isCoreMember || user?.attributes?.is_core_member);

    const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400";
    const subtleFieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400";

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
                const [response, participantsResponse] = await Promise.all([
                    getSurveyById(id),
                    getSurveyParticipants(),
                ]);
                if (!active) return;

                const participants = Array.isArray(participantsResponse) ? participantsResponse : [];
                const completed = participants.some((entry) => (
                    Number(entry?.survey_id) === Number(id)
                    && Number(entry?.user_id) === Number(user?.user_id)
                    && String(entry?.status || "").toUpperCase() === "COMPLETED"
                ));

                setSurvey(response);
                setAlreadyCompleted(completed);
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
    }, [id, user?.user_id]);

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
    const pageQuestions = useMemo(
        () => (Array.isArray(currentPage?.questions) ? currentPage.questions : []),
        [currentPage]
    );

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

    const totalQuestions = useMemo(() => {
        if (Array.isArray(questions) && questions.length) return questions.length;
        return visibleQuestions.length;
    }, [questions, visibleQuestions]);

    const answeredCount = useMemo(
        () => visibleQuestions.filter((q) => hasValue(answers[String(q.id)])).length,
        [visibleQuestions, answers]
    );
    const progressPercent = totalQuestions ? Math.max(0, Math.min(100, (answeredCount / totalQuestions) * 100)) : 0;

    useEffect(() => {
        const cards = document.querySelectorAll('[data-question-card="true"]');
        cards.forEach((card, index) => {
            card.animate(
                [
                    { opacity: 0, transform: "translateY(10px)" },
                    { opacity: 1, transform: "translateY(0)" },
                ],
                {
                    duration: 220,
                    easing: "ease-out",
                    delay: index * 35,
                    fill: "both",
                }
            );
        });
    }, [currentPageIndex]);

    useEffect(() => {
        if (alreadyCompleted && !submitted) {
            navigate("/student/surveys", { replace: true });
        }
    }, [alreadyCompleted, submitted, navigate]);

    const surveyClosed = useMemo(() => isSurveyClosedForUser(survey, alreadyCompleted), [survey, alreadyCompleted]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting || submitted) return;

        const parseValidation = (value) => {
            if (!value || typeof value !== "object") return {};
            return {
                minLength: value.minLength === "" || value.minLength == null ? null : Math.max(0, Number(value.minLength) || 0),
                maxLength: value.maxLength === "" || value.maxLength == null ? null : Math.max(0, Number(value.maxLength) || 0),
                regex: String(value.regex || "").trim(),
                email: Boolean(value.email),
            };
        };

        const isEmailLike = (text) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(text || "").trim());

        const validateText = (question, value, validation) => {
            const text = value == null ? "" : String(value);

            if (validation.minLength != null && text.length < validation.minLength) {
                setError(`${question.text} must be at least ${validation.minLength} characters.`);
                return false;
            }
            if (validation.maxLength != null && text.length > validation.maxLength) {
                setError(`${question.text} must be at most ${validation.maxLength} characters.`);
                return false;
            }
            if (validation.email && text && !isEmailLike(text)) {
                setError(`${question.text} must be a valid email address.`);
                return false;
            }
            if (validation.regex) {
                try {
                    const pattern = new RegExp(validation.regex);
                    if (text && !pattern.test(text)) {
                        setError(`${question.text} is not in the required format.`);
                        return false;
                    }
                } catch {
                    setError(`Validation pattern is invalid for: ${question.text}`);
                    return false;
                }
            }

            return true;
        };

        // Validate all questions in current page
        for (const question of visibleQuestions) {
            const questionId = String(question.id);
            const questionType = normalizeQuestionType(question.type);
            const value = answers[questionId];
            const choiceOptions = getChoiceOptions(question);
            const validation = parseValidation(question.validation);
            if (!question.required) {
                // Still validate constraints for optional fields
                if ((questionType === "short_text" || questionType === "long_text") && hasValue(value)) {
                    if (!validateText(question, value, validation)) return;
                }
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

            if (questionType === "priority_select") {
                const selections = toSelectionArray(value);
                const maxRank = Math.max(1, Number(question.maxRank || 3));
                if (selections.length < maxRank) {
                    setError(`Please rank all ${maxRank} choices for: ${question.text}`);
                    return;
                }
                if (new Set(selections).size !== selections.length) {
                    setError(`Duplicate selections are not allowed for: ${question.text}`);
                    return;
                }
                if (choiceOptions.length && selections.some((entry) => !choiceOptions.some((option) => String(option.value) === String(entry)))) {
                    setError(`One or more selections are invalid for: ${question.text}`);
                    return;
                }
                continue;
            }

            if (questionType === "multi_level_selection") {
                const selection = normalizeSelectionObject(value);
                const rules = normalizeSelectionRules(question.selectionRules);
                const primaryMax = Math.max(1, Number(rules.maxPrimary ?? 2));
                const secondaryMax = Math.max(0, Number(rules.maxSecondary ?? 2));
                const specialMax = Math.max(0, Number(rules.maxSpecial ?? 0));
                if (selection.primary.length < primaryMax) {
                    setError(`Please choose ${primaryMax} primary option(s) for: ${question.text}`);
                    return;
                }
                if (secondaryMax > 0 && selection.secondary.length < secondaryMax) {
                    setError(`Please choose ${secondaryMax} secondary option(s) for: ${question.text}`);
                    return;
                }
                if (specialMax > 0 && selection.special.length < specialMax) {
                    setError(`Please choose ${specialMax} special option(s) for: ${question.text}`);
                    return;
                }

                const combined = [...selection.primary, ...selection.secondary, ...selection.special];
                if ((rules.preventDuplicate ?? true) && new Set(combined).size !== combined.length) {
                    setError(`Primary and secondary choices must be different for: ${question.text}`);
                    return;
                }
                if (choiceOptions.length && combined.some((entry) => !choiceOptions.some((option) => String(option.value) === String(entry)))) {
                    setError(`One or more selections are invalid for: ${question.text}`);
                    return;
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

            if (questionType === "short_text" || questionType === "long_text") {
                if (!validateText(question, value, validation)) return;
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

        // If there are more pages, continue to next page
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
        const groupIdSet = new Set(groups.map((group) => String(group.id)));

        // Keep all non-group answers with actual value to avoid dropping answers from other pages.
        for (const [key, value] of Object.entries(answers || {})) {
            if (groupIdSet.has(String(key))) continue;
            if (!hasValue(value)) continue;
            filteredAnswers[String(key)] = value;
        }

        // Include group answers
        for (const group of groups) {
            const groupKey = String(group.id);
            if (Object.prototype.hasOwnProperty.call(answers, groupKey)) {
                filteredAnswers[groupKey] = answers[groupKey];
            }
        }

        if (!Object.keys(filteredAnswers).length) {
            setError("Please answer at least one question before submitting.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const participantsBeforeSubmit = await getSurveyParticipants();
            const alreadySubmitted = (Array.isArray(participantsBeforeSubmit) ? participantsBeforeSubmit : []).some((entry) => (
                Number(entry?.survey_id) === Number(id)
                && Number(entry?.user_id) === Number(user?.user_id)
                && String(entry?.status || "").toUpperCase() === "COMPLETED"
            ));

            if (alreadySubmitted) {
                setSubmitted(true);
                setTimeout(() => navigate("/student/surveys", { replace: true }), 1200);
                return;
            }

            await submitSurvey(id, { answers: filteredAnswers, otp: config.otpRequired ? otp : undefined });
            setSubmitted(true);
            setTimeout(() => navigate("/student/surveys", { replace: true }), 1200);
        } catch (err) {
            const message = err?.message || "Failed to submit survey.";
            if (String(message).toLowerCase().includes("already") || err?.status === 409) {
                setSubmitted(true);
                setTimeout(() => navigate("/student/surveys", { replace: true }), 1200);
                return;
            }
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading survey...</div>;
    }

    if (error && !survey) {
        return (
            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-rose-200 bg-rose-50/60 p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-rose-900">Take Survey</h1>
                <div className="mt-2 text-sm text-rose-700">{error}</div>
                <button
                    type="button"
                    onClick={() => navigate("/student/surveys")}
                    className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                >
                    Back to Surveys
                </button>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
                <img src="/successimage.gif" alt="Survey submitted successfully" className="h-48 w-48 object-contain" />
                <h1 className="mt-4 text-xl font-semibold text-emerald-900">Survey submitted successfully</h1>
                <p className="mt-2 text-sm text-emerald-700">Redirecting to surveys...</p>
            </div>
        );
    }

    if (isCoreMember) {
        return (
            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-amber-900">Core Committee Access</h1>
                <div className="mt-2 text-sm text-amber-700">Core members are already shortlisted and should not apply again.</div>
                <button
                    type="button"
                    onClick={() => navigate("/student/surveys")}
                    className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                    Back to Surveys
                </button>
            </div>
        );
    }

    if (surveyClosed) {
        return (
            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-300 bg-slate-50 p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-slate-900">Survey Closed</h1>
                <div className="mt-2 text-sm text-slate-700">This survey is no longer accepting responses.</div>
                <button
                    type="button"
                    onClick={() => navigate("/student/surveys")}
                    className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
                >
                    Back to Surveys
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto w-full max-w-6xl">
                <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div className="text-xs font-semibold text-slate-600">Step {currentPageIndex + 1} of {Math.max(1, pages.length)}</div>
                        <div className="flex items-center gap-3">
                            {Array.from({ length: Math.max(1, pages.length) }, (_, idx) => (
                                <span
                                    key={`step-dot-${idx}`}
                                    className={`h-1.5 w-5 rounded-full ${idx <= currentPageIndex ? "bg-violet-500" : "bg-slate-300"}`}
                                />
                            ))}
                        </div>
                    </div>


                    <div className="px-5 py-5 sm:px-6 sm:py-6">
                        {visibleQuestions.map((q, index) => (
                            <div key={q.id} data-question-card="true" className="mb-5 space-y-2">
                                {(() => {
                                    const questionType = normalizeQuestionType(q.type);

                                    return (
                                        <>
                                            <label className="block text-sm font-semibold text-slate-700">{q.text}</label>
                                            {questionType === "short_text" && (
                                                <input className={fieldClass} value={answers[String(q.id)] || ""} onChange={e => handleChange(q.id, e.target.value)} required={q.required} placeholder={q.placeholder || "Type here"} />
                                            )}
                                            {questionType === "long_text" && (
                                                <textarea
                                                    rows={4}
                                                    className={fieldClass}
                                                    value={answers[String(q.id)] || ""}
                                                    onChange={(e) => handleChange(q.id, e.target.value)}
                                                    required={q.required}
                                                    placeholder={q.placeholder || "Type here"}
                                                />
                                            )}
                                            {questionType === "multiple_choice" && (() => {
                                                const availableOptions = getChoiceOptions(q);
                                                const hasImportedUsers = availableOptions.some((opt) => isImportedUserChoiceOption(opt));
                                                return (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {availableOptions.map((opt) => {
                                                            const selected = Array.isArray(answers[String(q.id)]) && answers[String(q.id)].includes(opt.value);
                                                            const hoverUser = isImportedUserChoiceOption(opt) ? toImportedUserForHover(opt) : null;
                                                            return (
                                                                <label
                                                                    key={opt.value}
                                                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px] transition-all ${selected
                                                                        ? "border-violet-400 bg-violet-50 text-violet-800"
                                                                        : "border-gray-200 bg-white text-slate-700 hover:border-purple-400 hover:bg-purple-50"
                                                                        }`}
                                                                >
                                                                    <input
                                                                        className="h-4 w-4 rounded accent-purple-600"
                                                                        type="checkbox"
                                                                        value={opt.value}
                                                                        checked={selected}
                                                                        onChange={(e) => {
                                                                            let arr = Array.isArray(answers[String(q.id)]) ? [...answers[String(q.id)]] : [];
                                                                            if (e.target.checked) arr.push(opt.value);
                                                                            else arr = arr.filter((o) => o !== opt.value);
                                                                            handleChange(q.id, arr);
                                                                        }}
                                                                    />
                                                                    {hasImportedUsers && hoverUser ? (
                                                                        <HoverProfile user={hoverUser}>
                                                                            <span className="underline decoration-dotted underline-offset-2">
                                                                                {choiceOptionLabel(opt)}
                                                                            </span>
                                                                        </HoverProfile>
                                                                    ) : (
                                                                        <span>{choiceOptionLabel(opt)}</span>
                                                                    )}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                            {questionType === "single_choice" && (() => {
                                                const availableOptions = getChoiceOptions(q);
                                                const hasImportedUsers = availableOptions.some((opt) => isImportedUserChoiceOption(opt));
                                                return (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {availableOptions.map((opt) => {
                                                            const selected = answers[String(q.id)] === opt.value;
                                                            const hoverUser = isImportedUserChoiceOption(opt) ? toImportedUserForHover(opt) : null;
                                                            return (
                                                                <label
                                                                    key={opt.value}
                                                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px] transition-all ${selected
                                                                        ? "border-violet-400 bg-violet-50 text-violet-800"
                                                                        : "border-gray-200 bg-white text-slate-700 hover:border-purple-400 hover:bg-purple-50"
                                                                        }`}
                                                                >
                                                                    <input
                                                                        className="h-4 w-4 accent-purple-600"
                                                                        type="radio"
                                                                        name={`q${q.id}`}
                                                                        value={opt.value}
                                                                        checked={selected}
                                                                        onChange={() => handleChange(q.id, opt.value)}
                                                                    />
                                                                    {hasImportedUsers && hoverUser ? (
                                                                        <HoverProfile user={hoverUser}>
                                                                            <span className="underline decoration-dotted underline-offset-2">
                                                                                {choiceOptionLabel(opt)}
                                                                            </span>
                                                                        </HoverProfile>
                                                                    ) : (
                                                                        <span>{choiceOptionLabel(opt)}</span>
                                                                    )}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                            {questionType === "rating" && (
                                                <div className="flex items-center gap-2 mt-3">
                                                    {Array.from({ length: Math.max(1, q.scaleMax || 5) }, (_, i) => i + 1).map((n) => (
                                                        <button
                                                            key={n}
                                                            type="button"
                                                            onClick={() => handleChange(q.id, n)}
                                                            className={`p-1 transition ${Number(answers[String(q.id)]) >= Number(n)
                                                                ? "text-yellow-400"
                                                                : "text-gray-300 hover:text-yellow-400"
                                                                } hover:scale-110`}
                                                        >
                                                            <Star size={22} fill="currentColor" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {questionType === "file_upload" && (
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition">
                                                    <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                                                        <FileUp size={18} />
                                                    </div>
                                                    <div className="mt-2 text-sm font-semibold text-gray-800">Upload supporting file</div>
                                                    <div className="text-xs text-gray-600">Drag & drop your file here</div>
                                                    <div className="mt-1 text-xs text-gray-500">Allowed: PDF, images, docs. Max size depends on server limits.</div>

                                                    <div className="mt-3">
                                                        <label
                                                            htmlFor={`file-input-${q.id}`}
                                                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                                        >
                                                            <Paperclip size={14} />
                                                            Choose File
                                                        </label>
                                                    </div>

                                                    <input
                                                        id={`file-input-${q.id}`}
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) => handleFileChange(q.id, e.target.files?.[0] || null)}
                                                    />

                                                    {answers[String(q.id)]?.file_name && (
                                                        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-left">
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
                                            {(["dropdown", "limited_dropdown"].includes(questionType)) && (() => {
                                                const availableOptions = getAvailableChoiceOptions(q, answers[String(q.id)]);
                                                const hasImportedUsers = availableOptions.some((opt) => isImportedUserChoiceOption(opt));

                                                if (hasImportedUsers) {
                                                    return (
                                                        <div className="space-y-2">
                                                            {availableOptions.map((opt) => {
                                                                const selected = String(answers[String(q.id)] || "") === String(opt.value);
                                                                const hoverUser = isImportedUserChoiceOption(opt) ? toImportedUserForHover(opt) : null;
                                                                return (
                                                                    <label
                                                                        key={opt.value}
                                                                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px] transition-all ${selected
                                                                            ? "border-violet-400 bg-violet-50 text-violet-800"
                                                                            : "border-gray-200 bg-white text-slate-700 hover:border-purple-400 hover:bg-purple-50"
                                                                            }`}
                                                                    >
                                                                        <input
                                                                            className="h-4 w-4 accent-purple-600"
                                                                            type="radio"
                                                                            name={`q${q.id}`}
                                                                            value={opt.value}
                                                                            checked={selected}
                                                                            onChange={() => handleChange(q.id, opt.value)}
                                                                            required={q.required && !answers[String(q.id)]}
                                                                        />
                                                                        {hoverUser ? (
                                                                            <HoverProfile user={hoverUser}>
                                                                                <span className="underline decoration-dotted underline-offset-2">
                                                                                    {choiceOptionLabel(opt)}
                                                                                </span>
                                                                            </HoverProfile>
                                                                        ) : (
                                                                            <span>{choiceOptionLabel(opt)}</span>
                                                                        )}
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <select
                                                        className={`${fieldClass} pr-8`}
                                                        value={answers[String(q.id)] || ""}
                                                        onChange={(e) => handleChange(q.id, e.target.value)}
                                                        required={q.required}
                                                    >
                                                        <option value="">-- Select an option --</option>
                                                        {availableOptions.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>{choiceOptionLabel(opt)}</option>
                                                        ))}
                                                    </select>
                                                );
                                            })()}
                                            {questionType === "priority_select" && (() => {
                                                const maxRank = Math.max(1, Number(q.maxRank || 3));
                                                const selections = toSelectionArray(answers[String(q.id)]);
                                                return (
                                                    <div className="space-y-2">
                                                        {Array.from({ length: maxRank }, (_, index) => index).map((rankIndex) => {
                                                            const currentValue = selections[rankIndex] || "";
                                                            const usedValues = selections.filter((_, idx) => idx !== rankIndex).map(String);
                                                            const availableOptions = getChoiceOptions(q).filter((opt) => !usedValues.includes(String(opt.value)) || String(currentValue) === String(opt.value));
                                                            return (
                                                                <select
                                                                    key={`${q.id}-rank-${rankIndex}`}
                                                                    className={`${fieldClass} pr-8`}
                                                                    value={currentValue}
                                                                    onChange={(e) => {
                                                                        const next = [...selections];
                                                                        next[rankIndex] = e.target.value;
                                                                        handleChange(q.id, next.filter(Boolean));
                                                                    }}
                                                                >
                                                                    <option value="">Rank {rankIndex + 1}</option>
                                                                    {availableOptions.map((opt) => (
                                                                        <option key={opt.value} value={opt.value}>{choiceOptionLabel(opt)}</option>
                                                                    ))}
                                                                </select>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                            {questionType === "multi_level_selection" && (() => {
                                                const rules = normalizeSelectionRules(q.selectionRules);
                                                const selection = normalizeSelectionObject(answers[String(q.id)]);
                                                const renderSelectGroup = (label, key, count) => (
                                                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</div>
                                                        {Array.from({ length: Math.max(1, Number(count || 0)) }, (_, index) => index).map((slotIndex) => {
                                                            const groupValues = selection[key];
                                                            const currentValue = groupValues[slotIndex] || "";
                                                            const otherValues = [...selection.primary, ...selection.secondary, ...selection.special]
                                                                .filter(Boolean)
                                                                .filter((value) => String(value) !== String(currentValue));
                                                            const availableOptions = getChoiceOptions(q).filter((opt) => !otherValues.includes(String(opt.value)) || String(currentValue) === String(opt.value));
                                                            return (
                                                                <select
                                                                    key={`${q.id}-${key}-${slotIndex}`}
                                                                    className={`${fieldClass} pr-8`}
                                                                    value={currentValue}
                                                                    onChange={(e) => {
                                                                        const next = normalizeSelectionObject(answers[String(q.id)]);
                                                                        next[key][slotIndex] = e.target.value;
                                                                        handleChange(q.id, next);
                                                                    }}
                                                                >
                                                                    <option value="">{label} {slotIndex + 1}</option>
                                                                    {availableOptions.map((opt) => (
                                                                        <option key={opt.value} value={opt.value}>{choiceOptionLabel(opt)}</option>
                                                                    ))}
                                                                </select>
                                                            );
                                                        })}
                                                    </div>
                                                );

                                                return (
                                                    <div className="space-y-3">
                                                        {renderSelectGroup("Primary", "primary", rules.maxPrimary ?? 2)}
                                                        {Number(rules.maxSecondary ?? 0) > 0 && renderSelectGroup("Secondary", "secondary", rules.maxSecondary ?? 2)}
                                                        {Number(rules.maxSpecial ?? 0) > 0 && renderSelectGroup("Special", "special", rules.maxSpecial ?? 1)}
                                                    </div>
                                                );
                                            })()}
                                            {questionType === "date" && (
                                                <input
                                                    type="date"
                                                    className={fieldClass}
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
                                                    className={fieldClass}
                                                    value={answers[String(q.id)] ?? ""}
                                                    onChange={(e) => handleChange(q.id, e.target.value ? Number(e.target.value) : "")}
                                                    required={q.required}
                                                    placeholder={q.min != null && q.max != null ? `${q.min}-${q.max}` : ""}
                                                />
                                            )}
                                            {questionType === "matrix" && (
                                                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
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
                                                                                className="h-4 w-4 border-slate-300 text-purple-600 focus:ring-purple-500"
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
                                        </>
                                    );
                                })()}
                            </div>
                        ))}

                        {groups.map((group) => {
                            const groupKey = String(group.id);
                            const memberArray = Array.isArray(answers[groupKey]) ? answers[groupKey] : [];

                            return (
                                <div key={group.id} className="space-y-3 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-3 sm:p-4">
                                    <h3 className="text-base font-semibold text-blue-900">{group.label}</h3>

                                    {memberArray.map((member, memberIdx) => (
                                        <div key={memberIdx} className="space-y-3 rounded-lg border border-blue-200 bg-white p-3">
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
                                                        <div key={qId} className="space-y-1.5">
                                                            <label className="block text-sm font-medium text-slate-700">
                                                                {q.text}
                                                                {q.required && <span className="text-red-500">*</span>}
                                                            </label>

                                                            {qType === "short_text" && (
                                                                <input
                                                                    className={subtleFieldClass}
                                                                    value={memberValue}
                                                                    onChange={(e) => updateGroupMember(group.id, memberIdx, qId, e.target.value)}
                                                                    required={q.required}
                                                                    placeholder={q.placeholder || ""}
                                                                />
                                                            )}

                                                            {qType === "long_text" && (
                                                                <textarea
                                                                    rows={3}
                                                                    className={subtleFieldClass}
                                                                    value={memberValue}
                                                                    onChange={(e) => updateGroupMember(group.id, memberIdx, qId, e.target.value)}
                                                                    required={q.required}
                                                                    placeholder={q.placeholder || ""}
                                                                />
                                                            )}

                                                            {qType === "single_choice" && (
                                                                <select
                                                                    className={subtleFieldClass}
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
                                                                                className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
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
                                                                    className={subtleFieldClass}
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
                            <div className="space-y-2 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
                                <label className="block text-sm font-semibold text-amber-900">OTP Verification</label>
                                <input
                                    className="w-full rounded-none border-0 border-b-2 border-amber-300 bg-transparent px-0 py-2 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-0"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter the 6-digit OTP"
                                    required
                                />
                                <div className="text-xs text-amber-700">This survey requires a valid OTP generated by the admin within the last 10 seconds.</div>
                            </div>
                        )}
                        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</div>}

                        <div className="flex justify-between mt-6">
                            <button type="button" onClick={goToPreviousPage} disabled={currentPageIndex === 0 || submitting} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Previous</button>
                            {currentPageIndex < pages.length - 1 && <button type="button" onClick={goToNextPage} disabled={submitting} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Next</button>}
                            {currentPageIndex === pages.length - 1 && <button disabled={submitting} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg mt-4 disabled:opacity-60">{submitting ? "Submitting..." : "Submit Survey"}</button>}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
