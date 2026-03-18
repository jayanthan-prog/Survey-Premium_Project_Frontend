import {
    startOfDay,
    endOfDay,
    eventOverlapsRange,
    isSameMonth,
    getWeekdayLabels,
} from "../utils/dateHelpers";
import { getTypeColor } from "../utils/styleHelpers";

const MonthView = ({ days, selectedDate, events, onSelectDate }) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-200">
            <div className="grid grid-cols-7 border-b border-slate-200 rounded-t-2xl overflow-hidden">
                {getWeekdayLabels().map((label) => (
                    <div
                        key={label}
                        className="p-4 text-center font-semibold text-slate-600 text-sm border-r border-slate-100 last:border-r-0 bg-slate-50"
                    >
                        {label.toUpperCase()}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {days.map((day) => {
                    const dayStart = startOfDay(day);
                    const dayEnd = endOfDay(day);
                    const dayEvents = events.filter((event) =>
                        eventOverlapsRange(event, dayStart, dayEnd)
                    );
                    const isCurrentMonth = isSameMonth(day, selectedDate);

                    return (
                        <div
                            key={day.toISOString()}
                            className={`min-h-[10px] p-3 border-r border-b border-slate-100 ${!isCurrentMonth ? "bg-slate-50" : "bg-white"
                                } hover:bg-purple-50 cursor-pointer transition`}
                            onClick={() => onSelectDate(day)}
                        >
                            <div className="font-semibold text-sm text-slate-900 mb-2">
                                {day.getDate()}
                            </div>
                            <div className="space-y-1">
                                {dayEvents.slice(0, 3).map((event) => (
                                    <div
                                        key={event.id}
                                        className={`text-xs p-1 rounded truncate font-medium text-white ${getTypeColor(
                                            event.type
                                        )}`}
                                    >
                                        {event.type === "Survey" && "🔵"}
                                        {event.type === "Assessment" && "🔷"}
                                        {event.type === "Activity" && "🟢"} {event.title}
                                    </div>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-xs text-purple-600 font-semibold">
                                        +{dayEvents.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MonthView;
