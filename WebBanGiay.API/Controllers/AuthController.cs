using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.Services;
using WebBanGiay.API.Repositories.Interfaces;

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

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ResetPassword([FromBody] dynamic request)
    {
        try
        {
            var email = request?.email?.ToString();
            var newPassword = "huanvu210"; // Default password

            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(new { message = "Email is required" });
            }

            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Reset password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.IsActive = true;

            await _userRepository.UpdateAsync(user);

            _logger.LogInformation($"Password reset for user: {email}, IsActive set to true");

            return Ok(new { message = $"Password reset to '{newPassword}' and account activated" });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error resetting password: {ex.Message}");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("set-admin/{email}")]
    [AllowAnonymous]
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
