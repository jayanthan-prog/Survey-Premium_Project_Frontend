import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const DocumentsModule = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState("cards");

    const documents = useMemo(
        () => [
            {
                id: "DOC-102",
                title: "Consent Form - Hostel",
                type: "PDF",
                status: "Pending",
                uploadedBy: "Student",
                uploadedAt: "2026-02-06",
                size: "324 KB",
                relatedTo: "Hostel Preference 2026",
            },
            {
                id: "DOC-097",
                title: "Offer Letter",
                type: "PDF",
                status: "Approved",
                uploadedBy: "Approver",
                uploadedAt: "2026-02-02",
                size: "812 KB",
                relatedTo: "Internship Willingness",
            },
            {
                id: "DOC-090",
                title: "ID Proof",
                type: "Image",
                status: "Rejected",
                uploadedBy: "Student",
                uploadedAt: "2026-01-28",
                size: "210 KB",
                relatedTo: "Transport Facilities Feedback",
            },
            {
                id: "DOC-102",
                title: "Consent Form - Hostel",
                type: "PDF",
                status: "Pending",
                uploadedBy: "Student",
                uploadedAt: "2026-02-06",
                size: "324 KB",
                relatedTo: "Hostel Preference 2026",
            },
            {
                id: "DOC-097",
                title: "Offer Letter",
                type: "PDF",
                status: "Approved",
                uploadedBy: "Approver",
                uploadedAt: "2026-02-02",
                size: "812 KB",
                relatedTo: "Internship Willingness",
            },
            {
                id: "DOC-090",
                title: "ID Proof",
                type: "Image",
                status: "Rejected",
                uploadedBy: "Student",
                uploadedAt: "2026-01-28",
                size: "210 KB",
                relatedTo: "Transport Facilities Feedback",
            },
        ],
        []
    );

    const inputClassName =
        "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none";
    const labelClassName = "text-xs font-medium text-gray-500";

    const handleAddDocument = (event) => {
        event.preventDefault();

        const payload = {
            title,
            type: docType,
            relatedTo,
            visibility,
            notes,
            fileName,
        };

        console.log("Add document", payload);
        setShowAdd(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
                        <button
                            type="button"
                            onClick={() => setViewMode("cards")}
                            className={`px-3 py-1 text-xs rounded-lg ${viewMode === "cards" ? "bg-purple-600 text-white" : "text-gray-600"
                                }`}
                        >
                            Cards
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className={`px-3 py-1 text-xs rounded-lg ${viewMode === "table" ? "bg-purple-600 text-white" : "text-gray-600"
                                }`}
                        >
                            Table
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/documents/create")}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                    >
                        + Add Document
                    </button>
                </div>
            </div>

            {viewMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                        <button
                            type="button"
                            key={doc.id}
                            onClick={() => navigate(`/admin/documents/${doc.id}`)}
                            className="text-left bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3 hover:shadow-md transition"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">{doc.title}</div>
                                    <div className="text-xs text-gray-500">{doc.id} · {doc.type}</div>
                                </div>
                                <span
                                    className={`px-2 py-1 rounded-full text-[10px] font-semibold ${doc.status === "Approved"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : doc.status === "Rejected"
                                            ? "bg-rose-50 text-rose-700"
                                            : "bg-amber-50 text-amber-700"
                                        }`}
                                >
                                    {doc.status}
                                </span>
                            </div>
                            <div className="h-28 rounded-xl border border-gray-100 bg-gradient-to-br from-purple-50 via-white to-slate-50 overflow-hidden">
                                <img
                                    src="https://img.freepik.com/free-vector/files-blue-colour_78370-6661.jpg"
                                    alt="Document thumbnail"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="text-xs text-gray-500">Related: {doc.relatedTo}</div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>By {doc.uploadedBy}</span>
                                <span>{doc.uploadedAt}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>{doc.size}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    aria-label="Approve"
                                    onClick={(event) => event.stopPropagation()}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    aria-label="Reject"
                                    onClick={(event) => event.stopPropagation()}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    aria-label="Review"
                                    onClick={(event) => event.stopPropagation()}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                    </svg>
                                </button>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Document</th>
                                <th className="px-6 py-3 font-semibold">Type</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                <th className="px-6 py-3 font-semibold">Uploaded By</th>
                                <th className="px-6 py-3 font-semibold">Date</th>
                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {documents.map((doc) => (
                                <tr
                                    key={doc.id}
                                    onClick={() => navigate(`/admin/documents/${doc.id}`)}
                                    className="hover:bg-gray-50 cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{doc.title}</div>
                                        <div className="text-xs text-gray-500">{doc.relatedTo}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{doc.type}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-[10px] font-semibold ${doc.status === "Approved"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : doc.status === "Rejected"
                                                    ? "bg-rose-50 text-rose-700"
                                                    : "bg-amber-50 text-amber-700"
                                                }`}
                                        >
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{doc.uploadedBy}</td>
                                    <td className="px-6 py-4 text-gray-600">{doc.uploadedAt}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                aria-label="Approve"
                                                onClick={(event) => event.stopPropagation()}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="Reject"
                                                onClick={(event) => event.stopPropagation()}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="Review"
                                                onClick={(event) => event.stopPropagation()}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                                    <path d="M12 20h9" />
                                                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DocumentsModule;
