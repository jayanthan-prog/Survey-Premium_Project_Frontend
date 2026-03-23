import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";

const PaletteQuestionType = ({ type }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette:${type.value}`,
        data: {
            kind: "palette",
            questionType: type.value,
        },
    });

    return (
        <button
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            type="button"
            className={`w-full text-left rounded-xl border px-3 py-2 text-sm transition ${isDragging
                ? "border-sky-300 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                }`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{type.label}</span>
                <GripVertical size={14} className="text-slate-400" />
            </div>
        </button>
    );
};

export default PaletteQuestionType;
