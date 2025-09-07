export const API = import.meta.env.VITE_API_URL

export type PlanRequest = {
    current_location: string, 
    pickup_location: string,
    dropoff_location: string,
    current_cycle_used_hours: number
}

export type Segment = {
    status: "Off"|"Sleeper"|"Driving"|"OnDuty",
    start: string,
    end: string,
    miles?: number,
    label?: number
}

export type DayPlan = {
    date: string,
    segments: Segment[],
    totals: Record<string, number>
}

export type PlanResponse = {
    route_geojson: any,
    stops: any[],
    day_plans: DayPlan[],
    summary: Record<string, any>
}

export async function planTrip(payload: PlanRequest): Promise<PlanResponse> {
    const res = await fetch(`${API}/api/plan`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if(!res.ok){
        const text = await res.text().catch(()=> '')
        throw new Error(`Planning failed (${res.status}): ${text}`)
    }
    return res.json()
}