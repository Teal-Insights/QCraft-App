/**
 * What the engine throws when the source data cannot support a projection.
 *
 * Every message here is duplicated character for character in
 * `packages/qcraft-engine/src/qcraft_engine/errors.py`. The differential harness
 * compares the two engines' failures as strings, so a message is part of the
 * contract and not free text: change one side and the harness fails until the
 * other follows.
 *
 * These exist for the same reason `mustGet` does. A missing key in Python stops
 * the pipeline while a missing key in JavaScript yields `undefined` and poisons
 * the arithmetic; a null *value* behaves the same way, except worse, because
 * `null` coerces to 0 in arithmetic rather than to NaN. That is how Zambia's
 * debt path came out anchored at zero instead of at its real 127 per cent.
 */

/** A country's source data cannot support the projection that was asked for. */
export class QCraftDataError extends Error {
  readonly iso3c: string;
  readonly year: number;
  readonly field: string;

  constructor(message: string, iso3c: string, year: number, field: string) {
    super(message);
    this.name = new.target.name;
    this.iso3c = iso3c;
    this.year = year;
    this.field = field;
    // Restores the prototype chain so `instanceof` survives the ES5 downlevel
    // that `extends Error` otherwise breaks.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * No debt figure in the year the projection starts from.
 *
 * The recursion carries debt forward from the last WEO year, so without that
 * year's debt there is no starting point and nothing downstream is defined.
 * Zambia and Libya are the live cases: the WEO suppresses Zambia's debt
 * projection while its restructuring is unresolved, and carries no debt series
 * for Libya in any year.
 */
export class MissingDebtAnchorError extends QCraftDataError {
  constructor(iso3c: string, year: number, field = 'debt_to_gdp') {
    super(
      `No debt anchor for ${iso3c}: ${field} is missing for ${year}, ` +
        'the last WEO year, which is the year the projection starts from',
      iso3c,
      year,
      field,
    );
  }
}

/**
 * A macrofiscal series the engine reads has a hole inside the WEO window.
 *
 * Distinct from a missing anchor: the projection could start, but one of the
 * aggregates it copies through is absent for a year it does read. Singapore,
 * Samoa and Macao SAR are the live cases, all missing primary expenditure and
 * the interest split that depends on it.
 */
export class MissingMacrofiscalInputError extends QCraftDataError {
  constructor(iso3c: string, year: number, field: string) {
    super(
      `Missing macrofiscal input for ${iso3c}: ${field} is null for ${year}`,
      iso3c,
      year,
      field,
    );
  }
}

/**
 * A year the projection reads has no row at all.
 *
 * Distinct from a null cell: the series simply does not reach back that far.
 * Somalia's WEO record starts in 2011 and Puerto Rico's interest rate has no
 * 2009, while the projection starts at 2009 for every country.
 *
 * This is what `mustGet` throws. The message carries no country code because
 * `mustGet` does not know one, and the Python side matches it exactly.
 */
export class MissingYearError extends QCraftDataError {
  constructor(year: number, field: string) {
    super(`Missing ${field} for year ${year}`, '', year, field);
  }
}
