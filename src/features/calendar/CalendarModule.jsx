import { useMemo, useState } from "react";
import CalendarSidebar from "./components/CalendarSidebar";
import DayView from "./components/DayView";
import WeekView from "./components/WeekView";
import MonthView from "./components/MonthView";
import YearView from "./components/YearView";
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

const CalendarModule = () => {
    const [view, setView] = useState("month");
    const [selectedDate, setSelectedDate] = useState(new Date());

    const events = useMemo(
        () => [
            {
                id: 1,
                title: "Survey Release - Q1",
                type: "Survey",
                start: "2026-02-12T09:00:00",
                end: "2026-02-12T11:30:00",
                location: "Room 201",
            },
            {
                id: 2,
                title: "Assessment Window",
                type: "Assessment",
                start: "2026-02-13T00:00:00",
                end: "2026-02-15T23:59:00",
                location: "Online",
            },
            {
                id: 3,
                title: "Activity: Guest Talk",
                type: "Activity",
                start: "2026-02-14T14:00:00",
                end: "2026-02-14T16:00:00",
                location: "Auditorium",
            },
            {
                id: 4,
                title: "Survey Review",
                type: "Survey",
                start: "2026-02-16T10:00:00",
                end: "2026-02-16T12:00:00",
                location: "Room 105",
            },
            {
                id: 5,
                title: "Campus Fair (Multi-day)",
                type: "Activity",
                start: "2026-02-18T08:00:00",
                end: "2026-02-20T18:00:00",
                location: "Main Ground",
            },
            {
                id: 6,
                title: "Assessment: Labs",
                type: "Assessment",
                start: "2026-02-20T13:00:00",
                end: "2026-02-20T15:00:00",
                location: "Lab 3",
            },
        ],
        []
    );

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
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {selectedDate.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                        })}
                    </h1>
                    <div className="flex items-center gap-3">
                        
                        <button
                            onClick={() => setView("day")}
                            className={`px-4 py-2 rounded-lg font-medium transition ${view === "day"
                                    ? "bg-purple-600 text-white"
                                    : "bg-purple-600 border border-slate-200 text-white"
                                }`}
                        >
                            + Add
                        </button>
                    </div>
                </div>

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
