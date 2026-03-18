// Date manipulation utilities
export const startOfDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

export const endOfDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

export const setHour = (date, hour) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0);

export const addDays = (date, amount) => {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
};

export const addMonths = (date, amount) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + amount);
    return next;
};

export const addYears = (date, amount) => {
    const next = new Date(date);
    next.setFullYear(next.getFullYear() + amount);
    return next;
};

export const startOfWeek = (date) => {
    const dayIndex = (date.getDay() + 6) % 7;
    return addDays(startOfDay(date), -dayIndex);
};

export const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

export const isSameMonth = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const eventOverlapsRange = (event, rangeStart, rangeEnd) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return eventStart <= rangeEnd && eventEnd >= rangeStart;
};

// Formatting utilities
export const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const formatFullDate = (date) =>
    date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

export const formatShortDate = (date) =>
    date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });

export const formatTimeRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    })} - ${endDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
};

export const formatHour = (hour) => {
    const period = hour < 12 ? "AM" : "PM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12} ${period}`;
};

// Calendar grid utilities
export const getWeekdayLabels = () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const getWeekDays = (date) => {
    const start = startOfWeek(date);
    return Array.from({ length: 7 }).map((_, index) => addDays(start, index));
};

export const getMonthGridDays = (date) => {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const start = startOfWeek(monthStart);
    const totalDays = Math.ceil((monthEnd - start) / (1000 * 60 * 60 * 24)) + 1;
    return Array.from({ length: totalDays }).map((_, index) => addDays(start, index));
};

export const getYearMonths = (date) => {
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
