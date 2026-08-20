using AeroTravel.Api.Common;
using AeroTravel.Application.Features.Content.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers.Public;

// See PublicCatalogController.cs for why: header-only Cache-Control, no server-side caching.
[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
[Route("api/v1/public/testimonials")]
public class PublicTestimonialsController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? locale, CancellationToken ct)
        => (await Mediator.Send(new ListPublicTestimonialsQuery(ParseLocale(locale)), ct)).ToActionResult().Result ?? NoContent();
}

[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
[Route("api/v1/public/faq")]
public class PublicFaqController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? locale, CancellationToken ct)
        => (await Mediator.Send(new ListPublicFaqQuery(ParseLocale(locale)), ct)).ToActionResult().Result ?? NoContent();
}

[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
[Route("api/v1/public/site-content")]
public class PublicSiteContentController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpGet("{key}")]
    public async Task<IActionResult> GetByKey(string key, [FromQuery] string? locale, CancellationToken ct)
        => (await Mediator.Send(new GetPublicSiteContentByKeyQuery(key, ParseLocale(locale)), ct)).ToActionResult().Result ?? NoContent();
}
