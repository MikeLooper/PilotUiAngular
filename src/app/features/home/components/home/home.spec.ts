import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Mock } from 'vitest';

import { DataSourceOption } from '../../../../core/config/data-sources';
import { DataSourceService } from '../../../../core/services/data-source';
import { HomeFacade } from '../../services/home';
import { HomePageComponent } from './home';

type HomeViewModel = ReturnType<HomeFacade['vm']>;

const DOTNET_SQLSERVER: DataSourceOption = {
  id: 'dotnet-sqlserver',
  description: '.NET Core application with SQL Server',
  baseHostname: 'localhost',
  basePort: 11001,
};
const JAVA_POSTGRESQL: DataSourceOption = {
  id: 'java-postgresql',
  description: 'Java Spring Boot application with PostgreSQL',
  baseHostname: 'localhost',
  basePort: 11301,
};
const LOADED_VM: HomeViewModel = {
  connectionToApi: 'Healthy',
  apiVersion: '1.1.2',
  apiDeployed: '2026-07-24',
  isLoading: false,
  errorMessage: null,
};

describe('HomePageComponent', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  let vm: WritableSignal<HomeViewModel>;
  let reload: Mock<() => void>;
  let selectDataSourceById: Mock<(id: string) => void>;

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function button(label: string): HTMLButtonElement {
    const match = Array.from(page().querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!match) {
      throw new Error(`No button labelled "${label}"`);
    }
    return match;
  }

  function statusLine(prefix: string): string {
    const line = Array.from(page().querySelectorAll('li'))
      .map((item) => item.textContent?.replace(/\s+/g, ' ').trim() ?? '')
      .find((text) => text.startsWith(prefix));
    if (line === undefined) {
      throw new Error(`No status line starting with "${prefix}"`);
    }
    return line;
  }

  function dataSourceRadio(description: string): HTMLInputElement {
    const label = Array.from(page().querySelectorAll('label')).find(
      (candidate) => candidate.textContent?.trim() === description,
    );
    const radio = label?.querySelector<HTMLInputElement>('input[type="radio"]');
    if (!radio) {
      throw new Error(`No data source radio labelled "${description}"`);
    }
    return radio;
  }

  beforeEach(async () => {
    vm = signal(LOADED_VM);
    reload = vi.fn();
    selectDataSourceById = vi.fn();
    const homeFacadeDouble: Partial<HomeFacade> = { vm: vm.asReadonly(), reload };
    const dataSourceDouble: Partial<DataSourceService> = {
      options: [DOTNET_SQLSERVER, JAVA_POSTGRESQL],
      activeDataSource: signal(DOTNET_SQLSERVER).asReadonly(),
      activeBaseUrl: signal('/api/11001').asReadonly(),
      selectDataSourceById,
    };

    TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        { provide: HomeFacade, useValue: homeFacadeDouble },
        { provide: DataSourceService, useValue: dataSourceDouble },
      ],
    });
    fixture = TestBed.createComponent(HomePageComponent);
    await fixture.whenStable();
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('vm', () => {
    it('renders the API connection, version, and deploy date', () => {
      const connection = statusLine('Connection to API:');

      expect(connection).toContain('Connection to API: Healthy');
      expect(statusLine('API Version:')).toBe('API Version: 1.1.2');
      expect(statusLine('API Deployed:')).toBe('API Deployed: 2026-07-24');
    });

    it('shows a loading message and disables Refresh while loading', async () => {
      vm.set({ ...LOADED_VM, isLoading: true });

      await fixture.whenStable();

      expect(page().textContent).toContain('Loading API status...');
      expect(button('Refresh').disabled).toBe(true);
    });

    it('hides the loading message and enables Refresh when not loading', () => {
      const pageText = page().textContent;

      expect(pageText).not.toContain('Loading API status...');
      expect(button('Refresh').disabled).toBe(false);
    });

    it('shows an alert with the error message when loading failed', async () => {
      vm.set({ ...LOADED_VM, errorMessage: 'The API is unreachable.' });

      await fixture.whenStable();

      const alert = page().querySelector('[role="alert"]');
      expect(alert?.textContent).toContain('Request failed');
      expect(alert?.textContent).toContain('The API is unreachable.');
    });

    it('does not show an alert when there is no error', () => {
      const alert = page().querySelector('[role="alert"]');

      expect(alert).toBeNull();
    });
  });

  describe('activeBaseUrl', () => {
    it('renders the active API URL beside the connection status', () => {
      const connection = statusLine('Connection to API:');

      expect(connection).toMatch(/^Connection to API: Healthy\s+\(\/api\/11001\)$/);
    });
  });

  describe('dataSourceOptions', () => {
    it('renders one radio button per data source option', () => {
      const radios = page().querySelectorAll('input[type="radio"][name="active-data-source"]');

      const descriptions = Array.from(radios).map((radio) =>
        radio.closest('label')?.textContent?.trim(),
      );
      expect(descriptions).toEqual([
        '.NET Core application with SQL Server',
        'Java Spring Boot application with PostgreSQL',
      ]);
    });
  });

  describe('selectedDataSource', () => {
    it('checks the radio button of the active data source only', () => {
      const active = dataSourceRadio('.NET Core application with SQL Server');
      const inactive = dataSourceRadio('Java Spring Boot application with PostgreSQL');

      expect(active.checked).toBe(true);
      expect(inactive.checked).toBe(false);
    });
  });

  describe('onReload', () => {
    it('reloads the API status when Refresh is clicked', () => {
      button('Refresh').click();

      expect(reload).toHaveBeenCalledTimes(1);
    });

    it('reloads the API status when Try Again is clicked in the error alert', async () => {
      vm.set({ ...LOADED_VM, errorMessage: 'The API is unreachable.' });
      await fixture.whenStable();

      button('Try Again').click();

      expect(reload).toHaveBeenCalledTimes(1);
    });
  });

  describe('onDataSourceSelected', () => {
    it('selects the chosen data source and reloads the API status', () => {
      const radio = dataSourceRadio('Java Spring Boot application with PostgreSQL');

      radio.click();

      expect(selectDataSourceById).toHaveBeenCalledExactlyOnceWith('java-postgresql');
      expect(reload).toHaveBeenCalledTimes(1);
    });
  });

  describe('table of contents', () => {
    it.each([
      { text: 'Resources', href: '/resources' },
      { text: 'API Explorer', href: '/explorer' },
    ])('links "$text" to $href', ({ text, href }) => {
      const link = Array.from(
        page().querySelectorAll<HTMLAnchorElement>('[aria-labelledby="home-toc-title"] a'),
      ).find((candidate) => candidate.textContent?.trim() === text);

      expect(link?.getAttribute('href')).toBe(href);
    });
  });
});
