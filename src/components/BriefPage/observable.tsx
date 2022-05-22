import {asyncScheduler, BehaviorSubject, distinctUntilChanged, Observable, throttleTime} from "rxjs";
import {useState} from "react";


export const useObservable = <T, >(initialState: T): [Observable<T>, (value: T) => void] => {
    const [observable] = useState(new BehaviorSubject<T>(initialState));

    const handleNext = (value: T) => {
        observable.next(value);
    };

    return [observable, handleNext];
}
