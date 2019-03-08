import { CfnCloudFrontOriginAccessIdentity, CloudFrontAllowedCachedMethods, CloudFrontAllowedMethods, CloudFrontWebDistribution, PriceClass } from '@aws-cdk/aws-cloudfront';
import { CanonicalUserPrincipal, PolicyStatement } from '@aws-cdk/aws-iam';
import { AliasRecord, HostedZone } from '@aws-cdk/aws-route53';
import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import { Construct, Output, SSMParameterProvider } from "@aws-cdk/cdk";

export interface StaticSiteProps {
  domainName: string;
  siteSubDomain: string;
}

export class StaticWebsite extends Construct {

  siteDomain: string;
  originAccessIdentity: CfnCloudFrontOriginAccessIdentity;
  siteBucket: Bucket;
  siteDistribution: CloudFrontWebDistribution;

  constructor(parent: Construct, name: string, private props: StaticSiteProps) {
    super(parent, name);

    this.siteDomain = `${props.siteSubDomain}.${props.domainName}`;

    this.originAccessIdentity = this.createOriginAccessIdentity();
    this.siteBucket = this.createSiteBucket();
    this.siteDistribution = this.createSiteDistribution();
    this.createHostedZone();
  }

  private createOriginAccessIdentity() {
    return new CfnCloudFrontOriginAccessIdentity(this, 'OriginAccessIdentity', {
      cloudFrontOriginAccessIdentityConfig: {
        comment: 'Cloud front user which will be allowed to access the site s3 bucket'
      }
    });
  }

  private createSiteBucket() {
    const siteBucket = new Bucket(this, 'SiteBucket', {
      bucketName: this.siteDomain,
      encryption: BucketEncryption.S3Managed
    });

    const bucketPolicy = this.createBucketPolicyStatement(siteBucket.bucketArn);
    siteBucket.addToResourcePolicy(bucketPolicy);

    new Output(this, 'Bucket', { value: siteBucket.bucketName });
    return siteBucket;
  }

  private createBucketPolicyStatement(bucketArn: string) {
    const statement = new PolicyStatement();
    const userPrincipal = new CanonicalUserPrincipal(this.originAccessIdentity.cloudFrontOriginAccessIdentityId);
    statement.addPrincipal(userPrincipal);
    statement.addAction('s3:GetObject');
    statement.addResource(`${bucketArn}/*`);
    return statement;
  }

  private createSiteDistribution() {

    const certificateArn = new SSMParameterProvider(this, {
      parameterName: `CertificateArn-${this.siteDomain}`
    }).parameterValue();

    const distribution = new CloudFrontWebDistribution(this, 'SiteDistribution', {
      comment: 'Cloud front distribution for static website',
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [this.siteDomain]
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: this.siteBucket,
            originAccessIdentity: this.originAccessIdentity
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              compress: true,
              allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS
            }
          ]
        }
      ],
      errorConfigurations: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/'
        }
      ],
      loggingConfig: {
        bucket: this.createLoggingBucket()
      },
      priceClass: PriceClass.PriceClassAll
    });

    new Output(this, 'DistributionId', { value: distribution.distributionId });
    return distribution;
  }

  private createLoggingBucket() {
    return new Bucket(this, 'LogsBucket', {
      encryption: BucketEncryption.S3Managed
    });
  }

  private createHostedZone() {
    const zone = new HostedZone(this, 'HostedZone', {
      zoneName: this.siteDomain,
      comment: `Hosted zone for domain: ${this.siteDomain}`
    });

    new AliasRecord(this, 'SiteAliasRecord', {
      recordName: this.siteDomain,
      target: this.siteDistribution,
      zone
    });
  }
}