import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useConfirmation } from "../../context/ConfirmationContext";
import {
    archiveSurvey, createRelease, deleteRelease, deleteSurvey,
    generateSurveyOtp, getReleasesForSurvey, getSurveys, publishSurvey, unpublishSurvey, updateRelease
} from "../../services/surveyApi";

const SurveysModule = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { confirm } = useConfirmation();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSurveyId, setSelectedSurveyId] = useState(null);
    const [publishWindow, setPublishWindow] = useState({ opensAt: "", closesAt: "" });
    const [actionLoading, setActionLoading] = useState(false);

    // Releases tab
    const [detailTab, setDetailTab] = useState("overview");
    const [releases, setReleases] = useState([]);
    const [releasesLoading, setReleasesLoading] = useState(false);
    const [showCreateRelease, setShowCreateRelease] = useState(false);
    const [createReleaseForm, setCreateReleaseForm] = useState({ name: "", opensAt: "", closesAt: "" });
    const [releaseActionLoading, setReleaseActionLoading] = useState(false);
    const [otpInfo, setOtpInfo] = useState(null);

    const loadSurveys = async () => {
        try {
            setLoading(true);
            const response = await getSurveys();
            const list = Array.isArray(response) ? response : [];
            setSurveys(list);
            if (!selectedSurveyId && list.length) {
                setSelectedSurveyId(list[0].survey_id);
            }
        } catch (err) {
            setError(err?.message || "Failed to load surveys.");
        } finally {
            setLoading(false);
        }
    };

    const loadReleases = async (surveyId) => {
        if (!surveyId) return;
        try {
            setReleasesLoading(true);
            const data = await getReleasesForSurvey(surveyId);
            setReleases(Array.isArray(data) ? data : []);
        } catch {
            setReleases([]);
        } finally {
            setReleasesLoading(false);
        }
    };

    useEffect(() => {
        loadSurveys();
    }, []);

    useEffect(() => {
        if (detailTab === "releases" && selectedSurveyId) {
            loadReleases(selectedSurveyId);
        }
    }, [detailTab, selectedSurveyId]);

    useEffect(() => {
        setShowCreateRelease(false);
        setCreateReleaseForm({ name: "", opensAt: "", closesAt: "" });
    }, [selectedSurveyId]);

    const stats = useMemo(() => {
        const published = surveys.filter((item) => item.status === "PUBLISHED").length;
        const draft = surveys.filter((item) => item.status === "DRAFT").length;
        const archived = surveys.filter((item) => item.status === "ARCHIVED").length;

        return [
            { label: "Published", value: published, tone: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Draft", value: draft, tone: "text-amber-600", bg: "bg-amber-50" },
            { label: "Archived", value: archived, tone: "text-slate-600", bg: "bg-slate-50" },
        ];
    }, [surveys]);

    const filteredSurveys = useMemo(
        () =>
            surveys.filter((survey) => {
                const query = searchTerm.trim().toLowerCase();
                if (!query) return true;
                return (
                    String(survey.title || "").toLowerCase().includes(query) ||
                    String(survey.code || "").toLowerCase().includes(query) ||
                    String(survey.created_by_name || "").toLowerCase().includes(query) ||
                    String(survey.status || "").toLowerCase().includes(query)
                );
            }),
        [surveys, searchTerm]
    );

    useEffect(() => {
        if (!filteredSurveys.length) return;
        const exists = filteredSurveys.some((item) => item.survey_id === selectedSurveyId);
        if (!exists) {
            setSelectedSurveyId(filteredSurveys[0].survey_id);
        }
    }, [filteredSurveys, selectedSurveyId]);

    const selectedSurvey = filteredSurveys.find((item) => item.survey_id === selectedSurveyId) || filteredSurveys[0];
    const selectedSurveyConfig = selectedSurvey?.config && typeof selectedSurvey.config === "string"
        ? JSON.parse(selectedSurvey.config)
        : (selectedSurvey?.config || {});

    const canCreate = user && ["ADMIN", "APPROVER"].includes(user.role);
    const basePath = user?.role === "APPROVER" ? "/approver/surveys" : "/admin/surveys";

    const statusBadge = (status) => {
        if (status === "PUBLISHED") return "bg-emerald-50 text-emerald-700";
        if (status === "ARCHIVED") return "bg-slate-100 text-slate-600";
        return "bg-amber-50 text-amber-700";
    };

    const runAction = async (task) => {
        try {
            setActionLoading(true);
            setError("");
            await task();
            await loadSurveys();
        } catch (err) {
            setError(err?.message || "Failed to run survey action.");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!selectedSurvey) return;

        const approved = await confirm({
            title: "Publish Survey",
            message: `Publish ${selectedSurvey.title} now?`,
            confirmText: "Publish",
            tone: "info",
        });
        if (!approved) return;

        await runAction(async () => {
            await publishSurvey(selectedSurvey.survey_id, {
                release_name: `${selectedSurvey.title} Release`,
                opens_at: publishWindow.opensAt || null,
                closes_at: publishWindow.closesAt || null,
            });
        });
    };

    const handleUnpublish = async () => {
        if (!selectedSurvey) return;

        const approved = await confirm({
            title: "Unpublish Survey",
            message: `Unpublish ${selectedSurvey.title}?`,
            confirmText: "Unpublish",
            tone: "warning",
        });
        if (!approved) return;

        await runAction(async () => {
            await unpublishSurvey(selectedSurvey.survey_id);
        });
    };

    const handleArchive = async () => {
        if (!selectedSurvey) return;

        const approved = await confirm({
            title: "Archive Survey",
            message: `Archive ${selectedSurvey.title}?`,
            confirmText: "Archive",
            tone: "warning",
        });
        if (!approved) return;

        await runAction(async () => {
            await archiveSurvey(selectedSurvey.survey_id);
        });
    };

    const handleDelete = async () => {
        if (!selectedSurvey) return;

        const approved = await confirm({
            title: "Delete Survey",
            message: `Are you sure you want to delete ${selectedSurvey.title}? This action cannot be undone.`,
            confirmText: "Delete",
            tone: "danger",
        });
        if (!approved) return;

        await runAction(async () => {
            await deleteSurvey(selectedSurvey.survey_id);
        });
    };
    const handleCreateRelease = async () => {
        if (!selectedSurvey) return;
        try {
            setReleaseActionLoading(true);
            await createRelease(selectedSurvey.survey_id, {
                release_name: createReleaseForm.name.trim() || `${selectedSurvey.title} Release`,
                opens_at: createReleaseForm.opensAt || null,
                closes_at: createReleaseForm.closesAt || null,
            });
            setShowCreateRelease(false);
            setCreateReleaseForm({ name: "", opensAt: "", closesAt: "" });
            await loadReleases(selectedSurvey.survey_id);
        } catch (err) {
            setError(err?.message || "Failed to create release.");
        } finally {
            setReleaseActionLoading(false);
        }
    };

    const handleFreezeRelease = async (releaseId, freeze) => {
        if (!selectedSurvey) return;

        const approved = await confirm({
            title: freeze ? "Freeze Release" : "Resume Release",
            message: freeze
                ? "Are you sure you want to freeze this release?"
                : "Are you sure you want to resume this release?",
            confirmText: freeze ? "Freeze" : "Resume",
            tone: "warning",
        });
        if (!approved) return;

        try {
            setReleaseActionLoading(true);
            await updateRelease(selectedSurvey.survey_id, releaseId, { is_frozen: freeze });
            await loadReleases(selectedSurvey.survey_id);
        } catch (err) {
            setError(err?.message || "Failed to update release.");
        } finally {
            setReleaseActionLoading(false);
        }
    };

    const handleDeleteRelease = async (releaseId, releaseName) => {
        const approved = await confirm({
            title: "Delete Release",
            message: `Delete release ${releaseName}? This will also remove all participation records for this release.`,
            confirmText: "Delete",
            tone: "danger",
        });
        if (!approved) return;

        try {
            setReleaseActionLoading(true);
            await deleteRelease(selectedSurvey.survey_id, releaseId);
            await loadReleases(selectedSurvey.survey_id);
        } catch (err) {
            setError(err?.message || "Failed to delete release.");
        } finally {
            setReleaseActionLoading(false);
        }
    };

    const formatDate = (value) => {
        if (!value) return "—";
        try { return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
        catch { return String(value); }
    };

    const handleGenerateOtp = async () => {
        if (!selectedSurvey) return;
        try {
            setActionLoading(true);
            setError("");
            const response = await generateSurveyOtp(selectedSurvey.survey_id);
            setOtpInfo(response);
            await loadSurveys();
        } catch (err) {
            setError(err?.message || "Failed to generate survey OTP.");
        } finally {
            setActionLoading(false);
        }
    };
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Surveys</h1>
                </div>
                {canCreate && (
                    <button
                        onClick={() => navigate(`${basePath}/create`)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm"
                    >
                        + Create Survey
                    </button>
                )}
            </div>

            {loading && <div className="text-sm text-gray-500">Loading surveys...</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
                    >
                        <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${stat.bg} ${stat.tone}`}>
                            {stat.label}
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-gray-900">{stat.value}</div>
                        <p className="text-xs text-gray-400 mt-1">Updated today</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-800">Completed Surveys</h2>
                        </div>
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search surveys..."
                            className="w-56 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        />
                    </div>
                    <div className="divide-y divide-gray-100">
                        {filteredSurveys.map((survey) => (
                            <button
                                type="button"
                                key={survey.survey_id}
                                onClick={() => {
                                    setSelectedSurveyId(survey.survey_id);
                                }}
                                className={`w-full text-left px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:bg-slate-50 transition ${selectedSurveyId === survey.survey_id ? "bg-slate-50" : "bg-white"
                                    }`}
                            >
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">{survey.title}</div>
                                    <div className="text-xs text-gray-500">{survey.code || `ID-${survey.survey_id}`} · Owner: {survey.created_by_name || "-"}</div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusBadge(survey.status)}`}>
                                        {survey.status}
                                    </span>
                                    <div>{survey.question_count || 0} questions</div>
                                </div>
                            </button>
                        ))}
                        {!filteredSurveys.length && (
                            <div className="px-6 py-8 text-sm text-gray-500">No surveys match your search.</div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    {/* Tab row */}
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setDetailTab("overview")}
                            className={`flex-1 py-3 text-xs font-medium transition ${detailTab === "overview" ? "text-purple-700 border-b-2 border-purple-600" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setDetailTab("releases")}
                            className={`flex-1 py-3 text-xs font-medium transition ${detailTab === "releases" ? "text-purple-700 border-b-2 border-purple-600" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Releases
                        </button>
                    </div>

                    <div className="p-6">
                        {/* ── Overview tab ── */}
                        {detailTab === "overview" && (
                            <>
                                <h3 className="text-sm font-semibold text-gray-800">Survey Details</h3>
                                {selectedSurvey ? (
                                    <div className="mt-4 space-y-3 text-sm text-gray-600">
                                        <div>
                                            <div className="text-xs text-gray-400">Survey</div>
                                            <div className="font-medium text-gray-900">{selectedSurvey.title}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-gray-400">Survey Code</div>
                                                <div className="font-medium text-gray-700">{selectedSurvey.code || `ID-${selectedSurvey.survey_id}`}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Owner</div>
                                                <div className="font-medium text-gray-700">{selectedSurvey.created_by_name || "-"}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Status</div>
                                                <div className="font-medium text-gray-700">{selectedSurvey.status}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Questions</div>
                                                <div className="font-medium text-gray-700">{selectedSurvey.question_count || 0}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400">Latest Release</div>
                                            <div className="font-medium text-gray-700">{selectedSurvey.latest_release_name || "Not published"}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400">Target Groups</div>
                                            <div className="font-medium text-gray-700">{(selectedSurveyConfig.targetGroups || []).join(", ") || "All users"}</div>
                                        </div>
                                        <div className="pt-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => navigate(`${basePath}/builder/${selectedSurvey.survey_id}`)}
                                                    className="w-full rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
                                                >
                                                    Edit Builder
                                                </button>
                                                <button
                                                    onClick={() => navigate(`${basePath}/report/${selectedSurvey.survey_id}`)}
                                                    className="w-full rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                                                >
                                                    View Full Report
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2 border-t border-gray-100 pt-4">
                                            <div className="text-xs text-gray-400">Publish Window (optional)</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="datetime-local"
                                                    value={publishWindow.opensAt}
                                                    onChange={(event) => setPublishWindow((prev) => ({ ...prev, opensAt: event.target.value }))}
                                                    className="rounded-xl border border-gray-200 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-100"
                                                />
                                                <input
                                                    type="datetime-local"
                                                    value={publishWindow.closesAt}
                                                    onChange={(event) => setPublishWindow((prev) => ({ ...prev, closesAt: event.target.value }))}
                                                    className="rounded-xl border border-gray-200 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-100"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {selectedSurvey.status === "PUBLISHED" ? (
                                                    <button
                                                        disabled={actionLoading}
                                                        onClick={handleUnpublish}
                                                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                                                    >
                                                        Unpublish
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled={actionLoading}
                                                        onClick={handlePublish}
                                                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                                    >
                                                        Publish
                                                    </button>
                                                )}
                                                <button
                                                    disabled={actionLoading}
                                                    onClick={handleArchive}
                                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                                >
                                                    Archive
                                                </button>
                                                {selectedSurveyConfig.otpRequired ? (
                                                    <button
                                                        disabled={actionLoading}
                                                        onClick={handleGenerateOtp}
                                                        className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                                                    >
                                                        Generate OTP
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400"
                                                    >
                                                        OTP Disabled
                                                    </button>
                                                )}
                                                <button
                                                    disabled={actionLoading}
                                                    onClick={() => navigate(`${basePath}/create`)}
                                                    className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-700 hover:bg-purple-100 disabled:opacity-60"
                                                >
                                                    Create New
                                                </button>
                                                <button
                                                    disabled={actionLoading}
                                                    onClick={handleDelete}
                                                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                            {otpInfo && otpInfo.survey_id === selectedSurvey.survey_id && (
                                                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3 text-xs text-indigo-800">
                                                    OTP: <span className="font-semibold tracking-[0.25em]">{otpInfo.otp}</span>
                                                    <div className="mt-1 text-indigo-600">Valid until {new Date(otpInfo.expires_at).toLocaleTimeString()}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-4 text-sm text-gray-500">Select a survey to see details.</p>
                                )}
                            </>
                        )}

                        {/* ── Releases tab ── */}
                        {detailTab === "releases" && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-800">Releases</h3>
                                    {selectedSurvey && (
                                        <button
                                            onClick={() => setShowCreateRelease((prev) => !prev)}
                                            className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
                                        >
                                            {showCreateRelease ? "Cancel" : "+ New Release"}
                                        </button>
                                    )}
                                </div>

                                {showCreateRelease && (
                                    <div className="mb-4 rounded-xl border border-purple-100 bg-purple-50 p-4 space-y-3">
                                        <div className="text-xs font-medium text-purple-800">New Release</div>
                                        <input
                                            type="text"
                                            placeholder={selectedSurvey ? `${selectedSurvey.title} Release` : "Release name"}
                                            value={createReleaseForm.name}
                                            onChange={(e) => setCreateReleaseForm((prev) => ({ ...prev, name: e.target.value }))}
                                            className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-200"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <div className="text-[10px] text-gray-500 mb-1">Opens At</div>
                                                <input
                                                    type="datetime-local"
                                                    value={createReleaseForm.opensAt}
                                                    onChange={(e) => setCreateReleaseForm((prev) => ({ ...prev, opensAt: e.target.value }))}
                                                    className="w-full rounded-xl border border-purple-200 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-200"
                                                />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-gray-500 mb-1">Closes At</div>
                                                <input
                                                    type="datetime-local"
                                                    value={createReleaseForm.closesAt}
                                                    onChange={(e) => setCreateReleaseForm((prev) => ({ ...prev, closesAt: e.target.value }))}
                                                    className="w-full rounded-xl border border-purple-200 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-200"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            disabled={releaseActionLoading}
                                            onClick={handleCreateRelease}
                                            className="w-full rounded-xl bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-60"
                                        >
                                            {releaseActionLoading ? "Creating..." : "Create Release"}
                                        </button>
                                    </div>
                                )}

                                {!selectedSurvey ? (
                                    <p className="text-sm text-gray-500">Select a survey to see its releases.</p>
                                ) : releasesLoading ? (
                                    <div className="py-6 text-center text-xs text-gray-400">Loading releases...</div>
                                ) : releases.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-gray-400">No releases yet. Create one above to distribute this survey.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {releases.map((release) => (
                                            <div key={release.release_id} className="rounded-xl border border-gray-100 bg-slate-50 p-3 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="text-xs font-semibold text-gray-800">{release.name}</div>
                                                        <div className="text-[10px] text-gray-400 mt-0.5">Phase {release.phase || 1} · by {release.created_by_name || "—"}</div>
                                                    </div>
                                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${release.is_frozen ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"
                                                        }`}>
                                                        {release.is_frozen ? "Closed" : "Active"}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-gray-600">
                                                    <div><span className="text-gray-400">Opens: </span>{formatDate(release.opens_at)}</div>
                                                    <div><span className="text-gray-400">Closes: </span>{formatDate(release.closes_at)}</div>
                                                    <div><span className="text-gray-400">Participants: </span>{release.total_participants ?? 0}</div>
                                                    <div><span className="text-gray-400">Submitted: </span>{release.submitted_count ?? 0}</div>
                                                </div>
                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        disabled={releaseActionLoading}
                                                        onClick={() => handleFreezeRelease(release.release_id, !release.is_frozen)}
                                                        className={`rounded-lg px-2 py-1 text-[10px] font-medium disabled:opacity-60 ${release.is_frozen
                                                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                            : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                            }`}
                                                    >
                                                        {release.is_frozen ? "Reopen" : "Close"}
                                                    </button>
                                                    <button
                                                        disabled={releaseActionLoading}
                                                        onClick={() => handleDeleteRelease(release.release_id, release.name)}
                                                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SurveysModule;
