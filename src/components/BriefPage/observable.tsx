import {asyncScheduler, BehaviorSubject, distinctUntilChanged, Observable, throttleTime} from "rxjs";
import {useState} from "react";


export const useObservable = <T, >(initialState: T): [Observable<T>, (value: T) => void] => {
    const [observable] = useState(new BehaviorSubject<T>(initialState));

    const handleNext = (value: T) => {
        observable.next(value);
    };

    return [observable, handleNext];
}

export const useThrottledObservable = <T, >(initialState: T, comparator: (prev: T, current: T) => boolean): [Observable<T>, (value: T) => void] => {
    const [observable] = useState(new BehaviorSubject<T>(initialState));

    const distinctThrottledObservable = observable.pipe(
        throttleTime(3000, asyncScheduler, {leading: false, trailing: true}),
        distinctUntilChanged(comparator),
    );

    const handleNext = (value: T) => {
        observable.next(value);
    };

    return [distinctThrottledObservable, handleNext];
}