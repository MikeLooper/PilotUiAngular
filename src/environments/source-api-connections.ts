import { SourceApiConnections } from '../app/core/config/app-config';

export const sourceApiConnections: SourceApiConnections = {
  'dotnet-sqlserver': { hostname: 'localhost', port: 11001 },
  'dotnet-postgresql': { hostname: 'localhost', port: 11101 },
  'java-sqlserver': { hostname: 'localhost', port: 11201 },
  'java-postgresql': { hostname: 'localhost', port: 11301 },
  'python-sqlserver': { hostname: 'localhost', port: 11401 },
  'python-postgresql': { hostname: 'localhost', port: 11501 },
};
