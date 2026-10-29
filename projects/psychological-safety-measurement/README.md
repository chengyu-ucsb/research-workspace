# AI-generated psychological safety measures: Stage 1 prototype

This is an **anonymized research prototype**, separate from the main Research Workspace app. The repository is the single authoritative, GitHub-hosted copy of these materials.

## What is included

- [Organized Word item inventory](docs/generated_items_organized.docx) — all six scales and their 42 candidate items, with scoring directions.
- [Candidate items](generation/generated_items.md) and [machine-readable scales](generation/candidate_scales.json) — item content transcribed from the supplied `Generated items.docx`.
- [Generation manifest](generation/generation_manifest.json) and five prompt transcriptions — the last condition's complete executed prompt was absent from the supplied Word source.
- [Synthetic analysis](simulation/synthetic_demo.py) — deterministic simulated ordinal responses, paired coefficient comparisons, EFA and approximate CFA.
- [Worked results](results/DEMONSTRATION.md) and [technical appendix](docs/technical_appendix.md).
- [Multi-scale simulation](simulation/multiscale_sim.py) and [results and power analysis](results/MULTISCALE.md): the Stage 2 design in which each respondent answers several AI-generated scales, with a random-effects estimate of how much the psychological safety–team learning correlation varies across measures.

## Run

Requires Python 3.10 or higher.

```bash
python -m pip install -r requirements.txt
python simulation/synthetic_demo.py --out results
python simulation/multiscale_sim.py --out results/multiscale
```

The program writes a synthetic response matrix and reproducible result files, performs automated consistency checks, and reports numerical results. The synthetic dataset is regenerated deterministically from the seed; **no human participants' responses are used**.

## Critical distinction

The **six item sets are actual manually captured candidate outputs**, but no participant responses to those six instruments have been collected for this project. The simulations use **hypothetical factor loadings chosen by the researcher**; they do not infer loadings from the AI-generated wording.

EFA and CFA in this prototype are tests of simulated measurement structures, not validation of the six generated scales. CFA uses approximate continuous-normal ML for seven-category responses; a later empirical study would use appropriately specified ordinal models.

One generation per condition cannot identify prompt effects separately from stochastic generation variation. Model/version metadata and raw API response records were not supplied, and the full P3-A1 prompt is absent from the uploaded source.

## Source

Edmondson, A. (1999). Psychological safety and learning behavior in work teams. *Administrative Science Quarterly, 44*(2), 350–383. https://doi.org/10.2307/2666999
