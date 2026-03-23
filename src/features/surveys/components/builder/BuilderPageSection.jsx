import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, Copy, GripVertical, Plus, Trash2 } from "lucide-react";

function SortablePageContainer({ page, children }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `page:${page.id}`,
        data: {
            kind: "page",
            pageId: page.id,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <section
            ref={setNodeRef}
            style={style}
            className={`rounded-2xl border bg-white shadow-sm ${isDragging ? "border-sky-300" : "border-slate-200"}`}
        >
            {children({ dragHandleProps: { ...attributes, ...listeners } })}
        </section>
    );
}

function SortableQuestionCard({
    pageId,
    question,
    index,
    number,
    selected,
    onSelect,
    onDuplicate,
    onDelete,
    onInlineText,
}) {
    const sortable = useSortable({
        id: `question:${question.id}`,
        data: {
            kind: "question",
            pageId,
            questionId: question.id,
            index,
        },
    });

    const style = {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
    };

    return (
        <article
            ref={sortable.setNodeRef}
            style={style}
            className={`rounded-xl border bg-white p-3 transition ${selected ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200"} ${sortable.isDragging ? "opacity-60" : "opacity-100"}`}
            onClick={onSelect}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="rounded-md border border-slate-200 p-1 text-slate-400 hover:text-slate-600"
                        {...sortable.attributes}
                        {...sortable.listeners}
                        aria-label="Drag question"
                    >
                        <GripVertical size={14} />
                    </button>
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">{number}</div>
                        <div className="text-xs text-slate-500">{question.type.replaceAll("_", " ")}</div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDuplicate();
                        }}
                        className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                        title="Duplicate question"
                    >
                        <Copy size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete();
                        }}
                        className="rounded-md border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                        title="Delete question"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <input
                value={question.text || ""}
                onChange={(event) => onInlineText(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Type question text..."
            />

            {question.description && <p className="mt-2 text-xs text-slate-500">{question.description}</p>}
        </article>
    );
}

const BuilderPageSection = ({
    page,
    numberedQuestionMap,
    selectedQuestionRef,
    setSelectedQuestionRef,
    setActivePanelTab,
    updatePage,
    addQuestionToPage,
    removePage,
    duplicateQuestion,
    deleteQuestion,
    updateQuestion,
}) => {
    const pageQuestionItems = page.questions.map((question, index) => ({
        id: `question:${question.id}`,
        question,
        index,
    }));

    const droppable = useDroppable({
        id: `page-drop:${page.id}`,
        data: {
            kind: "page-drop",
            pageId: page.id,
            index: page.questions.length,
        },
    });

    return (
        <SortablePageContainer page={page}>
            {({ dragHandleProps }) => (
                <div className="p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-slate-200 p-1 text-slate-400 hover:text-slate-700"
                                {...dragHandleProps}
                            >
                                <GripVertical size={14} />
                            </button>
                            <button
                                type="button"
                                className="rounded-md border border-slate-200 p-1 text-slate-500"
                                onClick={() => updatePage(page.id, { collapsed: !page.collapsed })}
                            >
                                {page.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <input
                                value={page.title}
                                onChange={(event) => updatePage(page.id, { title: event.target.value })}
                                className="rounded-lg border border-transparent px-2 py-1 text-sm font-semibold text-slate-900 outline-none hover:border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                placeholder="Page title"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => addQuestionToPage(page.id, "short_text")}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <Plus size={14} />
                                Question
                            </button>
                            <button
                                type="button"
                                onClick={() => removePage(page.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                            >
                                <Trash2 size={14} />
                                Page
                            </button>
                        </div>
                    </div>

                    {!page.collapsed && (
                        <div ref={droppable.setNodeRef} className="mt-4 space-y-2">
                            <SortableContext items={pageQuestionItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                                {pageQuestionItems.map((item) => (
                                    <SortableQuestionCard
                                        key={item.id}
                                        pageId={page.id}
                                        question={item.question}
                                        index={item.index}
                                        number={numberedQuestionMap.get(String(item.question.id)) || "Q?"}
                                        selected={selectedQuestionRef?.pageId === page.id && selectedQuestionRef?.questionId === item.question.id}
                                        onSelect={() => {
                                            setSelectedQuestionRef({ pageId: page.id, questionId: item.question.id });
                                            setActivePanelTab("question");
                                        }}
                                        onDuplicate={() => duplicateQuestion(page.id, item.question.id)}
                                        onDelete={() => deleteQuestion(page.id, item.question.id)}
                                        onInlineText={(value) => updateQuestion(page.id, item.question.id, { text: value })}
                                    />
                                ))}
                            </SortableContext>

                            <div
                                className={`rounded-xl border-2 border-dashed p-3 text-center text-xs transition ${droppable.isOver ? "border-sky-300 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-400"}`}
                            >
                                Drop question here
                            </div>
                        </div>
                    )}
                </div>
            )}
        </SortablePageContainer>
    );
};

export default BuilderPageSection;
