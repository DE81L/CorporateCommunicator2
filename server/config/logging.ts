import debug from 'debug';

export const logger = {
  app: debug('rest-express:app'),
  db: debug('rest-express:db'),
  http: debug('rest-express:http')
};