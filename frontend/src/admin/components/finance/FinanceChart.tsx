import type { MonthlySeriesPoint } from '@/types/domain'
import { formatMoney } from '@/admin/lib/financeLabels'

const WIDTH = 640
const HEIGHT = 220
const PAD_LEFT = 44
const PAD_BOTTOM = 28
const PAD_TOP = 16
const PAD_RIGHT = 8

/** Compact axis label — 125000 -> "125k" — keeps gridline text from crowding a 375px-wide card. */
function compact(n: number): string {
  if (n === 0) return '0'
  if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)}k`
  return String(Math.round(n))
}

/** Income/expense by month — grouped bars, income in the app's success green, expense in its
 * warning tone (per MASTER_TZ: "зелёный для дохода, красный/оранжевый для расхода"), never the
 * library-default bright colors. Built as plain inline SVG (no charting dependency) so it always
 * matches the site's dark/gold theme exactly. */
export function FinanceChart({ points }: { points: MonthlySeriesPoint[] }) {
  const maxValue = Math.max(1, ...points.map((p) => Math.max(p.income, p.expense)))
  // Round the axis ceiling up to a "nice" step so gridline labels read as round numbers.
  const niceMax = (() => {
    const magnitude = 10 ** Math.floor(Math.log10(maxValue))
    const steps = [1, 2, 2.5, 5, 10]
    for (const s of steps) {
      if (magnitude * s >= maxValue) return magnitude * s
    }
    return magnitude * 10
  })()

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  const groupWidth = plotWidth / Math.max(1, points.length)
  const barWidth = Math.min(22, groupWidth * 0.32)
  const gridTicks = [0, 0.25, 0.5, 0.75, 1]

  function y(value: number): number {
    return PAD_TOP + plotHeight - (value / niceMax) * plotHeight
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="min-w-[480px]" role="img" aria-label="Доходы и расходы по месяцам">
        {/* Gridlines + y-axis labels */}
        {gridTicks.map((t) => {
          const value = niceMax * t
          const yPos = y(value)
          return (
            <g key={t}>
              <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={yPos} y2={yPos} stroke="currentColor" className="text-text/8" strokeWidth={1} />
              <text x={PAD_LEFT - 8} y={yPos} textAnchor="end" dominantBaseline="middle" className="fill-slate text-[9px]">
                {compact(value)}
              </text>
            </g>
          )
        })}

        {points.map((p, i) => {
          const groupX = PAD_LEFT + i * groupWidth
          const center = groupX + groupWidth / 2
          const incomeX = center - barWidth - 2
          const expenseX = center + 2
          const incomeY = y(p.income)
          const expenseY = y(p.expense)
          const isLast = i === points.length - 1
          return (
            <g key={`${p.year}-${p.month}`}>
              <rect x={incomeX} y={incomeY} width={barWidth} height={Math.max(0, y(0) - incomeY)} rx={4} className="fill-success">
                <title>{`Доход, ${p.monthLabel}: ${formatMoney(p.income)}`}</title>
              </rect>
              <rect x={expenseX} y={expenseY} width={barWidth} height={Math.max(0, y(0) - expenseY)} rx={4} className="fill-warning">
                <title>{`Расход, ${p.monthLabel}: ${formatMoney(p.expense)}`}</title>
              </rect>
              {isLast && p.income > 0 && (
                <text x={incomeX + barWidth / 2} y={incomeY - 5} textAnchor="middle" className="fill-text text-[9px] font-medium">
                  {compact(p.income)}
                </text>
              )}
              {isLast && p.expense > 0 && (
                <text x={expenseX + barWidth / 2} y={expenseY - 5} textAnchor="middle" className="fill-text text-[9px] font-medium">
                  {compact(p.expense)}
                </text>
              )}
              <text x={center} y={HEIGHT - PAD_BOTTOM + 16} textAnchor="middle" className="fill-slate text-[9px]">
                {p.monthLabel}
              </text>
            </g>
          )
        })}

        <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y(0)} y2={y(0)} stroke="currentColor" className="text-text/15" strokeWidth={1} />
      </svg>

      <div className="mt-2 flex items-center justify-center gap-5 text-xs text-slate">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-success" /> Доход
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Расход
        </span>
      </div>
    </div>
  )
}
