using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.Services;
using WebBanGiay.API.Repositories.Interfaces;
using WebBanGiay.API.Middleware;

namespace WebBanGiay.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, IUserRepository userRepository, ILogger<AuthController> logger)
    {
        _authService = authService;
        _userRepository = userRepository;
        _logger = logger;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetProfile()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (userId == 0)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            var user = await _authService.GetProfileAsync(userId);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileDto request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (userId == 0)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            var user = await _authService.UpdateProfileAsync(userId, request);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("check/{email}")]
    [AllowAnonymous]
    public async Task<ActionResult> CheckUserStatus(string email)
    {
        try
        {
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
            {
                return Ok(new { found = false, message = "User not found in database" });
            }

            return Ok(new 
            { 
                found = true, 
                email = user.Email,
                fullName = user.FullName,
                isActive = user.IsActive,
                role = user.Role,
                phone = user.Phone,
                id = user.Id
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error checking user: {ex.Message}");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Request password reset - generates token
    /// POST /api/auth/forgot-password
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordDto request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { message = "Email is required" });
            }

            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null)
            {
                // Don't reveal if user exists or not for security
                return Ok(new { message = "If that email exists, a reset link has been sent." });
            }

            // Generate secure token
            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                .Replace("+", "-").Replace("/", "_").Substring(0, 22);
            
            user.ResetToken = token;
            user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1); // Token valid for 1 hour
            
            await _userRepository.UpdateAsync(user);

            // In production, send email here. For demo, return token directly.
            _logger.LogInformation($"Password reset requested for: {request.Email}, Token: {token}");

            return Ok(new { 
                message = "Password reset link has been sent to your email.",
                // DEMO ONLY - Remove in production
                resetToken = token,
                resetLink = $"/reset-password?token={token}&email={request.Email}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error requesting password reset: {ex.Message}");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Reset password with token
    /// POST /api/auth/reset-password
    /// </summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDto request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email) || 
                string.IsNullOrWhiteSpace(request.Token) || 
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "Email, token, and new password are required" });
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters" });
            }

            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null)
            {
                return BadRequest(new { message = "Invalid reset request" });
            }

            // Verify token
            if (user.ResetToken != request.Token)
            {
                return BadRequest(new { message = "Invalid or expired reset token" });
            }

            // Check expiry
            if (user.ResetTokenExpiry == null || user.ResetTokenExpiry < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Reset token has expired. Please request a new one." });
            }

            // Reset password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.ResetToken = null;
            user.ResetTokenExpiry = null;
            user.IsActive = true;

            await _userRepository.UpdateAsync(user);

            _logger.LogInformation($"Password reset successfully for user: {request.Email}");

            return Ok(new { message = "Password has been reset successfully. You can now login." });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error resetting password: {ex.Message}");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("set-admin/{email}")]
    [Authorize]
    [RequireAdmin]
    public async Task<ActionResult> SetAdmin(string email)
    {
        try
        {
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            user.Role = WebBanGiay.API.Models.UserRole.Admin;
            await _userRepository.UpdateAsync(user);

            _logger.LogInformation($"User {email} has been set as Admin");

            return Ok(new { message = $"User {email} is now Admin", role = user.Role.ToString() });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error setting admin: {ex.Message}");
            return BadRequest(new { error = ex.Message });
        }
    }
}
