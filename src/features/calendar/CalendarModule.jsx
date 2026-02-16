import { useMemo, useState } from "react";

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

    const selectedDateKey = formatDateKey(selectedDate);
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
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
                    <p className="text-sm text-slate-500">
                        Daily, weekly, monthly, and yearly views with survey, assessment, and activity bookings.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
                        <button
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                            onClick={handlePrev}
                        >
                            Prev
                        </button>
                        <button
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                            onClick={() => setSelectedDate(new Date())}
                        >
                            Today
                        </button>
                        <button
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                            onClick={handleNext}
                        >
                            Next
                        </button>
                    </div>

                    <input
                        type="date"
                        value={selectedDateKey}
                        onChange={(event) => setSelectedDate(new Date(`${event.target.value}T00:00:00`))}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm"
                    />

                    <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        {VIEW_OPTIONS.map((option) => (
                            <button
                                key={option}
                                onClick={() => setView(option)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${view === option
                                        ? "bg-purple-600 text-white"
                                        : "text-slate-600 hover:bg-slate-100"
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="text-base font-semibold text-slate-900">{formatFullDate(selectedDate)}</h2>
                        <p className="text-sm text-slate-500">Bookings and activities for this day.</p>

                        <div className="mt-4 space-y-3">
                            {eventsForSelectedDay.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                    No events scheduled.
                                </div>
                            ) : (
                                eventsForSelectedDay.map((event) => (
                                    <div
                                        key={event.id}
                                        className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                                            <span className={`text-xs font-medium ${getTypeBadge(event.type)}`}>
                                                {event.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {formatTimeRange(event.start, event.end)} · {event.location}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900">Legend</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                                Survey
                            </span>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                Assessment
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                Activity
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DayView = ({ date, events, onSelectDate }) => {
    const hours = Array.from({ length: 24 }).map((_, index) => index);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const dayEvents = events.filter((event) => eventOverlapsRange(event, dayStart, dayEnd));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Day view</h2>
                    <p className="text-sm text-slate-500">Split into 24 hours with event overlaps.</p>
                </div>
                <button
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                    onClick={() => onSelectDate(new Date())}
                >
                    Jump to today
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                <div className="space-y-2">
                    {hours.map((hour) => (
                        <div key={hour} className="text-xs text-slate-400">
                            {formatHour(hour)}
                        </div>
                    ))}
                </div>

                <div className="space-y-2">
                    {hours.map((hour) => {
                        const hourStart = setHour(dayStart, hour);
                        const hourEnd = setHour(dayStart, hour + 1);
                        const hourEvents = dayEvents.filter((event) =>
                            eventOverlapsRange(event, hourStart, hourEnd)
                        );

                        return (
                            <div
                                key={hour}
                                className="min-h-[40px] rounded-lg border border-slate-100 bg-slate-50 p-2"
                            >
                                {hourEvents.length === 0 ? (
                                    <span className="text-xs text-slate-400">No events</span>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {hourEvents.map((event) => (
                                            <span
                                                key={event.id}
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${getTypeBadge(
                                                    event.type
                                                )}`}
                                            >
                                                {event.title}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const WeekView = ({ days, events, onSelectDate }) => {
    const hours = Array.from({ length: 24 }).map((_, index) => index);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Week view</h2>
                    <p className="text-sm text-slate-500">Seven-day timeline with 24-hour slices.</p>
                </div>
                <button
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                    onClick={() => onSelectDate(new Date())}
                >
                    Jump to today
                </button>
            </div>

            <div className="overflow-auto">
                <div className="min-w-[960px]">
                    <div className="grid grid-cols-8 gap-2 text-xs text-slate-400">
                        <div />
                        {days.map((day) => (
                            <button
                                key={day.toISOString()}
                                className="rounded-lg py-2 text-left font-semibold text-slate-600 hover:bg-slate-100"
                                onClick={() => onSelectDate(day)}
                            >
                                {formatShortDate(day)}
                            </button>
                        ))}
                    </div>

                    <div className="mt-2 grid grid-cols-8 gap-2">
                        <div className="space-y-2">
                            {hours.map((hour) => (
                                <div key={hour} className="text-xs text-slate-400">
                                    {formatHour(hour)}
                                </div>
                            ))}
                        </div>

                        {days.map((day) => {
                            const dayStart = startOfDay(day);
                            const dayEnd = endOfDay(day);
                            const dayEvents = events.filter((event) =>
                                eventOverlapsRange(event, dayStart, dayEnd)
                            );

                            return (
                                <div key={day.toISOString()} className="space-y-2">
                                    {hours.map((hour) => {
                                        const hourStart = setHour(dayStart, hour);
                                        const hourEnd = setHour(dayStart, hour + 1);
                                        const hourEvents = dayEvents.filter((event) =>
                                            eventOverlapsRange(event, hourStart, hourEnd)
                                        );

                                        return (
                                            <div
                                                key={hour}
                                                className="min-h-[36px] rounded-lg border border-slate-100 bg-slate-50 p-2"
                                            >
                                                {hourEvents.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        {hourEvents.map((event) => (
                                                            <span
                                                                key={event.id}
                                                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getTypeBadge(
                                                                    event.type
                                                                )}`}
                                                            >
                                                                {event.title}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MonthView = ({ days, selectedDate, events, onSelectDate }) => {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">Month view</h2>
                <p className="text-sm text-slate-500">Overview of all daily bookings.</p>
            </div>

            <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-slate-400">
                {getWeekdayLabels().map((label) => (
                    <span key={label}>{label}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                    const dayStart = startOfDay(day);
                    const dayEnd = endOfDay(day);
                    const dayEvents = events.filter((event) => eventOverlapsRange(event, dayStart, dayEnd));
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => onSelectDate(day)}
                            className={`rounded-xl border p-2 text-left transition hover:border-purple-200 hover:bg-purple-50 ${isSelected ? "border-purple-400 bg-purple-50" : "border-slate-100"
                                } ${isSameMonth(day, selectedDate) ? "bg-white" : "bg-slate-50"}`}
                        >
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>{day.getDate()}</span>
                                {dayEvents.length > 0 && (
                                    <span className="text-[11px] text-purple-600">{dayEvents.length}</span>
                                )}
                            </div>
                            <div className="mt-2 space-y-1">
                                {dayEvents.slice(0, 2).map((event) => (
                                    <div
                                        key={event.id}
                                        className={`truncate rounded-full px-2 py-0.5 text-[11px] font-medium ${getTypeBadge(
                                            event.type
                                        )}`}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                                {dayEvents.length > 2 && (
                                    <div className="text-[11px] text-slate-400">+{dayEvents.length - 2} more</div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const YearView = ({ months, events, onSelectDate }) => {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">Year view</h2>
                <p className="text-sm text-slate-500">Quick scan across all months.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {months.map((month) => (
                    <div key={month.label} className="rounded-xl border border-slate-100 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">{month.label}</span>
                            <button
                                className="text-xs text-purple-600 hover:underline"
                                onClick={() => onSelectDate(month.start)}
                            >
                                Go to month
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-400">
                            {getWeekdayLabels().map((label) => (
                                <span key={`${month.label}-${label}`}>{label[0]}</span>
                            ))}
                        </div>
                        <div className="mt-1 grid grid-cols-7 gap-1">
                            {month.days.map((day) => {
                                const dayStart = startOfDay(day);
                                const dayEnd = endOfDay(day);
                                const dayEvents = events.filter((event) =>
                                    eventOverlapsRange(event, dayStart, dayEnd)
                                );

                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => onSelectDate(day)}
                                        className={`rounded-md border px-1 py-1 text-[10px] text-slate-500 ${isSameMonth(day, month.start) ? "border-slate-100" : "border-transparent"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{day.getDate()}</span>
                                            {dayEvents.length > 0 && (
                                                <span className="text-[9px] text-purple-600">{dayEvents.length}</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const getTypeBadge = (type) => {
    if (type === "Survey") return "bg-purple-50 text-purple-700";
    if (type === "Assessment") return "bg-blue-50 text-blue-700";
    return "bg-emerald-50 text-emerald-700";
};

const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatFullDate = (date) =>
    date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

const formatShortDate = (date) =>
    date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const formatTimeRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString(
        "en-US",
        { hour: "2-digit", minute: "2-digit" }
    )}`;
};

const formatHour = (hour) => {
    const period = hour < 12 ? "AM" : "PM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12} ${period}`;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

const setHour = (date, hour) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0);

const addDays = (date, amount) => {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
};

const addMonths = (date, amount) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + amount);
    return next;
};

const addYears = (date, amount) => {
    const next = new Date(date);
    next.setFullYear(next.getFullYear() + amount);
    return next;
};

const startOfWeek = (date) => {
    const dayIndex = (date.getDay() + 6) % 7;
    return addDays(startOfDay(date), -dayIndex);
};

const getWeekDays = (date) => {
    const start = startOfWeek(date);
    return Array.from({ length: 7 }).map((_, index) => addDays(start, index));
};

const getWeekdayLabels = () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getMonthGridDays = (date) => {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const start = startOfWeek(monthStart);
    const totalDays = Math.ceil((monthEnd - start) / (1000 * 60 * 60 * 24)) + 1;
    return Array.from({ length: totalDays }).map((_, index) => addDays(start, index));
};

const getYearMonths = (date) => {
    const year = date.getFullYear();
    return Array.from({ length: 12 }).map((_, monthIndex) => {
        const start = new Date(year, monthIndex, 1);
        return {
            label: start.toLocaleDateString("en-US", { month: "long" }),
            start,
            days: getMonthGridDays(start),
        };
    });
};

const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isSameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const eventOverlapsRange = (event, rangeStart, rangeEnd) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return eventStart <= rangeEnd && eventEnd >= rangeStart;
};

export default CalendarModule;
