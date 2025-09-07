from datetime import datetime
from typing import Tuple

from dateutil.tz import UTC
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PlanRequestSerializer, PlanResponseSerializer
from .osrm import route_drive
from .hos import plan_schedule


def parse_point(s: str) -> Tuple[float, float]:
    """
    Accepts "lat,lng" and returns (lng, lat) for OSRM.
    """
    try:
        lat_str, lng_str = s.split(",")
        lat = float(lat_str.strip())
        lng = float(lng_str.strip())
    except Exception:
        raise ValueError('Invalid coordinate format. Use "lat,lng" (e.g. "31.5204,74.3587").')
    return (lng, lat)


class PlanTripView(APIView):
    def post(self, request):
        ser = PlanRequestSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        d = ser.validated_data

        # Parse inputs
        try:
            current = parse_point(d["current_location"])
            pickup = parse_point(d["pickup_location"])
            drop = parse_point(d["dropoff_location"])
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Route (current -> pickup -> drop)
        try:
            geo, legs = route_drive([current, pickup, drop])
        except Exception as e:
            return Response({"detail": f"Routing failed: {e}"}, status=status.HTTP_502_BAD_GATEWAY)

        # HOS planning
        start_dt = datetime.now(tz=UTC)  # assume 10h prior off already taken for day-one scope
        try:
            days, stops = plan_schedule(start_dt, legs, d["current_cycle_used_hours"])
        except Exception as e:
            return Response({"detail": f"Planning failed: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Shape response
        resp = {
            "route_geojson": geo,
            "stops": stops or [],
            "day_plans": [
                {
                    "date": day.date,
                    "segments": [
                        {
                            "status": seg["status"],
                            "start": seg["start"],
                            "end": seg["end"],
                            "miles": seg.get("miles", 0.0),
                            "label": seg.get("label", ""),
                        }
                        for seg in day.segments
                    ],
                    "totals": {
                        "driving": day.drive,
                        "on_duty": day.on,
                        "window": day.window,
                    },
                }
                for day in days
            ],
            "summary": {
                "total_miles": sum(l["miles"] for l in legs),
                "total_drive_hours": sum(l["hours"] for l in legs),
            },
        }

        # Validate/serialize output (optional but nice)
        out = PlanResponseSerializer(resp).data
        return Response(out, status=status.HTTP_200_OK)
