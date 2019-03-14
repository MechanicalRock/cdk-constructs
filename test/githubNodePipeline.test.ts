import { App, Stack, Secret } from '@aws-cdk/cdk';
import { GithubNodePipeline } from '../lib';
import { createExpectedResource } from './utils';

describe('Github Node Pipeline', () => {

  const name = 'MyPipeline';

  const expectedResources = [
    createExpectedResource(new RegExp(name, 'i')),
    createExpectedResource(/devstage/i),
    createExpectedResource(/buildandtestaction/i)
  ];

  it('should create the resources for the pipeline', () => {
    const app = new App();
    const stack = new Stack(app, 'MyPipelineStack');
    const pipeline = new GithubNodePipeline(stack, name, {
      githubOwner: 'Me',
      repoName: 'myRepo',
      ssmGithubAccessToken: new Secret('the secret', 'AccessToken'),
      codeBuildRolePolicy: 'arn:aws:iam::aws:policy/myPolicy'
    });

    const pipelineResources = pipeline.node.findAll();

    for (const expectedResource of expectedResources) {
      for (const websiteResource of pipelineResources) {
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