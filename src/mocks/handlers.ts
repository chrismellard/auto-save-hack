import {graphql} from 'msw'
import {UpdateBriefInput, UpdateBriefMutation} from "../generated/proxy";
import {UpdateConceptInput, UpdateConceptMutation, UpdateOrderInput, UpdateOrderMutation} from "../generated/api";

export const handlers = [
    graphql.mutation('UpdateBrief', (req, res, ctx) => {
        const updateBriefResponse: UpdateBriefMutation = {
            UpdateBrief: true
        }

        return res(ctx.delay(3000), ctx.data(updateBriefResponse));
    }),
    graphql.mutation('UpdateConcept', (req, res, ctx) => {
        const updateConceptResponse: UpdateConceptMutation = {
            UpdateConcept: true
        }
        return res(ctx.delay(3000), ctx.data(updateConceptResponse));
    }),
    graphql.mutation('UpdateOrder', (req, res, ctx) => {
        const updateOrderResponse: UpdateOrderMutation = {
            UpdateOrder: true
        }
        return res(ctx.delay(3000), ctx.data(updateOrderResponse));
    }),
]