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
        <div className="h-full min-h-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white flex flex-col">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {getWeekdayLabels().map((label) => (
                    <div
                        key={label}
                        className="px-1 py-2.5 text-center font-semibold text-slate-600 text-[11px] border-r border-slate-100 last:border-r-0 bg-slate-50"
                    >
                        {label.toUpperCase()}
                    </div>
                ))}
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-7 grid-rows-6">
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
                            className={`min-h-0 overflow-hidden p-1.5 border-r border-b border-slate-100 ${!isCurrentMonth ? "bg-slate-50" : "bg-white"
                                } hover:bg-purple-50 cursor-pointer transition`}
                            onClick={() => onSelectDate(day)}
                        >
                            <div className="font-semibold text-xs text-slate-900 mb-1">
                                {day.getDate()}
                            </div>
                            <div className="space-y-0.5">
                                {dayEvents.slice(0, 2).map((event) => (
                                    <div
                                        key={event.id}
                                        className={`text-[10px] p-0.5 rounded truncate font-medium text-white ${getTypeColor(
                                            event.type
                                        )}`}
                                    >
                                        {event.type}: {event.title}
                                    </div>
                                ))}
                                {dayEvents.length > 2 && (
                                    <div className="text-[10px] text-purple-600 font-semibold">
                                        +{dayEvents.length - 2}
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
