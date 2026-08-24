import { SourceApiConnections } from '../app/core/config/app-config';

export const sourceApiConnections: SourceApiConnections = {
  'dotnet-sqlserver': { hostname: 'localhost', port: 55101 },
  'dotnet-postgresql': { hostname: 'localhost', port: 55201 },
  'java-sqlserver': { hostname: 'localhost', port: 55301 },
  'java-postgresql': { hostname: 'localhost', port: 55401 },
  'python-sqlserver': { hostname: 'localhost', port: 55501 },
  'python-postgresql': { hostname: 'localhost', port: 55601 },
};
