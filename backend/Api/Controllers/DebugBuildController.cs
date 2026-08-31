using Microsoft.AspNetCore.Mvc;

namespace AeroTravel.Api.Controllers;

/// TEMPORARY — diagnostic-only, added to pin down a Railway prod deploy discrepancy where
/// /api/v1/admin/flights and /api/v1/admin/passengers 404 despite the dashboard showing a fresh
/// deploy of the commit that contains them. Delete this file once that's resolved — it is not
/// meant to stay in the codebase.
[Route("api/v1/_debug/build")]
public class DebugBuildController : ControllerBase
{
    // Hardcoded per-commit marker (not a computed git SHA — avoids the chicken-and-egg problem of
    // a commit hash depending on its own file contents). Regenerated any time this diagnostic is
    // redeployed; compare what this endpoint returns against what's expected for the commit just pushed.
    private const string BuildMarker = "25140b411a6f196a";

    [HttpGet]
    public IActionResult Get() => Ok(new { buildMarker = BuildMarker, utcNow = DateTime.UtcNow });
}
