import React, {useEffect, useState} from 'react';
import {GraphQLClient} from "graphql-request";
import {
    asyncScheduler,
    Observable,
    throttleTime,
    map,
    from,
    concatMap,
    distinctUntilChanged,
    groupBy,
    flatMap,
    tap,
    combineLatest, generate, zip, Subscription
} from "rxjs";
import {ConceptInput, UpdateBriefMutationVariables} from "../../generated/proxy";
import {
    getSdk as apiSdk, UpdateConceptMutationVariables,
    UpdateOrderMutationVariables
} from "../../generated/api";

import {useObservable} from "./observable";
import set from 'lodash.set';

const initialBrief: UpdateBriefMutationVariables = {
    brief: {
        briefName: '',
        briefDescription: '',
        concepts: [
            {
                conceptName: '',
                conceptDescription: ''
            },
            {
                conceptName: '',
                conceptDescription: ''
            }
        ]
    }
};

const initialFormState = {
    briefName: '',
    briefDescription: '',
    concepts: [
        {
            conceptName: '',
            conceptDescription: '',
        },

        {
            conceptName: '',
            conceptDescription: '',
        }
    ]

}

const sdk = apiSdk(new GraphQLClient('http://localhost:3000/graphql'));

const orderTypeMapper = (x: UpdateBriefMutationVariables): UpdateOrderMutationVariables => {
    return {order: {name: x.brief.briefName, description: x.brief.briefDescription}}
}
const orderComparator = (prev: UpdateOrderMutationVariables, current: UpdateOrderMutationVariables) => {
    return prev.order.name === current.order.name && prev.order.description === current.order.description
}
const conceptTypeMapper = (x: IndexedConcept): UpdateConceptMutationVariables => ({
    concept: {name: x.concept.conceptName, description: x.concept.conceptDescription}
})
const conceptComparator = (prev: UpdateConceptMutationVariables, current: UpdateConceptMutationVariables) => {
    return prev.concept.name === current.concept.name && prev.concept.description === current.concept.description
}

interface IndexedConcept {
    key: number
    concept: ConceptInput
}

const AutoSaveObservable = <T,R>(observable: Observable<T>,
                    comparator: (prev: T, curr: T) => boolean,
                    sideEffect: (input: T) => Promise<R>): Observable<[R, number]> => {
    const preThrottleUpdateOrderObservable = zip(
        observable.pipe(
            distinctUntilChanged(comparator),
        ),
        generate({
            initialState: 1,
            condition: (x: number) => x < 1000000,
            iterate: (x: number) => x + 1
        })
    )

    const observableApiCall = preThrottleUpdateOrderObservable.pipe(
        throttleTime(3000, asyncScheduler, {leading: false, trailing: true}),
        tap(x => console.log('throttle open')),
        concatMap(x => zip(
            from(sideEffect(x[0])),
            from([x[1]]),
        )),
    );

    const reconciledApiCall = combineLatest(
        preThrottleUpdateOrderObservable.pipe(
            map(x => x[1])
        ),
        observableApiCall
    ).pipe(
        map<[number, [R, number]], [R, number]>( x => [x[1][0], x[0] - x[1][1]])
    )

    return reconciledApiCall;
}

export const BriefPage = () => {

    const [form, setForm] = useState(initialFormState);

    const [observable, setObservableState] = useObservable(initialBrief);

    const updateOrderApiCall = AutoSaveObservable(
        observable.pipe(map(orderTypeMapper)),
        orderComparator,
        sdk.UpdateOrder
        );

    const conceptGroupedObservables = observable.pipe(
        map(x => x.brief.concepts),
        map<ConceptInput[], IndexedConcept[]>(value => {
            return value.map((x, i) => {
                return {key: i, concept: x}
            })
        }),
        flatMap(x => x),
        groupBy<IndexedConcept, number>(x => x.key),
    )

    useEffect(() => {
        const subscriptions: Subscription[] = []
        const subscription = conceptGroupedObservables.subscribe(o => {
            const p = AutoSaveObservable(
                o.pipe(map(conceptTypeMapper)),
                conceptComparator,
                sdk.UpdateConcept
            );
            const innerSubscription = p.subscribe(x => console.log(x));
            subscriptions.push(innerSubscription);
        });
        subscriptions.push(subscription);
        return () => {
            subscriptions.forEach(s => s.unsubscribe());
        }
    }, [])


    useEffect(() => {
        const subscription = updateOrderApiCall.subscribe(o => console.log(o));
        return () => {
            subscription.unsubscribe();
        }
    }, [])

    useEffect(() => {
        setObservableState({
            brief: {
                briefName: form.briefName,
                briefDescription: form.briefDescription,
                concepts: form.concepts.map(x => {
                    return {conceptName: x.conceptName, conceptDescription: x.conceptDescription}
                })
            }
        });
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm({...form, [event.target.id]: event.target.value});
    };

    const handleConceptChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        setForm(set({...form}, `concepts[${index}].${event.target.id}`, event.target.value))
    }

    return (
        <div>
            <form>
                <label htmlFor="name">Name: <input id="briefName" value={form.briefName} onChange={handleChange}
                                                   type="text"/></label>
                <label htmlFor="description">Description: <input id="briefDescription" value={form.briefDescription}
                                                                 onChange={handleChange} type="text"/></label>
                {form.concepts.map((input, index) => {
                    return <div key={index}>
                        <label htmlFor="conceptName">Concept name: <input id="conceptName" value={input.conceptName}
                                                                          onChange={event => handleConceptChange(index, event)}
                                                                          type="text"/></label>
                        <label htmlFor="conceptDescription">Concept description: <input id="conceptDescription"
                                                                                        value={input.conceptDescription}
                                                                                        onChange={event => handleConceptChange(index, event)}
                                                                                        type="text"/></label>
                    </div>
                })}


            </form>
        </div>
    )
}
