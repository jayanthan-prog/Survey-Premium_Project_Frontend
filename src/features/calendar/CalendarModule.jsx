import { useEffect, useMemo, useState } from "react";
import CalendarSidebar from "./components/CalendarSidebar";
import DayView from "./components/DayView";
import WeekView from "./components/WeekView";
import MonthView from "./components/MonthView";
import YearView from "./components/YearView";
import { useAuth } from "../../context/AuthContext";
import { getSurveyReleases } from "../../services/surveyApi";
import { getApprovalItems, getApprovalWorkflows } from "../../services/approvalApi";
import { getAllocations } from "../../services/allocationApi";
import {
    startOfDay,
    endOfDay,
    eventOverlapsRange,
    addDays,
    addMonths,
    addYears,
    getWeekDays,
    getMonthGridDays,
    getYearMonths,
} from "./utils/dateHelpers";

const VIEW_OPTIONS = ["day", "week", "month", "year"];

const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;

const safeDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
};

const normalizeRange = (startValue, endValue) => {
    const startDate = safeDate(startValue);
    if (!startDate) return null;

    const endDate = safeDate(endValue) || new Date(startDate.getTime() + DEFAULT_EVENT_DURATION_MS);
    return {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
    };
};

const CalendarModule = () => {
    const { user } = useAuth();
    const [view, setView] = useState("month");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [surveyEvents, setSurveyEvents] = useState([]);
    const [approvalEvents, setApprovalEvents] = useState([]);
    const [allocationEvents, setAllocationEvents] = useState([]);

    const normalizedRole = String(user?.role || "").toUpperCase();
    const currentUserId = Number(user?.user_id || user?.id || 0) || null;

    useEffect(() => {
        let active = true;

        const loadCalendarEvents = async () => {
            try {
                setLoading(true);
                setError("");

                const [releasesResult, approvalsResult, allocationsResult] = await Promise.allSettled([
                    getSurveyReleases(),
                    Promise.all([getApprovalWorkflows(), getApprovalItems()]),
                    getAllocations(),
                ]);

                if (!active) return;

                const nextSurveyEvents = [];
                if (releasesResult.status === "fulfilled") {
                    const releases = Array.isArray(releasesResult.value) ? releasesResult.value : [];

                    for (const release of releases) {
                        const range = normalizeRange(release.opens_at || release.created_at, release.closes_at || release.opens_at || release.created_at);
                        if (!range) continue;

                        nextSurveyEvents.push({
                            id: `survey-release-${release.release_id}`,
                            title: release.name ? `Survey Release: ${release.name}` : `Survey Release ${release.release_id}`,
                            type: "Survey",
                            start: range.start,
                            end: range.end,
                            location: release.is_frozen ? "Frozen" : "Survey Window",
                            allDay: true,
                        });
                    }
                }

                const nextApprovalEvents = [];
                if (approvalsResult.status === "fulfilled") {
                    const [workflowsRaw, itemsRaw] = approvalsResult.value;
                    const workflows = Array.isArray(workflowsRaw) ? workflowsRaw : [];
                    const items = Array.isArray(itemsRaw) ? itemsRaw : [];

                    const itemsByWorkflowId = new Map();
                    for (const item of items) {
                        const workflowId = Number(item.approval_workflow_id);
                        const bucket = itemsByWorkflowId.get(workflowId) || [];
                        bucket.push(item);
                        itemsByWorkflowId.set(workflowId, bucket);
                    }

                    for (const workflow of workflows) {
                        const requestedBy = Number(workflow.requested_by || 0) || null;
                        const approvedBy = Number(workflow.approved_by || 0) || null;

                        if ((normalizedRole === "USER" || normalizedRole === "STUDENT") && currentUserId) {
                            const relatedToUser = requestedBy === currentUserId || approvedBy === currentUserId;
                            if (!relatedToUser) continue;
                        }

                        const requestRange = normalizeRange(workflow.requested_at, workflow.requested_at);
                        if (requestRange) {
                            nextApprovalEvents.push({
                                id: `approval-request-${workflow.approval_workflow_id}`,
                                title: `Approval Requested (${String(workflow.entity_type || "Request").toUpperCase()})`,
                                type: "Approval",
                                start: requestRange.start,
                                end: requestRange.end,
                                location: workflow.status || "PENDING",
                                allDay: true,
                            });
                        }

                        const approvalRange = normalizeRange(workflow.approved_at, workflow.approved_at);
                        if (approvalRange) {
                            nextApprovalEvents.push({
                                id: `approval-decision-${workflow.approval_workflow_id}`,
                                title: `Approval ${String(workflow.status || "UPDATED").toUpperCase()}`,
                                type: "Approval",
                                start: approvalRange.start,
                                end: approvalRange.end,
                                location: "Decision",
                                allDay: true,
                            });
                        }

                        const relatedItems = itemsByWorkflowId.get(Number(workflow.approval_workflow_id)) || [];
                        for (const item of relatedItems) {
                            const itemRange = normalizeRange(item.created_at, item.decided_at || item.created_at);
                            if (!itemRange) continue;

                            nextApprovalEvents.push({
                                id: `approval-item-${item.approval_item_id}`,
                                title: `Approval Item ${item.approval_item_id}`,
                                type: "Approval",
                                start: itemRange.start,
                                end: itemRange.end,
                                location: String(item.status || "PENDING").toUpperCase(),
                                allDay: true,
                            });
                        }
                    }
                }

                const nextAllocationEvents = [];
                if (allocationsResult.status === "fulfilled") {
                    const allocations = Array.isArray(allocationsResult.value) ? allocationsResult.value : [];

                    for (const allocation of allocations) {
                        const range = normalizeRange(allocation.start_at || allocation.created_at, allocation.end_at || allocation.start_at || allocation.created_at);
                        if (!range) continue;

                        nextAllocationEvents.push({
                            id: `allocation-${allocation.allocation_task_id}`,
                            title: allocation.title || `Allocation ${allocation.allocation_task_id}`,
                            type: "Allocation",
                            start: range.start,
                            end: range.end,
                            location: allocation.location || String(allocation.status || "ASSIGNED").toUpperCase(),
                            allDay: true,
                        });
                    }
                }

                setSurveyEvents(nextSurveyEvents);
                setApprovalEvents(nextApprovalEvents);
                setAllocationEvents(nextAllocationEvents);

                const failures = [releasesResult, approvalsResult, allocationsResult].filter((result) => result.status === "rejected");
                if (failures.length) {
                    setError("Some calendar sources failed to load. Showing available events.");
                }

                const mergedEvents = [...nextSurveyEvents, ...nextApprovalEvents, ...nextAllocationEvents]
                    .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
                if (mergedEvents.length) {
                    const hasEventOnCurrentDate = mergedEvents.some((event) => {
                        const eventStart = new Date(event.start);
                        return (
                            eventStart.getFullYear() === selectedDate.getFullYear()
                            && eventStart.getMonth() === selectedDate.getMonth()
                            && eventStart.getDate() === selectedDate.getDate()
                        );
                    });

                    if (!hasEventOnCurrentDate) {
                        setSelectedDate(new Date(mergedEvents[0].start));
                    }
                }
            } catch (err) {
                if (!active) return;
                setError(err?.message || "Failed to load calendar events.");
                setSurveyEvents([]);
                setApprovalEvents([]);
                setAllocationEvents([]);
            } finally {
                if (active) setLoading(false);
            }
        };

        loadCalendarEvents();

        return () => {
            active = false;
        };
    }, [normalizedRole, currentUserId]);

    const events = useMemo(() => {
        const merged = [...surveyEvents, ...allocationEvents, ...approvalEvents];
        merged.sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
        return merged;
    }, [surveyEvents, allocationEvents, approvalEvents]);

    const eventsForSelectedDay = useMemo(() => {
        const dayStart = startOfDay(selectedDate);
        const dayEnd = endOfDay(selectedDate);
        return events.filter((event) => eventOverlapsRange(event, dayStart, dayEnd));
    }, [events, selectedDate]);

    const monthDays = useMemo(() => getMonthGridDays(selectedDate), [selectedDate]);
    const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
    const yearMonths = useMemo(() => getYearMonths(selectedDate), [selectedDate]);

    const handlePrev = () => {
        if (view === "day") setSelectedDate(addDays(selectedDate, -1));
        if (view === "week") setSelectedDate(addDays(selectedDate, -7));
        if (view === "month") setSelectedDate(addMonths(selectedDate, -1));
        if (view === "year") setSelectedDate(addYears(selectedDate, -1));
    };

    const handleNext = () => {
        if (view === "day") setSelectedDate(addDays(selectedDate, 1));
        if (view === "week") setSelectedDate(addDays(selectedDate, 7));
        if (view === "month") setSelectedDate(addMonths(selectedDate, 1));
        if (view === "year") setSelectedDate(addYears(selectedDate, 1));
    };

    return (
        <div className="flex h-full bg-slate-50">

            {/* Sidebar */}
            <CalendarSidebar
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                eventsForSelectedDay={eventsForSelectedDay}
                onPrev={handlePrev}
                onNext={handleNext}
            />

            {/* Main Calendar Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Header */}
                <div className="border-b border-slate-200 bg-white p-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            {selectedDate.toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                            })}
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Unified timeline: Survey releases, allocations, and approvals.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="rounded-full bg-purple-50 px-2 py-1 text-purple-700">Survey</span>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">Allocation</span>
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Approval</span>
                    </div>
                </div>

                {(loading || error) && (
                    <div className="px-6 pt-3 text-xs">
                        {loading && <span className="text-slate-500">Loading calendar events...</span>}
                        {!loading && error && <span className="text-amber-600">{error}</span>}
                    </div>
                )}

                {/* View Controls */}
                <div className="border-b border-slate-200 bg-white px-6 py-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
                        {VIEW_OPTIONS.map((option) => (
                            <button
                                key={option}
                                onClick={() => setView(option)}
                                className={`px-3 py-1 rounded text-xs font-medium capitalize transition ${view === option
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-600 hover:bg-slate-100"
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setSelectedDate(new Date())}
                        className="ml-auto px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        Today
                    </button>
                </div>

                {/* Calendar Content */}
                <div className="flex-1 flex flex-col overflow-auto p-6">
                    {view === "day" && (
                        <DayView
                            date={selectedDate}
                            events={events}
                            onSelectDate={setSelectedDate}
                        />
                    )}

                    {view === "week" && (
                        <WeekView
                            days={weekDays}
                            events={events}
                            onSelectDate={setSelectedDate}
                        />
                    )}

                    {view === "month" && (
                        <MonthView
                            days={monthDays}
                            selectedDate={selectedDate}
                            events={events}
                            onSelectDate={setSelectedDate}
                        />
                    )}

                    {view === "year" && (
                        <YearView
                            months={yearMonths}
                            events={events}
                            onSelectDate={setSelectedDate}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarModule;
