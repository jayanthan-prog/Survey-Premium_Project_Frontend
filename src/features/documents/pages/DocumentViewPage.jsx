import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

const DocumentViewPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

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
        ],
        []
    );

    const doc = documents.find((item) => item.id === id);

    if (!doc) {
        return (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-gray-800">Document</h1>
                <p className="text-sm text-gray-500 mt-2">Document not found.</p>
                <button
                    type="button"
                    onClick={() => navigate("/admin/documents")}
                    className="mt-4 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                    Back to Documents
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Document View</h1>
                    <div className="text-sm text-gray-500">Review document details and preview.</div>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/admin/documents")}
                    className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                    Back to Documents
                </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="text-xs text-gray-400">Document</div>
                        <div className="text-xl font-semibold text-gray-900">{doc.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{doc.id} · {doc.type}</div>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mt-6">
                    <div>
                        <div className="text-xs text-gray-400">Uploaded By</div>
                        <div className="font-medium text-gray-700">{doc.uploadedBy}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Uploaded At</div>
                        <div className="font-medium text-gray-700">{doc.uploadedAt}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Size</div>
                        <div className="font-medium text-gray-700">{doc.size}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Related To</div>
                        <div className="font-medium text-gray-700">{doc.relatedTo}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="text-sm font-semibold text-gray-800">Preview</div>
                <div className="mt-4 h-80 rounded-xl border border-gray-100 bg-gradient-to-br from-purple-50 via-white to-slate-50 flex items-center justify-center text-xs text-gray-400">
                    Document Preview
                </div>
                <div className="mt-4 flex gap-2">
                    <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">Approve</button>
                    <button className="rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">Reject</button>
                    <button className="rounded-xl border border-amber-200 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50">Review</button>
                </div>
            </div>
        </div>
    );
};

export default DocumentViewPage;
