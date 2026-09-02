using AeroTravel.Api.Common;
using AeroTravel.Application.Features.Auth.Commands;
using AeroTravel.Application.Features.Auth.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AeroTravel.Api.Controllers;

[Route("api/v1/auth")]
public class AuthController(ISender mediator, IWebHostEnvironment env) : ApiControllerBase(mediator)
{
    private const string RefreshCookieName = "refreshToken";

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        if (result.IsFailure)
            return result.ToActionResult().Result!;

        SetRefreshCookie(result.Value.RefreshToken);
        return Ok(new { result.Value.AccessToken, result.Value.ExpiresAtUtc, result.Value.Admin });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        var rawToken = Request.Cookies[RefreshCookieName] ?? string.Empty;
        var result = await Mediator.Send(new RefreshTokenCommand(rawToken), ct);
        if (result.IsFailure)
            return result.ToActionResult().Result!;

        SetRefreshCookie(result.Value.RefreshToken);
        return Ok(new { result.Value.AccessToken, result.Value.ExpiresAtUtc });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var rawToken = Request.Cookies[RefreshCookieName] ?? string.Empty;
        await Mediator.Send(new LogoutCommand(rawToken), ct);
        Response.Cookies.Delete(RefreshCookieName);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken ct)
        => (await Mediator.Send(new MeQuery(), ct)).ToActionResult().Result ?? NoContent();

    [HttpPost("bootstrap")]
    [EnableRateLimiting("bootstrap")]
    public async Task<IActionResult> Bootstrap([FromBody] BootstrapAdminCommand command, CancellationToken ct)
        => (await Mediator.Send(command, ct)).ToActionResult().Result ?? NoContent();

    private void SetRefreshCookie(string rawToken)
    {
        // Secure cookies are silently dropped by browsers on a plain-http origin. The dev
        // frontend talks to the API over http://localhost by default (frontend/.env.example),
        // so Secure must be conditional on the request scheme rather than hardcoded true —
        // otherwise the refresh cookie never persists locally and sessions die with the
        // access token (see docs/PROGRESS.md).
        var isSecureContext = env.IsProduction() || Request.IsHttps;
        Response.Cookies.Append(RefreshCookieName, rawToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = isSecureContext,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(30),
        });
    }
}
