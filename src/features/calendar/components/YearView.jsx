import {
    startOfDay,
    endOfDay,
    eventOverlapsRange,
    isSameMonth,
    getWeekdayLabels,
    getMonthGridDays,
} from "../utils/dateHelpers";

const YearView = ({ months, events, onSelectDate }) => {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {months.map((month) => (
                    <div key={month.label} className="rounded-xl border border-slate-100 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">
                                {month.label}
                            </span>
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
                                        className={`rounded-md border px-1 py-1 text-[10px] text-slate-500 ${isSameMonth(day, month.start)
                                            ? "border-slate-100"
                                            : "border-transparent"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{day.getDate()}</span>
                                            {dayEvents.length > 0 && (
                                                <span className="text-[9px] text-purple-600">
                                                    {dayEvents.length}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-3 border-t border-slate-100 pt-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Mapped items</p>
                            <div className="mt-1 space-y-1">
                                {events
                                    .filter((event) => {
                                        const eventStart = new Date(event.start);
                                        return (
                                            eventStart.getFullYear() === month.start.getFullYear()
                                            && eventStart.getMonth() === month.start.getMonth()
                                        );
                                    })
                                    .slice(0, 3)
                                    .map((event) => (
                                        <div key={`m-${month.label}-${event.id}`} className="text-[10px] text-slate-600 truncate">
                                            {event.type}: {event.title}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default YearView;
