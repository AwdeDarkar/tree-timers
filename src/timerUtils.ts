import { Duration } from "luxon"

import { durationSerializer, defaultSerializer } from "./localStorageTools"
import type { UUID } from "./uuid"

/**
 * TimerData is an interface that describes the immutable data that is stored in a Timer.
 *
 * @interface
 */
export interface TimerData {
    /**
     * id is a UUID that uniquely identifies this Timer.
     */
    id: UUID

    /**
     * name is a string that describes the Timer and is displayed to the user.
     */
    name: string

    /**
     * totalTime is a Duration that represents the total duration of the timer.
     */
    totalTime: Duration

    /**
     * parentID is a UUID that identifies the parent Timer of this Timer or "root"
     * if this Timer has no parent.
     *
     * @deprecated This field isn't used anymore.
     */
    parentID: UUID | "root"

    /**
     * childrenIDs is an array of UUIDs that identify the children Timers of this Timer.
     * This is how non-root Timers are discovered.
     */
    childrenIDs: UUID[]
}

/**
 * A parent timer needs to know the total duration of its children, so this function
 * retrieves that data from localStorage.
 *
 * @param {UUID} id The UUID of the Timer.
 * @returns {Duration} The totalTime of the timer with the given id.
 */
export function getTimerDuration(id: UUID): Duration {
    return durationSerializer.parse(
        localStorage.getItem(`${id}-totalTime`) || "0",
    )
}

/**
 * This function saves the given TimerData to localStorage.
 *
 * @param {TimerData} timer The TimerData to save.
 */
export function saveTimer(timer: TimerData) {
    localStorage.setItem(`${timer.id}-name`, defaultSerializer.stringify(timer.name))
    localStorage.setItem(`${timer.id}-totalTime`, durationSerializer.stringify(timer.totalTime))
    localStorage.setItem(`${timer.id}-parentID`, defaultSerializer.stringify(timer.parentID))
    localStorage.setItem(`${timer.id}-childrenIDs`, defaultSerializer.stringify(timer.childrenIDs))
}
