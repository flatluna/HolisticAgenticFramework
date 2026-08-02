using System.Text.Json;

namespace AETP.Modules.ClientEngagement.Api.Utilities
{
    public static class JsonOptionsHelper
    {
        /// <summary>
        /// Default options for deserializing incoming Function request bodies.
        /// Case-insensitive because frontend clients send camelCase JSON
        /// (e.g. "name") while the request DTOs use PascalCase C# properties
        /// (e.g. "Name") - without this, System.Text.Json's default
        /// case-sensitive matching silently leaves properties null.
        /// </summary>
        public static readonly JsonSerializerOptions CaseInsensitive = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
    }
}
