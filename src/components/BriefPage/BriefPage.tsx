import React, {useCallback, useEffect, useState} from 'react';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import {GraphQLClient} from "graphql-request";
import {
    asyncScheduler,
    BehaviorSubject,
    distinctUntilChanged,
    interval,
    Observable,
    of,
    tap,
    throttleTime,
    partition,
    map,
    mergeMap, from
} from "rxjs";
import {UpdateBriefMutationVariables} from "../../generated/proxy";
import {
    getSdk as apiSdk,
    UpdateConceptMutationVariables,
    UpdateOrderMutationVariables
} from "../../generated/api";

import {useObservable, useThrottledObservable} from "./observable";

const initialBrief: UpdateBriefMutationVariables = {
    brief: {
        briefName: '',
        briefDescription: '',
        concept: {
            conceptName: '',
            conceptDescription: ''
        }
    }
};

const briefComparator = (p: UpdateBriefMutationVariables, c: UpdateBriefMutationVariables): boolean => {
    return p.brief.briefName === c.brief.briefName && p.brief.briefDescription === c.brief.briefDescription;
}

const initialFormState = {
    briefName: '',
    briefDescription: '',
    conceptName: '',
    conceptDescription: '',
}

const sdk = apiSdk(new GraphQLClient('http://localhost:3000/graphql'));


export const BriefPage = () => {

    const [saved, setSaved] = useState(false)
    const [form, setForm] = useState(initialFormState);

    const [splitObservable, setSplitObservableState] = useObservable(initialBrief);

    const updateOrderObservable = splitObservable.pipe(
        map<UpdateBriefMutationVariables, UpdateOrderMutationVariables>(x => {
            return {order: {name: x.brief.briefName, description: x.brief.briefDescription}}
        }),
        distinctUntilChanged((prev, current) => {
            return prev.order.name === current.order.name && prev.order.description === current.order.description
        }),
        throttleTime(3000, asyncScheduler, {leading: false, trailing: true}),
        mergeMap(x => from(sdk.UpdateOrder(x)))
    )

    const updateConceptObservable = splitObservable.pipe(
        map<UpdateBriefMutationVariables, UpdateConceptMutationVariables>(x => {
            return {concept: {name: x.brief.concept.conceptName, description: x.brief.concept.conceptDescription}}
        }),
        distinctUntilChanged((prev, current) => {
            console.log(prev);
            console.log(current);
            return prev.concept.name === current.concept.name && prev.concept.description === current.concept.description
        }),
        throttleTime(3000, asyncScheduler, {leading: false, trailing: true}),
        mergeMap(x => from(sdk.UpdateConcept(x)))
    )

    useEffect(() => {
        const subscription = updateOrderObservable.subscribe(o => console.log('save order'));
        return () => {
            subscription.unsubscribe();
        }
    }, [])

    useEffect(() => {
        const subscription = updateConceptObservable.subscribe(o => console.log('save concept'));
        return () => {
            subscription.unsubscribe();
        }
    }, [])

    useEffect(() => {
        setSplitObservableState({
            brief: {
                briefName: form.briefName,
                briefDescription: form.briefDescription,
                concept: {conceptName: form.conceptName, conceptDescription: form.conceptDescription}
            }
        });
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm({...form, [event.target.id]: event.target.value});
    };

    return (
        <div>
            <form>
                <label htmlFor="name">Name: <input id="briefName" value={form.briefName} onChange={handleChange}
                                                   type="text"/></label>
                <label htmlFor="description">Description: <input id="briefDescription" value={form.briefDescription}
                                                                 onChange={handleChange} type="text"/></label>
                <label htmlFor="conceptName">Concept name: <input id="conceptName" value={form.conceptName}
                                                                  onChange={handleChange} type="text"/></label>
                <label htmlFor="conceptDescription">Concept description: <input id="conceptDescription"
                                                                                value={form.conceptDescription}
                                                                                onChange={handleChange}
                                                                                type="text"/></label>

            </form>
            <p>Saved is {saved ? 'saved' : 'unsaved'}</p>
        </div>
    )
}
