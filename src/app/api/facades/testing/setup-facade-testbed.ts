import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ApiConfiguration } from '../../generated';
import { DataSourceOption } from '../../../core/config/data-sources';
import { DataSourceService } from '../../../core/services/data-source';

export interface FacadeTestContext<TFacade> {
  readonly facade: TFacade;
  readonly httpMock: HttpTestingController;
  /** Drives the DataSourceService double; set it and call TestBed.tick() to simulate a switch. */
  readonly activeDataSource: WritableSignal<DataSourceOption>;
}

const DEFAULT_DATA_SOURCE: DataSourceOption = {
  id: 'dotnet-sqlserver',
  description: '.NET Core application with SQL Server',
  baseHostname: 'localhost',
  basePort: 11001,
};

/**
 * Configures TestBed for an API facade backed by the generated ApiClient, with
 * HttpTestingController in place of the network and a controllable DataSourceService double.
 */
export function setupFacadeTestbed<TFacade>(
  facadeType: Type<TFacade>,
  rootUrl = 'http://localhost:53060',
): FacadeTestContext<TFacade> {
  const apiConfiguration = new ApiConfiguration();
  apiConfiguration.rootUrl = rootUrl;
  const activeDataSource = signal(DEFAULT_DATA_SOURCE);
  const dataSourceDouble: Partial<DataSourceService> = {
    activeDataSource: activeDataSource.asReadonly(),
  };

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ApiConfiguration, useValue: apiConfiguration },
      { provide: DataSourceService, useValue: dataSourceDouble },
    ],
  });

  return {
    facade: TestBed.inject(facadeType),
    httpMock: TestBed.inject(HttpTestingController),
    activeDataSource,
  };
}
