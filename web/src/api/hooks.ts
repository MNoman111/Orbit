import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { Me, Project, Task } from '../lib/types';

export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ['me'],
    enabled,
    queryFn: async () => (await api.get<{ data: Me }>('/me')).data.data,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get<{ data: Project[] }>('/projects')).data.data,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; key: string; description?: string }) =>
      (await api.post<{ data: Project }>('/projects', input)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', projectId],
    enabled: !!projectId,
    queryFn: async () =>
      (await api.get<{ data: Task[] }>(`/projects/${projectId}/tasks`)).data.data,
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string }) =>
      (await api.post<{ data: Task }>(`/projects/${projectId}/tasks`, input)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
}

export function useMoveTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Task['status'] }) =>
      (await api.patch<{ data: Task }>(`/tasks/${id}`, { status })).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
}
