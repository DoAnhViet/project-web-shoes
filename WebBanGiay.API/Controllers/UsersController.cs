using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.Middleware;
using WebBanGiay.API.Models;
using WebBanGiay.API.Repositories.Interfaces;

namespace WebBanGiay.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserRepository userRepository, ILogger<UsersController> logger)
    {
        _userRepository = userRepository;
        _logger = logger;
    }

    [HttpGet]
    [Authorize]
    [RequireAdmin]
    public async Task<ActionResult<List<AdminUserDto>>> GetUsers()
    {
        try
        {
            var users = await _userRepository.GetAllAsync();
            return Ok(users.Select(MapToAdminUserDto).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while fetching users");
            return StatusCode(500, new { message = "Error while fetching users" });
        }
    }

    [HttpPost]
    [Authorize]
    [RequireAdmin]
    public async Task<ActionResult<AdminUserDto>> CreateUser([FromBody] CreateUserByAdminDto request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest(new { message = "Request body is required" });
            }

            request.Email = request.Email?.Trim() ?? string.Empty;
            request.FullName = request.FullName?.Trim() ?? string.Empty;
            request.Password = request.Password?.Trim() ?? string.Empty;
            request.Phone = request.Phone?.Trim();
            request.Address = request.Address?.Trim();

            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new { message = "Full name and email are required" });
            }

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters" });
            }

            if (await _userRepository.ExistsAsync(request.Email))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            if (!TryParseRole(request.Role, out var role))
            {
                return BadRequest(new { message = "Role must be Admin or Customer" });
            }

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Phone = request.Phone,
                Address = request.Address,
                Role = role,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdUser = await _userRepository.CreateAsync(user);
            return CreatedAtAction(nameof(GetUsers), new { id = createdUser.Id }, MapToAdminUserDto(createdUser));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while creating user");
            return StatusCode(500, new { message = "Error while creating user" });
        }
    }

    [HttpPatch("{id:int}/role")]
    [Authorize]
    [RequireAdmin]
    public async Task<ActionResult<AdminUserDto>> UpdateUserRole(int id, [FromBody] UpdateUserRoleDto request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Role))
            {
                return BadRequest(new { message = "Role is required" });
            }

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (!TryParseRole(request.Role, out var parsedRole))
            {
                return BadRequest(new { message = "Role must be Admin or Customer" });
            }

            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (currentUserId == user.Id && parsedRole != UserRole.Admin)
            {
                return BadRequest(new { message = "You cannot remove your own admin role" });
            }

            user.Role = parsedRole;
            var updated = await _userRepository.UpdateAsync(user);

            return Ok(MapToAdminUserDto(updated));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while updating role for user {UserId}", id);
            return StatusCode(500, new { message = "Error while updating user role" });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize]
    [RequireAdmin]
    public async Task<ActionResult<AdminUserDto>> UpdateUser(int id, [FromBody] UpdateUserByAdminDto request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest(new { message = "Request body is required" });
            }

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                if (!TryParseRole(request.Role, out var parsedRole))
                {
                    return BadRequest(new { message = "Role must be Admin or Customer" });
                }

                if (currentUserId == user.Id && parsedRole != UserRole.Admin)
                {
                    return BadRequest(new { message = "You cannot remove your own admin role" });
                }

                user.Role = parsedRole;
            }

            if (request.IsActive.HasValue)
            {
                if (currentUserId == user.Id && request.IsActive.Value == false)
                {
                    return BadRequest(new { message = "You cannot lock your own account" });
                }

                user.IsActive = request.IsActive.Value;
            }

            if (!string.IsNullOrWhiteSpace(request.FullName))
            {
                user.FullName = request.FullName.Trim();
            }

            user.Phone = request.Phone?.Trim();
            user.Address = request.Address?.Trim();

            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                if (request.Password.Trim().Length < 6)
                {
                    return BadRequest(new { message = "Password must be at least 6 characters" });
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim());
            }

            var updated = await _userRepository.UpdateAsync(user);
            return Ok(MapToAdminUserDto(updated));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while updating user {UserId}", id);
            return StatusCode(500, new { message = "Error while updating user" });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    [RequireAdmin]
    public async Task<ActionResult> DeleteUser(int id)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (currentUserId == id)
            {
                return BadRequest(new { message = "You cannot delete your own account" });
            }

            var deleted = await _userRepository.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new { message = "User not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while deleting user {UserId}", id);
            return StatusCode(500, new { message = "Error while deleting user" });
        }
    }

    private static bool TryParseRole(string roleValue, out UserRole role)
    {
        role = UserRole.Customer;

        if (int.TryParse(roleValue, out var roleAsInt) && Enum.IsDefined(typeof(UserRole), roleAsInt))
        {
            role = (UserRole)roleAsInt;
            return true;
        }

        return Enum.TryParse(roleValue, true, out role);
    }

    private static AdminUserDto MapToAdminUserDto(User user)
    {
        return new AdminUserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Address = user.Address,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }
}
