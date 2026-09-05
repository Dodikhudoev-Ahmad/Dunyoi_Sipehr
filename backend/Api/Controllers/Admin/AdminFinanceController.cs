using AeroTravel.Api.Common;
using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Application.Features.Finance.Commands;
using AeroTravel.Application.Features.Finance.Dtos;
using AeroTravel.Application.Features.Finance.Queries;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers.Admin;

/// Finance module — the one section an Accountant can reach. Restricted to Accountant+SuperAdmin
/// (the inverse of every other admin controller, which now excludes Accountant explicitly).
[Route("api/v1/admin/finance")]
[Authorize(Roles = nameof(AdminRole.Accountant) + "," + nameof(AdminRole.SuperAdmin))]
public class AdminFinanceController(ISender mediator, ICurrentUserService currentUser) : AdminApiControllerBase(mediator, currentUser)
{
    [HttpGet("transactions")]
    public async Task<IActionResult> ListTransactions(
        [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, [FromQuery] string? type,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null, CancellationToken ct = default)
        => (await Mediator.Send(new ListFinanceTransactionsQuery(fromDate, toDate, type, page, pageSize, sortBy, sortDir), ct)).ToActionResult().Result!;

    [HttpGet("transactions/export")]
    public async Task<IActionResult> Export([FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, [FromQuery] string? type, CancellationToken ct = default)
    {
        var result = await Mediator.Send(new ExportFinanceTransactionsQuery(fromDate, toDate, type), ct);
        if (result.IsFailure) return result.ToActionResult().Result!;

        var fileName = $"finance-{DateTime.UtcNow:yyyy-MM-dd}.xlsx";
        return File(result.Value, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct)
        => (await Mediator.Send(new GetFinanceSummaryQuery(fromDate, toDate), ct)).ToActionResult().Result!;

    [HttpGet("receivables")]
    public async Task<IActionResult> Receivables([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
        => (await Mediator.Send(new ListReceivablesQuery(page, pageSize), ct)).ToActionResult().Result!;

    [HttpGet("report/flights")]
    public async Task<IActionResult> FlightReport([FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct)
        => (await Mediator.Send(new GetFinanceFlightReportQuery(fromDate, toDate), ct)).ToActionResult().Result!;

    [HttpGet("monthly-series")]
    public async Task<IActionResult> MonthlySeries([FromQuery] int months = 6, CancellationToken ct = default)
        => (await Mediator.Send(new GetFinanceMonthlySeriesQuery(months), ct)).ToActionResult().Result!;

    [HttpGet("lookup/flights")]
    public async Task<IActionResult> FlightsLookup(CancellationToken ct)
        => (await Mediator.Send(new GetFinanceFlightsLookupQuery(), ct)).ToActionResult().Result!;

    [HttpGet("lookup/flights-for-client")]
    public async Task<IActionResult> FlightsForClient([FromQuery] Guid? travelRequestId, [FromQuery] string? clientName, CancellationToken ct)
        => (await Mediator.Send(new GetFinanceFlightsForClientQuery(travelRequestId, clientName), ct)).ToActionResult().Result!;

    [HttpGet("lookup/travel-requests")]
    public async Task<IActionResult> TravelRequestsLookup([FromQuery] string? search, CancellationToken ct = default)
        => (await Mediator.Send(new GetFinanceTravelRequestsLookupQuery(search), ct)).ToActionResult().Result!;

    [HttpPost("payments")]
    public async Task<IActionResult> CreatePayment([FromBody] UpsertPaymentInput input, CancellationToken ct)
    {
        var result = await Mediator.Send(new CreatePaymentCommand(input, CurrentAdminUserId), ct);
        return result.IsSuccess ? Ok(new { id = result.Value }) : result.ToActionResult().Result!;
    }

    [HttpDelete("payments/{id:guid}")]
    public async Task<IActionResult> DeletePayment(Guid id, CancellationToken ct)
        => (await Mediator.Send(new DeletePaymentCommand(id, CurrentAdminUserId), ct)).ToActionResult();

    [HttpPost("expenses")]
    public async Task<IActionResult> CreateExpense([FromBody] UpsertExpenseInput input, CancellationToken ct)
    {
        var result = await Mediator.Send(new CreateExpenseCommand(input, CurrentAdminUserId), ct);
        return result.IsSuccess ? Ok(new { id = result.Value }) : result.ToActionResult().Result!;
    }

    [HttpDelete("expenses/{id:guid}")]
    public async Task<IActionResult> DeleteExpense(Guid id, CancellationToken ct)
        => (await Mediator.Send(new DeleteExpenseCommand(id, CurrentAdminUserId), ct)).ToActionResult();
}
