import { startOfDay, endOfDay, setHour, eventOverlapsRange, formatTimeRange, formatHour } from "../utils/dateHelpers";
import { getTypeBadge } from "../utils/styleHelpers";

const DayView = ({ date, events, onSelectDate }) => {
    const hours = Array.from({ length: 24 }).map((_, index) => index);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const dayEvents = events.filter((event) => eventOverlapsRange(event, dayStart, dayEnd));

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">
                        {date.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                </div>
                <button
                    className="flex-shrink-0 rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 whitespace-nowrap ml-2"
                    onClick={() => onSelectDate(new Date())}
                >
                    Jump to today
                </button>
            </div>

            {/* Scrollable Timeline */}
            <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-sm custom-scrollbar">
                <div className="w-full relative">
                    {hours.map((hour) => {
                        const hourStart = setHour(dayStart, hour);
                        const hourEnd = setHour(dayStart, hour + 1);
                        const hourEvents = dayEvents.filter((event) =>
                            eventOverlapsRange(event, hourStart, hourEnd)
                        );

                        return (
                            <div
                                key={hour}
                                className="grid grid-cols-[80px_1fr] border-b border-slate-50 last:border-b-0 group"
                            >
                                {/* Hour Label - Sticky sidebar for the day */}
                                <div className="py-6 pr-4 text-right text-xs font-semibold text-slate-400 bg-slate-50/30 border-r border-slate-200 sticky left-0 z-10">
                                    {formatHour(hour)}
                                </div>

                                {/* Event Slot */}
                                <div className="relative h-20 p-2 group-hover:bg-slate-50/30 transition-colors">
                                    {hourEvents.length === 0 ? (
                                        <div className="h-full w-full border border-dashed border-slate-100 rounded-lg flex items-center justify-center">
                                            <span className="text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                                No events scheduled
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="relative h-full w-full">
                                            {hourEvents.map((event, index) => {
                                                const offsetTop = index * 8;
                                                const offsetLeft = index * 6;

                                                return (
                                                    <div
                                                        key={event.id}
                                                        style={{
                                                            top: `${offsetTop}px`,
                                                            left: `${offsetLeft}px`,
                                                            zIndex: index + 1,
                                                            width: `calc(100% - ${offsetLeft + 10}px)`,
                                                        }}
                                                        className={`absolute h-14 rounded-xl p-3 shadow-md border transition-all cursor-pointer 
                                                            hover:z-50 hover:scale-[1.02] hover:shadow-lg flex flex-col justify-center
                                                            ${getTypeBadge(event.type)}`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="min-w-0">
                                                                <h4 className="text-[11px] font-bold truncate leading-none mb-1">
                                                                    {event.title}
                                                                </h4>
                                                                <p className="text-[10px] opacity-80 font-medium">
                                                                    {formatTimeRange(event.start, event.end)}
                                                                </p>
                                                            </div>
                                                            <div className="bg-white/20 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                                                {event.type}
                                                            </div>
                                                        </div>

                                                        {/* Location indicator */}
                                                        {event.location && (
                                                            <div className="mt-1 flex items-center gap-1 opacity-70 text-[9px]">
                                                                <span>📍</span>
                                                                <span className="truncate">
                                                                    {event.location}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DayView;
