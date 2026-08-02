param location string = 'East US'
param environment string = 'dev'
param projectName string = 'aetp'

@minLength(3)
@maxLength(24)
param storageAccountName string

@minLength(1)
@maxLength(80)
param appServicePlanName string

var uniqueSuffix = uniqueString(resourceGroup().id)
var resourcePrefix = '${projectName}-${environment}-'

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${storageAccountName}${uniqueSuffix}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${resourcePrefix}${appServicePlanName}'
  location: location
  sku: {
    name: environment == 'prod' ? 'P1v2' : 'B2'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// App Service for Backend API
resource backendAppService 'Microsoft.Web/sites@2023-01-01' = {
  name: '${resourcePrefix}api'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|9.0'
      appSettings: [
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: environment == 'prod' ? 'Production' : 'Development'
        }
      ]
    }
  }
}

// App Service for Frontend
resource frontendAppService 'Microsoft.Web/sites@2023-01-01' = {
  name: '${resourcePrefix}web'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      nodeVersion: '~20'
    }
  }
}

// SQL Server
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: '${resourcePrefix}sql'
  location: location
  properties: {
    administratorLogin: 'sqladmin'
    administratorLoginPassword: uniqueString(resourceGroup().id, 'sql')
  }
}

// SQL Database
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: '${projectName}_db'
  location: location
  sku: {
    name: environment == 'prod' ? 'S1' : 'S0'
  }
}

output backendUrl string = 'https://${backendAppService.properties.defaultHostName}'
output frontendUrl string = 'https://${frontendAppService.properties.defaultHostName}'
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
