import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EmployeesApiFacade } from '../../../../api/facades/employees-api.facade';
import { EmployeesDto } from '../../../../api/generated';
import { EmployeesResourceVmFacade } from './employees-resource-vm.facade';
import { expectWithinMaxLengths } from './testing/expect-within-max-lengths';

const EMPLOYEE: EmployeesDto = {
  employeeId: 1,
  firstName: 'Nancy',
  lastName: 'Davolio',
  title: 'Sales Representative',
  city: 'Seattle',
  region: 'WA',
  country: 'USA',
  extension: '5467',
};
const MAX_LENGTHS = { firstName: 10, lastName: 20, title: 30, city: 15, country: 15 };

describe('EmployeesResourceVmFacade', () => {
  let facade: EmployeesResourceVmFacade;
  let api: Pick<EmployeesApiFacade, 'getAll' | 'getById' | 'add' | 'update' | 'delete'>;

  beforeEach(() => {
    api = {
      getAll: vi.fn(() => of([EMPLOYEE])),
      getById: vi.fn(() => of(EMPLOYEE)),
      add: vi.fn(() => of({ id: 10 })),
      update: vi.fn(() => of(undefined)),
      delete: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: EmployeesApiFacade, useValue: api }],
    });
    facade = TestBed.inject(EmployeesResourceVmFacade);
  });

  it('creates the facade', () => {
    expect(facade).toBeTruthy();
  });

  describe('key', () => {
    it('identifies the employees resource', () => {
      expect(facade.key).toBe('employees');
    });
  });

  describe('metadata', () => {
    it('describes the employees page', () => {
      const { heading, primaryIdLabel, defaultPrimaryId } = facade;

      expect({ heading, primaryIdLabel, defaultPrimaryId }).toEqual({
        heading: 'Employees API',
        primaryIdLabel: 'Employee ID',
        defaultPrimaryId: '1',
      });
    });
  });

  describe('pageDefaults', () => {
    it('loads nine employees per page', () => {
      const pageDefaults = facade.pageDefaults;

      expect(pageDefaults).toMatchObject({
        initialPrimaryId: '1',
        pageSize: 9,
        autoLoadOnEnter: true,
      });
    });
  });

  describe('reload', () => {
    it('loads the employees with the requested refresh mode', () => {
      facade.reload(false);

      expect(api.getAll).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('maps each employee to a record titled by full name with job details', () => {
      facade.reload();

      expect(facade.vm().items).toEqual([
        {
          primaryId: '1',
          title: 'Nancy Davolio',
          subtitle: 'Sales Representative • Seattle • USA',
          raw: EMPLOYEE,
        },
      ]);
    });

    it('uses fallback text when the name and details are blank', () => {
      vi.mocked(api.getAll).mockReturnValue(of([{ employeeId: 2, firstName: '', lastName: '' }]));

      facade.reload();

      expect(facade.vm().items[0]).toMatchObject({
        title: 'Unnamed employee',
        subtitle: 'No details',
      });
    });
  });

  describe('fetchById', () => {
    it('requests the employee by numeric id', () => {
      facade.fetchById('5');

      expect(api.getById).toHaveBeenCalledExactlyOnceWith(5);
    });

    it('falls back to employee 1 for an empty id', () => {
      facade.fetchById('');

      expect(api.getById).toHaveBeenCalledExactlyOnceWith(1);
    });
  });

  describe('createSample', () => {
    it('adds a sample employee without a server-generated id', () => {
      facade.createSample();

      const dto = vi.mocked(api.add).mock.lastCall?.[0];
      expect(dto).toMatchObject({ firstName: 'Sample', lastName: 'Employee' });
      expect(dto).not.toHaveProperty('employeeId');
    });

    it('sends an add payload that satisfies the OpenAPI length limits', () => {
      facade.createSample();

      expectWithinMaxLengths(vi.mocked(api.add).mock.lastCall![0], MAX_LENGTHS);
    });
  });

  describe('updateSample', () => {
    it('updates the employee with the given id', () => {
      facade.updateSample('5');

      expect(vi.mocked(api.update).mock.lastCall?.[0]).toMatchObject({
        employeeId: 5,
        firstName: 'Updated',
      });
    });

    it('updates the default employee when no id is given', () => {
      facade.updateSample();

      expect(vi.mocked(api.update).mock.lastCall?.[0]).toMatchObject({ employeeId: 1 });
    });

    it('sends an update payload that satisfies the OpenAPI length limits', () => {
      facade.updateSample('5');

      expectWithinMaxLengths(vi.mocked(api.update).mock.lastCall![0], MAX_LENGTHS);
    });
  });

  describe('deleteById', () => {
    it('deletes the employee by numeric id', () => {
      facade.deleteById('10');

      expect(api.delete).toHaveBeenCalledExactlyOnceWith(10);
    });
  });

  describe('mapSelectedItemSections', () => {
    it('shows the employee profile and work location sections', () => {
      const sections = facade.mapSelectedItemSections(EMPLOYEE);

      expect(sections).toEqual([
        {
          title: 'Employee profile',
          kind: 'fields',
          fields: [
            { label: 'Employee ID', value: '1' },
            { label: 'First name', value: 'Nancy' },
            { label: 'Last name', value: 'Davolio' },
            { label: 'Title', value: 'Sales Representative' },
          ],
        },
        {
          title: 'Work location',
          kind: 'fields',
          fields: [
            { label: 'City', value: 'Seattle' },
            { label: 'Region', value: 'WA' },
            { label: 'Country', value: 'USA' },
            { label: 'Extension', value: '5467' },
          ],
        },
      ]);
    });
  });

  describe('mapMutationResultSections', () => {
    it('reports the employee mutation status', () => {
      const sections = facade.mapMutationResultSections({ success: true, operation: 'delete' });

      expect(sections[0]).toEqual({
        title: 'Employee status',
        kind: 'fields',
        fields: [
          { label: 'Action', value: 'Delete' },
          { label: 'Status', value: 'Success' },
          { label: 'Employee ID', value: '-' },
        ],
      });
    });
  });
});
