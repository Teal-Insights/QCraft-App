/**
 * The references the app cites, in one place.
 *
 * The 2026-09-02 audit found a reference that does not exist (Batini and
 * others, 2024, "Building Blocks of a Climate-Fiscal Policy Framework"), the
 * User Guide described as an internal document, and an invented title on
 * Centorrino, Massetti and Tagklis (2024). Every entry below is taken from the
 * User Guide's own reference list (Tim and Rahman, 2024, pages 36 to 37) or
 * from the workbook's Dashboard, and both tabs that print references read this
 * list, so a citation can only be wrong in one place.
 */

export interface Reference {
  key: string;
  authors: string;
  year: string;
  title: string;
  publisher: string;
}

export const REFERENCES: readonly Reference[] = [
  {
    key: 'workbook',
    authors: 'IMF Fiscal Affairs Department',
    year: '2024',
    title:
      'Quantitative Climate Risk Assessment Fiscal Tool (Q-CRAFT), Excel workbook, ' +
      'Version 1.0_11-15-2024',
    publisher: 'International Monetary Fund',
  },
  {
    key: 'guide',
    authors: 'Tim, T. and Rahman, J.',
    year: '2024',
    title:
      'Climate Change Fiscal Risks: User Guide for the Quantitative Climate Risk ' +
      'Assessment Fiscal Tool (Q-CRAFT), Version 1.0',
    publisher: 'IMF Fiscal Affairs Department',
  },
  {
    key: 'kahn',
    authors: 'Kahn, M.E., Mohaddes, K., Ng, R.N.C., Pesaran, M.H., Raissi, M. and Yang, J.-C.',
    year: '2021',
    title: 'Long-Term Macroeconomic Effects of Climate Change: A Cross-Country Analysis',
    publisher: 'Energy Economics, 104, 105624',
  },
  {
    key: 'massetti-2023',
    authors: 'Massetti, E. and Tagklis, F.',
    year: '2023',
    title:
      'FADCP Climate Dataset using CRU data (Harris et al., 2020) and CMIP6 data ' +
      '(Copernicus Climate Change Service, Climate Data Store, 2021)',
    publisher: 'IMF Fiscal Affairs Department',
  },
  {
    key: 'massetti-2024',
    authors: 'Massetti, E. and Tagklis, F.',
    year: '2024',
    title: 'FADCP Climate Dataset: Temperature and Precipitation, Reference Guide',
    publisher: 'IMF Fiscal Affairs Department',
  },
  {
    key: 'centorrino',
    authors: 'Centorrino, S., Massetti, E. and Tagklis, F.',
    year: '2024',
    title:
      'Climate Effects on GDP Growth: Updated Estimates of Kahn et al. (2021), ' +
      'Reference Guide',
    publisher: 'IMF Fiscal Affairs Department',
  },
];
