import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/useAppStore'
import type { Client, Project, TeamMember } from '@/types'
import { computeProjectStats, type ProjectStats } from '@/utils/quality'
import { can, type Permission } from '@/utils/permissions'
import { CURRENT_USER } from '@/data/seed/team'

/** Memoized per-project stats (score, open issues, risk). Recomputed only when projects/issues/segments change. */
export function useProjectStatsMap() {
  const { projects, issues, segments, weights } = useAppStore(
    useShallow((s) => ({ projects: s.projects, issues: s.issues, segments: s.segments, weights: s.settings.severityWeights })),
  )
  return useMemo(() => {
    const segCounts = new Map<string, number>()
    for (const s of segments) segCounts.set(s.projectId, (segCounts.get(s.projectId) ?? 0) + 1)
    const byProject = new Map<string, typeof issues>()
    for (const i of issues) {
      const arr = byProject.get(i.projectId)
      if (arr) arr.push(i)
      else byProject.set(i.projectId, [i])
    }
    const map = new Map<string, ProjectStats>()
    for (const p of projects) map.set(p.id, computeProjectStats(p, byProject.get(p.id) ?? [], segCounts.get(p.id) ?? 0, weights))
    return map
  }, [projects, issues, segments, weights])
}

export function useProjectStats(projectId: string | undefined) {
  const map = useProjectStatsMap()
  return projectId ? map.get(projectId) : undefined
}

export function useLookups() {
  const { clients, team } = useAppStore(useShallow((s) => ({ clients: s.clients, team: s.team })))
  return useMemo(() => {
    const clientById = new Map<string, Client>(clients.map((c) => [c.id, c]))
    const memberById = new Map<string, TeamMember>(team.map((m) => [m.id, m]))
    return { clientById, memberById, clients, team }
  }, [clients, team])
}

export function usePersonName() {
  const { memberById } = useLookups()
  return (id: string | undefined) => {
    if (!id) return 'Unassigned'
    if (id === CURRENT_USER.id) return CURRENT_USER.name
    if (id === 'system') return 'LingoPilot'
    return memberById.get(id)?.name ?? 'Unknown'
  }
}

export function useCan() {
  const role = useAppStore((s) => s.viewAs)
  return (p: Permission) => can(role, p)
}

export function useProject(id: string | undefined): Project | undefined {
  return useAppStore((s) => s.projects.find((p) => p.id === id))
}
