/**
 * Y-axis tick formatting, shared by the interactive chart and the export SVG.
 *
 * SI-abbreviates once the numbers get long (real GDP reaches 10^6 LCU billions
 * by 2099 and full digits overflow the left margin), plain digits below that.
 * `~s` alone would render a 0.4pp balance as "400m".
 */

import * as d3 from 'd3';

export const yTickFormat = (raw: d3.NumberValue) => {
  const v = Number(raw);
  return Math.abs(v) >= 10_000 ? d3.format('~s')(v) : d3.format('~f')(v);
};

export const xTickFormat = d3.format('d');
