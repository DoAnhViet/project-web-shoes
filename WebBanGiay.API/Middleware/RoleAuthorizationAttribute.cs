using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace WebBanGiay.API.Middleware;

/// <summary>
/// Authorization attribute to require specific role(s) for accessing an endpoint
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class RequireRoleAttribute : Attribute, IAuthorizationFilter
{
    private readonly string[] _roles;

    public RequireRoleAttribute(params string[] roles)
    {
        _roles = roles;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // Check if user is authenticated
        if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Unauthorized. Please login." });
            return;
        }

        // Get user's role from claims
        var userRole = context.HttpContext.User.FindFirst("Role")?.Value;

        if (string.IsNullOrEmpty(userRole))
        {
            context.Result = new ForbidResult();
            return;
        }

        // Check if user has required role
        if (!_roles.Contains(userRole, StringComparer.OrdinalIgnoreCase))
        {
            context.Result = new ObjectResult(new { message = "Forbidden. Insufficient permissions." })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }
}

/// <summary>
/// Authorization attribute to require Admin role
/// </summary>
public class RequireAdminAttribute : RequireRoleAttribute
{
    public RequireAdminAttribute() : base("Admin") { }
}

/// <summary>
/// Authorization attribute to require Customer role
/// </summary>
public class RequireCustomerAttribute : RequireRoleAttribute
{
    public RequireCustomerAttribute() : base("Customer", "Admin") { }
}
