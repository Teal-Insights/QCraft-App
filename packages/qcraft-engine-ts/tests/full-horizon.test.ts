import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildClimateVariation, calcClimateScenario, resolveHorizon, runPipeline, type CountryInput, type PipelineParams } from '../src/index.js';

const fixture = (name: string) => readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf8');
const input = JSON.parse(fixture('UGA-full-horizon.json')) as CountryInput;
const result = runPipeline(input);
const h = input.horizonPolicy!.weoMaxYear!;
const first = h + 1;
const near = (a: number, b: number) => expect(Math.abs(a-b)/Math.max(1,Math.abs(a),Math.abs(b))).toBeLessThan(2e-12);
const raw = new Map(fixture('UGA-weo-raw.csv').trim().split(/\r?\n/).slice(1).map(line => {
  const [indicator,year,value] = line.split(','); return [`${indicator}:${year}`, Number(value)] as const;
}));
const source = (indicator: string, year: number) => raw.get(`${indicator}:${year}`)!;

function applyPolicy(copy: CountryInput): CountryInput {
  copy.horizonPolicy = { ...input.horizonPolicy!, ...resolveHorizon(copy) };
  return copy;
}

describe('Current complete WEO profile', () => {
  it('uses the entire source horizon and the real WDI endpoint', () => {
    expect(h).toBe(Math.max(...input.macrofiscal.map(r => r.years)));
    expect(input.horizonPolicy!.wdiLastYear).toBe(Math.max(...input.productivity.filter(r => r.iso3c === input.iso3c).map(r=>r.years)));
    expect(input.horizonPolicy!.climateStartYear).toBe(first);
  });

  it('copies WEO real and nominal GDP, deflator growth, debt and balances through H', () => {
    for (const b of result.baseline_v1.filter(r => r.years <= h)) {
      const y=b.years; const f=result.fiscal.find(r=>r.years===y)!;
      near(b.real_gdp,source('NGDP_R',y)/1e9); near(b.nominal_gdp,source('NGDP',y)/1e9);
      near(b.real_gdp_growth_percent,(source('NGDP_R',y)/source('NGDP_R',y-1)-1)*100);
      near(b.gdp_deflator_growth_percent,(source('NGDP_D',y)/source('NGDP_D',y-1)-1)*100);
      near(f.debt,source('GGXWDG',y)/1e9); near(f.primary_balance,source('GGXONLB',y)/1e9);
      near(f.primary_expenditure,(source('GGR',y)-source('GGXONLB',y))/1e9);
    }
  });

  it('uses the WEO productivity residual from WDI end + 1 through H', () => {
    for (const b of result.baseline_v1.filter(r=>r.years>input.horizonPolicy!.wdiLastYear! && r.years<=h)) {
      near(b.labour_productivity_growth,((1+b.real_gdp_growth_percent/100)/(1+b.employment_growth/100)-1)*100);
    }
  });

  it('matches independently calculated first-year baseline and all six climate rows', () => {
    for (const line of fixture('UGA-full-horizon-first-year.csv').trim().split(/\r?\n/).slice(1)) {
      const [scenario,year,field,value] = line.split(',');
      if (field==='calendarShock2032') {
        near(buildClimateVariation(input.climate,input.iso3c,scenario!,h).find(r=>r.years===Number(year))!.climate_variation,Number(value)); continue;
      }
      const row = scenario==='Baseline'
        ? { ...result.baseline_v1.find(r=>r.years===Number(year))!, ...result.fiscal.find(r=>r.years===Number(year))! }
        : result.climate[scenario!]!.find(r=>r.years===Number(year))!;
      near((row as unknown as Record<string,number>)[field!]!,Number(value));
    }
  });

  it.each([
    {productivity_start:3}, {productivity_end:3}, {productivity_turning_point:20},
    {inflation_start:2}, {inflation_end:2}, {interest_rate_mode:'Real interest rate',long_run_interest_rate:2},
    {interest_rate_mode:'Interest-growth differential'}, {fiscal_rule:'No'}, {debt_target:40},
  ] as Partial<PipelineParams>[])('preserves supplied WEO values under control changes: %j', params => {
    const changed=runPipeline(input,params);
    expect(changed.baseline_v1.filter(r=>r.years<=h)).toEqual(result.baseline_v1.filter(r=>r.years<=h));
    expect(changed.fiscal.filter(r=>r.years<=h)).toEqual(result.fiscal.filter(r=>r.years<=h));
    expect(changed.interest_rate.filter(r=>r.years<=h)).toEqual(result.interest_rate.filter(r=>r.years<=h));
    expect(changed.fiscal.filter(r=>r.years>h)).not.toEqual(result.fiscal.filter(r=>r.years>h));
  });

  it('applies the independently checked nonzero target-60 prior-year adjustment', () => {
    const out=runPipeline(input,{debt_target:60});
    const row={...out.baseline_v1.find(r=>r.years===first)!,...out.fiscal.find(r=>r.years===first)!};
    for(const line of fixture('UGA-full-horizon-target60.csv').trim().split(/\r?\n/).slice(1)) {
      const [field,value]=line.split(','); near((row as unknown as Record<string,number>)[field!]!,Number(value));
    }
  });

  it('uses original calendar ratios and the new cumulative index anchor', () => {
    const scenario='Hot';
    const loss=new Map(input.climate.filter(r=>r.climate_scenario===scenario).map(r=>[r.years,r.gdp_loss_percent]));
    const rows=buildClimateVariation(input.climate,input.iso3c,scenario,h);
    let product=1;
    for(const row of rows.filter(r=>r.years>h)) product*=1+row.climate_variation/100;
    near(product,(100+loss.get(rows.at(-1)!.years)!)/(100+loss.get(h)!));
  });

  it('honors the explicit start with leading zero shocks and a first-year discrete risk', () => {
    const variation=buildClimateVariation(input.climate,input.iso3c,'Hot',h).map(r=>r.years===first ? {...r,climate_variation:0} : r);
    const out=calcClimateScenario(result.fiscal,result.baseline_v1,result.interest_rate,variation,{
      climateStartYear:first,dataRisk:[{years:first,revenue_risk:1,expenditure_risk:0}],
    });
    const b=result.fiscal.find(r=>r.years===first)!; const g=result.baseline_v1.find(r=>r.years===first)!;
    near(out.find(r=>r.years===first)!.revenue,b.revenue+g.nominal_gdp/100);
  });

  it('does not infer an earlier start from an all-zero climate slice', () => {
    const copy=structuredClone(input); copy.climate=copy.climate.map(r=>({...r,gdp_loss_percent:0}));
    const zero=runPipeline(copy);
    for(const rows of Object.values(zero.climate)) for(const f of result.fiscal.filter(r=>r.years<=h)) {
      near(rows.find(r=>r.years===f.years)!.debt,f.debt);
    }
    near(zero.climate.Paris!.find(r=>r.years===first)!.debt,result.fiscal.find(r=>r.years===first)!.debt);
  });

  it('retains later source rows while explicitly shortening an incomplete fiscal window', () => {
    const copy=structuredClone(input); copy.macrofiscal.find(r=>r.years===h)!.debt=null;
    const prepared=applyPolicy(copy); const out=runPipeline(prepared);
    expect(copy.macrofiscal.at(-1)!.years).toBe(h);
    expect(out.horizonPolicy!.weoMaxYear).toBe(h-1);
    expect(out.horizonPolicy!.coverageStatus).toBe('shorter');
  });

  it('rejects unsupported profile identities instead of silently running legacy', () => {
    const unknown=JSON.parse(JSON.stringify(input)) as CountryInput;
    Object.assign(unknown.horizonPolicy!,{id:'future-unknown'});
    expect(()=>runPipeline(unknown)).toThrow(/Unknown calculation policy/);
    const wrongRevision=structuredClone(input); wrongRevision.horizonPolicy!.dataRevision='weo-2024-10';
    expect(()=>runPipeline(wrongRevision)).toThrow(/revision/);
  });

  it('rejects unsupported history and stale timing metadata', () => {
    const missing=structuredClone(input); missing.macrofiscal.find(r=>r.years===2009)!.debt=null;
    expect(()=>runPipeline(applyPolicy(missing))).toThrow(/Incomplete WEO/);
    const stale=structuredClone(input); stale.horizonPolicy!.climateStartYear=first-1;
    expect(()=>runPipeline(stale)).toThrow(/metadata mismatch/);
  });
});
