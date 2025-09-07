import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { planTrip } from '../lib/api'
import { useState } from 'react'

// Schema
const Schema = z.object({
  current_location: z.string().min(3),
  pickup_location: z.string().min(3),
  dropoff_location: z.string().min(3),
  current_cycle_used_hours: z.number().min(0).max(70),
})
type FormValues = z.infer<typeof Schema>

// sample suggestions (global landmarks)
const LOCATIONS = {
    Northeast: [
      { name: 'Statue of Liberty (NYC)', coords: '40.6892,-74.0445' },
      { name: 'JFK Airport (NYC)', coords: '40.6413,-73.7781' },
      { name: 'Boston Logan Airport', coords: '42.3656,-71.0096' },
    ],
    Midwest: [
      { name: 'Chicago O’Hare Airport', coords: '41.9742,-87.9073' },
      { name: 'Detroit Downtown', coords: '42.3314,-83.0458' },
      { name: 'Minneapolis Downtown', coords: '44.9778,-93.2650' },
    ],
    South: [
      { name: 'Atlanta Hartsfield Airport', coords: '33.6407,-84.4277' },
      { name: 'Dallas Downtown', coords: '32.7767,-96.7970' },
      { name: 'Houston Downtown', coords: '29.7604,-95.3698' },
    ],
    West: [
      { name: 'Golden Gate Bridge (SF)', coords: '37.8199,-122.4783' },
      { name: 'Los Angeles Downtown', coords: '34.0522,-118.2437' },
      { name: 'Las Vegas Strip', coords: '36.1147,-115.1728' },
    ],
  }

export default function PlanPage() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)

  // track selected suggestion for each field
  const [selected, setSelected] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      current_location: '',
      pickup_location: '',
      dropoff_location: '',
      current_cycle_used_hours: 5,
    },
  })

  return (
    <div className="bg-white/70 backdrop-blur-md shadow-md p-8">
    <div className="max-w-2xl mx-auto p-6">
      <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">🚚 Plan Your Truck Trip</h1>

        <form
          onSubmit={handleSubmit(async (v) => {
            setLoading(true)
            const data = await planTrip(v)
            nav('/results', { state: data })
            setLoading(false)
          })}
          className="space-y-6"
        >
          {(['current_location', 'pickup_location', 'dropoff_location'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-600 mb-2 capitalize">
                {field.replace('_', ' ')}
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition"
                {...register(field)}
                placeholder="lat,lng"
              />
              {errors[field] && (
                <p className="mt-1 text-sm text-red-600">{errors[field]?.message}</p>
              )}

              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(LOCATIONS).map(([region, spots]) =>
                  spots.map((spot) => {
                    const isActive = selected[field] === spot.coords || watch(field) === spot.coords
                    return (
                      <button
                        type="button"
                        key={`${field}-${spot.name}`}
                        onClick={() => {
                          setValue(field, spot.coords, { shouldValidate: true })
                          setSelected((prev) => ({ ...prev, [field]: spot.coords }))
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow'
                            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                      >
                        {region} • {spot.name}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Current Cycle Used (hrs)
            </label>
            <input
              type="number"
              step="0.5"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition"
              {...register('current_cycle_used_hours', { valueAsNumber: true })}
            />
            {errors.current_cycle_used_hours && (
              <p className="mt-1 text-sm text-red-600">{errors.current_cycle_used_hours.message}</p>
            )}
          </div>

          <button
            disabled={loading || isSubmitting}
            className="w-full flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loading && (
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            )}
            {loading ? 'Planning…' : 'Plan Trip'}
          </button>
        </form>

        <p className="text-xs text-slate-500">
          You can type your own <code>lat,lng</code> or click a chip to auto-fill.
        </p>
      </div>
    </div>
    </div>
  )
}
