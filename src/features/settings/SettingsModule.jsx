import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateCurrentUser } from "../../services/authservice";

const SettingsModule = () => {
    const { user, token, updateSessionUser } = useAuth();
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        department: "",
        role: "",
    });
    const [editProfile, setEditProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");
    // Sync theme state with global documentElement class
    const getInitialTheme = () => {
        return document.documentElement.classList.contains("dark") ? "dark" : "light";
    };
    const [theme, setTheme] = useState(getInitialTheme);
    const [language, setLanguage] = useState("English");
    const [timezone, setTimezone] = useState("GMT+5:30 (India Standard Time)");
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [pushAlerts, setPushAlerts] = useState(true);
    const [weeklyDigest, setWeeklyDigest] = useState(false);
    const [profileVisible, setProfileVisible] = useState(true);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

    // Only update global theme when toggled, not on mount
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [theme]);

    useEffect(() => {
        if (!user) return;
        setProfile({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            department: user.department || "",
            role: user.role || "",
        });
    }, [user]);

    const handleProfileChange = (field) => (event) => {
        setProfile((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleProfileSave = async (event) => {
        event.preventDefault();
        if (!token) {
            setProfileMessage("Session expired. Please login again.");
            return;
        }

        try {
            const response = await updateCurrentUser(token, {
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                department: profile.department,
            });
            updateSessionUser(response.user);
            setEditProfile(false);
            setProfileMessage("Profile updated successfully.");
        } catch (err) {
            setProfileMessage(err?.message || "Failed to update profile.");
        }
    };

    const handleSecuritySave = (event) => {
        event.preventDefault();
        console.log("Update security settings");
    };

    const Toggle = ({ enabled, onToggle }) => (
        <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-purple-600" : "bg-gray-200"}`}
            aria-pressed={enabled}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`}
            />
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <form onSubmit={handleProfileSave} className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-semibold text-gray-900">Profile Settings</div>
                            <div className="text-sm text-gray-500">Update personal details and contact info.</div>
                        </div>
                        {!editProfile ? (
                            <button
                                type="button"
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                                onClick={() => setEditProfile(true)}
                            >
                                Edit
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                            >
                                Save Changes
                            </button>
                        )}
                    </div>
                    {profileMessage && (
                        <div className="text-sm text-purple-600">{profileMessage}</div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500">Full Name</label>
                            {!editProfile ? (
                                <div className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 shadow-sm">{profile.name}</div>
                            ) : (
                                <input
                                    value={profile.name}
                                    onChange={handleProfileChange("name")}
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                                />
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Role</label>
                            {!editProfile ? (
                                <div className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 shadow-sm">{profile.role}</div>
                            ) : (
                                <input
                                    value={profile.role}
                                    onChange={handleProfileChange("role")}
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                                />
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Email</label>
                            {!editProfile ? (
                                <div className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 shadow-sm">{profile.email}</div>
                            ) : (
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={handleProfileChange("email")}
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                                />
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Phone</label>
                            {!editProfile ? (
                                <div className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 shadow-sm">{profile.phone}</div>
                            ) : (
                                <input
                                    value={profile.phone}
                                    onChange={handleProfileChange("phone")}
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                                />
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-gray-500">Department</label>
                            {!editProfile ? (
                                <div className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 shadow-sm">{profile.department}</div>
                            ) : (
                                <input
                                    value={profile.department}
                                    onChange={handleProfileChange("department")}
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                                />
                            )}
                        </div>
                    </div>
                </form>

                <form onSubmit={handleSecuritySave} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                    <div>
                        <div className="text-lg font-semibold text-gray-900">Security</div>
                        <div className="text-sm text-gray-500">Manage passwords and sign-in protection.</div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">New Password</label>
                        <input
                            type="password"
                            placeholder="Enter new password"
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Confirm Password</label>
                        <input
                            type="password"
                            placeholder="Confirm new password"
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-800">Two-factor authentication</div>
                            <div className="text-xs text-gray-500">Require verification code on login.</div>
                        </div>
                        <Toggle enabled={twoFactorEnabled} onToggle={() => setTwoFactorEnabled((prev) => !prev)} />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium"
                    >
                        Update Security
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                    <div>
                        <div className="text-lg font-semibold text-gray-900">Appearance</div>
                        <div className="text-sm text-gray-500">Switch between light and dark mode.</div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-800">Theme</div>
                            <div className="text-xs text-gray-500">{theme === "dark" ? "Dark" : "Light"} mode</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setTheme("light")}
                                className={`px-3 py-1 rounded-lg text-xs font-medium ${theme === "light" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"}`}
                            >
                                Light
                            </button>
                            <button
                                type="button"
                                onClick={() => setTheme("dark")}
                                className={`px-3 py-1 rounded-lg text-xs font-medium ${theme === "dark" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"}`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                    <div>
                        <div className="text-lg font-semibold text-gray-900">Notifications</div>
                        <div className="text-sm text-gray-500">Choose how you want to be updated.</div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-800">Email alerts</div>
                                <div className="text-xs text-gray-500">Survey releases and approvals.</div>
                            </div>
                            <Toggle enabled={emailAlerts} onToggle={() => setEmailAlerts((prev) => !prev)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-800">Push notifications</div>
                                <div className="text-xs text-gray-500">Real-time alerts on activity.</div>
                            </div>
                            <Toggle enabled={pushAlerts} onToggle={() => setPushAlerts((prev) => !prev)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-800">Weekly digest</div>
                                <div className="text-xs text-gray-500">Summary sent every Friday.</div>
                            </div>
                            <Toggle enabled={weeklyDigest} onToggle={() => setWeeklyDigest((prev) => !prev)} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                    <div>
                        <div className="text-lg font-semibold text-gray-900">Common Settings</div>
                        <div className="text-sm text-gray-500">Language, time zone, and privacy preferences.</div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Language</label>
                        <select
                            value={language}
                            onChange={(event) => setLanguage(event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        >
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Time Zone</label>
                        <select
                            value={timezone}
                            onChange={(event) => setTimezone(event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        >
                            <option>GMT+5:30 (India Standard Time)</option>
                            <option>GMT+0 (UTC)</option>
                            <option>GMT-5 (Eastern Time)</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-800">Profile visibility</div>
                            <div className="text-xs text-gray-500">Allow others to view your profile.</div>
                        </div>
                        <Toggle enabled={profileVisible} onToggle={() => setProfileVisible((prev) => !prev)} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModule;
