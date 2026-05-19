import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useTeams } from '@/hooks/useTeams'
import { TASK_STATUSES, TASK_PRIORITIES } from '@/utils/constants'

export default function TaskFilters({ filters, onChange }) {
  const { data: teams = [] } = useTeams()
  const set = (key, val) => onChange({ ...filters, [key]: val })

  const hasFilters = filters.search || filters.status || filters.priority || filters.teamId

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={filters.search || ''}
          onChange={(e) => set('search', e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <Select
        value={filters.status || 'all'}
        onValueChange={(v) => set('status', v === 'all' ? '' : v)}
      >
        <SelectTrigger className="h-8 text-sm w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority || 'all'}
        onValueChange={(v) => set('priority', v === 'all' ? '' : v)}
      >
        <SelectTrigger className="h-8 text-sm w-32">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {teams.length > 0 && (
        <Select
          value={filters.teamId || 'all'}
          onValueChange={(v) => set('teamId', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="h-8 text-sm w-36">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t.teamId} value={t.teamId}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ search: '', status: '', priority: '', teamId: '' })}
          className="h-8 text-xs gap-1"
        >
          <X size={12} /> Clear
        </Button>
      )}
    </div>
  )
}
