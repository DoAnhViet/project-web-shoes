using System.Security.Claims;

namespace WebBanGiay.API.Middleware;

/// <summary>
/// Middleware to validate JWT token and add user info to HttpContext
/// </summary>
public class JwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<JwtMiddleware> _logger;

    public JwtMiddleware(RequestDelegate next, ILogger<JwtMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

        if (!string.IsNullOrEmpty(token))
        {
            try
            {
                // Token is already validated by JWT Bearer authentication
                // Additional custom logic can be added here if needed
                var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userEmail = context.User.FindFirst(ClaimTypes.Email)?.Value;
                var userRole = context.User.FindFirst("Role")?.Value;

                if (!string.IsNullOrEmpty(userId))
                {
                    _logger.LogInformation($"User authenticated: ID={userId}, Email={userEmail}, Role={userRole}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Token validation error: {ex.Message}");
            }
        }

        await _next(context);
    }
}

/// <summary>
/// Extension method to register JwtMiddleware
/// </summary>
public static class JwtMiddlewareExtensions
{
    public static IApplicationBuilder UseJwtMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<JwtMiddleware>();
    }
}
