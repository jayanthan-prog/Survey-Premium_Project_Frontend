import {
    getWeekdayLabels,
    getMonthGridDays,
    isSameDay,
    isSameMonth,
    addDays,
    addMonths,
    formatTimeRange,
} from "../utils/dateHelpers";

const CalendarSidebar = ({
    selectedDate,
    setSelectedDate,
    eventsForSelectedDay,
    onPrev,
    onNext,
}) => {
    return (
        <div className="w-full shrink-0 border-b border-slate-200 bg-white p-4 lg:w-60 lg:min-w-[240px] lg:max-w-[280px] lg:border-b-0 lg:border-r lg:overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>

            {/* Mini Calendar Navigation */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={onPrev} className="p-1.5 hover:bg-slate-100 rounded-lg">
                    <span className="text-xl">‹</span>
                </button>
                <span className="text-sm font-medium text-slate-600">
                    {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <button onClick={onNext} className="p-1.5 hover:bg-slate-100 rounded-lg">
                    <span className="text-xl">›</span>
                </button>
            </div>

            {/* Mini Calendar Grid */}
            <div className="mb-6">
                <div className="grid grid-cols-7 gap-2 mb-4 text-xs text-slate-500 font-medium">
                    {getWeekdayLabels().map((label) => (
                        <span key={label} className="text-center">
                            {label[0]}
                        </span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {getMonthGridDays(selectedDate).map((day) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth = isSameMonth(day, selectedDate);

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                className={`p-2 text-sm rounded-lg transition ${isSelected
                                    ? "bg-purple-600 text-white font-semibold"
                                    : isToday
                                        ? "border-2 border-purple-400 text-slate-900"
                                        : isCurrentMonth
                                            ? "text-slate-900 hover:bg-slate-100"
                                            : "text-slate-300"
                                    }`}
                            >
                                {day.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Scheduled Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">Scheduled</h4>
                </div>

                <div className="space-y-2">
                    {eventsForSelectedDay.length === 0 ? (
                        <p className="text-xs text-slate-500 p-3">No events scheduled.</p>
                    ) : (
                        eventsForSelectedDay.map((event) => (
                            <div
                                key={event.id}
                                className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                            >
                                <p className="font-semibold text-slate-900">{event.title}</p>
                                <p className="text-slate-500">
                                    {formatTimeRange(event.start, event.end)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarSidebar;
