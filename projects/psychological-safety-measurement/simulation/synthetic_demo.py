#!/usr/bin/env python3
"""Synthetic psychological-safety measurement demonstration.

All generating parameters are hypothetical researcher assumptions, not fitted
from AI-generated item wording or actual participants. Python 3.10+.
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm
from statsmodels.multivariate.factor import Factor

SEED = 20261028
N = 600
BOOTSTRAPS = 700
RHO_PE = .35
BETA_PL = .30
BETA_EL = .20
NEGATIVE_ITEMS = (0, 1, 2)
THRESHOLDS = norm.ppf(np.arange(1, 7) / 7)


def make_synthetic_data(n=N, seed=SEED):
    rng = np.random.default_rng(seed)
    p = rng.normal(size=n)
    e = RHO_PE * p + np.sqrt(1 - RHO_PE**2) * rng.normal(size=n)
    resid_var = 1 - BETA_PL**2 - BETA_EL**2 - 2 * BETA_PL * BETA_EL * RHO_PE
    assert resid_var > 0
    l = BETA_PL * p + BETA_EL * e + np.sqrt(resid_var) * rng.normal(size=n)
    latent_correlations = np.corrcoef(np.column_stack([p, e, l]), rowvar=False)
    nominal_corr = np.array([
        [1, RHO_PE, BETA_PL + BETA_EL * RHO_PE],
        [RHO_PE, 1, BETA_EL + BETA_PL * RHO_PE],
        [BETA_PL + BETA_EL * RHO_PE, BETA_EL + BETA_PL * RHO_PE, 1],
    ])

    def indicators(prefix, count, loading_p=0., loading_e=0., loading_l=0., negative=()):
        loadings = np.tile([loading_p, loading_e, loading_l], (count, 1)).astype(float)
        if prefix == 'sparse_learning_overlap':
            loadings[:2, 2] = .40
        out = {}
        for j, weights in enumerate(loadings):
            common_var = weights @ nominal_corr @ weights
            if not 0 <= common_var < 1:
                raise ValueError(f'invalid variance for {prefix} item {j+1}')
            continuous = weights @ np.vstack([p, e, l]) + np.sqrt(1-common_var) * rng.normal(size=n)
            raw = np.searchsorted(THRESHOLDS, continuous, side='right').astype(int) + 1
            if j in negative:
                raw = 8 - raw
            out[f'{prefix}_{j+1:02d}'] = raw
        return out

    forms = {
        'efficacy': indicators('efficacy', 3, loading_e=.70),
        'learning': indicators('learning', 7, loading_l=.70),
        'reference_safety': indicators('reference_safety', 7, loading_p=.65, negative=NEGATIVE_ITEMS),
        'equivalent': indicators('equivalent', 7, loading_p=.65, negative=NEGATIVE_ITEMS),
        'lower_precision': indicators('lower_precision', 7, loading_p=.40, negative=NEGATIVE_ITEMS),
        'efficacy_overlap': indicators('efficacy_overlap', 7, loading_p=.65, loading_e=.30, negative=NEGATIVE_ITEMS),
        'learning_overlap': indicators('learning_overlap', 7, loading_p=.65, loading_l=.30, negative=NEGATIVE_ITEMS),
        'sparse_learning_overlap': indicators('sparse_learning_overlap', 7, loading_p=.65, negative=NEGATIVE_ITEMS),
    }
    all_items = {k: v for form in forms.values() for k, v in form.items()}
    assert len(all_items) == len(set(all_items)) == 52
    assert all(np.min(v) >= 1 and np.max(v) <= 7 for v in all_items.values())
    scores = {}
    for name, entries in forms.items():
        arr = np.column_stack(list(entries.values())).astype(float)
        if name not in ('efficacy', 'learning'):
            arr[:, list(NEGATIVE_ITEMS)] = 8 - arr[:, list(NEGATIVE_ITEMS)]
        scores[name] = np.mean(arr, axis=1)
    return forms, all_items, scores, latent_correlations


def adjusted_beta(scores, name, rows):
    arr = np.column_stack([scores[name][rows], scores['efficacy'][rows], scores['learning'][rows]])
    std = arr.std(axis=0, ddof=1)
    if np.any(std <= 1e-12):
        return float('nan')
    zz = (arr - arr.mean(axis=0)) / std
    x = np.column_stack([np.ones(len(rows)), zz[:, :2]])
    return float(np.linalg.lstsq(x, zz[:, 2], rcond=None)[0][1])


def paired_comparison(scores, n, B=BOOTSTRAPS, seed=SEED+1):
    names = ['equivalent', 'lower_precision', 'efficacy_overlap', 'learning_overlap', 'sparse_learning_overlap']
    all_idx = np.arange(n)
    b0 = adjusted_beta(scores, 'reference_safety', all_idx)
    estimates = np.array([adjusted_beta(scores, name, all_idx) for name in names])
    rr = np.random.default_rng(seed)
    boot = np.empty((B, len(names)))
    for i in range(B):
        ids = rr.integers(0, n, n)
        reference = adjusted_beta(scores, 'reference_safety', ids)
        boot[i] = np.array([adjusted_beta(scores, name, ids) for name in names]) - reference
    assert np.all(np.isfinite(boot))
    interval = np.quantile(boot, [.025, .975], axis=0)
    data = []
    for j, name in enumerate(names):
        data.append({
            'condition': name,
            'standardized_adjusted_beta': round(float(estimates[j]), 4),
            'delta_vs_reference': round(float(estimates[j] - b0), 4),
            'ci_lower': round(float(interval[0, j]), 4),
            'ci_upper': round(float(interval[1, j]), 4),
        })
    return {'reference_standardized_adjusted_beta': round(b0, 4), 'comparisons': data, 'bootstrap_reps': B}


def keyed_block(forms, scale):
    arr = np.column_stack(list(forms[scale].values())).astype(float)
    if scale not in ('efficacy', 'learning'):
        arr[:, list(NEGATIVE_ITEMS)] = 8 - arr[:, list(NEGATIVE_ITEMS)]
    return arr


def efa_block(forms, scale, indices):
    a = np.column_stack([keyed_block(forms, scale), keyed_block(forms, 'efficacy'), keyed_block(forms, 'learning')])
    a = a[indices]
    a = (a - a.mean(axis=0)) / a.std(axis=0, ddof=1)
    model = Factor(a, n_factor=3, method='pa')
    res = model.fit()
    res.rotate('oblimin')
    ld = np.asarray(res.loadings)
    return {
        'scale': scale,
        'sample_n': len(indices),
        'rotation': 'oblimin',
        'extraction': 'principal axis',
        'loadings': np.round(ld, 4).tolist(),
        'largest_absolute_loading_by_construct': {
            'safety': [round(float(v), 3) for v in np.max(np.abs(ld[:7]), axis=1)],
            'efficacy': [round(float(v), 3) for v in np.max(np.abs(ld[7:10]), axis=1)],
            'learning': [round(float(v), 3) for v in np.max(np.abs(ld[10:]), axis=1)],
        },
    }


def fit_cfa(forms, scale, indices, mode='three', cross_indices=()):
    """Approximate continuous-normal ML CFA on 7-category coded responses.

    Not WLSMV/ordinal CFA. A check of feasibility under simulated assumptions.
    """
    a = np.column_stack([keyed_block(forms, scale), keyed_block(forms, 'efficacy'), keyed_block(forms, 'learning')])[indices]
    a = (a-a.mean(axis=0))/a.std(axis=0, ddof=1)
    S = np.cov(a, rowvar=False)
    d = S.shape[0]
    k = 2 if mode == 'merged' else 3
    factor = np.array([0]*7 + [1]*3 + ([0]*7 if mode == 'merged' else [2]*7))
    nb_corr = k*(k-1)//2
    n_cross = len(cross_indices)
    x0 = np.concatenate([np.repeat(.6,d), np.repeat(.55,d), np.repeat(.20,nb_corr), np.repeat(.10,n_cross)])
    bounds = [(.03,1.30)]*d + [(0.03,1.8)]*d + [(-.85,.85)]*nb_corr + [(-.9,.9)]*n_cross
    sg, ld = np.linalg.slogdet(S)
    if sg <= 0: raise ValueError('Non-PD sample covariance')

    def objective(x):
        W = np.zeros((d,k))
        W[np.arange(d),factor] = x[:d]
        if n_cross:
            for j,idx in enumerate(cross_indices):
                W[idx,2] = x[2*d+nb_corr+j]
        phi = np.eye(k)
        ci=0
        for i in range(k):
            for j in range(i+1,k):
                phi[i,j]=phi[j,i]=x[2*d+ci]
                ci+=1
        if np.linalg.eigvalsh(phi).min() <= .02:
            return 1e6
        Sigma = W @ phi @ W.T + np.diag(x[d:2*d])
        try:
            sign, ldet = np.linalg.slogdet(Sigma)
            if sign <= 0: return 1e6
            f = ldet + np.trace(np.linalg.solve(Sigma, S)) - ld - d
            return float(f) if np.isfinite(f) else 1e6
        except np.linalg.LinAlgError:
            return 1e6

    opt = minimize(objective,x0,method='L-BFGS-B',bounds=bounds,options={'maxiter':750,'ftol':1e-10})
    n = len(indices)
    df = d*(d+1)//2 - len(x0)
    chisq = max(0.,float((n-1)*opt.fun))
    return {
        'scale':scale,'model':mode,'crossloaded_safety_items_1based':[i+1 for i in cross_indices],
        'n':n,'df':df,'chi_square_ml_approx':round(chisq,3),
        'rmsea_approx':round(float(np.sqrt(max(chisq-df,0)/max(df*(n-1),1))),4),
        'discrepancy_ml':round(float(opt.fun),6),
        'optimizer_success':bool(opt.success), 'optimizer_message':str(opt.message),
        'note':'7-category ordinal responses treated as continuous; diagnostics only, not ordinal WLSMV CFA.'
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out',default='results', help='Output directory')
    args = parser.parse_args()
    out=Path(args.out);out.mkdir(parents=True, exist_ok=True)
    forms, items, scores, empirical_latent_correlations = make_synthetic_data()
    idx=np.random.default_rng(SEED+2).permutation(N)
    discovery,validation=idx[:N//2],idx[N//2:]
    results={
        'status':'synthetic demonstration only',
        'generation_assumptions':{'seed':SEED,'n':N,'rho_safety_efficacy':RHO_PE,
          'latent_beta_safety_to_learning':BETA_PL,'latent_beta_efficacy_to_learning':BETA_EL,
          'reference_target_loading':.65,'equivalent_loading':.65,'low_precision_loading':.40,
          'efficacy_crossloading':.30,'learning_crossloading':.30,
          'sparse_learning_crossloading_first_two_items':.40,
          'negative_items_1based':[1,2,3], 'ordinal_thresholds':'standard normal quantiles at 1/7,...,6/7'},
        'observed_latent_correlations':np.round(empirical_latent_correlations,3).tolist(),
        'paired_regression':paired_comparison(scores,N),
        'efa': [efa_block(forms,'reference_safety',discovery),efa_block(forms,'sparse_learning_overlap',discovery)],
        'cfa': [
            fit_cfa(forms,'reference_safety',validation,'three'),
            fit_cfa(forms,'reference_safety',validation,'merged'),
            fit_cfa(forms,'sparse_learning_overlap',validation,'three'),
            fit_cfa(forms,'sparse_learning_overlap',validation,'three',cross_indices=(0,1))
        ],
        'limitations':['The factor analyses are statistical checks on model-generated ordinal responses.',
          'EFA and CFA use disjoint respondent halves; neither uses actual AI item responses.',
          'CFA uses continuous-normal ML approximations, not ordinal WLSMV.',
          'Hypothetical crossloadings are not inferred from candidate item text.',
          'This is one synthetic dataset, not a Monte Carlo simulation.']
    }
    (out/'demo_results.json').write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n')
    with (out/'synthetic_responses.csv').open('w',newline='') as f:
        writer=csv.writer(f)
        columns=['synthetic_respondent_id',*items.keys()]
        writer.writerow(columns)
        for i in range(N):
            writer.writerow([f'S{i+1:04d}',*(items[col][i] for col in items)])
    with (out/'paired_comparison.csv').open('w',newline='') as f:
        fieldnames=['condition','standardized_adjusted_beta','delta_vs_reference','ci_lower','ci_upper']
        w=csv.DictWriter(f,fieldnames=fieldnames)
        w.writeheader();w.writerows(results['paired_regression']['comparisons'])
    with (out/'factor_models.csv').open('w',newline='') as f:
        fields=['scale','model','crossloaded_safety_items_1based','n','df','chi_square_ml_approx','rmsea_approx','optimizer_success']
        w=csv.DictWriter(f,fieldnames=fields)
        w.writeheader();w.writerows({c:str(m[c]) if isinstance(m[c],list) else m[c] for c in fields} for m in results['cfa'])
    for name in ['reference_safety','sparse_learning_overlap']:
        info=next(x for x in results['efa'] if x['scale']==name)
        with (out/f'efa_{name}.csv').open('w',newline='') as f:
            w=csv.writer(f);w.writerow(['item','factor1','factor2','factor3'])
            for j,row in enumerate(info['loadings']): w.writerow([f'{name}_{j+1}' if j<7 else f'efficacy_{j-6}' if j<10 else f'learning_{j-9}',*row])
    assert all(m['optimizer_success'] for m in results['cfa']), results['cfa']
    assert len(results['paired_regression']['comparisons'])==5
    assert results['cfa'][0]['chi_square_ml_approx'] < results['cfa'][1]['chi_square_ml_approx'], 'Expected distinct anchor factors'
    assert results['cfa'][3]['chi_square_ml_approx'] < results['cfa'][2]['chi_square_ml_approx'], 'Expected crossloading model fit'
    print('Synthetic results written to',out)
    print('Reference b:',results['paired_regression']['reference_standardized_adjusted_beta'])
    for r in results['paired_regression']['comparisons']:print(r)
    for r in results['cfa']:print('CFA',r['scale'],r['model'],r['crossloaded_safety_items_1based'],r['chi_square_ml_approx'],r['rmsea_approx'],r['optimizer_success'])

if __name__=='__main__':main()
