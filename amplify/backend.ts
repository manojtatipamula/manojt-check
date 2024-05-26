import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import {Stack} from "aws-cdk-lib"
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi
} from "aws-cdk-lib/aws-apigateway"

import {Policy, PolicyStatement} from "aws-cdk-lib/aws-iam"
import  {myApiFunction} from "./functions/api-function/resource"

const backend = defineBackend({
  auth,
  data,
  myApiFunction
});

const apiStack = backend.createStack("api-stack")
const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName : 'manojRestApi',
  deploy: true,
  defaultCorsPreflightOptions : {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods : Cors.ALL_METHODS,
    allowHeaders : Cors.DEFAULT_HEADERS
  }
})

const lambdaIntegration =  new LambdaIntegration(
  backend.myApiFunction.resources.lambda
)
const itemsPath = myRestApi.root.addResource("items", {
  defaultMethodOptions: {
    authorizationType : AuthorizationType.IAM
  }
})
itemsPath.addMethod("Get", lambdaIntegration)
itemsPath.addMethod("POST", lambdaIntegration)
itemsPath.addMethod("DELETE", lambdaIntegration)
itemsPath.addMethod("PUT", lambdaIntegration)

itemsPath.addProxy({
  anyMethod : true,
  defaultIntegration: lambdaIntegration
})

const congnitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools : [backend.auth.resources.userPool]
})


const booksPath = myRestApi.root.addResource("congnito-auth-path")

booksPath.addMethod("Get", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: congnitoAuth
})

const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements : [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${myRestApi.arnForExecuteApi("items")}`,
        `${myRestApi.arnForExecuteApi("cognito-auth-path")}`,
      ]
    })
  ]
})

backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiRestPolicy)
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(apiRestPolicy)

backend.addOutput({
  custom : {
    API: {
      [myRestApi.restApiName] : {
        endpoint: myRestApi.url,
        region: Stack.of(myRestApi).region,
        apiName : myRestApi.restApiName
      }
    }
  }
})