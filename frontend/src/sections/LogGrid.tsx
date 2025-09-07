import type { DayPlan } from '../lib/api'
import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

const ROWS = ['Off', 'Sleeper', 'Driving', 'OnDuty'] as const
type RowStatus = (typeof ROWS)[number]

const LABEL: Record<RowStatus, string> = { Off: 'OFF', Sleeper: 'SB', Driving: 'D', OnDuty: 'ON' }
const COLORS = {
  grid: '#E5E7EB',
  text: '#374151',
  line: '#2563EB',
  break: '#DC2626',
}

const ROW_H = 36
const GRID_TOP = 24
const HEIGHT = GRID_TOP + ROWS.length * ROW_H + 20

const statusIndex: Record<RowStatus, number> = { Off: 0, Sleeper: 1, Driving: 2, OnDuty: 3 }

function rowY(status: string) {
  const idx = (status as RowStatus) in statusIndex ? statusIndex[status as RowStatus] : 0
  return GRID_TOP + idx * ROW_H + ROW_H / 2
}
function minutesUTC(iso: string) {
  const d = new Date(iso)
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}
function clampDay(min: number) {
  return Math.max(0, Math.min(1440, Number.isFinite(min) ? min : 0))
}
function hhmm(mins: number) {
  const m = Math.round(mins)
  const h = Math.floor(m / 60)
  const mm = String(m % 60).padStart(2, '0')
  return `${h}:${mm}`
}

// summary (small + modern)
function Summary({ day }: { day: DayPlan }) {
  const totals = useMemo(() => {
    const t: Record<RowStatus, number> = { Off: 0, Sleeper: 0, Driving: 0, OnDuty: 0 }
    for (const s of day.segments) {
      const st = (ROWS.includes(s.status as RowStatus) ? s.status : 'Off') as RowStatus
      const m = clampDay(minutesUTC(s.end)) - clampDay(minutesUTC(s.start))
      if (m > 0) t[st] += m
    }
    return {
      driving: t.Driving,
      onduty: t.OnDuty,
      sleeper: t.Sleeper,
      off: t.Off,
      onInclDrive: t.OnDuty + t.Driving,
    }
  }, [day.segments])

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {Object.entries({
        'Driving (D)': totals.driving,
        'On Duty (ON)': totals.onduty,
        'Sleeper (SB)': totals.sleeper,
        'Off Duty (OFF)': totals.off,
        'On-duty incl. Driving': totals.onInclDrive,
      }).map(([label, val]) => (
        <div
          key={label}
          className="rounded-lg bg-slate-50 px-3 py-2 text-center shadow-sm"
        >
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-lg font-semibold text-slate-800">{hhmm(val)}</div>
        </div>
      ))}
    </div>
  )
}

function GridSVG({ day }: { day: DayPlan }) {
  return (
    <svg
      viewBox={`0 0 1440 ${HEIGHT}`} // 1440 minutes scaled to fit 100%
      className="w-full h-auto"
      role="img"
    >
      {/* hour ticks */}
      {Array.from({ length: 25 }).map((_, i) => {
        const x = i * 60
        const label = i === 0 ? 'M' : i === 12 ? 'N' : String(i % 12)
        return (
          <g key={i}>
            <line x1={x} y1={GRID_TOP - 6} x2={x} y2={HEIGHT} stroke={COLORS.grid} strokeWidth={0.5} />
            <text
              x={x}
              y={GRID_TOP - 10}
              fontSize={10}
              textAnchor="middle"
              fill={COLORS.text}
            >
              {label}
            </text>
          </g>
        )
      })}

      {/* row lines + labels */}
      {ROWS.map((r, i) => {
        const yMid = rowY(r)
        const yLine = GRID_TOP + i * ROW_H + ROW_H
        return (
          <g key={r}>
            <line x1={0} y1={yLine} x2={1440} y2={yLine} stroke={COLORS.grid} strokeWidth={0.5} />
            <text
              x={4}
              y={yMid + 3}
              fontSize={10}
              fontWeight={500}
              fill={COLORS.text}
            >
              {LABEL[r]}
            </text>
          </g>
        )
      })}

      {/* segments */}
      {day.segments.map((s, idx) => {
        let a = clampDay(minutesUTC(s.start))
        let b = clampDay(minutesUTC(s.end))
        if (b < a) [a, b] = [b, a]
        const dur = b - a
        const y = rowY(s.status)
        const isBreak = s.status === 'OnDuty' && Math.abs(dur - 30) <= 1
        const stroke = isBreak ? COLORS.break : COLORS.line

        return (
          <motion.g
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
          >
            <line
              x1={a}
              y1={y}
              x2={b}
              y2={y}
              stroke={stroke}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <line x1={a} y1={y - 6} x2={a} y2={y + 6} stroke={COLORS.text} strokeWidth={1} />
            <line x1={b} y1={y - 6} x2={b} y2={y + 6} stroke={COLORS.text} strokeWidth={1} />
          </motion.g>
        )
      })}
    </svg>
  )
}

export default memo(function LogGrid({ day }: { day: DayPlan }) {
  return (
    <div className="w-full space-y-4">
      <Summary day={day} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
      >
        <GridSVG day={day} />
      </motion.div>
    </div>
  )
})
