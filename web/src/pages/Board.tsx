import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTasks, useCreateTask, useMoveTask } from '../api/hooks';
import { TaskStatus } from '../lib/types';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'done', label: 'Done' },
];

const NEXT: Record<TaskStatus, TaskStatus> = {
  backlog: 'todo',
  todo: 'in_progress',
  in_progress: 'review',
  review: 'done',
  done: 'done',
};

export function Board() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: tasks } = useTasks(projectId);
  const createTask = useCreateTask(projectId!);
  const moveTask = useMoveTask(projectId!);
  const [title, setTitle] = useState('');

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!title) return;
    await createTask.mutateAsync({ title });
    setTitle('');
  }

  return (
    <div className="page">
      <h1>Board</h1>
      <form className="row" onSubmit={onAdd}>
        <input
          placeholder="New task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button disabled={createTask.isPending}>Add task</button>
      </form>

      <div className="board">
        {COLUMNS.map((col) => (
          <div key={col.status} className="column">
            <h3>{col.label}</h3>
            {tasks
              ?.filter((t) => t.status === col.status)
              .map((t) => (
                <div key={t._id} className="task">
                  <span>{t.title}</span>
                  {t.status !== 'done' && (
                    <button
                      className="move"
                      onClick={() => moveTask.mutate({ id: t._id, status: NEXT[t.status] })}
                    >
                      →
                    </button>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
