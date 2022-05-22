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

export type Mutation = {
  __typename?: 'Mutation';
  UpdateConcept: Scalars['Boolean'];
  UpdateOrder: Scalars['Boolean'];
};


export type MutationUpdateConceptArgs = {
  input?: InputMaybe<UpdateConceptInput>;
};


export type MutationUpdateOrderArgs = {
  input?: InputMaybe<UpdateOrderInput>;
};

export type Query = {
  __typename?: 'Query';
  Order?: Maybe<Scalars['Boolean']>;
};

export type UpdateConceptInput = {
  description: Scalars['String'];
  name: Scalars['String'];
};

export type UpdateOrderInput = {
  description: Scalars['String'];
  name: Scalars['String'];
};

export type UpdateConceptMutationVariables = Exact<{
  concept: UpdateConceptInput;
}>;


export type UpdateConceptMutation = { __typename?: 'Mutation', UpdateConcept: boolean };

export type UpdateOrderMutationVariables = Exact<{
  order: UpdateOrderInput;
}>;


export type UpdateOrderMutation = { __typename?: 'Mutation', UpdateOrder: boolean };


export const UpdateConceptDocument = gql`
    mutation UpdateConcept($concept: UpdateConceptInput!) {
  UpdateConcept(input: $concept)
}
    `;
export const UpdateOrderDocument = gql`
    mutation UpdateOrder($order: UpdateOrderInput!) {
  UpdateOrder(input: $order)
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    UpdateConcept(variables: UpdateConceptMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateConceptMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateConceptMutation>(UpdateConceptDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateConcept', 'mutation');
    },
    UpdateOrder(variables: UpdateOrderMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateOrderMutation>(UpdateOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateOrder', 'mutation');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;