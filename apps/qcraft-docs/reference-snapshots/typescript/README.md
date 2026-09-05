**@qcraft/engine**

***

# @qcraft/engine

## Classes

- [MissingDebtAnchorError](classes/MissingDebtAnchorError.md)
- [MissingMacrofiscalInputError](classes/MissingMacrofiscalInputError.md)
- [MissingYearError](classes/MissingYearError.md)
- [QCraftDataError](classes/QCraftDataError.md)

## Interfaces

- [AdapterOptions](interfaces/AdapterOptions.md)
- [BaselineV1Row](interfaces/BaselineV1Row.md)
- [ClimateInputRow](interfaces/ClimateInputRow.md)
- [ClimateOptions](interfaces/ClimateOptions.md)
- [ClimateRow](interfaces/ClimateRow.md)
- [ClimateVariationRow](interfaces/ClimateVariationRow.md)
- [ColumnarCountryInput](interfaces/ColumnarCountryInput.md)
- [CountryInput](interfaces/CountryInput.md)
- [DeflatorInputRow](interfaces/DeflatorInputRow.md)
- [DemographyInputRow](interfaces/DemographyInputRow.md)
- [DemographyRow](interfaces/DemographyRow.md)
- [FiscalOptions](interfaces/FiscalOptions.md)
- [FiscalRow](interfaces/FiscalRow.md)
- [HorizonPolicy](interfaces/HorizonPolicy.md)
- [InflationOptions](interfaces/InflationOptions.md)
- [InflationRow](interfaces/InflationRow.md)
- [InterestRateOptions](interfaces/InterestRateOptions.md)
- [InterestRateRow](interfaces/InterestRateRow.md)
- [MacroBaselineRow](interfaces/MacroBaselineRow.md)
- [MacroFiscalRow](interfaces/MacroFiscalRow.md)
- [MacroRawRow](interfaces/MacroRawRow.md)
- [PipelineParams](interfaces/PipelineParams.md)
- [PipelineResult](interfaces/PipelineResult.md)
- [ProductivityInputRow](interfaces/ProductivityInputRow.md)
- [ProductivityOptions](interfaces/ProductivityOptions.md)
- [ProductivityRow](interfaces/ProductivityRow.md)
- [RiskRow](interfaces/RiskRow.md)

## Type Aliases

- [ClimateScenario](type-aliases/ClimateScenario.md)
- [FiscalRuleSetting](type-aliases/FiscalRuleSetting.md)
- [InterestRateMode](type-aliases/InterestRateMode.md)
- [Num](type-aliases/Num.md)

## Variables

- [CLIMATE\_SCENARIOS](variables/CLIMATE_SCENARIOS.md)
- [COLORS](variables/COLORS.md)
- [DEFAULTS](variables/DEFAULTS.md)
- [PROJ\_START](variables/PROJ_START.md)
- [SCENARIO\_LABELS](variables/SCENARIO_LABELS.md)
- [YEAR\_END](variables/YEAR_END.md)
- [YEAR\_START](variables/YEAR_START.md)

## Functions

- [baselineCountry](functions/baselineCountry.md)
- [baselineV1](functions/baselineV1.md)
- [buildClimateVariation](functions/buildClimateVariation.md)
- [buildMacroDeflator](functions/buildMacroDeflator.md)
- [buildMacroForBaseline](functions/buildMacroForBaseline.md)
- [buildMacroForFiscal](functions/buildMacroForFiscal.md)
- [calcClimateScenario](functions/calcClimateScenario.md)
- [demographyCountry](functions/demographyCountry.md)
- [fromColumnarCountryInput](functions/fromColumnarCountryInput.md)
- [hasOecdSeries](functions/hasOecdSeries.md)
- [inflationCountry](functions/inflationCountry.md)
- [interestRateCountry](functions/interestRateCountry.md)
- [logisticGrowth](functions/logisticGrowth.md)
- [productivityCountry](functions/productivityCountry.md)
- [projectionYears](functions/projectionYears.md)
- [resolveHorizon](functions/resolveHorizon.md)
- [runPipeline](functions/runPipeline.md)
