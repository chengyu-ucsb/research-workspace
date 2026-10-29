# Multi-Scale Design

Each respondent answers two established psychological safety scales (Edmondson, 1999; May et al., 2004), the team learning behavior and team efficacy scales, and four AI-generated psychological safety scales assigned at random from 20. A random-effects model estimates τ, the standard deviation of the psychological safety–team learning correlation across AI-generated measures, and locates the established scales within that distribution. A meta-regression then relates each scale's correlation to features scored from its item text before data collection: content coverage, referent, similarity to Edmondson's items, and wording overlap with the team learning items.

## AI-Generated Scales

The 20 scales are drawn with a recorded seed from a logged pool of 60 scales. Two language models produced the pool under three levels of construct information, with five runs per condition and a revision of each first draft. The prompts, model versions, settings, saved responses, and the seeded draw will be added under `generation/`.

## Simulation

`simulation/multiscale_sim.py` runs the analysis on simulated responses with hypothetical parameters and evaluates its error rates, interval coverage, and power. `results/MULTISCALE.md` reports the results. `results/` holds the output tables, the figure, and the technical appendix exhibits (`table_A1.csv` and `figure_A1.png`).

## Run

```bash
python -m pip install -r requirements.txt
python simulation/multiscale_sim.py --out results
```

The run takes about two and a half minutes. All random draws come from a fixed seed, so rerunning the command from this folder reproduces every file in `results/` exactly, and `git status` shows no changes afterward. The committed results were produced with Python 3.13, NumPy 2.5.3, SciPy 1.18.1, and Matplotlib 3.11.2.
