from datetime import datetime, timedelta
from dateutil.tz import UTC

# ---- constants (make sure these exist) ----
MAX_DRIVE_HRS_PER_DAY = 11
DRIVING_WINDOW_HRS = 14
REQUIRED_BREAK_AFTER_DRIVE_HRS = 8
REQUIRED_BREAK_MIN = 30
DAILY_OFF_HRS = 10
CYCLE_MAX_HRS = 70
FUEL_EVERY_MILES = 1000
PICKUP_ON_DUTY_HRS = 1
DROPOFF_ON_DUTY_HRS = 1


class Day:
    def __init__(self, start_dt: datetime):
        self.date = start_dt.date()
        self.cursor = start_dt
        self.segments = []  # list of dicts {status,start,end,miles,label}
        self.drive = 0.0
        self.on = 0.0
        self.window = 0.0
        self.took_break = False

    def add(self, status, minutes, miles=0.0, label=''):
        end = self.cursor + timedelta(minutes=minutes)
        self.segments.append({
            'status': status, 'start': self.cursor, 'end': end, 'miles': miles, 'label': label
        })

        # Update per-status totals
        if status == 'Driving':
            self.drive += minutes / 60.0
        elif status == 'OnDuty':
            self.on += minutes / 60.0
        # Off/Sleeper do not add to 'on', but they still consume the daily window below

        # IMPORTANT: Always advance the driving window and cursor
        self.window += minutes / 60.0
        self.cursor = end

    def ensure_break(self):
        if self.drive >= REQUIRED_BREAK_AFTER_DRIVE_HRS and not self.took_break:
            self.add('OnDuty', REQUIRED_BREAK_MIN, 0.0, '30m Break')
            self.took_break = True


def plan_schedule(start_dt: datetime, legs, cycle_used_hours: float):
    """
    legs: list of dicts [{ 'miles': float, 'hours': float, 'label': 'Current->Pickup'/'Pickup->Drop' }]
    Returns: list of Day objects, list of stops
    """
    tz = UTC
    dt = start_dt.astimezone(tz)
    cycle_rem = max(0.0, CYCLE_MAX_HRS - cycle_used_hours)
    days = []
    stops = []

    def end_day():
        nonlocal dt, day, days
        # 10h off
        day.add('Off', int(DAILY_OFF_HRS * 60), 0.0, 'Daily 10h Off')
        days.append(day)
        dt = day.cursor  # advance pointer to next day start

    # Start fresh day (assume driver already had 10h off before start)
    day = Day(dt)
    day.took_break = False

    # Pickup on-duty hour before driving
    day.add('OnDuty', int(PICKUP_ON_DUTY_HRS * 60), 0.0, 'Pickup')
    cycle_rem -= PICKUP_ON_DUTY_HRS

    miles_since_fuel = 0.0

    for leg in legs:
        remaining = float(leg['hours'])
        miles = float(leg['miles'])
        label = leg.get('label', 'Drive') or 'Drive'

        # Drive this leg in chunks within 11h/14h/day and cycle remaining
        while remaining > 1e-6:
            # If day limits hit, close day and start a new one
            if day.drive >= MAX_DRIVE_HRS_PER_DAY or day.window >= DRIVING_WINDOW_HRS:
                end_day()
                day = Day(dt)
                day.took_break = False

            # Insert the required 30-min break if we crossed 8h of driving
            day.ensure_break()

            # Compute how much we can drive now
            can_drive = min(
                remaining,
                MAX_DRIVE_HRS_PER_DAY - day.drive,
                DRIVING_WINDOW_HRS - day.window,
                cycle_rem
            )

            if can_drive <= 0:
                # No drive available in this day/cycle: force a new day
                end_day()
                day = Day(dt)
                day.took_break = False
                continue

            minutes = int(round(can_drive * 60))
            # Apportion miles for this slice
            # Guard divide-by-zero if leg['hours'] is extremely tiny
            dist = 0.0 if leg['hours'] == 0 else miles * (can_drive / leg['hours'])

            day.add('Driving', minutes, dist, label)
            remaining -= can_drive
            cycle_rem -= can_drive
            miles_since_fuel += dist

            # Fuel stop if we crossed 1000 miles since last fuel
            if miles_since_fuel >= FUEL_EVERY_MILES:
                day.add('OnDuty', 30, 0.0, 'Fuel')
                miles_since_fuel = 0.0

    # Drop-off on-duty hour
    day.add('OnDuty', int(DROPOFF_ON_DUTY_HRS * 60), 0.0, 'Drop-Off')
    days.append(day)

    return days, stops
