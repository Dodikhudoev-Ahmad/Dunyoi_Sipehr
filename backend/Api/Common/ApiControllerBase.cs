using AeroTravel.Application.Common.Interfaces;
using AeroTravel.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Common;

[ApiController]
public abstract class ApiControllerBase(ISender mediator) : ControllerBase
{
    protected ISender Mediator { get; } = mediator;

    /// Resolves the `?locale=ru|tg|en` public-endpoint query param per API_CONTRACT.md, default `ru`.
    protected static Locale ParseLocale(string? locale) =>
        Enum.TryParse<Locale>(locale, ignoreCase: true, out var parsed) ? parsed : Locale.Ru;
}

[ApiController]
public abstract class AdminApiControllerBase(ISender mediator, ICurrentUserService currentUser) : ApiControllerBase(mediator)
{
    protected Guid? CurrentAdminUserId => currentUser.AdminUserId;
}
