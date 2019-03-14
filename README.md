[![CircleCI](https://circleci.com/gh/MechanicalRock/cdk-constructs.svg?style=svg)](https://circleci.com/gh/MechanicalRock/cdk-constructs)
[![npm version](https://badge.fury.io/js//cdk-constructs.svg)](https://badge.fury.io/js/cdk-constructs)
[![Coverage Status](https://coveralls.io/repos/github/MechanicalRock/cdk-constructs/badge.svg?branch=master)](https://coveralls.io/github/MechanicalRock/cdk-constructs?branch=master)

# CDK Constructs

CDK constructs to enable creation of AWS resources for projects.

## Install

```bash
npm i -D cdk-constructs
```

## Usage

To create constructs:

```typescript
import { App, Tag, Stack, Secret } from '@aws-cdk/cdk';
import { StaticWebsite, GithubNodePipeline } from '@mechanicalrock/cdk-constructs';

const app = new App();
app.apply(new Tag('owner', 'me'));
app.apply(new Tag('project', 'my-project'));

const stack = new Stack(app, 'myAppStack');

new StaticWebsite(stack, 'MyStaticSite', {
    domainName = 'example.com',
    siteSubDomain: 'sub'
});

new GithubNodePipeline(stack, 'MyPipeline', {
    githubOwner: 'Me',
    repoName: 'MyRepo',
    ssmGithubAccessToken: new Secret('my special secret', 'SpecialSecret'),
    codeBuildRolePolicy: 'MyPolicy'
});

app.run();
```

## License

Apache-2.0
