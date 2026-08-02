using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AETP.Modules.ClientEngagement.Domain;
using AETP.Modules.ClientEngagement.Infrastructure;
using AETP.Modules.ClientEngagement.Api.DTOs;
using AETP.Modules.ClientEngagement.Api.Utilities;
using System.Text.Json;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    public class DepartmentFunctions
    {
        private readonly ClientEngagementDbContext _dbContext;
        private readonly ILogger<DepartmentFunctions> _logger;

        public DepartmentFunctions(
            ClientEngagementDbContext dbContext,
            ILogger<DepartmentFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Adds a new Department to a CompanyProfile
        /// POST /api/engagements/{engagementId}/company-profile/{companyProfileId}/departments
        /// </summary>
        [Function("AddDepartment")]
        public async Task<IActionResult> AddDepartment(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "engagements/{engagementId}/company-profile/{companyProfileId}/departments")] HttpRequest req,
            string engagementId,
            string companyProfileId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                _logger.LogInformation("Adding department to CompanyProfile {companyProfileId}", companyProfileId);

                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                if (!Guid.TryParse(companyProfileId, out var profileGuid))
                    return new BadRequestObjectResult(new { error = "Invalid company profile ID" });

                // Verify CompanyProfile exists and belongs to engagement
                var companyProfile = await _dbContext.CompanyProfiles.FindAsync(profileGuid);
                if (companyProfile == null)
                    return new NotFoundObjectResult(new { error = "CompanyProfile not found" });

                if (companyProfile.EngagementId != engagementGuid)
                    return new BadRequestObjectResult(new { error = "Engagement ID mismatch" });

                // Read request body
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateDepartmentRequest>(requestBody, AETP.Modules.ClientEngagement.Api.Utilities.JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Name))
                    return new BadRequestObjectResult(new { error = "Department name is required" });

                // Create Department
                var department = Department.Create(
                    engagementGuid,
                    profileGuid,
                    request.Name,
                    request.Description,
                    request.HeadCount,
                    request.DisplayOrder);

                // Apply additional fields
                if (!string.IsNullOrEmpty(request.LeadName))
                    department.LeadName = request.LeadName;
                if (!string.IsNullOrEmpty(request.LeadEmail))
                    department.LeadEmail = request.LeadEmail;
                if (request.AnnualBudget.HasValue)
                    department.AnnualBudget = request.AnnualBudget;

                // Validate
                if (!department.Validate())
                    return new BadRequestObjectResult(new { error = "Invalid Department data" });

                // Save
                _dbContext.Departments.Add(department);
                await _dbContext.SaveChangesAsync();

                var dto = MapToDto(department);
                return new CreatedResult($"/api/engagements/{engagementId}/departments/{department.Id}", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding department");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Updates a Department
        /// PUT /api/engagements/{engagementId}/departments/{departmentId}
        /// </summary>
        [Function("UpdateDepartment")]
        public async Task<IActionResult> UpdateDepartment(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put",
                Route = "engagements/{engagementId}/departments/{departmentId}")] HttpRequest req,
            string engagementId,
            string departmentId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                _logger.LogInformation("Updating department {departmentId} in engagement {engagementId}", departmentId, engagementId);

                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                if (!Guid.TryParse(departmentId, out var deptGuid))
                    return new BadRequestObjectResult(new { error = "Invalid department ID" });

                // Find and validate ownership
                var department = await _dbContext.Departments.FindAsync(deptGuid);
                if (department == null)
                    return new NotFoundObjectResult(new { error = "Department not found" });

                if (department.EngagementId != engagementGuid)
                    return new BadRequestObjectResult(new { error = "Engagement ID mismatch" });

                // Read request body
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<UpdateDepartmentRequest>(requestBody, AETP.Modules.ClientEngagement.Api.Utilities.JsonOptionsHelper.CaseInsensitive);

                if (request == null)
                    return new BadRequestObjectResult(new { error = "Invalid request body" });

                // Update fields
                if (!string.IsNullOrEmpty(request.Name))
                    department.Name = request.Name;
                if (request.Description != null)
                    department.Description = request.Description;
                if (request.HeadCount.HasValue)
                    department.HeadCount = request.HeadCount;
                if (!string.IsNullOrEmpty(request.LeadName))
                    department.LeadName = request.LeadName;
                if (!string.IsNullOrEmpty(request.LeadEmail))
                    department.LeadEmail = request.LeadEmail;
                if (request.AnnualBudget.HasValue)
                    department.AnnualBudget = request.AnnualBudget;
                if (request.DisplayOrder.HasValue)
                    department.DisplayOrder = request.DisplayOrder.Value;
                if (!string.IsNullOrEmpty(request.Status))
                    department.Status = request.Status;

                // Validate and save
                if (!department.Validate())
                    return new BadRequestObjectResult(new { error = "Invalid Department data" });

                _dbContext.Departments.Update(department);
                await _dbContext.SaveChangesAsync();

                var dto = MapToDto(department);
                return new OkObjectResult(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating department");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Deletes a Department
        /// DELETE /api/engagements/{engagementId}/departments/{departmentId}
        /// </summary>
        [Function("DeleteDepartment")]
        public async Task<IActionResult> DeleteDepartment(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", "options",
                Route = "engagements/{engagementId}/departments/{departmentId}")] HttpRequest req,
            string engagementId,
            string departmentId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                _logger.LogInformation("Deleting department {departmentId} from engagement {engagementId}", departmentId, engagementId);

                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                if (!Guid.TryParse(departmentId, out var deptGuid))
                    return new BadRequestObjectResult(new { error = "Invalid department ID" });

                // Find and validate ownership
                var department = await _dbContext.Departments.FindAsync(deptGuid);
                if (department == null)
                    return new NotFoundObjectResult(new { error = "Department not found" });

                if (department.EngagementId != engagementGuid)
                    return new BadRequestObjectResult(new { error = "Engagement ID mismatch" });

                // Delete
                _dbContext.Departments.Remove(department);
                await _dbContext.SaveChangesAsync();

                return new NoContentResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting department");
                return new StatusCodeResult(500);
            }
        }

        private DepartmentDto MapToDto(Department entity)
        {
            return new DepartmentDto
            {
                Id = entity.Id,
                EngagementId = entity.EngagementId,
                CompanyProfileId = entity.CompanyProfileId,
                Name = entity.Name,
                Description = entity.Description,
                HeadCount = entity.HeadCount,
                LeadName = entity.LeadName,
                LeadEmail = entity.LeadEmail,
                AnnualBudget = entity.AnnualBudget,
                DisplayOrder = entity.DisplayOrder,
                Status = entity.Status,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }
    }
}
