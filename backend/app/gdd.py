from datetime import date, timedelta
from math import ceil

STAGES = [(0, "Emergence"), (0.1, "Vegetative growth"), (0.4, "Flowering"),
          (0.65, "Fruit / grain filling"), (0.9, "Maturity")]


def daily_gdd(tmax: float, tmin: float, base: float, upper: float) -> float:
    """Growing degree days for one day: tmax capped at `upper`, tmin floored at `base`."""
    tmax, tmin = min(tmax, upper), max(tmin, base)
    return max(0.0, (tmax + tmin) / 2 - base)


def accumulate(days, crop):
    """days: iterable of (date, tmax, tmin) -> list of (date, cumulative GDD)."""
    total, out = 0.0, []
    for d, hi, lo in days:
        total += daily_gdd(hi, lo, crop["base"], crop["upper"])
        out.append((d, round(total, 1)))
    return out


def stage_for(acc: float, target: float) -> str:
    frac, name = acc / target, STAGES[0][1]
    for threshold, label in STAGES:
        if frac >= threshold:
            name = label
    return name


def project(remaining: float, forecast, rate: float, start: date):
    """Date when `remaining` GDD is used up: forecast days first, then a steady `rate`/day."""
    d = start
    for g in forecast:
        d += timedelta(days=1)
        remaining -= g
        if remaining <= 0:
            return d
    if rate <= 0.1:
        return None
    return d + timedelta(days=ceil(remaining / rate))


def harvest_window(acc, target, forecast, recent_rate, today):
    """(earliest, latest) harvest dates; rate varies +/-25% to show uncertainty."""
    if target - acc <= 0:
        return today, today
    remaining = target - acc
    return (project(remaining, forecast, recent_rate * 1.25, today),
            project(remaining, forecast, recent_rate * 0.75, today))
