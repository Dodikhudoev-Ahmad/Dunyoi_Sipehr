using System.Text;
using System.Threading.RateLimiting;
using AeroTravel.Api.Common;
using AeroTravel.Application;
using AeroTravel.Infrastructure;
using AeroTravel.Infrastructure.Persistence;
using AeroTravel.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ---- Serilog structured logging ----
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// ---- Application / Infrastructure ----
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);

// Enums (Currency, Locale, TravelRequestStatus, …) serialize as their string names, not raw
// ordinals — matches the domain model and every frontend type declared against string unions.
builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddOpenApi();

// ---- JWT auth. Mirrors the signing settings JwtTokenGenerator (Infrastructure/Auth/AuthServices.cs)
// uses: same secret source, issuer, audience. Jwt__Secret env var per BLOCKERS.md BLK-002; the
// literal below is a dev-only fallback, never a real secret. ----
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? Environment.GetEnvironmentVariable("Jwt__Secret")
    ?? "dev-only-insecure-signing-key-change-me-1234567890";
builder.Configuration["Jwt:Secret"] = jwtSecret;
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AeroTravel";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AeroTravel";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });
builder.Services.AddAuthorization();

// ---- CORS ----
// In Development, Vite's dev port drifts (5173, 5174, ...) whenever another process already
// holds the default port, so any localhost/127.0.0.1 origin is accepted regardless of port.
// Production stays strictly config-driven via Cors:AllowedOrigins (see BLK-003).
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(origin =>
                Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
                (uri.Host == "localhost" || uri.Host == "127.0.0.1"));
        }
        else
        {
            policy.WithOrigins(allowedOrigins);
        }
    });
});

// ---- Rate limiting (DEC-004): fixed-window per-IP limiter applied to public travel-request
// submission and admin login. ----
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Final form submission — deliberately tight (1/min pending CAPTCHA post-domain). Kept
    // separate from the photo-upload policy below: they used to share one "travel-requests"
    // policy at the controller level, which meant a legitimate multi-step submission (upload a
    // photo, then submit) was two requests against a 1/min limit — the second one always got
    // rejected with 429, breaking the form for every real visitor, not just abusers.
    options.AddPolicy("travel-request-submit", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 1,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        }));

    // Passport-photo upload — a real submission needs exactly 1 (MaxPassportPhotos) plus room
    // for a retry after a network hiccup, so 5/min still comfortably covers legitimate use while
    // capping how many files an abuser can write per minute.
    options.AddPolicy("travel-request-photo-upload", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        }));

    options.AddPolicy("login", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        }));

    // Bootstrap self-disables once one AdminUser exists (DEC-010), but until that first admin is
    // created it's an unauthenticated endpoint — tighter than login since a real deployment only
    // ever needs to call it once.
    options.AddPolicy("bootstrap", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        }));
});

// ---- Response compression: every JSON API response gzip/brotli-compressed. `application/json`
// is already in ResponseCompressionDefaults.MimeTypes, so no extra MIME config is needed.
// EnableForHttps=true is safe here — this is a JSON data API (catalog reads, auth via Bearer
// header, no per-session secret ever reflected into a compressible HTML body), not the
// HTML+embedded-CSRF-token shape BREACH actually targets. ----
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

// ---- Health checks ----
var connectionString = builder.Configuration["ConnectionStrings:Default"]
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? "Host=localhost;Port=5432;Database=aerotravel;Username=postgres;Password=postgres";
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString, name: "postgres");

// ---- Swagger (Development only) ----
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "AeroTravel API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
    });
    options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", null),
            new List<string>()
        }
    });
});

var app = builder.Build();

// ---- Schema migration: applied on every startup, all environments. Previously this only ran
// inside DevSeeder.SeedAsync, which is gated to Development — Production (Railway, BLK-001) never
// got a schema at all on first deploy. See docs/DECISIONS.md DEC-008. ----
using (var migrationScope = app.Services.CreateScope())
{
    var migrationDb = migrationScope.ServiceProvider.GetRequiredService<AppDbContext>();
    await migrationDb.Database.MigrateAsync();
}

// ---- Dev-only seed data (never runs outside Development; see DevSeeder for details) ----
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DevSeeder.SeedAsync(db);
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", "AeroTravel API v1"));
}

app.UseHttpsRedirection();

app.UseResponseCompression();

app.UseCors("Default");

app.UseAuthentication();
app.UseAuthorization();

app.UseRateLimiter();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

public partial class Program;
