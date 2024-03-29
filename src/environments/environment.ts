export const environment = {
  production: false,
  adminService: 'http://localhost:8090/admin',
  dataService: 'http://localhost:8091/data/api',
  brokerUrl: '13.82.121.101',
  brokerPort: 61614,
  brokerPath: '', //optional
  authEnabled: false,
  keyCloakConfig: {
    clientId: 'front-smart-campus',
    realm: 'smart-campus-iot',
    url: 'https://lemur-9.cloud-iam.com/auth'
  }
};
