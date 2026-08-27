/**
 * Renders a tab's charts in whichever register each one is showing.
 *
 * Every tab renders its charts through here, so the register control behaves
 * identically everywhere and a tab file contains no chart configuration at all.
 * What a chart shows is decided once, in `charts/specs.ts`, which is also what
 * the export packet reads.
 *
 * Consecutive charts marked `half` are paired into a row, which is how the
 * Baseline tab keeps revenue-and-expenditure beside the two balances.
 */

import { Fragment } from 'react';

import { SpecChart } from './LineChart';
import { CHART_REGISTERS, type ChartRegister } from '../charts/register';
import { specFor, type RegisteredChart } from '../charts/specs';
import type { ChartRegisterState } from '../charts/useChartRegister';

interface Props {
  charts: RegisteredChart[];
  registers: ChartRegisterState;
}

/** Which registers this chart actually offers. A chart may belong to one only. */
function availableRegisters(chart: RegisteredChart): ChartRegister[] {
  return CHART_REGISTERS.filter((r) => specFor(chart, r) != null);
}

function One({ chart, registers }: { chart: RegisteredChart; registers: ChartRegisterState }) {
  const available = availableRegisters(chart);
  const shown = registers.registerFor(chart.id);
  const spec = specFor(chart, shown);
  if (!spec) return null;

  return (
    <SpecChart
      spec={spec}
      register={shown}
      registers={available}
      onRegisterChange={(r) => registers.setFor(chart.id, r)}
      overridden={registers.isOverridden(chart.id)}
      onFollowGlobal={() => registers.followGlobal(chart.id)}
    />
  );
}

export function ChartStack({ charts, registers }: Props) {
  // A chart shows only in the registers it defines. The workbook register keeps
  // charts that carry no single message, because the workbook has them; the
  // briefing register would be diluted by exactly those, which is the point of
  // having two. So a workbook-only chart is absent under Briefing rather than
  // falling back and quietly making the briefing view longer.
  const shown = charts.filter((c) => specFor(c, registers.registerFor(c.id)) != null);

  const rows: RegisteredChart[][] = [];
  for (const chart of shown) {
    const last = rows[rows.length - 1];
    if (chart.half && last?.length === 1 && last[0]!.half) last.push(chart);
    else rows.push([chart]);
  }

  return (
    <>
      {rows.map((row, i) =>
        row.length === 2 ? (
          <div className="chart-row" key={row.map((c) => c.id).join('+')}>
            {row.map((chart) => (
              <One key={chart.id} chart={chart} registers={registers} />
            ))}
          </div>
        ) : (
          <Fragment key={row[0]?.id ?? i}>
            <One chart={row[0]!} registers={registers} />
          </Fragment>
        ),
      )}
    </>
  );
}

/** How many charts in this set are not following the global choice. */
export function overrideCount(
  charts: RegisteredChart[],
  registers: ChartRegisterState,
): number {
  return charts.filter((c) => registers.isOverridden(c.id)).length;
}

export { availableRegisters };
