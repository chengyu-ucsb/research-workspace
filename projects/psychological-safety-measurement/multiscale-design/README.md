# Multi-scale design

This folder holds the Stage 2 analysis. It is separate from the six-condition prototype and uses a different set of AI-generated scales.

Each respondent answers both established psychological safety scales (Edmondson, 1999; May et al., 2004), the team learning behavior and team efficacy scales, and four AI-generated scales assigned at random from 20. A random-effects model estimates tau, the standard deviation of the psychological safety–team learning correlation across AI-generated measures (RQ1). A meta-regression relates each scale's correlation to features scored from its item text before data collection: content coverage, referent, similarity to Edmondson's items, and wording overlap with the team learning items (RQ2).

## Input

The AI scales come from the team's logged generation pipeline: two models, three levels of construct information, five runs per condition, and a revision of each first draft, for 60 scales in total. The 20 survey scales will be drawn from that pool with the same seeded rule used for the pilot draw. The pool is kept in a separate repository and will be added here as `generation/` when it is shared.

Until then, the script runs on simulated scales with hypothetical parameters. No participant data are used.

## Files

- `simulation/multiscale_sim.py`: simulation, random-effects estimation, meta-regression, and Monte Carlo study
- `results/MULTISCALE.md`: results, power analysis, and the benchmark from Frazier et al. (2017)
- `results/`: output tables, JSON summaries, and the figure

## Run

```bash
python -m pip install -r requirements.txt
python simulation/multiscale_sim.py --out results
```

The run takes about two and a half minutes. All random draws come from a fixed seed.
