import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useConfirmation } from "../../context/ConfirmationContext";
import {
    archiveSurvey,
    deleteRelease,
    getReleasesForSurvey,
    getSurveys,
    updateRelease,
} from "../../services/surveyApi";

const ReleasesModule = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { confirm } = useConfirmation();

    const basePath = user?.role === "APPROVER" ? "/approver" : "/admin";
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const [releases, setReleases] = useState([]);
    const [selectedReleaseId, setSelectedReleaseId] = useState(null);

    const getReleaseStatus = (release) => {
        if (release.is_frozen) return "Frozen";

        const now = new Date();
        const opensAt = release.opens_at ? new Date(release.opens_at) : null;
        const closesAt = release.closes_at ? new Date(release.closes_at) : null;

        if (opensAt && now < opensAt) return "Scheduled";
        if (closesAt && now > closesAt) return "Stopped";
        return "Active";
    };

    const formatDate = (value) => {
        if (!value) return "-";
        try {
            return new Date(value).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return String(value);
        }
    };

    const loadReleases = async () => {
        try {
            setLoading(true);
            setError("");

            const surveys = await getSurveys();
            const surveyList = Array.isArray(surveys) ? surveys : [];

            const releaseGroups = await Promise.all(
                surveyList.map(async (survey) => {
                    try {
                        const surveyReleases = await getReleasesForSurvey(survey.survey_id);
                        const rows = Array.isArray(surveyReleases) ? surveyReleases : [];
                        return rows.map((release) => {
                            const participants = Number(release.total_participants || 0);
                            const submitted = Number(release.submitted_count || 0);
                            const completionRate = participants > 0
                                ? Math.round((submitted / participants) * 100)
                                : 0;

                            return {
                                ...release,
                                survey_id: survey.survey_id,
                                survey_title: survey.title,
                                survey_status: survey.status,
                                status: getReleaseStatus(release),
                                participants,
                                submitted,
                                completionRate,
                            };
                        });
                    } catch {
                        return [];
                    }
                })
            );

            const flat = releaseGroups.flat();
            flat.sort((a, b) => {
                const left = new Date(a.created_at || 0).getTime();
                const right = new Date(b.created_at || 0).getTime();
                return right - left;
            });

            setReleases(flat);
            setSelectedReleaseId((prev) => {
                if (!flat.length) return null;
                if (prev && flat.some((item) => item.release_id === prev)) return prev;
                return flat[0].release_id;
            });
        } catch (err) {
            setError(err?.message || "Failed to load releases.");
            setReleases([]);
            setSelectedReleaseId(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReleases();
    }, []);

    const filteredReleases = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return releases;

        return releases.filter((release) => (
            String(release.name || "").toLowerCase().includes(query)
            || String(release.survey_title || "").toLowerCase().includes(query)
            || String(release.release_id || "").toLowerCase().includes(query)
            || String(release.status || "").toLowerCase().includes(query)
        ));
    }, [releases, searchTerm]);

    useEffect(() => {
        if (!filteredReleases.length) {
            setSelectedReleaseId(null);
            return;
        }

        const exists = filteredReleases.some((item) => item.release_id === selectedReleaseId);
        if (!exists) {
            setSelectedReleaseId(filteredReleases[0].release_id);
        }
    }, [filteredReleases, selectedReleaseId]);

    const selectedRelease = filteredReleases.find((item) => item.release_id === selectedReleaseId) || filteredReleases[0];

    const stats = useMemo(() => {
        const active = releases.filter((item) => item.status === "Active").length;
        const frozen = releases.filter((item) => item.status === "Frozen").length;
        const stopped = releases.filter((item) => item.status === "Stopped").length;
        const scheduled = releases.filter((item) => item.status === "Scheduled").length;

        return [
            { label: "Active", value: active, tone: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Frozen", value: frozen, tone: "text-amber-600", bg: "bg-amber-50" },
            { label: "Stopped", value: stopped, tone: "text-rose-600", bg: "bg-rose-50" },
            { label: "Scheduled", value: scheduled, tone: "text-slate-600", bg: "bg-slate-50" },
        ];
    }, [releases]);

    const statusBadge = (status) => {
        switch (status) {
            case "Active":
                return "bg-emerald-50 text-emerald-700";
            case "Frozen":
                return "bg-amber-50 text-amber-700";
            case "Stopped":
                return "bg-rose-50 text-rose-700";
            default:
                return "bg-slate-50 text-slate-600";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Survey Releases</h1>
                </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
            {loading && <div className="text-sm text-gray-500">Loading releases...</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
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
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                        <h2 className="font-semibold text-gray-800">Published Releases</h2>
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search releases..."
                            className="w-56 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        />
                    </div>
                    <div className="divide-y divide-gray-100">
                        {filteredReleases.map((release) => (
                            <button
                                type="button"
                                key={release.release_id}
                                onClick={() => setSelectedReleaseId(release.release_id)}
                                className={`w-full text-left px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:bg-slate-50 transition ${selectedReleaseId === release.release_id ? "bg-slate-50" : "bg-white"}`}
                            >
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">{release.survey_title}</div>
                                    <div className="text-xs text-gray-500">REL-{release.release_id} · {release.name}</div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${statusBadge(release.status)}`}>
                                        {release.status}
                                    </span>
                                    <div>{formatDate(release.opens_at)} to {formatDate(release.closes_at)}</div>
                                </div>
                            </button>
                        ))}
                        {!filteredReleases.length && !loading && (
                            <div className="px-6 py-8 text-sm text-gray-500">No releases found.</div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-800">Release Details</h3>
                    {selectedRelease ? (
                        <>
                            <div>
                                <div className="text-xs text-gray-400">Survey</div>
                                <div className="font-medium text-gray-900">{selectedRelease.survey_title}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-xs text-gray-400">Release ID</div>
                                    <div className="text-gray-700">REL-{selectedRelease.release_id}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Status</div>
                                    <div className="text-gray-700">{selectedRelease.status}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Responses</div>
                                    <div className="text-gray-700">{selectedRelease.submitted}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Completion</div>
                                    <div className="text-gray-700">{selectedRelease.completionRate}%</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Participants</div>
                                <div className="text-sm text-gray-700">{selectedRelease.participants}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Release Window</div>
                                <div className="text-sm text-gray-700">{formatDate(selectedRelease.opens_at)} to {formatDate(selectedRelease.closes_at)}</div>
                            </div>
                            <div className="pt-2 space-y-2">
                                <button
                                    onClick={() =>
                                        navigate(`${basePath}/releases/${selectedRelease.survey_id}/edit`, {
                                            state: { release: selectedRelease },
                                        })
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                                >
                                    Modify Release
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        disabled={actionLoading || selectedRelease.is_frozen}
                                        onClick={async () => {
                                            const approved = await confirm({
                                                title: "Freeze Release",
                                                message: "Are you sure you want to freeze this release?",
                                                confirmText: "Freeze",
                                                tone: "warning",
                                            });
                                            if (!approved) return;

                                            try {
                                                setActionLoading(true);
                                                setError("");
                                                await updateRelease(selectedRelease.survey_id, selectedRelease.release_id, { is_frozen: true });
                                                await loadReleases();
                                            } catch (err) {
                                                setError(err?.message || "Failed to freeze release.");
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                                    >
                                        Freeze
                                    </button>
                                    <button
                                        disabled={actionLoading || !selectedRelease.is_frozen}
                                        onClick={async () => {
                                            const approved = await confirm({
                                                title: "Resume Release",
                                                message: "Are you sure you want to resume this release?",
                                                confirmText: "Resume",
                                                tone: "warning",
                                            });
                                            if (!approved) return;

                                            try {
                                                setActionLoading(true);
                                                setError("");
                                                await updateRelease(selectedRelease.survey_id, selectedRelease.release_id, { is_frozen: false });
                                                await loadReleases();
                                            } catch (err) {
                                                setError(err?.message || "Failed to resume release.");
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                    >
                                        Resume
                                    </button>
                                    <button
                                        disabled={actionLoading}
                                        onClick={async () => {
                                            const approved = await confirm({
                                                title: "Stop Release",
                                                message: "Are you sure you want to stop this release now?",
                                                confirmText: "Stop",
                                                tone: "warning",
                                            });
                                            if (!approved) return;

                                            try {
                                                setActionLoading(true);
                                                setError("");
                                                await updateRelease(selectedRelease.survey_id, selectedRelease.release_id, {
                                                    is_frozen: true,
                                                    closes_at: new Date().toISOString(),
                                                });
                                                await loadReleases();
                                            } catch (err) {
                                                setError(err?.message || "Failed to stop responses.");
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                    >
                                        Stop
                                    </button>
                                    <button
                                        disabled={actionLoading}
                                        onClick={async () => {
                                            const approved = await confirm({
                                                title: "Archive Survey",
                                                message: "Archive the linked survey for this release?",
                                                confirmText: "Archive",
                                                tone: "warning",
                                            });
                                            if (!approved) return;
                                            try {
                                                setActionLoading(true);
                                                setError("");
                                                await archiveSurvey(selectedRelease.survey_id);
                                                await loadReleases();
                                            } catch (err) {
                                                setError(err?.message || "Failed to archive survey.");
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                    >
                                        Archive Survey
                                    </button>
                                </div>
                                <button
                                    disabled={actionLoading}
                                    onClick={async () => {
                                        const approved = await confirm({
                                            title: "Delete Release",
                                            message: `Delete release ${selectedRelease.name}? This action cannot be undone.`,
                                            confirmText: "Delete",
                                            tone: "danger",
                                        });
                                        if (!approved) return;
                                        try {
                                            setActionLoading(true);
                                            setError("");
                                            await deleteRelease(selectedRelease.survey_id, selectedRelease.release_id);
                                            await loadReleases();
                                        } catch (err) {
                                            setError(err?.message || "Failed to delete release.");
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }}
                                    className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                >
                                    Delete Release
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">Select a release to manage.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReleasesModule;
