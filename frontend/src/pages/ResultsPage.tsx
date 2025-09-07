import { Link, useLocation } from 'react-router-dom'
import MapView from '../sections/MapView'
import LogGrid from '../sections/LogGrid'
import type { DayPlan } from '../lib/api'

type ResultState = {
  route_geojson: any
  day_plans: DayPlan[]
  summary?: Record<string, unknown>
}

export default function ResultsPage() {
  const { state } = useLocation() as { state?: ResultState }

  if (!state || !state.route_geojson || !state.day_plans?.length) {
    return (
      <div className="p-6">
        <p>
          No data found.{' '}
          <Link className="underline" to="/">
            Plan a trip
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-md shadow-md p-8">
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plan Results</h1>
        <Link to="/" className="underline">
          New Plan
        </Link>
      </div>

      <MapView geo={state.route_geojson} />

      <div>
        <h2 className="text-xl font-semibold mb-3">Daily Log Sheets</h2>
        <div className="space-y-8">
          {state.day_plans.map((d, i) => (
            <div key={i} className="border rounded p-4">
              <h3 className="font-medium mb-2">
                Day {i + 1} — {d.date}
              </h3>
              <LogGrid day={d} />
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  )
}
