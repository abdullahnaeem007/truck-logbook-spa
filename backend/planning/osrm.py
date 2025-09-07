import requests
from typing import List, Tuple, Dict, Any

OSRM_BASE = "https://router.project-osrm.org"  # public demo server

def route_drive(coords: List[Tuple[float, float]]) -> Tuple[Dict[str, Any], List[Dict[str, float]]]:
    """
    Compute a driving route and per-leg summaries via OSRM.

    Args:
        coords: list of (lng, lat) tuples, e.g. [ (74.3587, 31.5204), (67.0011, 24.8607) ]

    Returns:
        tuple:
          - geojson Feature for the full route polyline
          - legs: list of { miles: float, hours: float, label: str }
    """
    if not coords or len(coords) < 2:
        raise ValueError("coords must contain at least 2 (lng, lat) points")

    locs = ";".join(f"{lng},{lat}" for lng, lat in coords)
    url = (
        f"{OSRM_BASE}/route/v1/driving/{locs}"
        "?overview=full&annotations=distance,duration&geometries=geojson"
    )

    r = requests.get(url, timeout=20)
    r.raise_for_status()
    data = r.json()

    routes = data.get("routes", [])
    if not routes:
        raise RuntimeError("OSRM returned no routes")

    route = routes[0]
    geometry = route.get("geometry")
    if not geometry:
        raise RuntimeError("OSRM response missing geometry")

    geojson = {
        "type": "Feature",
        "properties": {},
        "geometry": geometry,
    }

    legs_out: List[Dict[str, float]] = []
    for idx, leg in enumerate(route.get("legs", []), start=1):
        ann = leg.get("annotation") or {}
        distances = ann.get("distance") or []   # meters per step
        durations = ann.get("duration") or []   # seconds per step

        total_meters = float(sum(distances))
        total_seconds = float(sum(durations))

        miles = total_meters / 1609.344
        hours = total_seconds / 3600.0

        legs_out.append({
            "miles": miles,
            "hours": hours,
            "label": f"Leg {idx}",
        })

    if not legs_out:
        # Fallback if OSRM didn't include per-leg annotations
        distance_m = float(route.get("distance", 0.0))
        duration_s = float(route.get("duration", 0.0))
        legs_out = [{
            "miles": distance_m / 1609.344,
            "hours": duration_s / 3600.0,
            "label": "Leg 1",
        }]

    return geojson, legs_out
