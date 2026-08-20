using AeroTravel.Api.Common;
using AeroTravel.Application.Features.Content.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers.Public;

[Route("api/v1/public/testimonials")]
public class PublicTestimonialsController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? locale, CancellationToken ct)
        => (await Mediator.Send(new ListPublicTestimonialsQuery(ParseLocale(locale)), ct)).ToActionResult().Result ?? NoContent();
}

[Route("api/v1/public/faq")]
public class PublicFaqController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? locale, CancellationToken ct)
        => (await Mediator.Send(new ListPublicFaqQuery(ParseLocale(locale)), ct)).ToActionResult().Result ?? NoContent();
}

[Route("api/v1/public/site-content")]
public class PublicSiteContentController(ISender mediator) : ApiControllerBase(mediator)
{
    [HttpGet("{key}")]
    public async Task<IActionResult> GetByKey(string key, [FromQuery] string? locale, CancellationToken ct)
        => (await Mediator.Send(new GetPublicSiteContentByKeyQuery(key, ParseLocale(locale)), ct)).ToActionResult().Result ?? NoContent();
}
