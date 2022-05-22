import { GraphQLClient } from 'graphql-request';
import * as Dom from 'graphql-request/dist/types.dom';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type ConceptInput = {
  conceptDescription: Scalars['String'];
  conceptName: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  UpdateBrief: Scalars['Boolean'];
};


export type MutationUpdateBriefArgs = {
  input?: InputMaybe<UpdateBriefInput>;
};

export type Query = {
  __typename?: 'Query';
  Brief?: Maybe<Scalars['Boolean']>;
};

export type UpdateBriefInput = {
  briefDescription: Scalars['String'];
  briefName: Scalars['String'];
  concepts?: InputMaybe<Array<ConceptInput>>;
};

export type UpdateBriefMutationVariables = Exact<{
  brief: UpdateBriefInput;
}>;


export type UpdateBriefMutation = { __typename?: 'Mutation', UpdateBrief: boolean };


export const UpdateBriefDocument = gql`
    mutation updateBrief($brief: UpdateBriefInput!) {
  UpdateBrief(input: $brief)
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    updateBrief(variables: UpdateBriefMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateBriefMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateBriefMutation>(UpdateBriefDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'updateBrief', 'mutation');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;