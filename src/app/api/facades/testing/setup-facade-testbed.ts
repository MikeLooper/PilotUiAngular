import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiConfiguration } from '../../generated';
import { DataSourceService } from '../../../core/services/data-source';
import { environment } from '../../../../environments/environment.development';

interface FacadeTestContext<TFacade> {
  facade: TFacade;
  httpMock: HttpTestingController;
}

export function setupFacadeTestbed<TFacade>(
  facadeType: Type<TFacade>,
  rootUrl = 'http://localhost:53060'
): FacadeTestContext<TFacade> {
  const defaultConnection = environment.sourceApiConnections['dotnet-sqlserver'];
  const apiConfiguration = new ApiConfiguration();
  apiConfiguration.rootUrl = rootUrl;

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ApiConfiguration,
        useValue: apiConfiguration,
      },
      {
        provide: DataSourceService,
        useValue: {
          activeDataSource: () => ({
            id: 'dotnet-sqlserver',
            description: '.NET Core application with SQL Server',
            basePort: defaultConnection.port,
          }),
        },
      },
    ],
  });

  return {
    facade: TestBed.inject(facadeType),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

function expectRequest(
  httpMock: HttpTestingController,
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
): TestRequest {
  const request = httpMock.expectOne(url);
  if (request.request.method !== method) {
    throw new Error(
      `Expected ${method} request for ${url} but received ${request.request.method}`
    );
  }
  return request;
}

export function expectGet(httpMock: HttpTestingController, url: string): TestRequest {
  return expectRequest(httpMock, url, 'GET');
}

export function expectPost(httpMock: HttpTestingController, url: string): TestRequest {
  return expectRequest(httpMock, url, 'POST');
}

export function expectPut(httpMock: HttpTestingController, url: string): TestRequest {
  return expectRequest(httpMock, url, 'PUT');
}

export function expectDelete(httpMock: HttpTestingController, url: string): TestRequest {
  return expectRequest(httpMock, url, 'DELETE');
}
