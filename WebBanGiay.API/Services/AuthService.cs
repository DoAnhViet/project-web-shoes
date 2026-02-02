using WebBanGiay.API.DTOs;
using WebBanGiay.API.Models;
using WebBanGiay.API.Repositories.Interfaces;
using WebBanGiay.API.Services;

namespace WebBanGiay.API.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<UserDto> GetProfileAsync(int userId);
    Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileDto request);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepository,
        ITokenService tokenService,
        ILogger<AuthService> logger
    )
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // Trim whitespace from all inputs
        request.Email = request.Email?.Trim() ?? string.Empty;
        request.Password = request.Password?.Trim() ?? string.Empty;
        request.FullName = request.FullName?.Trim() ?? string.Empty;
        request.Phone = request.Phone?.Trim() ?? string.Empty;
        request.Address = request.Address?.Trim() ?? string.Empty;

        // Validate input
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Email and password are required");
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ArgumentException("Full name is required");
        }

        if (string.IsNullOrWhiteSpace(request.Phone))
        {
            throw new ArgumentException("Phone number is required");
        }

        // Validate phone: 10-12 digits only
        var phoneDigitsOnly = System.Text.RegularExpressions.Regex.Replace(request.Phone, @"\D", "");
        if (phoneDigitsOnly.Length < 10 || phoneDigitsOnly.Length > 12)
        {
            throw new ArgumentException("Phone number must be 10-12 digits");
        }

        if (string.IsNullOrWhiteSpace(request.Address))
        {
            throw new ArgumentException("Address is required");
        }

        // Check if user already exists
        if (await _userRepository.ExistsAsync(request.Email))
        {
            throw new InvalidOperationException("Email already registered");
        }

        // Create new user
        var user = new User
        {
            Email = request.Email,
            FullName = request.FullName,
            Phone = request.Phone,
            Address = request.Address,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true
        };

        var createdUser = await _userRepository.CreateAsync(user);
        var token = _tokenService.GenerateToken(createdUser.Id, createdUser.Email, createdUser.Role);

        _logger.LogInformation($"User registered: {createdUser.Email}");

        return new AuthResponseDto
        {
            User = MapToUserDto(createdUser),
            Token = token
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        // Trim whitespace from inputs
        request.Email = request.Email?.Trim() ?? string.Empty;
        request.Password = request.Password?.Trim() ?? string.Empty;

        _logger.LogInformation($"Login attempt for email: {request.Email}");

        var user = await _userRepository.GetByEmailAsync(request.Email);

        if (user == null)
        {
            _logger.LogWarning($"Login failed: User not found for email {request.Email}");
            throw new InvalidOperationException("Invalid email or password");
        }

        _logger.LogInformation($"User found: {user.Email}, IsActive: {user.IsActive}");

        var passwordVerified = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        _logger.LogInformation($"Password verification result: {passwordVerified}");

        if (!passwordVerified)
        {
            _logger.LogWarning($"Login failed: Invalid password for {request.Email}");
            throw new InvalidOperationException("Invalid email or password");
        }

        if (!user.IsActive)
        {
            _logger.LogWarning($"Login failed: User account not active for {request.Email}");
            throw new InvalidOperationException("User account is not active");
        }

        var token = _tokenService.GenerateToken(user.Id, user.Email, user.Role);

        _logger.LogInformation($"User logged in: {user.Email}");

        return new AuthResponseDto
        {
            User = MapToUserDto(user),
            Token = token
        };
    }

    public async Task<UserDto> GetProfileAsync(int userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        return MapToUserDto(user);
    }

    public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileDto request)
    {
        // Trim whitespace from inputs
        request.FullName = request.FullName?.Trim() ?? string.Empty;
        request.Phone = request.Phone?.Trim();
        request.Address = request.Address?.Trim();

        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        user.FullName = request.FullName ?? user.FullName;
        user.Phone = request.Phone ?? user.Phone;
        user.Address = request.Address ?? user.Address;

        await _userRepository.UpdateAsync(user);

        _logger.LogInformation($"User profile updated: {user.Email}");

        return MapToUserDto(user);
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Address = user.Address,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt
        };
    }
}
