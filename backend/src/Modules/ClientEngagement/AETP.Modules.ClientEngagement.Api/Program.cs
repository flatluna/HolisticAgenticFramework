using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Extensions.Http.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using AETP.Modules.ClientEngagement.Api.Agents;
using AETP.Modules.ClientEngagement.Api.Storage;
using AETP.Modules.ClientEngagement.Infrastructure;
using AETP.Modules.Capability.Infrastructure;
using AETP.Modules.Process.Infrastructure;
using AETP.Modules.Decision.Infrastructure;

namespace AETP.Modules.ClientEngagement.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var host = new HostBuilder()
                .ConfigureFunctionsWebApplication()
                .ConfigureServices((context, services) =>
                {
                    // Add DbContext
                    services.AddDbContext<ClientEngagementDbContext>(options =>
                    {
                        var connectionString = context.Configuration.GetConnectionString("DefaultConnection")
                            ?? "Server=(local);Database=businessagenticdb;Integrated Security=True;";
                        
                        options.UseSqlServer(connectionString);
                    });

                    // Capability module (Business Capabilities assessment, 02.2) —
                    // hosted in this same Functions app so the frontend can keep
                    // calling a single base URL (localhost:7073/api).
                    services.AddDbContext<CapabilityDbContext>(options =>
                    {
                        var connectionString = context.Configuration.GetConnectionString("DefaultConnection")
                            ?? "Server=(local);Database=businessagenticdb;Integrated Security=True;";

                        options.UseSqlServer(connectionString);
                    });

                    // Process module (Business Processes assessment, 02.3) — same
                    // pattern as Capability: hosted here for a single base URL.
                    // Registered via AddDbContextFactory (not plain AddDbContext) —
                    // this ALSO registers the regular scoped ProcessDbContext for
                    // normal per-request injection, but additionally exposes
                    // IDbContextFactory<ProcessDbContext> so
                    // ProcessDocumentExtractionOrchestrator's background Task.Run
                    // (which outlives the HTTP request that started it) can safely
                    // create its own short-lived DbContext instead of reusing one
                    // tied to an already-completed/disposed request scope.
                    services.AddDbContextFactory<ProcessDbContext>(options =>
                    {
                        var connectionString = context.Configuration.GetConnectionString("DefaultConnection")
                            ?? "Server=(local);Database=businessagenticdb;Integrated Security=True;";

                        options.UseSqlServer(connectionString);
                    });

                    // Decision module (Business Decisions assessment, 02.4) — same
                    // pattern as Process/Capability: hosted here for a single base URL.
                    services.AddDbContext<DecisionDbContext>(options =>
                    {
                        var connectionString = context.Configuration.GetConnectionString("DefaultConnection")
                            ?? "Server=(local);Database=businessagenticdb;Integrated Security=True;";

                        options.UseSqlServer(connectionString);
                    });

                    services.AddLogging();

                    // Org Design — Org Chart extraction agent (Microsoft Agent Framework,
                    // ChatClientAgent with vision + structured output). Singleton: the
                    // underlying AIAgent wraps a stateless chat client + instructions, no
                    // per-request state, same pattern used across the HumanOS reference project.
                    services.AddSingleton<OrgChartExtractionAgent>();

                    // Decisiones (02.4) — extracts candidate decision points from a Business
                    // Process's text (name/description/hallazgos) via Microsoft Agent
                    // Framework, structured output, no vision needed. Suggestions only —
                    // a human always reviews/confirms before anything is saved.
                    services.AddSingleton<DecisionExtractionAgent>();

                    // Full process document upload (PDF) — stores the raw file in Data
                    // Lake/Blob Storage and extracts an executive summary, mentioned
                    // entities and every candidate decision in one agent pass over the
                    // whole document text (see ProcessDocumentExtractionAgent).
                    services.AddSingleton<ProcessDocumentStorageService>();
                    services.AddSingleton<ProcessDocumentExtractionAgent>();

                    // Describes embedded page images (scanned pages,
                    // flowcharts, screenshots) via a vision-capable model so
                    // their content is folded into the page text before the
                    // main extraction call — ported from HumanOS's
                    // PdfImageDescriptionAgent.
                    services.AddSingleton<PdfImageDescriptionAgent>();

                    // Runs the (multi-minute) AI extraction call as a background
                    // task instead of blocking the HTTP trigger for its full
                    // duration — same non-blocking start/poll pattern as HumanOS's
                    // PdfCapabilityGraphOrchestrator (C:\EducationAI\HumanOS\backend\
                    // HumanOS\Services\PdfCapabilityGraphOrchestrator.cs). Fixes a
                    // recurring "zombie Functions host" bug (2026-07-24): awaiting
                    // the AI call directly inside the Function handler repeatedly
                    // left the host's port open but unable to route any request
                    // (isolated worker's channel to the host silently died mid-call).
                    services.AddSingleton<ProcessDocumentExtractionOrchestrator>();

                    // Agent-Readiness assessment (Paso 2.3 Procesos, upload PDF) —
                    // "Agent-Readiness Process Architect" agent that produces a full
                    // process model, ontology, governance and 8-dimension assessment
                    // instrument from a whole process document. Uses the MAIN
                    // deployment (open-ended, multi-dimension reasoning), and runs as
                    // a background task via its own orchestrator for the same reason
                    // as ProcessDocumentExtractionOrchestrator above.
                    services.AddSingleton<AgentReadinessExtractionAgent>();
                    services.AddSingleton<AgentReadinessExtractionOrchestrator>();
                })
                .Build();

            host.Run();
        }
    }
}

