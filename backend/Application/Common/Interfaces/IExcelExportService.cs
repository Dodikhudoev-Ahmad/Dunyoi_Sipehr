namespace AeroTravel.Application.Common.Interfaces;

/// Abstraction over "turn tabular data into an .xlsx file" so Application code never depends on a
/// concrete spreadsheet library directly — same seam pattern as IFileStorageService. Infrastructure
/// implements this with ClosedXML (MIT-licensed; EPPlus was ruled out for its non-free commercial
/// license).
public interface IExcelExportService
{
    /// `rows` cells may be string/decimal/int/DateTime/null — the implementation is responsible
    /// for writing each to a native Excel type where possible (numbers/dates as real cell types,
    /// not text) rather than just stringifying everything.
    byte[] GenerateXlsx(string sheetName, IReadOnlyList<string> headers, IReadOnlyList<IReadOnlyList<object?>> rows);
}
