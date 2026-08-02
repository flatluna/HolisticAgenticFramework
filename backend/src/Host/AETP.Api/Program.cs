using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using AETP.Modules.ClientEngagement.Infrastructure;
using AETP.Modules.Strategy.Infrastructure;
using AETP.Modules.Capability.Infrastructure;
using AETP.Modules.Process.Infrastructure;
using AETP.Modules.Decision.Infrastructure;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog logging
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Add Microsoft Identity Web
builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration, "AzureAd");

// Add DbContexts
builder.Services.AddDbContext<ClientEngagementDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<StrategyDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<CapabilityDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<ProcessDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<DecisionDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocal", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Apply migrations at startup
using (var scope = app.Services.CreateScope())
{
    var clientEngagementDb = scope.ServiceProvider.GetRequiredService<ClientEngagementDbContext>();
    var strategyDb = scope.ServiceProvider.GetRequiredService<StrategyDbContext>();

    // Uncomment to apply migrations (if DB exists)
    // clientEngagementDb.Database.Migrate();
    // strategyDb.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowLocal");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
