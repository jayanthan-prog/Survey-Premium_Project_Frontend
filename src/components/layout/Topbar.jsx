import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CircleHelp, Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getHomePathByRole } from "../../services/authservice";

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

    const recentNotifications = [
        {
            title: "New survey release opened",
            detail: "Group A · 2m ago",
            tone: "bg-emerald-400",
        },
        {
            title: "Action plan marked overdue",
            detail: "AP-7003 · 1h ago",
            tone: "bg-amber-400",
        },
        {
            title: "Allocation conflicts detected",
            detail: "Block A · Today",
            tone: "bg-rose-400",
        },
        {
            title: "Approval pending review",
            detail: "APP-5282 · Today",
            tone: "bg-sky-400",
        },
    ];

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
                    onClick={() => {
                        setShowNotifications((prev) => !prev);
                        setShowHelp(false);
                    }}
                    className="h-10 w-10 rounded-xl text-gray-600 hover:bg-slate-100 hover:text-gray-800 transition-colors flex items-center justify-center"
                    aria-label="Notifications"
                >
                    <Bell size={18} />
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
                            <div className="text-xs text-slate-200">Latest activity updates</div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recentNotifications.map((item) => (
                                <div key={item.title} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50">
                                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.tone}`} />
                                    <div>
                                        <div className="text-sm font-medium text-gray-800">{item.title}</div>
                                        <div className="text-xs text-gray-500">{item.detail}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full text-xs font-semibold text-purple-600 py-2 hover:bg-purple-50">
                            See all activity
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
