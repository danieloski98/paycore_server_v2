import { EmployeeAuthGuard } from './employee-auth.guard';

describe('EmployeeAuthGuard', () => {
  it('should be defined', () => {
    expect(new EmployeeAuthGuard()).toBeDefined();
  });
});
