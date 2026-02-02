using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WebBanGiay.API.Data;
using WebBanGiay.API.Repositories.Interfaces;
using WebBanGiay.API.Repositories.Implementations;
using WebBanGiay.API.Observers;
using WebBanGiay.API.Observers.Implementations;
using WebBanGiay.API.Services;
using WebBanGiay.API.Middleware;
using DotNetEnv;

// Load .env file from parent directory
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "WebBanGiay API",
        Version = "v1",
        Description = "API để quản lý cửa hàng bán giày",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Admin",
            Email = "admin@webbangiay.com"
        }
    });
});

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "your-secret-key-min-32-chars-long!";
var key = Encoding.ASCII.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// Configure MySQL connection from environment variable
var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING") 
    ?? builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Register Repository Pattern with Dependency Injection
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Register Auth Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Register Logger Service as Singleton
builder.Services.AddSingleton<ILoggerService, LoggerService>();

// Register Observer Pattern
// ReviewSubject is a singleton to maintain observer subscriptions across requests
builder.Services.AddSingleton<ReviewSubject>();
// UpdateProductRatingObserver is scoped to ensure it uses the correct DbContext
builder.Services.AddScoped<UpdateProductRatingObserver>();

// Register and initialize observer
builder.Services.AddScoped(provider =>
{
    var subject = provider.GetRequiredService<ReviewSubject>();
    var observer = provider.GetRequiredService<UpdateProductRatingObserver>();
    subject.Subscribe(observer);
    return observer;
});

// Configure CORS for React app
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:5174")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "WebBanGiay API v1");
    c.RoutePrefix = "swagger"; // Swagger UI at /swagger
});

// Comment out HTTPS redirection for development
// app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

// Global exception handling middleware
app.UseExceptionHandling();

// JWT middleware for logging and custom processing
app.UseJwtMiddleware();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
