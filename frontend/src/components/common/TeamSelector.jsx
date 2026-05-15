import { useQuery } from '@tanstack/react-query'
import { teamsApi } from '@/api/teams'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select.jsx'
import { Skeleton } from '../ui/skeleton.jsx'

export default function TeamSelector({ value, onChange, className, placeholder = 'Select team' }) {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll().then((r) => r.data),
  })

  if (isLoading) return <Skeleton className="h-10 w-full" />

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => (
          <SelectItem key={team.teamId} value={team.teamId}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
