import {
    startOfDay,
    endOfDay,
    setHour,
    eventOverlapsRange,
    formatHour,
    isSameDay,
} from "../utils/dateHelpers";
import { getTypeBadge } from "../utils/styleHelpers";

const WeekView = ({ days, events, onSelectDate }) => {
    const hours = Array.from({ length: 24 }).map((_, index) => index);

    const getAllDayEventsForDate = (day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        return events.filter((event) => event.allDay && eventOverlapsRange(event, dayStart, dayEnd));
    };

    const timedEvents = events.filter((event) => !event.allDay);

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Main scroll container */}
            <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-sm custom-scrollbar">
                <div className="w-full ">
                    {/* Header Row - Narrowed time column from 80px to 60px */}
                    <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-30 bg-white border-b border-slate-200">
                        <div className="bg-slate-50/50 border-r border-slate-200" />
                        {days.map((day) => (
                            <div
                                key={day.toISOString()}
                                className="py-2 text-center border-r border-slate-100 last:border-r-0"
                            >
                                <div className="text-[9px] uppercase tracking-tighter font-bold text-slate-400">
                                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                                </div>
                                <div
                                    className={`text-sm font-bold ${isSameDay(day, new Date()) ? "text-purple-600" : "text-slate-700"
                                        }`}
                                >
                                    {day.getDate()}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100 bg-slate-50/40">
                        <div className="px-2 py-2 text-right text-[10px] font-semibold text-slate-500 border-r border-slate-200 sticky left-0 z-10 bg-slate-50/60">
                            All-day
                        </div>
                        {days.map((day) => {
                            const allDayEvents = getAllDayEventsForDate(day);
                            return (
                                <div key={`allday-${day.toISOString()}`} className="min-h-12 border-r border-slate-100 p-1.5 last:border-r-0">
                                    <div className="space-y-1">
                                        {allDayEvents.slice(0, 2).map((event) => (
                                            <div key={event.id} className={`rounded px-1.5 py-1 text-[9px] font-semibold truncate ${getTypeBadge(event.type)}`}>
                                                {event.type}: {event.title}
                                            </div>
                                        ))}
                                        {allDayEvents.length > 2 && (
                                            <div className="text-[9px] text-slate-500">+{allDayEvents.length - 2} more</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Time Rows */}
                    <div className="relative">
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-50 last:border-b-0"
                            >
                                {/* Hour Label - Narrower for better space distribution */}
                                <div className="py-4 pr-2 text-right text-[10px] font-semibold text-slate-400 bg-slate-50/20 border-r border-slate-200 sticky left-0 z-10">
                                    {formatHour(hour)}
                                </div>

                                {/* Day Cells */}
                                {days.map((day) => {
                                    const hourStart = setHour(startOfDay(day), hour);
                                    const hourEnd = setHour(startOfDay(day), hour + 1);
                                    const hourEvents = timedEvents.filter((event) =>
                                        eventOverlapsRange(event, hourStart, hourEnd)
                                    );

                                    return (
                                        <div
                                            key={day.toISOString()}
                                            className="relative h-14 border-r border-slate-50 last:border-r-0 p-0.5 group hover:bg-slate-50/30 transition-colors"
                                        >
                                            {hourEvents.map((event, index) => {
                                                const offsetTop = index * 4;
                                                const offsetLeft = index * 3;

                                                return (
                                                    <div
                                                        key={event.id}
                                                        style={{
                                                            top: `${offsetTop + 2}px`,
                                                            left: `${offsetLeft + 2}px`,
                                                            zIndex: index + 1,
                                                            width: `calc(100% - ${offsetLeft + 4}px)`,
                                                        }}
                                                        className={`absolute h-10 rounded-md p-1.5 shadow border transition-all cursor-pointer 
                                                            hover:z-50 hover:scale-105 hover:shadow-md
                                                            ${getTypeBadge(event.type)}`}
                                                    >
                                                        <div className="flex flex-col h-full leading-tight">
                                                            <span className="text-[9px] font-bold truncate">
                                                                {event.title}
                                                            </span>
                                                            <span className="text-[8px] opacity-80 whitespace-nowrap">
                                                                {new Date(event.start).toLocaleTimeString(
                                                                    [],
                                                                    { hour: "numeric", minute: "2-digit" }
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeekView;
