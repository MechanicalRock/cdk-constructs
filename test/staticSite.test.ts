import { App, Stack } from '@aws-cdk/cdk';
import { StaticWebsite } from '../lib';
import { createExpectedResource } from './utils';

describe('Github Node Pipeline', () => {

  const expectedResources = [
    createExpectedResource(/sitebucket/i),
    createExpectedResource(/sitedistribution/i),
    createExpectedResource(/logsbucket/i),
    createExpectedResource(/hostedzone/i),
    createExpectedResource(/aliasrecord/i)
  ];

  it('should create the resources for the pipeline', () => {
    const app = new App();
    const stack = new Stack(app, 'myAppStack');
    const website = new StaticWebsite(stack, 'MyWebsite', {
      domainName: 'example.com',
      siteSubDomain: 'sub'
    });

    const websiteResources = website.node.findAll();

    for (const expectedResource of expectedResources) {
      for (const websiteResource of websiteResources) {
        if (expectedResource.name.test(websiteResource.node.uniqueId)) {
          expectedResource.found = true;
          break;
        }
      }
    }

    const allFound = expectedResources.every(({ found }) => found);
    expect(allFound).toBe(true);
  });
});
