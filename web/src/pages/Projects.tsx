import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, useCreateProject } from '../api/hooks';

export function Projects() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name || !key) return;
    await createProject.mutateAsync({ name, key });
    setName('');
    setKey('');
  }

  return (
    <div className="page">
      <h1>Projects</h1>

      <form className="row" onSubmit={onCreate}>
        <input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="KEY"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          maxLength={6}
        />
        <button disabled={createProject.isPending}>Add</button>
      </form>

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <ul className="list">
          {projects?.map((p) => (
            <li key={p._id}>
              <Link to={`/projects/${p._id}`}>
                <span className="badge">{p.key}</span> {p.name}
              </Link>
            </li>
          ))}
          {projects?.length === 0 && <p className="muted">No projects yet — create one above.</p>}
        </ul>
      )}
    </div>
  );
}
