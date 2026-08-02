using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AETP.Modules.ClientEngagement.Api.Utilities
{
    public static class CorsHelper
    {
        public static void SetCorsHeaders(HttpResponse response)
        {
            response.Headers["Access-Control-Allow-Origin"] = "*";
            response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
            response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
            response.Headers["Access-Control-Max-Age"] = "86400";
        }

        public static bool IsPreflightRequest(HttpRequest request)
        {
            return request.Method == "OPTIONS";
        }

        /// <summary>
        /// Sets CORS headers and, if this is a browser CORS preflight (OPTIONS) request,
        /// returns a 200 result to short-circuit the rest of the handler. The HttpTrigger's
        /// method list must include "options" for this to ever be reached.
        /// </summary>
        public static IActionResult? HandlePreflight(HttpRequest request)
        {
            SetCorsHeaders(request.HttpContext.Response);
            return IsPreflightRequest(request) ? new OkResult() : null;
        }
    }
}
