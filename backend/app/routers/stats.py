import logging
import math
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np
import scipy.stats as stats
from scipy.signal import savgol_filter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stats", tags=["Scientific Statistics & Analysis Engine"])

# ----------------- Models -----------------

class TTestRequest(BaseModel):
    group_a: List[float]
    group_b: List[float]
    paired: bool = False
    equal_var: bool = False  # Welch's unequal variance by default
    alpha: float = 0.05

class AnovaRequest(BaseModel):
    groups: Dict[str, List[float]]
    alpha: float = 0.05

class SmoothingRequest(BaseModel):
    x: List[float]
    y: List[float]
    method: str = "savgol"  # "savgol" | "moving_avg"
    window_size: int = 5
    poly_order: int = 2

class RegressionRequest(BaseModel):
    x: List[float]
    y: List[float]
    poly_degree: int = 1

# ----------------- Endpoints -----------------

@router.post("/t-test")
async def calculate_t_test(req: TTestRequest):
    """
    Computes two-sample Student's or Welch's t-test with Cohen's d effect size,
    mean difference, standard error, and 95% Confidence Interval.
    """
    arr_a = np.array([float(v) for v in req.group_a if not math.isnan(v)])
    arr_b = np.array([float(v) for v in req.group_b if not math.isnan(v)])

    if len(arr_a) < 2 or len(arr_b) < 2:
        raise HTTPException(status_code=400, detail="Each group must contain at least 2 valid numeric observations.")

    n_a, n_b = len(arr_a), len(arr_b)
    mean_a, mean_b = float(np.mean(arr_a)), float(np.mean(arr_b))
    std_a, std_b = float(np.std(arr_a, ddof=1)), float(np.std(arr_b, ddof=1))
    mean_diff = mean_a - mean_b

    try:
        if req.paired:
            if n_a != n_b:
                raise HTTPException(status_code=400, detail="Paired t-test requires both groups to have identical sample sizes.")
            res = stats.ttest_rel(arr_a, arr_b)
            t_stat = float(res.statistic)
            p_val = float(res.pvalue)
            df = float(res.df)
            
            # Pooled SD for Cohen's d (paired)
            diffs = arr_a - arr_b
            std_diff = float(np.std(diffs, ddof=1))
            se_diff = std_diff / math.sqrt(n_a) if n_a > 0 else 0.0
            cohens_d = (mean_diff / std_diff) if std_diff > 0 else 0.0
        else:
            res = stats.ttest_ind(arr_a, arr_b, equal_var=req.equal_var)
            t_stat = float(res.statistic)
            p_val = float(res.pvalue)
            df = float(res.df)

            # Standard error of the difference
            if req.equal_var:
                sp2 = ((n_a - 1) * (std_a ** 2) + (n_b - 1) * (std_b ** 2)) / (n_a + n_b - 2)
                se_diff = math.sqrt(sp2 * (1.0 / n_a + 1.0 / n_b))
                pooled_sd = math.sqrt(sp2)
            else:
                se_diff = math.sqrt((std_a ** 2) / n_a + (std_b ** 2) / n_b)
                pooled_sd = math.sqrt(((std_a ** 2) + (std_b ** 2)) / 2.0)

            cohens_d = (mean_diff / pooled_sd) if pooled_sd > 0 else 0.0

        # Critical t for 95% CI
        crit_t = float(stats.t.ppf(1 - req.alpha / 2, df))
        ci_lower = mean_diff - crit_t * se_diff
        ci_upper = mean_diff + crit_t * se_diff

        is_significant = bool(p_val < req.alpha)
        
        if p_val < 0.001:
            p_str = "p < 0.001"
        else:
            p_str = f"p = {p_val:.4f}"

        verdict = f"{'Statistically significant' if is_significant else 'No statistically significant'} difference ({p_str}, t({df:.1f}) = {t_stat:.3f}, Cohen's d = {cohens_d:.2f})."

        return {
            "statistic": round(t_stat, 4),
            "p_value": p_val,
            "df": round(df, 2),
            "mean_a": round(mean_a, 4),
            "mean_b": round(mean_b, 4),
            "std_a": round(std_a, 4),
            "std_b": round(std_b, 4),
            "n_a": n_a,
            "n_b": n_b,
            "mean_diff": round(mean_diff, 4),
            "se_diff": round(se_diff, 4),
            "ci_lower": round(ci_lower, 4),
            "ci_upper": round(ci_upper, 4),
            "cohens_d": round(cohens_d, 4),
            "is_significant": is_significant,
            "verdict": verdict,
            "test_type": "Paired Student's t-test" if req.paired else ("Student's t-test (Equal Variance)" if req.equal_var else "Welch's t-test (Unequal Variance)")
        }
    except Exception as e:
        logger.error(f"t-test execution error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate t-test: {str(e)}")


@router.post("/anova")
async def calculate_anova(req: AnovaRequest):
    """
    Computes One-Way ANOVA with sum of squares, F-statistic, degrees of freedom,
    and Tukey HSD pairwise post-hoc test.
    """
    clean_groups: Dict[str, np.ndarray] = {}
    for name, vals in req.groups.items():
        arr = np.array([float(v) for v in vals if not math.isnan(v)])
        if len(arr) >= 2:
            clean_groups[name] = arr

    if len(clean_groups) < 2:
        raise HTTPException(status_code=400, detail="ANOVA requires at least 2 groups with >= 2 observations each.")

    try:
        data_arrays = list(clean_groups.values())
        group_names = list(clean_groups.keys())

        # One-way ANOVA
        res = stats.f_oneway(*data_arrays)
        f_stat = float(res.statistic)
        p_val = float(res.pvalue)

        # Compute SS and degrees of freedom
        all_vals = np.concatenate(data_arrays)
        grand_mean = float(np.mean(all_vals))
        n_total = len(all_vals)
        k_groups = len(clean_groups)

        df_between = k_groups - 1
        df_within = n_total - k_groups
        df_total = n_total - 1

        ss_between = float(sum(len(arr) * ((np.mean(arr) - grand_mean) ** 2) for arr in data_arrays))
        ss_within = float(sum(np.sum((arr - np.mean(arr)) ** 2) for arr in data_arrays))
        ss_total = ss_between + ss_within

        ms_between = ss_between / df_between if df_between > 0 else 0.0
        ms_within = ss_within / df_within if df_within > 0 else 0.0

        # Group Summaries
        summaries = {}
        for name, arr in clean_groups.items():
            s = float(np.std(arr, ddof=1))
            n = len(arr)
            summaries[name] = {
                "count": n,
                "mean": round(float(np.mean(arr)), 4),
                "std": round(s, 4),
                "sem": round(s / math.sqrt(n) if n > 0 else 0.0, 4),
                "median": round(float(np.median(arr)), 4),
                "min": round(float(np.min(arr)), 4),
                "max": round(float(np.max(arr)), 4)
            }

        # Tukey HSD Post-Hoc Comparisons
        tukey_results = []
        try:
            flat_data = []
            flat_labels = []
            for name, arr in clean_groups.items():
                flat_data.extend(arr.tolist())
                flat_labels.extend([name] * len(arr))

            tukey = stats.tukey_hsd(*data_arrays)
            for i in range(k_groups):
                for j in range(i + 1, k_groups):
                    diff = float(np.mean(data_arrays[i]) - np.mean(data_arrays[j]))
                    p_adj = float(tukey.pvalue[i, j])
                    tukey_results.append({
                        "group1": group_names[i],
                        "group2": group_names[j],
                        "diff": round(diff, 4),
                        "p_adj": round(p_adj, 5),
                        "significant": bool(p_adj < req.alpha)
                    })
        except Exception as te:
            logger.warning(f"Tukey HSD post-hoc calculation skipped: {te}")

        is_significant = bool(p_val < req.alpha)
        p_str = "p < 0.001" if p_val < 0.001 else f"p = {p_val:.4f}"
        verdict = f"{'Statistically significant difference across groups' if is_significant else 'No significant difference detected'} (F({df_between}, {df_within}) = {f_stat:.3f}, {p_str})."

        return {
            "f_statistic": round(f_stat, 4),
            "p_value": p_val,
            "df_between": df_between,
            "df_within": df_within,
            "df_total": df_total,
            "ss_between": round(ss_between, 4),
            "ss_within": round(ss_within, 4),
            "ss_total": round(ss_total, 4),
            "ms_between": round(ms_between, 4),
            "ms_within": round(ms_within, 4),
            "is_significant": is_significant,
            "verdict": verdict,
            "group_summaries": summaries,
            "post_hoc_tukey": tukey_results
        }
    except Exception as e:
        logger.error(f"ANOVA execution error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate ANOVA: {str(e)}")


@router.post("/smoothing")
async def smooth_data(req: SmoothingRequest):
    """
    Applies Savitzky-Golay or Moving Average filtering to a 1D sequence of points.
    """
    if len(req.x) != len(req.y):
        raise HTTPException(status_code=400, detail="Lengths of X and Y arrays must match.")
    if len(req.y) < 4:
        raise HTTPException(status_code=400, detail="At least 4 data points required for smoothing.")

    y_arr = np.array(req.y, dtype=float)
    x_arr = np.array(req.x, dtype=float)

    # Sort by X
    sort_idx = np.argsort(x_arr)
    sorted_x = x_arr[sort_idx]
    sorted_y = y_arr[sort_idx]

    smoothed = []
    if req.method == "savgol":
        w = req.window_size
        if w % 2 == 0:
            w += 1  # Window must be odd
        w = min(w, len(sorted_y))
        if w % 2 == 0:
            w -= 1
        p = min(req.poly_order, w - 1)
        if w >= 3 and p >= 1:
            smoothed = savgol_filter(sorted_y, window_length=w, polyorder=p).tolist()
        else:
            smoothed = sorted_y.tolist()
    else:  # moving_avg
        w = max(2, min(req.window_size, len(sorted_y)))
        kernel = np.ones(w) / w
        smoothed = np.convolve(sorted_y, kernel, mode='same').tolist()

    # Calculate R-squared between raw and smoothed
    residuals = sorted_y - np.array(smoothed)
    ss_res = np.sum(residuals ** 2)
    ss_tot = np.sum((sorted_y - np.mean(sorted_y)) ** 2)
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

    return {
        "x": sorted_x.tolist(),
        "raw_y": sorted_y.tolist(),
        "smoothed_y": [round(float(v), 5) for v in smoothed],
        "r_squared": round(float(r2), 4),
        "method": req.method,
        "window_size": req.window_size
    }


@router.post("/regression")
async def fit_regression(req: RegressionRequest):
    """
    Computes linear or polynomial regression fit with R², Pearson r, standard error,
    and 95% confidence prediction bands.
    """
    if len(req.x) != len(req.y):
        raise HTTPException(status_code=400, detail="Lengths of X and Y arrays must match.")
    if len(req.x) < 3:
        raise HTTPException(status_code=400, detail="At least 3 points required for regression.")

    x_arr = np.array(req.x, dtype=float)
    y_arr = np.array(req.y, dtype=float)
    n = len(x_arr)

    # Sort
    idx = np.argsort(x_arr)
    x_sort = x_arr[idx]
    y_sort = y_arr[idx]

    deg = max(1, min(req.poly_degree, 3))
    coeffs = np.polyfit(x_sort, y_sort, deg)
    poly = np.poly1d(coeffs)
    fitted_y = poly(x_sort)

    # Statistics
    residuals = y_sort - fitted_y
    ss_res = np.sum(residuals ** 2)
    ss_tot = np.sum((y_sort - np.mean(y_sort)) ** 2)
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

    pearson_r, p_val = stats.pearsonr(x_sort, y_sort) if deg == 1 else (math.sqrt(max(0, r2)), 0.0)
    std_err = math.sqrt(ss_res / (n - (deg + 1))) if (n - (deg + 1)) > 0 else 0.0

    # 95% Confidence interval band
    t_val = stats.t.ppf(0.975, df=max(1, n - 2))
    s_err = std_err * np.sqrt(1.0 / n + (x_sort - np.mean(x_sort))**2 / np.sum((x_sort - np.mean(x_sort))**2))
    ci_upper = fitted_y + t_val * s_err
    ci_lower = fitted_y - t_val * s_err

    # LaTeX formula representation
    if deg == 1:
        m, c = coeffs[0], coeffs[1]
        sign = "+" if c >= 0 else "-"
        formula_latex = f"y = {m:.4f}x {sign} {abs(c):.4f}"
    else:
        terms = []
        for i, c in enumerate(coeffs):
            power = deg - i
            if power == 0:
                terms.append(f"{c:+.4f}")
            elif power == 1:
                terms.append(f"{c:+.4f}x")
            else:
                terms.append(f"{c:+.4f}x^{{{power}}}")
        formula_latex = "y = " + " ".join(terms).lstrip("+")

    return {
        "x": x_sort.tolist(),
        "raw_y": y_sort.tolist(),
        "fitted_y": [round(float(v), 5) for v in fitted_y],
        "ci_upper": [round(float(v), 5) for v in ci_upper],
        "ci_lower": [round(float(v), 5) for v in ci_lower],
        "coefficients": [round(float(c), 5) for c in coeffs],
        "formula_latex": formula_latex,
        "r_squared": round(float(r2), 4),
        "pearson_r": round(float(pearson_r), 4),
        "p_value": float(p_val),
        "std_err": round(float(std_err), 4),
        "poly_degree": deg
    }
