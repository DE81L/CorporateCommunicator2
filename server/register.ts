import { register } from 'tsconfig-paths';
import { resolve } from 'path';

// Register TypeScript paths
register({
  baseUrl: resolve(__dirname, '..'),
  paths: {
    '@shared/*': ['shared/*'],
    '@/*': ['*']
  }
});
