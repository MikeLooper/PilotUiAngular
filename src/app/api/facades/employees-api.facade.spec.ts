import { HttpTestingController } from '@angular/common/http/testing';
import { EmployeesApiFacade } from './employees-api.facade';
import { expectGet, setupFacadeTestbed } from './testing/setup-facade-testbed';

describe('EmployeesApiFacade', () => {
  let facade: EmployeesApiFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const context = setupFacadeTestbed(EmployeesApiFacade);
    facade = context.facade;
    httpMock = context.httpMock;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets one employee by id', () => {
    let firstName: string | null | undefined;

    facade.getById(1).subscribe((result) => {
      firstName = result.firstName;
    });

    const request = expectGet(httpMock, 'http://localhost:53060/v1/employees/get/1');
    request.flush({ employeeID: 1, firstName: 'Nancy', lastName: 'Davolio' });

    expect(firstName).toBe('Nancy');
  });
});
