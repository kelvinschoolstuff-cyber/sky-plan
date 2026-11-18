"""Local rainfall analysis from modelled historical rainfall. Indicative only: simplified definitions, not official KMD products."""
from datetime import date, timedelta
from statistics import median

SEASONS = {"long": (2, 15), "short": (9, 15)}  # search start (month, day) for the long and short rains


def find_onset(rain: dict, start: date, days=120, trigger_mm=20.0, trigger_days=3, dry_days=10, lookahead=30):
    """First day where >= trigger_mm falls within trigger_days AND no run of dry_days (<1 mm/day) follows in the next lookahead days."""
    for i in range(days):
        d = start + timedelta(days=i)
        wet = [rain.get(d + timedelta(days=k)) for k in range(trigger_days)]
        if any(v is None for v in wet) or sum(wet) < trigger_mm:
            continue
        run = 0
        ok = True
        for k in range(trigger_days, trigger_days + lookahead):
            v = rain.get(d + timedelta(days=k))
            if v is None:
                break
            run = run + 1 if v < 1.0 else 0
            if run >= dry_days:
                ok = False
                break
        if ok:
            return d
    return None


def longest_dry_run(values, threshold=1.0) -> int:
    best = run = 0
    for v in values:
        run = run + 1 if v < threshold else 0
        best = max(best, run)
    return best


def summarise_onsets(onsets: dict) -> dict:
    found = {y: d for y, d in onsets.items() if d}
    out = dict(years=[dict(year=y, onset=d) for y, d in sorted(onsets.items())], found=len(found), total=len(onsets))
    if found:
        doy = sorted(date(2001, d.month, d.day).timetuple().tm_yday for d in found.values())
        ref = lambda n: date(2001, 1, 1) + timedelta(days=int(n) - 1)
        out.update(median=ref(median(doy)).strftime("%d %b"), earliest=ref(doy[0]).strftime("%d %b"), latest=ref(doy[-1]).strftime("%d %b"))
    return out
