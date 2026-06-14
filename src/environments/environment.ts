export const environment = {
  production: false,
  iamUrl: 'http://localhost:8081',
  apiUrls: {
    employees: '/api/employees',  // Backend UserController uses @RequestMapping("/api/employees")
    leaves: '/api/leaves',
    payroll: '/api/payroll',
    dashboard: '/api/dashboard',
    departments: '/api/departments',
    teams: '/api/teams'
  }
};
