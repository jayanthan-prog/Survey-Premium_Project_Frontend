import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CircleHelp, Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getHomePathByRole } from "../../services/authservice";
import {
    getMyNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "../../services/notificationApi";

const Topbar = ({ setIsOpen }) => {
    const { user } = useAuth();
    const settingsPath = useMemo(() => {
        const homePath = getHomePathByRole(user?.role);
        if (homePath.startsWith("/admin")) return "/admin/settings";
        if (homePath.startsWith("/approver")) return "/approver/settings";
        return "/student/settings";
    }, [user]);

    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const popoverRef = useRef(null);

    const initials = useMemo(() => {
        const rawName = user?.name || user?.email || "User";
        return rawName
            .split(" ")
            .map((chunk) => chunk[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }, [user]);

    const toRelativeTime = (value) => {
        if (!value) return "Now";
        const createdAt = new Date(value);
        if (Number.isNaN(createdAt.getTime())) return "Now";

        const diffMs = Date.now() - createdAt.getTime();
        const minutes = Math.max(1, Math.floor(diffMs / 60000));
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const loadNotifications = async () => {
        try {
            setIsLoadingNotifications(true);
            const response = await getMyNotifications({ limit: 8 });
            setNotifications(Array.isArray(response?.notifications) ? response.notifications : []);
            setUnreadCount(Number(response?.unread_count || 0));
        } catch (_err) {
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const openNotifications = async () => {
        setShowNotifications((prev) => !prev);
        setShowHelp(false);

        if (!showNotifications) {
            await loadNotifications();
        }
    };

    const handleNotificationClick = async (item) => {
        if (!item || item.is_read) return;
        try {
            await markNotificationAsRead(item.notification_id);
            setNotifications((prev) => prev.map((entry) => (
                entry.notification_id === item.notification_id
                    ? { ...entry, is_read: true }
                    : entry
            )));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (_err) {
            // ignore read status update failures in UI
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications((prev) => prev.map((entry) => ({ ...entry, is_read: true })));
            setUnreadCount(0);
        } catch (_err) {
            // ignore read-all update failures in UI
        }
    };

    useEffect(() => {
        const root = document.documentElement;
        setIsDark(root.classList.contains("dark"));

        const observer = new MutationObserver(() => {
            setIsDark(root.classList.contains("dark"));
        });
        observer.observe(root, { attributes: true, attributeFilter: ["class"] });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!popoverRef.current) return;
            if (popoverRef.current.contains(event.target)) return;
            setShowNotifications(false);
            setShowHelp(false);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    return (
        <div className="h-16 bg-white border-b flex items-center px-4 md:px-6">
            {/* Mobile menu button */}
            <button
                className="md:hidden text-slate-700 hover:bg-slate-100 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                onClick={() => setIsOpen(true)}
                aria-label="Open sidebar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex-1" />
            <div ref={popoverRef} className="relative flex items-center gap-3 justify-end">
                <button
                    onClick={() => {
                        const next = !isDark;
                        const root = document.documentElement;
                        root.classList.toggle("dark", next);
                        setIsDark(next);
                    }}
                    className="h-10 w-10 rounded-xl text-gray-600 hover:bg-slate-100 hover:text-gray-800 transition-colors flex items-center justify-center"
                    aria-label="Toggle theme"
                    title={isDark ? "Switch to light" : "Switch to dark"}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button
                    onClick={() => {
                        setShowHelp((prev) => !prev);
                        setShowNotifications(false);
                    }}
                    className="h-10 w-10 rounded-xl text-gray-600 hover:bg-slate-100 hover:text-gray-800 transition-colors flex items-center justify-center"
                    aria-label="Help"
                >
                    <CircleHelp size={18} />
                </button>

                <button
                    onClick={openNotifications}
                    className="h-10 w-10 rounded-xl text-gray-600 hover:bg-slate-100 hover:text-gray-800 transition-colors flex items-center justify-center"
                    aria-label="Notifications"
                >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute mt-[-20px] ml-[20px] min-w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center px-1">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => navigate(settingsPath)}
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs font-bold shadow-sm"
                    aria-label="Open profile settings"
                    title="Open Settings"
                >
                    {initials}
                </button>

                {showNotifications && (
                    <div className="absolute right-12 top-12 w-80 rounded-xl border border-gray-100 bg-white shadow-2xl z-50 overflow-hidden">
                        <div className="px-4 py-3 bg-purple-500 text-white">
                            <div className="text-sm font-semibold">Notifications</div>
                            <div className="text-xs text-slate-200">Survey updates and reminders</div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {isLoadingNotifications && (
                                <div className="px-4 py-3 text-xs text-gray-500">Loading notifications...</div>
                            )}

                            {!isLoadingNotifications && notifications.length === 0 && (
                                <div className="px-4 py-3 text-xs text-gray-500">No notifications yet.</div>
                            )}

                            {!isLoadingNotifications && notifications.map((item) => (
                                <button
                                    key={item.notification_id}
                                    onClick={() => handleNotificationClick(item)}
                                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50"
                                >
                                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.is_read ? "bg-slate-300" : "bg-rose-500"}`} />
                                    <div>
                                        <div className="text-sm font-medium text-gray-800">{item.title}</div>
                                        <div className="text-xs text-gray-500">{item.message}</div>
                                        <div className="text-[11px] text-gray-400 mt-1">{toRelativeTime(item.created_at)}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button onClick={handleMarkAllRead} className="w-full text-xs font-semibold text-purple-600 py-2 hover:bg-purple-50">
                            Mark all as read
                        </button>
                    </div>
                )}

                {showHelp && (
                    <div className="absolute right-0 top-12 w-80 rounded-2xl border border-gray-100 bg-white shadow-2xl z-50 p-4">
                        <div className="text-sm font-semibold text-gray-800">Need help?</div>
                        <p className="text-xs text-gray-500 mt-1">Reach us anytime for support.</p>
                        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
                            <div className="text-xs text-gray-500">contact</div>
                            <div className="text-sm font-semibold text-gray-800">mrsn5712@gmaill.com</div>
                            <div className="text-xs text-gray-500 mt-2">phone</div>
                            <div className="text-sm font-semibold text-gray-800">7825955712</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Topbar;
