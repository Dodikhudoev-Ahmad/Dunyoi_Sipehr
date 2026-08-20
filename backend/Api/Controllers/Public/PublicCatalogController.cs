using AeroTravel.Api.Common;
using AeroTravel.Application.Features.Cities.Queries;
using AeroTravel.Application.Features.Countries.Queries;
using AeroTravel.Application.Features.Destinations.Queries;
using AeroTravel.Application.Features.Offers.Queries;
using AeroTravel.Application.Features.Services.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers.Public;

[Route("api/v1/public/countries")]
public class PublicCountriesController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? locale, CancellationToken ct)
        => (await Mediator.Send(new ListPublicCountriesQuery(ParseLocale(locale)), ct)).ToActionResult().Result ?? NoContent();
}

[Route("api/v1/public/cities")]
public class PublicCitiesController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? locale, [FromQuery] Guid? countryId, CancellationToken ct)
        => (await Mediator.Send(new ListPublicCitiesQuery(ParseLocale(locale), countryId), ct)).ToActionResult().Result ?? NoContent();
}

[Route("api/v1/public/destinations")]
public class PublicDestinationsController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? locale, [FromQuery] bool? featured, [FromQuery] Guid? cityId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
        => (await Mediator.Send(new ListPublicDestinationsQuery(ParseLocale(locale), featured, cityId, page, pageSize), ct)).ToActionResult().Result ?? NoContent();

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, [FromQuery] string? locale, CancellationToken ct)
        => (await Mediator.Send(new GetPublicDestinationBySlugQuery(slug, ParseLocale(locale)), ct)).ToActionResult().Result ?? NoContent();
}

[Route("api/v1/public/services")]
public class PublicServicesController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? locale, CancellationToken ct)
        => (await Mediator.Send(new ListPublicServicesQuery(ParseLocale(locale)), ct)).ToActionResult().Result ?? NoContent();
}

[Route("api/v1/public/offers")]
public class PublicOffersController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? locale, [FromQuery] Guid? destinationId, [FromQuery] bool? featured,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
        => (await Mediator.Send(new ListPublicOffersQuery(ParseLocale(locale), destinationId, featured, page, pageSize), ct)).ToActionResult().Result ?? NoContent();

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, [FromQuery] string? locale, CancellationToken ct)
        => (await Mediator.Send(new GetPublicOfferBySlugQuery(slug, ParseLocale(locale)), ct)).ToActionResult().Result ?? NoContent();
}
