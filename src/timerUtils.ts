import { Duration } from "luxon"

import { durationSerializer, defaultSerializer } from "./localStorageTools"
import type { UUID } from "./uuid"

export interface TimerData {
    id: UUID
    name: string
    totalTime: Duration
    parentID: UUID | "root"
    childrenIDs: UUID[]
}

/**
 *
 * @param id
 */
export function getTimerDuration(id: UUID): Duration {
    return durationSerializer.parse(
        localStorage.getItem(`${id}-totalTime`) || "0",
    )
}

/**
 *
 * @param timer
 */
export function saveTimer(timer: TimerData) {
    localStorage.setItem(`${timer.id}-name`, defaultSerializer.stringify(timer.name))
    localStorage.setItem(`${timer.id}-totalTime`, durationSerializer.stringify(timer.totalTime))
    localStorage.setItem(`${timer.id}-parentID`, defaultSerializer.stringify(timer.parentID))
    localStorage.setItem(`${timer.id}-childrenIDs`, defaultSerializer.stringify(timer.childrenIDs))
}
