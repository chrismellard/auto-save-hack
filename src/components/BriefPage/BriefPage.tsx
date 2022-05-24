import React, {useEffect, useState} from 'react';
import {GraphQLClient} from "graphql-request";
import {
    asyncScheduler,
    catchError,
    combineLatest,
    concatMap,
    distinctUntilChanged,
    filter,
    flatMap,
    from,
    generate,
    groupBy,
    map,
    merge,
    Observable,
    of,
    retry,
    tap,
    throttleTime,
    zip
} from "rxjs";
import {ConceptInput, UpdateBriefMutationVariables} from "../../generated/proxy";
import {getSdk as apiSdk, UpdateConceptMutationVariables, UpdateOrderMutationVariables} from "../../generated/api";

import {useObservable} from "./observable";
import set from 'lodash.set';

type SequenceType = {
    sequenceNumber: number
}

const initialBrief: UpdateBriefMutationVariables & SequenceType = {
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
    },
    sequenceNumber: 0
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

const orderTypeMapper = (x: UpdateBriefMutationVariables & SequenceType): UpdateOrderMutationVariables & { sequenceNumber: number } => {
    return {order: {name: x.brief.briefName, description: x.brief.briefDescription}, sequenceNumber: x.sequenceNumber}
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

interface Retry {
    retrying: boolean
}

let counter = 0;

const AutoSaveObservable = <T extends { sequenceNumber: number }, R>(observable: Observable<T>,
                                                                     comparator: (prev: T, curr: T) => boolean,
                                                                     sideEffect: (input: T) => Promise<R>): Observable<[R, number] | Retry> => {
    const preThrottleUpdateOrderObservable = observable.pipe(
        tap(x => console.log(x)),
        distinctUntilChanged(comparator),
    )

    const observableApiCall = preThrottleUpdateOrderObservable.pipe(
        throttleTime(3000, asyncScheduler, {leading: false, trailing: true}),
        concatMap(x => zip(
            from(sideEffect(x)),
            from([x.sequenceNumber]),
        )),
    );

    function inputIsRetry(input: [R, number] | Retry): input is Retry {
        return (input as Retry).retrying !== undefined;
    }

    const trapError = observableApiCall.pipe(
        catchError<[R, number], Observable<Retry>>(x => of({retrying: true})),
        filter(inputIsRetry),
    )

    const reconciledApiCall = combineLatest(
        preThrottleUpdateOrderObservable.pipe(
            map(x => x.sequenceNumber)
        ),
        observableApiCall.pipe(
            retry({
                count: 3,
                delay: 1000
            })
        )
    ).pipe(
        map<[number, [R, number]], [R, number]>(x => [x[1][0], x[0] - x[1][1]])
    )

    return merge(reconciledApiCall, trapError);
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
    //
    // useEffect(() => {
    //     const subscriptions: Subscription[] = []
    //     const subscription = conceptGroupedObservables.subscribe(o => {
    //         const p = AutoSaveObservable(
    //             o.pipe(map(conceptTypeMapper)),
    //             conceptComparator,
    //             sdk.UpdateConcept
    //         );
    //         const innerSubscription = p.subscribe(x => console.log(x));
    //         subscriptions.push(innerSubscription);
    //     });
    //     subscriptions.push(subscription);
    //     return () => {
    //         subscriptions.forEach(s => s.unsubscribe());
    //     }
    // }, [])


    useEffect(() => {
        const subscription = updateOrderApiCall.subscribe(o => console.log(o), error => console.log('i should not be here unless retry fails'));
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
            },
            sequenceNumber: counter++
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
