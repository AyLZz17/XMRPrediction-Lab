import datetime as dt

from src import scheduler


def test_daily_refresh_precedes_weekly_retraining_when_both_are_due(monkeypatch):
    now = dt.datetime(2026, 11, 15, 4, 30, tzinfo=dt.timezone.utc)
    monkeypatch.setattr(scheduler, "DAILY_UPDATE_UTC", dt.time(3, 15))
    monkeypatch.setattr(scheduler, "WEEKLY_RETRAIN_DAY_UTC", 6)
    monkeypatch.setattr(scheduler, "WEEKLY_RETRAIN_UTC", dt.time(4, 0))
    state = scheduler._default_state()

    assert scheduler._due_job(now, state) == "daily"

    state["daily"]["last_success_at"] = now.isoformat()
    assert scheduler._due_job(now, state) == "weekly"


def test_weekly_suite_covers_all_model_seeds():
    scheduled_runs = {
        (model, objective, seed)
        for model, objective, seeds in scheduler.MODEL_RUNS
        for seed in seeds
    }

    assert len(scheduled_runs) == 9
    assert ("lstm", "retorno", 2) in scheduled_runs
    assert ("gru", "retorno", 2) in scheduled_runs