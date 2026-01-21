"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleDailyTask } from "@/app/employees/actions";

type DailyTaskItem = {
  id: number;
  label: string;
  completed: boolean;
};

type DailyTasksProps = {
  tasks: DailyTaskItem[];
  employeeId: number;
};

export function DailyTasks({ tasks, employeeId }: DailyTasksProps) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (taskId: number) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("taskId", String(taskId));
      await toggleDailyTask(formData);
      setLocalTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      );
    });
  };

  if (localTasks.length === 0) {
    return <p className="text-sm text-slate-500">אין משימות מוגדרות להיום.</p>;
  }

  return (
    <div className="space-y-2">
      {localTasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
        >
          <span className={task.completed ? "text-slate-400 line-through" : "text-slate-900"}>
            {task.label}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleToggle(task.id)}
            disabled={isPending}
          >
            {task.completed ? "סמן כלא בוצע" : "סמן כבוצע"}
          </Button>
        </div>
      ))}
    </div>
  );
}

