using MusicPlatform.WebAdmin.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDistributedMemoryCache();

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

var app = builder.Build();

app.UseSession();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/config", (IConfiguration configuration) =>
{
    return new
    {
        apiBaseUrl = configuration["ApiBaseUrl"]
    };
});

app.MapGet("/api/language", (HttpContext context) =>
{
    var language = Language.Normalize(
        context.Session.GetString(Language.SessionKey));

    return new LanguageResponse(
        language,
        Language.GetTitle(language));
});

app.MapPost("/api/language", (LanguageRequest request, HttpContext context) =>
{
    var language = Language.Normalize(request.Language);

    context.Session.SetString(
        Language.SessionKey,
        language);

    return new LanguageResponse(
        language,
        Language.GetTitle(language));
});

app.Run();

record LanguageRequest(string? Language);
record LanguageResponse(string Language, string Title);