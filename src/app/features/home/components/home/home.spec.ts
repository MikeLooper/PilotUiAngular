import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SystemApiFacade } from '../../../../api/facades/system-api.facade';
import { DataSourceService } from '../../../../core/services/data-source';
import { environment } from '../../../../../environments/environment.development';

import { HomePageComponent } from './home';

describe('Home', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;
  const dotnetSqlServerConnection = environment.sourceApiConnections['dotnet-sqlserver'];
  const dotnetSqlServerUrl =
    `http://${dotnetSqlServerConnection.hostname}:${dotnetSqlServerConnection.port}`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: SystemApiFacade,
          useValue: {
            getHealthcheck: () => of('Healthy'),
            getAbout: () => of({ apiVersion: '1.0', deployDate: '2026-07-24' }),
          },
        },
        {
          provide: DataSourceService,
          useValue: {
            options: [
              {
                id: 'dotnet-sqlserver',
                description: '.NET Core application with SQL Server',
                basePort: dotnetSqlServerConnection.port,
              },
            ],
            activeDataSource: () => ({
              id: 'dotnet-sqlserver',
              description: '.NET Core application with SQL Server',
              basePort: dotnetSqlServerConnection.port,
            }),
            activeBaseUrl: () => dotnetSqlServerUrl,
            selectDataSourceById: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('displays the active API URL beside the connection status', () => {
    fixture.detectChanges();
    const pageText = fixture.nativeElement.textContent.replace(/\s+/g, ' ');

    expect(pageText).toContain(
      `Connection to API: Healthy (${dotnetSqlServerUrl})`
    );
  });
});
