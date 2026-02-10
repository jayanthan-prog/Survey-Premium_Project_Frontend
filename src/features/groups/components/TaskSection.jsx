const TaskSection = ({ task, setTask }) => {
    const inputClassName = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none";

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-2">
                Task / Responsibility
            </h2>

            <input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className={inputClassName}
                placeholder="Monitor training progress"
            />
        </div>
    );
};

export default TaskSection;
