import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, subDays, startOfDay } from 'date-fns'

function buildDailyData(tasks, days = 14) {
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i))
    const nextDay = startOfDay(subDays(new Date(), i - 1))
    const created = tasks.filter((t) => {
      const d = new Date(t.createdAt)
      return d >= day && d < nextDay
    }).length
    result.push({ date: format(day, 'MMM d'), created })
  }
  return result
}

export default function TasksCreatedChart({ tasks = [] }) {
  const data = buildDailyData(tasks)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Tasks Created (Last 14 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(263.4, 70%, 50.4%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(263.4, 70%, 50.4%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="created"
              stroke="hsl(263.4, 70%, 50.4%)"
              strokeWidth={2}
              fill="url(#colorCreated)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
