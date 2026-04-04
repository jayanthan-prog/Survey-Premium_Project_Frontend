import { apiRequest, getApiBaseUrl } from "./api";

const AUTH_STORAGE_KEY = "auth.session";

function getToken() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.token || null;
    } catch (err) {
        return null;
    }
}

const request = (url, method = "GET", body = undefined) =>
    apiRequest(url, {
        method,
        body,
        token: getToken(),
    });

// Survey CRUD
export const getSurveys = () => request('/api/surveys', 'GET');
export const createSurvey = (data) => request('/api/surveys', 'POST', data);
export const getSurveyById = (id) => request(`/api/surveys/${id}`, 'GET');
export const updateSurvey = (id, data) => request(`/api/surveys/${id}`, 'PUT', data);
export const deleteSurvey = (id) => request(`/api/surveys/${id}`, 'DELETE');
export const publishSurvey = (id, data) => request(`/api/surveys/${id}/publish`, 'POST', data);
export const unpublishSurvey = (id) => request(`/api/surveys/${id}/unpublish`, 'POST');
export const archiveSurvey = (id) => request(`/api/surveys/${id}/archive`, 'POST');
export const generateSurveyOtp = (id) => request(`/api/surveys/${id}/generate-otp`, 'POST');
export const getSurveyReport = (id) => request(`/api/surveys/${id}/report`, 'GET');
export const getSurveyResponses = (id, params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", String(params.search));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/api/surveys/${id}/responses${suffix}`, "GET");
};
export const getSurveyResponseById = (id, participationId) => request(`/api/surveys/${id}/responses/${participationId}`, "GET");
export const deleteSurveyResponse = (id, participationId) => request(`/api/surveys/${id}/responses/${participationId}`, "DELETE");
export const submitSurvey = (id, data) => request(`/api/surveys/${id}/submit`, 'POST', data);

export const exportSurveyResponses = async (id, format = "csv", params = {}) => {
    const token = getToken();
    const query = new URLSearchParams({ format: String(format || "csv") });
    if (params.search) query.set("search", String(params.search));

    const response = await fetch(`${getApiBaseUrl()}/api/surveys/${id}/responses/export?${query.toString()}`, {
        method: "GET",
        headers: {
            Authorization: token ? `Bearer ${token}` : "",
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to export responses");
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition") || "";
    const filenameMatch = contentDisposition.match(/filename="?([^\"]+)"?/i);
    const filename = filenameMatch ? filenameMatch[1] : `survey-${id}-responses.${format === "xlsx" ? "xls" : "csv"}`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

// Release management
export const getReleasesForSurvey = (surveyId) => request(`/api/surveys/${surveyId}/releases`);
export const createRelease = (surveyId, data) => request(`/api/surveys/${surveyId}/releases`, 'POST', data);
export const updateRelease = (surveyId, releaseId, data) => request(`/api/surveys/${surveyId}/releases/${releaseId}`, 'PUT', data);
export const deleteRelease = (surveyId, releaseId) => request(`/api/surveys/${surveyId}/releases/${releaseId}`, 'DELETE');

// Survey Question CRUD
export const getSurveyQuestions = () => request('/api/survey-questions', 'GET');
export const createSurveyQuestion = (data) => request('/api/survey-questions', 'POST', data);
export const getSurveyQuestionById = (id) => request(`/api/survey-questions/${id}`, 'GET');
export const updateSurveyQuestion = (id, data) => request(`/api/survey-questions/${id}`, 'PUT', data);
export const deleteSurveyQuestion = (id) => request(`/api/survey-questions/${id}`, 'DELETE');

// Survey Option CRUD
export const getSurveyOptions = () => request('/api/survey_options', 'GET');
export const createSurveyOption = (data) => request('/api/survey_options', 'POST', data);
export const getSurveyOptionById = (id) => request(`/api/survey_options/${id}`, 'GET');
export const updateSurveyOption = (id, data) => request(`/api/survey_options/${id}`, 'PUT', data);
export const deleteSurveyOption = (id) => request(`/api/survey_options/${id}`, 'DELETE');

// Survey Answer CRUD
export const getSurveyAnswers = () => request('/api/survey_answers', 'GET');
export const createSurveyAnswer = (data) => request('/api/survey_answers', 'POST', data);
export const getSurveyAnswerById = (id) => request(`/api/survey_answers/${id}`, 'GET');
export const updateSurveyAnswer = (id, data) => request(`/api/survey_answers/${id}`, 'PUT', data);
export const deleteSurveyAnswer = (id) => request(`/api/survey_answers/${id}`, 'DELETE');

// Survey Answer Selection CRUD
export const getSurveyAnswerSelections = () => request('/api/survey-answer-selections', 'GET');
export const createSurveyAnswerSelection = (data) => request('/api/survey-answer-selections', 'POST', data);
export const getSurveyAnswerSelectionById = (id) => request(`/api/survey-answer-selections/${id}`, 'GET');
export const updateSurveyAnswerSelection = (id, data) => request(`/api/survey-answer-selections/${id}`, 'PUT', data);
export const deleteSurveyAnswerSelection = (id) => request(`/api/survey-answer-selections/${id}`, 'DELETE');

// Survey Participant CRUD
export const getSurveyParticipants = () => request('/api/survey_participants', 'GET');
export const createSurveyParticipant = (data) => request('/api/survey_participants', 'POST', data);
export const getSurveyParticipantById = (id) => request(`/api/survey_participants/${id}`, 'GET');
export const updateSurveyParticipant = (id, data) => request(`/api/survey_participants/${id}`, 'PUT', data);
export const deleteSurveyParticipant = (id) => request(`/api/survey_participants/${id}`, 'DELETE');

// Survey Release CRUD
export const getSurveyReleases = () => request('/api/survey-releases', 'GET');
export const createSurveyRelease = (data) => request('/api/survey-releases', 'POST', data);
export const getSurveyReleaseById = (id) => request(`/api/survey-releases/${id}`, 'GET');
export const updateSurveyRelease = (id, data) => request(`/api/survey-releases/${id}`, 'PUT', data);
export const deleteSurveyRelease = (id) => request(`/api/survey-releases/${id}`, 'DELETE');

// Survey Session CRUD
export const getSurveySessions = () => request('/api/survey-sessions', 'GET');
export const createSurveySession = (data) => request('/api/survey-sessions', 'POST', data);
export const getSurveySessionById = (id) => request(`/api/survey-sessions/${id}`, 'GET');
export const updateSurveySession = (id, data) => request(`/api/survey-sessions/${id}`, 'PUT', data);
export const deleteSurveySession = (id) => request(`/api/survey-sessions/${id}`, 'DELETE');
