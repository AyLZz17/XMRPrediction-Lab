"""Daily data refresh and weekly model/metric retraining scheduler."""

import datetime as dt
import hashlib
import json
import os
import signal
import subprocess
import sys
import threading
from pathlib import Path

from src.config import (
    DATA_PROCESSED_DIR,
    DATA_RAW_DIR,
    MODELS_DIR,
    RESULTS_METRICS_DIR,
)
from src.pipeline_lock import pipeline_lock

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_FILE = Path(DATA_RAW_DIR) / "xmr_usd_diario.csv"
DATASET_FILE = Path(DATA_PROCESSED_DIR) / "dataset.npz"
METRICS_FILE = Path(RESULTS_METRICS_DIR) / "comparacion.csv"
STATUS_FILE = Path(DATA_RAW_DIR).parent / "maintenance_status.json"


def _schedule_time(variable, default):
    value = os.getenv(variable, default)
    parsed = dt.time.fromisoformat(value)
    if parsed.tzinfo is not None or parsed.second or parsed.microsecond:
        raise ValueError(f"{variable} must be an HH:MM UTC time.")
    return parsed


DAILY_UPDATE_UTC = _schedule_time("DAILY_UPDATE_UTC", "03:15")
WEEKLY_RETRAIN_UTC = _schedule_time("WEEKLY_RETRAIN_UTC", "04:00")
WEEKLY_RETRAIN_DAY_UTC = int(os.getenv("WEEKLY_RETRAIN_DAY_UTC", "6"))
if not 0 <= WEEKLY_RETRAIN_DAY_UTC <= 6:
    raise ValueError("WEEKLY_RETRAIN_DAY_UTC must be between 0 (Monday) and 6 (Sunday).")
RETRY_SECONDS = 15 * 60
MODEL_RUNS = (
    ("naive", "precio", (0,)),
    ("moving_average", "precio", (0,)),
    ("arima", "precio", (0,)),
    ("lstm", "retorno", (0, 1, 2)),
    ("gru", "retorno", (0, 1, 2)),
)


def _default_state():
    return {
        "daily": {"status": "waiting", "last_started_at": None, "last_success_at": None, "last_error": None},
        "weekly": {"status": "waiting", "last_started_at": None, "last_success_at": None, "last_error": None},
    }


def _read_state():
    try:
        state = json.loads(STATUS_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return _default_state()

    defaults = _default_state()
    for job, values in defaults.items():
        values.update(state.get(job, {}))
    return defaults


def _write_state(state):
    STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary_file = STATUS_FILE.with_suffix(".tmp")
    temporary_file.write_text(json.dumps(state, indent=2), encoding="utf-8")
    os.replace(temporary_file, STATUS_FILE)


def _file_timestamp(path):
    try:
        modified = path.stat().st_mtime
    except OSError:
        return None
    return dt.datetime.fromtimestamp(modified, tz=dt.timezone.utc).isoformat()


def maintenance_status():
    now = dt.datetime.now(dt.timezone.utc)
    return {
        "timezone": "UTC",
        "schedule": {
            "daily_update_utc": DAILY_UPDATE_UTC.isoformat(timespec="minutes"),
            "weekly_retrain_day_utc": WEEKLY_RETRAIN_DAY_UTC,
            "weekly_retrain_utc": WEEKLY_RETRAIN_UTC.isoformat(timespec="minutes"),
        },
        "next_runs": {
            "daily_update_at": _next_run(now, "daily").isoformat(),
            "weekly_retrain_at": _next_run(now, "weekly").isoformat(),
        },
        "jobs": _read_state(),
        "files": {
            "ohlcv_updated_at": _file_timestamp(DATA_FILE),
            "dataset_updated_at": _file_timestamp(DATASET_FILE),
            "benchmark_updated_at": _file_timestamp(METRICS_FILE),
        },
    }


def _set_job_state(job, status, *, started=None, error=None):
    state = _read_state()
    entry = state[job]
    entry["status"] = status
    if started is not None:
        entry["last_started_at"] = started
    if status == "success":
        entry["last_success_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
        entry["last_error"] = None
    elif status == "error":
        entry["last_error"] = str(error)[-2000:]
    _write_state(state)


def _run_daily_update():
    started = dt.datetime.now(dt.timezone.utc).isoformat()
    _set_job_state("daily", "running", started=started)
    try:
        from src.api import _refresh_market

        with pipeline_lock():
            market = _refresh_market()
        _set_job_state("daily", "success")
        print(f"Daily data refresh succeeded: {market['latest']['date']}", flush=True)
        return True
    except Exception as error:  # noqa: BLE001
        _set_job_state("daily", "error", error=error)
        print(f"Daily data refresh failed: {error}", file=sys.stderr, flush=True)
        return False


def _train_model(model, objective, seed, dataset_hash):
    command = [
        sys.executable,
        "-m",
        "src.train",
        "--modelo",
        model,
        "--objetivo",
        objective,
        "--semilla",
        str(seed),
    ]
    with pipeline_lock():
        if hashlib.sha256(DATA_FILE.read_bytes()).hexdigest() != dataset_hash:
            raise RuntimeError("Dataset changed during weekly model retraining; benchmark was not regenerated.")
        result = subprocess.run(
            command,
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            timeout=3600,
            check=False,
        )
        if result.returncode:
            message = (result.stderr or result.stdout).strip()
            raise RuntimeError(f"{model} ({objective}, seed {seed}) failed: {message[-2000:]}")

        if model not in {"naive", "moving_average"}:
            marker = Path(MODELS_DIR) / f"{model}_{objective}_seed{seed}.live.json"
            marker.parent.mkdir(parents=True, exist_ok=True)
            marker.write_text(json.dumps({"dataset_sha256": dataset_hash}), encoding="utf-8")


def _run_weekly_retraining():
    started = dt.datetime.now(dt.timezone.utc).isoformat()
    _set_job_state("weekly", "running", started=started)
    try:
        if not DATA_FILE.is_file() or not DATASET_FILE.is_file():
            raise RuntimeError("OHLCV data or prepared dataset is missing; daily refresh must succeed first.")
        dataset_hash = hashlib.sha256(DATA_FILE.read_bytes()).hexdigest()
        for model, objective, seeds in MODEL_RUNS:
            for seed in seeds:
                _train_model(model, objective, seed, dataset_hash)

        with pipeline_lock():
            if hashlib.sha256(DATA_FILE.read_bytes()).hexdigest() != dataset_hash:
                raise RuntimeError("Dataset changed before benchmark aggregation; old benchmark was kept.")
            result = subprocess.run(
                [sys.executable, "-m", "src.evaluation.compare"],
                cwd=ROOT_DIR,
                capture_output=True,
                text=True,
                timeout=300,
                check=False,
            )
            if result.returncode:
                message = (result.stderr or result.stdout).strip()
                raise RuntimeError(f"Benchmark aggregation failed: {message[-2000:]}")

        _set_job_state("weekly", "success")
        print("Weekly model retraining and benchmark aggregation succeeded.", flush=True)
        return True
    except Exception as error:  # noqa: BLE001
        _set_job_state("weekly", "error", error=error)
        print(f"Weekly model retraining failed: {error}", file=sys.stderr, flush=True)
        return False


def _last_success_date(state, job):
    value = state[job].get("last_success_at")
    return value[:10] if value else None


def _due_job(now, state):
    today = now.date().isoformat()
    current_time = now.time().replace(tzinfo=None)
    if current_time >= DAILY_UPDATE_UTC and _last_success_date(state, "daily") != today:
        return "daily"
    if (
        now.weekday() == WEEKLY_RETRAIN_DAY_UTC
        and current_time >= WEEKLY_RETRAIN_UTC
        and _last_success_date(state, "weekly") != today
    ):
        return "weekly"
    return None


def _next_run(now, job):
    if job == "daily":
        candidate = dt.datetime.combine(now.date(), DAILY_UPDATE_UTC, tzinfo=dt.timezone.utc)
        if candidate <= now:
            candidate += dt.timedelta(days=1)
        return candidate

    days_ahead = (WEEKLY_RETRAIN_DAY_UTC - now.weekday()) % 7
    candidate_date = now.date() + dt.timedelta(days=days_ahead)
    candidate = dt.datetime.combine(candidate_date, WEEKLY_RETRAIN_UTC, tzinfo=dt.timezone.utc)
    if candidate <= now:
        candidate += dt.timedelta(days=7)
    return candidate


def run_scheduler(stop_event):
    print(
        f"Scheduler active: daily refresh {DAILY_UPDATE_UTC.isoformat(timespec='minutes')} UTC; "
        f"weekly retraining weekday {WEEKLY_RETRAIN_DAY_UTC} at "
        f"{WEEKLY_RETRAIN_UTC.isoformat(timespec='minutes')} UTC.",
        flush=True,
    )
    while not stop_event.is_set():
        now = dt.datetime.now(dt.timezone.utc)
        state = _read_state()
        due = _due_job(now, state)
        if due:
            succeeded = _run_daily_update() if due == "daily" else _run_weekly_retraining()
            if not succeeded:
                stop_event.wait(RETRY_SECONDS)
            continue

        next_run = min(_next_run(now, "daily"), _next_run(now, "weekly"))
        stop_event.wait(max(1, (next_run - now).total_seconds()))


def main():
    stop_event = threading.Event()
    for signum in (signal.SIGINT, signal.SIGTERM):
        signal.signal(signum, lambda *_args: stop_event.set())
    run_scheduler(stop_event)


if __name__ == "__main__":
    main()
