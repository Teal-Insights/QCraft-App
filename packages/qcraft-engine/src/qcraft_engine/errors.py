"""What the engine raises when the source data cannot support a projection.

Every message in this module is duplicated character for character in
`packages/qcraft-engine-ts/src/errors.ts`. The differential harness compares the
two engines' failures as strings, so a message is part of the contract and not
free text: change one side and the harness fails until the other follows.

The fidelity argument for refusing rather than substituting is the workbook's.
`Macrofiscal` row 19 is `=D10/D4*100` and `Baseline` row 36 anchors the whole
2030-2099 recursion on its last WEO column. No IFERROR guards either one. Give
that chain a missing debt figure and every dependent cell reads `#VALUE!`, which
is how the posted workbook ships: Afghanistan is the selected country and its
debt path is `#VALUE!` from end to end. The workbook has no fallback rule to
mirror, so neither does this engine.
"""

from __future__ import annotations


class QCraftDataError(ValueError):
    """A country's source data cannot support the projection that was asked for.

    Subclasses `ValueError` so callers that already catch it keep working, and
    carries the country, year and field as attributes so a caller can build a
    sentence rather than parse one.
    """

    def __init__(self, message: str, *, iso3c: str, year: int, field: str) -> None:
        super().__init__(message)
        self.iso3c = iso3c
        self.year = year
        self.field = field


class MissingDebtAnchorError(QCraftDataError):
    """No debt figure in the year the projection starts from.

    The recursion carries debt forward from the last WEO year, so without that
    year's debt there is no starting point and nothing downstream is defined.
    Zambia and Libya are the live cases: the WEO suppresses Zambia's debt
    projection while its restructuring is unresolved, and carries no debt series
    for Libya in any year.
    """

    def __init__(self, iso3c: str, year: int, field: str = "debt_to_gdp") -> None:
        super().__init__(
            f"No debt anchor for {iso3c}: {field} is missing for {year}, "
            "the last WEO year, which is the year the projection starts from",
            iso3c=iso3c,
            year=year,
            field=field,
        )


class MissingMacrofiscalInputError(QCraftDataError):
    """A macrofiscal series the engine reads has a hole inside the WEO window.

    Distinct from a missing anchor: the projection could start, but one of the
    aggregates it copies through is absent for a year it does read. Singapore,
    Samoa and Macao SAR are the live cases, all missing primary expenditure and
    the interest split that depends on it.
    """

    def __init__(self, iso3c: str, year: int, field: str) -> None:
        super().__init__(
            f"Missing macrofiscal input for {iso3c}: {field} is null for {year}",
            iso3c=iso3c,
            year=year,
            field=field,
        )
