import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import type { Issue } from '@/types'
import { computeProjectStats } from '@/utils/quality'
import { useCan } from '@/hooks/useData'

export function projectScoreNow(projectId: string) {
  const s = useAppStore.getState()
  const p = s.projects.find((x) => x.id === projectId)
  if (!p) return null
  return computeProjectStats(p, s.issues, s.segments.filter((x) => x.projectId === projectId).length, s.settings.severityWeights)
}

export function useIssueActions() {
  const can = useCan()
  const store = useAppStore.getState

  const deny = (what: string) => {
    toast.error('Not allowed for your role', { description: `Your current role cannot ${what}. Switch role from the account menu.` })
    return false
  }

  const scoreNote = (projectId: string, before: number | undefined) => {
    const after = projectScoreNow(projectId)
    if (!after || before === undefined) return undefined
    const diff = after.score - before
    return `Project quality ${before.toFixed(1)} → ${after.score.toFixed(1)}${diff > 0 ? ` (+${diff.toFixed(1)})` : ''} · ${after.open} open issues`
  }

  return {
    accept(issue: Issue) {
      if (!can('issue.resolve')) return deny('accept suggestions')
      if (!issue.suggestion) return toast.error('No suggestion available', { description: 'Edit the translation manually instead.' })
      const before = projectScoreNow(issue.projectId)?.score
      store().acceptSuggestion(issue.id)
      toast.success('Issue successfully resolved.', { description: scoreNote(issue.projectId, before) })
      return true
    },
    resolve(issue: Issue, note?: string) {
      if (!can('issue.resolve')) return deny('resolve issues')
      const before = projectScoreNow(issue.projectId)?.score
      store().resolveIssue(issue.id, note)
      toast.success('Issue successfully resolved.', { description: scoreNote(issue.projectId, before), action: { label: 'Undo', onClick: () => store().reopenIssue(issue.id) } })
      return true
    },
    editAndResolve(issue: Issue, target: string) {
      if (!can('segment.edit')) return deny('edit translations')
      const before = projectScoreNow(issue.projectId)?.score
      store().editIssueTarget(issue.id, target)
      toast.success('Translation updated and issue resolved.', { description: scoreNote(issue.projectId, before) })
      return true
    },
    ignore(issue: Issue, reason: string) {
      if (!can('issue.ignore')) return deny('ignore issues')
      const before = projectScoreNow(issue.projectId)?.score
      store().ignoreIssue(issue.id, reason)
      toast('Issue ignored.', { description: scoreNote(issue.projectId, before), action: { label: 'Undo', onClick: () => store().reopenIssue(issue.id) } })
      return true
    },
    reopen(issue: Issue) {
      if (!can('issue.resolve')) return deny('reopen issues')
      store().reopenIssue(issue.id)
      toast('Issue reopened.')
      return true
    },
    assign(issue: Issue, memberId: string) {
      if (!can('issue.assign')) return deny('assign issues')
      store().assignIssue(issue.id, memberId)
      const m = store().team.find((x) => x.id === memberId)
      toast.success('Reviewer assigned.', { description: `${issue.id} assigned to ${m?.name}.` })
      return true
    },
    markInReview(issue: Issue) {
      if (!can('issue.resolve')) return deny('change issue status')
      store().setIssueInReview(issue.id)
      toast('Moved to In review.')
      return true
    },
  }
}
