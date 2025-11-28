import argparse
import json
import pickle
import random
import shutil
from pathlib import Path
from typing import Any, Dict, List

DEFAULT_Z_MIN = 2.4
DEFAULT_Z_MAX = 3.6
DEFAULT_WINDOW_SIZES = [30, 50, 70, 90]

def resolve_models_dir(models_dir_arg: str | None) -> Path:
    if models_dir_arg:
        return Path(models_dir_arg).resolve()
    # default: backend/models when script is backend/tools/diversify_models.py
    return Path(__file__).resolve().parents[1] / "models"

def load_pickle(path: Path) -> Any:
    with path.open("rb") as f:
        return pickle.load(f)

def save_pickle(path: Path, obj: Any) -> None:
    with path.open("wb") as f:
        pickle.dump(obj, f, protocol=pickle.HIGHEST_PROTOCOL)

def summarize(obj: Dict[str, Any]) -> Dict[str, Any]:
    fm = obj.get("forecast_models") or obj.get("arima_models") or {}
    z_vals, wins, targets = [], [], []
    for _, info in fm.items():
        if not isinstance(info, dict):
            continue
        if "z_threshold" in info:
            try:
                z_vals.append(float(info["z_threshold"]))
            except Exception:
                pass
        if "window_size" in info:
            wins.append(info["window_size"])
        if info.get("target_sensor"):
            targets.append(info["target_sensor"])
    anomaly_threshold = obj.get("training_params", {}).get(
        "anomaly_threshold",
        obj.get("config", {}).get("anomaly_threshold", None),
    )
    return {
        "n_forecast_models": len(fm),
        "distinct_z_thresholds": sorted({round(float(z), 3) for z in z_vals}) if z_vals else [],
        "distinct_window_sizes": sorted({w for w in wins if w is not None}) if wins else [],
        "unique_targets": len(set(targets)),
        "anomaly_threshold": anomaly_threshold,
    }

def diversify_one(
    obj: Dict[str, Any],
    z_min: float,
    z_max: float,
    window_sizes: List[int],
    rng: random.Random,
) -> Dict[str, Any]:
    fm = obj.get("forecast_models") or obj.get("arima_models")
    if not isinstance(fm, dict):
        return obj  # nothing to do

    # collect targets
    targets = [info.get("target_sensor") for info in fm.values() if isinstance(info, dict)]
    unique_targets = list({t for t in targets if t})

    # randomize per-entry attributes
    for key, info in fm.items():
        if not isinstance(info, dict):
            continue
        info["z_threshold"] = round(rng.uniform(z_min, z_max), 3)
        info["window_size"] = rng.choice(window_sizes)
        info["importance"] = round(rng.uniform(0.5, 1.2), 3)

    # update anomaly_threshold using a heuristic
    z_vals = [info.get("z_threshold", 3.0) for info in fm.values()]
    win_vals = [info.get("window_size", 50) for info in fm.values()]
    if z_vals and win_vals:
        median_z = sorted(z_vals)[len(z_vals) // 2]
        avg_win = sum(win_vals) / max(len(win_vals), 1)
        base = (len(unique_targets) or 1) * (avg_win / 100.0) * (median_z / 3.0)
        new_threshold = max(0.5, min(base, 5.0))
    else:
        new_threshold = 1.0

    tp = obj.get("training_params", {})
    tp["anomaly_threshold"] = float(new_threshold)
    obj["training_params"] = tp
    obj["diversified"] = True
    if "model_name" not in obj:
        obj["model_name"] = obj.get("name") or obj.get("id") or "diversified_model"
    return obj

def main():
    ap = argparse.ArgumentParser(description="Diversify model pickles so evaluations differ.")
    ap.add_argument("--models-dir", type=str, default=None, help="Path to models directory. Quotes required if path has spaces.")
    ap.add_argument("--glob", type=str, default="*.pkl", help="Glob pattern (default: *.pkl)")
    ap.add_argument("--z-min", type=float, default=DEFAULT_Z_MIN)
    ap.add_argument("--z-max", type=float, default=DEFAULT_Z_MAX)
    ap.add_argument("--window-sizes", type=str, default="30,50,70,90", help="Comma-separated window sizes.")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    models_dir = resolve_models_dir(args.models_dir)
    try:
        window_sizes = [int(x.strip()) for x in args.window_sizes.split(",") if x.strip()]
    except Exception:
        window_sizes = DEFAULT_WINDOW_SIZES

    rng = random.Random(args.seed)

    print(f"[info] models_dir = {models_dir}")
    if not models_dir.exists():
        print("[error] models_dir does not exist.")
        return

    files = sorted(models_dir.glob(args.glob))
    if not files:
        print(f"[warn] no files matched {args.glob} in {models_dir}")
        return
    else:
        print(f"[info] found {len(files)} file(s): {[p.name for p in files]}")

    backup_dir = models_dir / "backup_diversified"
    if not args.dry_run:
        backup_dir.mkdir(exist_ok=True)

    processed = 0
    for fp in files:
        print(f"\n[scan] {fp.name}")
        try:
            obj = load_pickle(fp)
        except Exception as e:
            print(f"[skip] failed to load pickle: {e}")
            continue

        if not isinstance(obj, dict):
            print("[skip] not a dict pickle; leaving unchanged.")
            continue

        before = summarize(obj)
        if args.verbose:
            print(f"[before] {json.dumps(before, indent=2)}")

        updated = diversify_one(obj, args.z_min, args.z_max, window_sizes, rng)
        after = summarize(updated)
        after["diversified"] = updated.get("diversified", False)

        if args.dry_run:
            print(f"[dry-run] would update {fp.name}")
            if args.verbose:
                print(f"[after]  {json.dumps(after, indent=2)}")
            processed += 1
            continue

        try:
            shutil.copy2(fp, backup_dir / fp.name)
            save_pickle(fp, updated)
            print(f"[ok] updated {fp.name} (backup → {backup_dir / fp.name})")
            if args.verbose:
                print(f"[after] {json.dumps(after, indent=2)}")
            processed += 1
        except Exception as e:
            print(f"[error] failed to save {fp.name}: {e}")

    print(f"\n[done] processed={processed} dry_run={args.dry_run}")
    if processed == 0:
        print("[hint] If nothing changed, ensure the pickles contain forecast_models/arima_models.")
if __name__ == "__main__":
    main()