using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StrategyModel = AETP.Modules.Strategy.Domain.Strategy;
using AETP.Modules.Strategy.Infrastructure;
using AETP.Modules.Strategy.Domain;

namespace AETP.Modules.Strategy.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class StrategiesController : ControllerBase
    {
        private readonly StrategyDbContext _dbContext;
        private readonly ILogger<StrategiesController> _logger;

        public StrategiesController(
            StrategyDbContext dbContext,
            ILogger<StrategiesController> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Get all strategies for an engagement
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetStrategies([FromQuery] Guid engagementId)
        {
            try
            {
                if (engagementId == Guid.Empty)
                    return BadRequest("EngagementId is required");

                var strategies = await _dbContext.Strategies
                    .Where(s => s.EngagementId == engagementId)
                    .Include(s => s.Objectives)
                    .ThenInclude(o => o.KPIs)
                    .ToListAsync();

                return Ok(strategies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching strategies");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Create a new strategy
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateStrategy([FromBody] CreateStrategyRequest request)
        {
            try
            {
                if (request.EngagementId == Guid.Empty)
                    return BadRequest("EngagementId is required");

                var strategy = AETP.Modules.Strategy.Domain.Strategy.Create(
                    request.EngagementId,
                    request.Name,
                    request.Vision);

                _dbContext.Strategies.Add(strategy);
                await _dbContext.SaveChangesAsync();

                return CreatedAtAction(nameof(GetStrategyById), new { id = strategy.Id }, strategy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating strategy");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Get strategy by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetStrategyById(Guid id)
        {
            try
            {
                var strategy = await _dbContext.Strategies
                    .Include(s => s.Objectives)
                    .ThenInclude(o => o.KPIs)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (strategy == null)
                    return NotFound();

                return Ok(strategy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching strategy");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Create an objective for a strategy
        /// </summary>
        [HttpPost("{strategyId}/objectives")]
        public async Task<IActionResult> CreateObjective(Guid strategyId, [FromBody] CreateObjectiveRequest request)
        {
            try
            {
                var strategy = await _dbContext.Strategies.FindAsync(strategyId);
                if (strategy == null)
                    return NotFound("Strategy not found");

                var objective = Objective.Create(
                    strategy.EngagementId,
                    strategyId,
                    request.Name,
                    request.Description);

                _dbContext.Objectives.Add(objective);
                await _dbContext.SaveChangesAsync();

                return CreatedAtAction(nameof(GetStrategyById), new { id = strategyId }, objective);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating objective");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Create a KPI for an objective
        /// </summary>
        [HttpPost("objectives/{objectiveId}/kpis")]
        public async Task<IActionResult> CreateKPI(Guid objectiveId, [FromBody] CreateKPIRequest request)
        {
            try
            {
                var objective = await _dbContext.Objectives.FindAsync(objectiveId);
                if (objective == null)
                    return NotFound("Objective not found");

                var kpi = KPI.Create(
                    objective.EngagementId,
                    objectiveId,
                    request.Name,
                    request.Unit);

                if (!string.IsNullOrEmpty(request.Frequency))
                    kpi.MeasurementFrequency = request.Frequency;

                _dbContext.KPIs.Add(kpi);
                await _dbContext.SaveChangesAsync();

                return CreatedAtAction(nameof(GetStrategyById), 
                    new { id = objective.StrategyId }, kpi);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating KPI");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }

    // DTOs
    public class CreateStrategyRequest
    {
        public Guid EngagementId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Vision { get; set; }
    }

    public class CreateObjectiveRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class CreateKPIRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Unit { get; set; }
        public string? Frequency { get; set; }
    }
}
