using AeroTravel.Application.Common.Interfaces;
using ClosedXML.Excel;

namespace AeroTravel.Infrastructure.Files;

public class ClosedXmlExportService : IExcelExportService
{
    public byte[] GenerateXlsx(string sheetName, IReadOnlyList<string> headers, IReadOnlyList<IReadOnlyList<object?>> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(sheetName);

        for (var col = 0; col < headers.Count; col++)
        {
            var cell = sheet.Cell(1, col + 1);
            cell.Value = headers[col];
            cell.Style.Font.Bold = true;
        }

        for (var row = 0; row < rows.Count; row++)
        {
            var rowData = rows[row];
            for (var col = 0; col < rowData.Count; col++)
            {
                var cell = sheet.Cell(row + 2, col + 1);
                SetCellValue(cell, rowData[col]);
            }
        }

        sheet.Columns().AdjustToContents();
        sheet.SheetView.FreezeRows(1);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void SetCellValue(IXLCell cell, object? value)
    {
        switch (value)
        {
            case null:
                cell.Value = string.Empty;
                break;
            case DateTime dateTime:
                cell.Value = dateTime;
                cell.Style.DateFormat.Format = "dd.MM.yyyy HH:mm";
                break;
            case DateOnly dateOnly:
                cell.Value = dateOnly.ToDateTime(TimeOnly.MinValue);
                cell.Style.DateFormat.Format = "dd.MM.yyyy";
                break;
            case decimal dec:
                cell.Value = dec;
                break;
            case int i:
                cell.Value = i;
                break;
            default:
                cell.Value = value.ToString();
                break;
        }
    }
}
