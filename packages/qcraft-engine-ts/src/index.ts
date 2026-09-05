/**
 * Q-CRAFT engine — TypeScript port of `packages/qcraft-engine`.
 *
 * Seven pure functions plus a pipeline orchestrator. Every function takes plain arrays
 * of row objects and returns a new array; nothing mutates its inputs and nothing holds
 * state between calls. Column names match the Python/Polars engine exactly.
 */

export * from './types.js';
export {
  QCraftDataError,
  MissingDebtAnchorError,
  MissingMacrofiscalInputError,
  MissingYearError,
} from './errors.js';
export * from './constants.js';
export { demographyCountry } from './demography.js';
export { productivityCountry, type ProductivityOptions } from './productivity.js';
export { inflationCountry, type InflationOptions } from './inflation.js';
export { baselineV1 } from './baselineV1.js';
export { interestRateCountry, type InterestRateOptions } from './interestRate.js';
export { baselineCountry, type FiscalOptions } from './fiscal.js';
export { calcClimateScenario, type ClimateOptions } from './climate.js';
export {
  runPipeline,
  buildMacroDeflator,
  buildMacroForBaseline,
  buildMacroForFiscal,
  buildClimateVariation,
} from './pipeline.js';
export {
  fromColumnarCountryInput,
  hasOecdSeries,
  type ColumnarCountryInput,
  type AdapterOptions,
} from './adapters.js';
export { logisticGrowth } from './internal.js';

export { resolveHorizon } from './horizon.js';
