import { LinuxBuildImage, PipelineBuildAction, PipelineBuildActionProps, PipelineProject } from '@aws-cdk/aws-codebuild';
import { GitHubSourceAction, Pipeline, PipelineProps } from '@aws-cdk/aws-codepipeline';
import { Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { Construct, SSMParameterProvider } from '@aws-cdk/cdk';

export interface Props extends PipelineProps {
  githubOwner: string
  repoName: string
  ssmGithubTokenName: string
  codeBuildRolePolicy: string
}

export class GithubNodePipeline extends Construct {

  codeBuildRole: Role;
  pipeline: Pipeline;

  constructor(parent: Construct, private name: string, private props: Props) {
    super(parent, name);
    this.codeBuildRole = this.createCodeBuildRole();
    this.pipeline = this.createPipeline();
    this.createSourceStage();
    this.createDevStage();
  }

  private createPipeline(): Pipeline {
    const pipeline = new Pipeline(this, this.name, {
      pipelineName: this.name,
      restartExecutionOnUpdate: true
    });
    return pipeline;
  }

  private createCodeBuildRole(): Role {
    const codeBuildRole = new Role(this, 'CodeBuildRole', {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com')
    });
    codeBuildRole.attachManagedPolicy(this.props.codeBuildRolePolicy);
    return codeBuildRole;
  }

  private createDevStage(): void {
    const stage = this.pipeline.addStage('DevStage');
    const project = this.createCodeBuildProject('BuildAndTest');

    this.createCodeBuildAction('BuildAndTestAction', {
      project,
      stage
    });
  }

  private createCodeBuildProject(projectName: string): PipelineProject {
    return new PipelineProject(this, projectName, {
      environment: {
        buildImage: LinuxBuildImage.UBUNTU_14_04_NODEJS_10_1_0
      },
      role: this.codeBuildRole
    });
  }

  private createCodeBuildAction(actionName: string, props: PipelineBuildActionProps): void {
    new PipelineBuildAction(this, actionName, props);
  }

  private createSourceStage(): void {
    const stage = this.pipeline.addStage('Checkout');


    const oauthToken = new SSMParameterProvider(this, {
      parameterName: this.props.ssmGithubTokenName
    }).parameterValue();

    new GitHubSourceAction(this, 'GithubSource', {
      owner: this.props.githubOwner,
      repo: this.props.repoName,
      stage,
      oauthToken
    });
  }

}
