# Technical Appendix: AI-Generated Psychological Safety Measures

## Research problem and construct boundaries

The study examines whether flexibility in AI-generated operationalizations of psychological safety changes conclusions about associations with team learning behavior. The central challenge is to distinguish measurement precision from construct drift and overlap with outcomes. Edmondson (1999) conceptualized team psychological safety as a shared belief concerning the interpersonal consequences of risk-taking. Team efficacy, learning behavior, and broad positive evaluations are distinct. The proposed Prolific survey elicits *individual perceptions of focal teams*; these data should not be treated as shared team-level climate without multiple members and aggregation evidence.

## Captured candidate item-generation procedure

A 3 × 2 framework crosses (P1) construct name, (P2) definition plus conceptual boundaries, and (P3) definition plus contextual work examples with either absence (A0) or presence (A1) of Edmondson's seven reference items. Common item requirements specify seven statements, four positive and three negative, a team referent, and a seven-point accuracy response format. The uploaded Word document contains one seven-item output for each of the six cells (42 items total). The first five full prompts were transcribed from that document, subject to whitespace cleanup. P3-A1 contains its seven-item output but not the complete original prompt.

No model snapshots, execution timestamps, generation seeds, original API request IDs, or raw-response machine logs were supplied. These outputs are therefore an exploratory proof-of-concept item pool, not a fully reproducible controlled generation experiment. A later study should use isolated calls to a fixed model, log all attempts, and repeat generation within cells to distinguish prompt effects from stochastic variation.

## Synthetic response-generating assumptions

The executable prototype creates 600 synthetic individuals using a fixed random seed. Standardized latent psychological safety P and team efficacy E are constructed with correlation .35. Latent reported team learning L follows L = 0.30P + 0.20E + u, where u has independent normal noise scaled so the variance of L is one. The model assumes these population values; they are not estimates taken from Edmondson (1999) or from the six generated scales.

For each synthetic item j, a continuous propensity X*j = λj P + γj E + δj L + εj is drawn with the residual variance chosen to make the propensity variance one. Thresholds at standard-normal quantiles 1/7 through 6/7 yield ordered responses 1–7. The first three safety items are reversed on administration and then keyed back for scoring. Errors are initially independent among items. Common efficacy and learning indicators have own-construct loadings .70.

The hypothetical safety conditions include a reference (target loading .65), equivalent independent measurement (.65), lower precision (.40), efficacy overlap (target .65 plus efficacy .30), and learning overlap (target .65 plus learning .30). A separate sparse learning-overlap diagnostic adds a learning loading of .40 to the first two of seven safety indicators only. These manipulations are *assumed statistical mechanisms*, not features attributed to any specific AI-generated item set. Changing overlap also changes indicator common variance, so conditions do not perfectly match reliability.

## Substantive comparison

For each alternative composite scale s, estimate the efficacy-adjusted standardized association of reported learning with scale s and efficacy. Reestimate the reference scale on the same simulated respondents. The primary contrast is Δs = b(s) − b(reference). Bootstrap complete respondent records, including all item scores and variables together, and recompute standardization and both regressions each replicate. This gives paired uncertainty intervals and prevents inference from separate significance tests. No causal interpretation is warranted.

## Exploratory and confirmatory factor analyses

Split the simulated respondents into a 300-person exploratory sample and a 300-person confirmatory sample, using a fixed independent selection seed.

On the exploratory half, estimate a three-factor principal-axis EFA with oblimin rotation using a block comprising seven synthetic safety items, three efficacy items, and seven learning items. Examine both the reference and sparse-overlap forms. Factor signs and ordering are arbitrary; loading patterns are diagnostic.

On the confirmatory half, fit approximate covariance-structure CFA models to standardized 1–7 item responses using maximum-likelihood discrepancy. Compare (a) distinct safety/efficacy/learning factors with (b) safety and learning merged, and compare a simple three-factor model with a model permitting cross-loadings on the first two sparse-overlap safety indicators. Compute approximate chi-square and RMSEA while recording optimization success.

These CFA models **treat ordinal categories as approximately continuous** and do not implement polychoric correlations, WLSMV, robust standard errors, or measurement invariance. Their purpose is to show that a correctly specified cross-loading model can better recover a known synthetic mechanism. They are not an empirical validation of the AI-generated items.

## Verification and files

Running `python simulation/synthetic_demo.py --out results` deterministically recreates the synthetic item-level dataset, paired coefficient CSV, EFA loading CSVs, CFA comparison CSV, and JSON results. Checks verify ordinal response ranges, item count, direction-keying convention, optimizer convergence, and the expected improvement when modeled overlap is permitted.

The observed numerical outputs are one realization of a known simulation design. A bootstrap within a single sample measures sampling uncertainty; it does not substitute for a repeated Monte Carlo methods study.

## Planned empirical extension

The full study would field established psychological safety, team efficacy, team learning, and exploratory general-evaluation items with selected AI-generated scales in a within-person or incomplete-block design. Randomized block order would control order effects. Primary analyses would use paired scale-dependent associations, independent content ratings, reliability and discriminant-validity diagnostics, and ordinal latent-factor analyses. Established human scales must be verified for construct referent, wording, response format, and common lineage; shortened Edmondson variants are not independent human-developed scale families. A later transcript-based analysis could examine disclosure, others' responses, and subsequent participation, but should not label text scores as shared team psychological safety without external validation.

## References

Clark, L. A., & Watson, D. (2019). Constructing validity: New developments in creating objective measuring instruments. *Psychological Assessment, 31*(12), 1412–1427. https://doi.org/10.1037/pas0000626

Edmondson, A. (1999). Psychological safety and learning behavior in work teams. *Administrative Science Quarterly, 44*(2), 350–383. https://doi.org/10.2307/2666999

Flake, J. K., & Fried, E. I. (2020). Measurement schmeasurement: Questionable measurement practices and how to avoid them. *Advances in Methods and Practices in Psychological Science, 3*(4), 456–465. https://doi.org/10.1177/2515245920952393

Morris, T. P., White, I. R., & Crowther, M. J. (2019). Using simulation studies to evaluate statistical methods. *Statistics in Medicine, 38*(11), 2074–2102. https://doi.org/10.1002/sim.8086

Terry, J., Strait, G., Alsarraf, S., Weinmann, E., & Waychoff, A. (2025). Artificial intelligence in scale development: Evaluating AI-generated survey items against gold standard measures. *Current Psychology, 44*, 16339–16350. https://doi.org/10.1007/s12144-025-08240-w
