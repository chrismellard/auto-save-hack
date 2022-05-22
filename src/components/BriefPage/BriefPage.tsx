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
    mergeMap, from, zip, combineLatest, concatAll, merge, race, reduce, scan
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

const initialFormState = {
    briefName: '',
    briefDescription: '',
    conceptName: '',
    conceptDescription: '',
}

const sdk = apiSdk(new GraphQLClient('http://localhost:3000/graphql'));

const orderTypeMapper = (x: UpdateBriefMutationVariables): UpdateOrderMutationVariables => {
    return {order: {name: x.brief.briefName, description: x.brief.briefDescription}}
}
const orderComparator = (prev: UpdateOrderMutationVariables, current: UpdateOrderMutationVariables) => {
    return prev.order.name === current.order.name && prev.order.description === current.order.description
}
const conceptTypeMapper = (x: UpdateBriefMutationVariables): UpdateConceptMutationVariables => {
    return {concept: {name: x.brief.concept.conceptName, description: x.brief.concept.conceptDescription}}
}
const conceptComparator = (prev: UpdateConceptMutationVariables, current: UpdateConceptMutationVariables) => {
    return prev.concept.name === current.concept.name && prev.concept.description === current.concept.description
}

const abstractPotato = <T,R>(inputObservable: Observable<T>,
                              comparator: ((prev: T, current: T) => boolean),
                              apiCall: (payload: T) => Promise<R> ): [Observable<R>, Observable<number>] => {

    const throttledObservable = inputObservable.pipe(
        throttleTime(3000, asyncScheduler, {leading: false, trailing: true}),
    )

    const sideEffectedObservable = throttledObservable.pipe(
        mergeMap(x => from(apiCall(x))), // TODO - should probably be a concatMap - will test
    )
    const savingCountObservable = merge(
        throttledObservable.pipe(
            map(x => 1),
        ),
        sideEffectedObservable.pipe(
            map(x => -1),
        )
    ).pipe(
        scan((a, c) => a + c, 0),
    )
    return [sideEffectedObservable, savingCountObservable];
}

export const BriefPage = () => {

    const [saved, setSaved] = useState(false)
    const [form, setForm] = useState(initialFormState);

    const [observable, setSplitObservableState] = useObservable(initialBrief);

    const [updateOrderObservable, orderSavedObservable] = abstractPotato(observable.pipe(map(x => orderTypeMapper(x))), orderComparator, sdk.UpdateOrder);
    const [updateConceptObservable, conceptSavedObservable] = abstractPotato(observable.pipe(map(x => conceptTypeMapper(x))), conceptComparator, sdk.UpdateConcept);


    useEffect(() => {
        const subscription = orderSavedObservable.subscribe(o => {
            console.log(o);
        });
        return () => {
            subscription.unsubscribe();
        }
    }, [])

    useEffect(() => {
        const subscription = updateConceptObservable.subscribe(o => console.log(o.UpdateConcept));
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
