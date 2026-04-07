using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using MySqlConnector;
using WebBanGiay.API.Data;
using WebBanGiay.API.Repositories.Interfaces;
using WebBanGiay.API.Repositories.Implementations;
using WebBanGiay.API.Observers;
using WebBanGiay.API.Observers.Implementations;
using WebBanGiay.API.Services;
using WebBanGiay.API.Services.Payment;
using WebBanGiay.API.Services.PricingStrategies;
using WebBanGiay.API.Services.Commands;
using WebBanGiay.API.Services.OrderStates;
using WebBanGiay.API.Services.Notifications;
using WebBanGiay.API.Services.Notifications.ExternalProviders;
using WebBanGiay.API.PriceCalculators.Services;
using WebBanGiay.API.Middleware;

using DotNetEnv;

var builder = WebApplication.CreateBuilder(args);

// Load .env from the solution root (parent of API project).
var envCandidates = new[]
{
    Path.Combine(builder.Environment.ContentRootPath, ".env"),
    Path.Combine(builder.Environment.ContentRootPath, "..", ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "..", ".env")
};

foreach (var candidate in envCandidates)
{
    var fullPath = Path.GetFullPath(candidate);
    if (File.Exists(fullPath))
    {
        Env.Load(fullPath);
        break;
    }
}

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
var rawConnectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(rawConnectionString))
{
    throw new InvalidOperationException("Database connection string is not configured. Set DB_CONNECTION_STRING in .env.");
}

// Normalize connection settings to reduce intermittent cloud DB timeout issues.
var connectionBuilder = new MySqlConnectionStringBuilder(rawConnectionString)
{
    SslMode = MySqlSslMode.Required
};

if (connectionBuilder.ConnectionTimeout < 30)
{
    connectionBuilder.ConnectionTimeout = 30;
}

if (connectionBuilder.DefaultCommandTimeout < 60)
{
    connectionBuilder.DefaultCommandTimeout = 60;
}

var connectionString = connectionBuilder.ConnectionString;

// Avoid ServerVersion.AutoDetect because it opens a DB connection and can timeout on cloud providers.
var mysqlServerVersionValue = Environment.GetEnvironmentVariable("DB_SERVER_VERSION")
    ?? builder.Configuration["Database:ServerVersion"]
    ?? "8.0.36-mysql";

if (!ServerVersion.TryParse(mysqlServerVersionValue, out var mysqlServerVersion))
{
    mysqlServerVersion = new MySqlServerVersion(new Version(8, 0, 36));
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, mysqlServerVersion, mysqlOptions =>
    {
        mysqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null);
        mysqlOptions.CommandTimeout(60);
    }));

// Register Repository Pattern with Dependency Injection
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Register Auth Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Register Payment Factory Pattern
builder.Services.AddScoped<IPaymentProcessorFactory, PaymentProcessorFactory>();

// Register Logger Service as Singleton (Pattern 1: Singleton)
builder.Services.AddSingleton<ILoggerService, LoggerService>();

// Register Strategy Pattern - Pricing Context (Pattern 2: Strategy)
builder.Services.AddScoped<IPricingContext, PricingContext>();

// Register Decorator Pattern - Price Calculation Service (Pattern 3: Decorator)
builder.Services.AddTransient<PriceCalculationService>();

// Register Command Pattern (Pattern 4: Command)
builder.Services.AddScoped<ICommandInvoker, CommandInvoker>();

// Register State Pattern - Order Status Management (Pattern 7: State)
builder.Services.AddSingleton<IOrderStateManager, OrderStateManager>();

// Register Adapter Pattern - External Notification Providers (Pattern 6: Adapter)
builder.Services.AddSingleton<ISmtpEmailProvider, SmtpEmailProvider>();
builder.Services.AddSingleton<ITwilioSmsProvider, TwilioSmsProvider>();
builder.Services.AddScoped<SmtpEmailAdapter>();
builder.Services.AddScoped<TwilioSmsAdapter>();
builder.Services.AddScoped<PushNotificationChannel>();
builder.Services.AddScoped<INotificationService, NotificationService>();

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
                  .AllowAnyMethod()
                  .AllowCredentials();
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
