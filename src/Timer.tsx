import React, { useState } from "react"

import AccountTreeTwoToneIcon from "@mui/icons-material/AccountTreeTwoTone"
import AccountTreeIcon from "@mui/icons-material/AccountTree"
import ReplayIcon from "@mui/icons-material/Replay"
import { Add, Delete } from "@mui/icons-material"

import { DateTime, Duration } from "luxon"

import type { UUID } from "./uuid"
import {
    useLocalStorage, CustomSerializable,
    defaultSerializer, durationSerializer,
    datetimeMaybeSerializer,
} from "./localStorageTools"
import { TimerData, saveTimer, getTimerDuration } from "./timerUtils"
import { AddTimerDialog } from "./TimerDialogs"
import {
    PauseCircle, PlayButton,
    SemiCircle, FinishedBox,
} from "./svgTools"

/**
 * Timer component.
 *
 * This is the main component for the timer page, it represents a countdown timer
 * that may have children timers and enforces some rules about its children.
 *
 * @param {any} props Component props
 * @param {UUID} props.id
 *  The ID of the timer to display (used to lookup the timer data from local storage)
 * @param {DateTime} props.currentTime The current time (used to calculate the time remaining)
 * @param {Function} props.triggerStart Callback to inform the parent that the timer has started
 * @param {Function} props.triggerStop Callback to inform the parent that the timer has paused
 * @param {Function} props.onDelete Callback to inform the parent that the timer has been deleted
 * @param {boolean} props.notifyWhenFinished Whether to notify the user when the timer finishes
 * @param {UUID} props.siblingRunning
 *  The ID of the sibling timer that is currently running (may be this timer,
 *  or a non-existent timer). Used to enforce the rule that only one timer at a level
 *  can be running at a time.
 * @returns {Element} The timer component
 */
export default function Timer(props: {
        id: UUID,
        currentTime: DateTime,
        triggerStart?: () => void,
        triggerStop?: () => void,
        onDelete?: () => void,
        notifyWhenFinished?: boolean,
        siblingRunning?: UUID,
    }) {
    const {
        id, currentTime,
        triggerStart, triggerStop,
        onDelete, notifyWhenFinished,
        siblingRunning,
    } = props

    /**
     * This is a custom hook to manage the state of the timer and synchronize it
     * with local storage by UUID. It is a wrapper around useLocalStorage and
     * saves values in the format `<uuid>-<stateName>`.
     *
     * @template T The type of the state to manage
     * @param {string} stateName The name of the state to manage (used as a suffix for the key)
     * @param {T} defaultValue The default value to use if the state is not found in local storage
     * @param {CustomSerializable} serializer
     *  Serializer to correctly manage the state in local storage
     * @returns {[T, (newValue: T) => void, () => void]}
     *  The state value, a function to update the state, and a function to reset the state
     */
    function useUUIDStore<T>(
        stateName: string,
        defaultValue: T,
        serializer: CustomSerializable<T> = defaultSerializer,
    ): [T, (newValue: T) => void, () => void] {
        return useLocalStorage<T>(`${id}-${stateName}`, defaultValue, serializer)
    }

    // TODO: setName and setTotalTime are unused, they'll be put in the edit dialog
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [name, setName, clearName] = useUUIDStore<string>("name", "unnamed")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [totalTime, setTotalTime, clearTotalTime] = useUUIDStore<Duration>("totalTime", Duration.fromMillis(0), durationSerializer)
    const [childrenIDs, setChildrenIDs, clearChildrenIDs] = useUUIDStore<UUID[]>("childrenIDs", [])

    const [childRunning, setChildRunning, clearChildRunning] = useUUIDStore<UUID | undefined>("childRunning", undefined)
    const [started, setStarted, clearStarted] = useUUIDStore<DateTime | undefined>("started", undefined, datetimeMaybeSerializer)
    const [finished, setFinished, clearFinished] = useUUIDStore<boolean>("finished", false)
    const [elapsed, setElapsed, clearElapsed] = useUUIDStore<Duration>("elapsed", Duration.fromMillis(0), durationSerializer)

    // These are the states that are not saved to local storage
    const [expanded, setExpanded] = useState<boolean>(false)
    const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false)

    const addTimer = (timer: TimerData) => {
        saveTimer(timer)
        setChildrenIDs([...childrenIDs, timer.id])
    }

    // This function cleans up storage on deletion, though it's a bit messy and
    // could probably be improved to more easily support adding new states
    const clearSelf = () => {
        clearName()
        clearTotalTime()
        clearChildrenIDs()
        clearChildRunning()
        clearStarted()
        clearFinished()
        clearElapsed()
    }

    const currentSegment = (started !== undefined)
        ? currentTime.diff(started)
        : Duration.fromMillis(0)

    const timeRemaining = totalTime.minus(currentSegment.plus(elapsed))

    const childrenTime: Duration = childrenIDs.reduce((acc: Duration, cid: UUID) => (
        acc.plus(getTimerDuration(cid))
    ), Duration.fromMillis(0)).shiftTo("milliseconds")

    const unallocatedTime = totalTime.minus(childrenTime)

    if (timeRemaining.shiftTo("milliseconds").milliseconds < 10 && started) {
        if (notifyWhenFinished) {
            new Notification("Timer finished", { body: name }) // eslint-disable-line no-new
        }
        setStarted(undefined)
        setFinished(true)
        triggerStop && triggerStop()
    }

    const toggleExpanded = () => { setExpanded(!expanded) }

    const startTimer = () => {
        setStarted(currentTime)
        triggerStart && triggerStart()
    }

    const stopTimer = () => {
        setElapsed(elapsed.plus(currentTime.diff(started || DateTime.local())))
        setStarted(undefined)
        if (childRunning !== undefined) {
            setChildRunning("__NONE__" as UUID)
        }
        triggerStop && triggerStop()
    }

    if (siblingRunning && siblingRunning !== id && started) {
        setElapsed(elapsed.plus(currentTime.diff(started || DateTime.local())))
        setStarted(undefined)
    }

    return (
        <li className="Timer">
            <h2>
                <TimerControl
                    running={started !== undefined}
                    finished={finished}
                    startable={totalTime.minus(childrenTime).shiftTo("milliseconds").milliseconds > 0}
                    percentRemaining={timeRemaining.shiftTo("milliseconds").milliseconds / totalTime.shiftTo("milliseconds").milliseconds}
                    onStart={startTimer}
                    onStop={stopTimer}
                />
                {` ${name} `}
                {expanded
                    ? (
                        <AccountTreeIcon
                            className="IconButton"
                            onClick={toggleExpanded}
                        />
                    )
                    : (
                        <AccountTreeTwoToneIcon
                            className="IconButton"
                            onClick={toggleExpanded}
                        />
                    )}
                {` ${(finished) ? "00:00:00" : timeRemaining.toFormat("hh:mm:ss")}`}
                {totalTime.minus(timeRemaining).shiftTo("milliseconds").milliseconds >= 0
                    && (
                        <ReplayIcon
                            className="IconButton"
                            onClick={() => {
                                setElapsed(Duration.fromMillis(0))
                                setFinished(false)
                                if (started) {
                                    setStarted(currentTime)
                                }
                            }}
                        />
                    )}
                {onDelete
                && (
                    <Delete
                        className="IconButton"
                        onClick={() => {
                            clearSelf()
                            onDelete && onDelete()
                        }}
                    />
                )}
            </h2>
            {expanded
            && (
                <ul className="TimerList">
                    {childrenIDs.map((cid) => (
                        (
                            <Timer
                                key={cid}
                                id={cid}
                                currentTime={currentTime}
                                triggerStart={() => {
                                    setChildRunning(cid)
                                    if (started === undefined) {
                                        startTimer()
                                    }
                                }}
                                triggerStop={() => {
                                    setChildRunning(undefined)
                                    if (started !== undefined) {
                                        stopTimer()
                                    }
                                }}
                                onDelete={() => {
                                    setChildrenIDs(childrenIDs.filter((_cid) => _cid !== cid))
                                }}
                                siblingRunning={childRunning}
                                notifyWhenFinished={notifyWhenFinished || false}
                            />
                        )))}
                    {addDialogOpen || (unallocatedTime.shiftTo("milliseconds").milliseconds > 0
                    && (
                        <div>
                            <Add
                                className="IconButton"
                                onClick={() => setAddDialogOpen(true)}
                            />
                            {` Add Timer (unallocated: ${unallocatedTime.toFormat("hh:mm:ss")})`}
                        </div>
                    ))}
                    {addDialogOpen
                    && (
                        <AddTimerDialog
                            addTimer={addTimer}
                            maxDuration={unallocatedTime}
                            parentID={id}
                            onCancel={() => setAddDialogOpen(false)}
                        />
                    )}
                </ul>
            )}
        </li>
    )
}

/**
 * Custom start/pause control for timers that indecates the percent of time remaining
 *
 * @param {any} props Component props
 * @param {boolean} props.running Whether the timer is currently running
 * @param {boolean} props.finished Whether the timer has finished
 * @param {boolean} props.startable
 *  Whether the timer can be started (parent timers can't be started if all their time is allocated)
 * @param {number} props.percentRemaining The percent of time remaining (0-1)
 * @param {Function} props.onStart Callback to start the timer
 * @param {Function} props.onStop Callback to pause the timer
 * @returns {Element} The component
 */
function TimerControl(props: {
        running: boolean, finished: boolean, startable: boolean,
        percentRemaining: number,
        onStart: () => void, onStop: () => void}) {
    const {
        running, finished, startable,
        percentRemaining,
        onStart, onStop,
    } = props

    const [hovering, setHovering] = useState<boolean>(false)

    const radius = 8

    if (finished) {
        return (
            <span
                className="TimerControl"
                style={{ cursor: "not-allowed" }}
            >
                <FinishedBox radius={radius} fill="#48A0B8" />
            </span>
        )
    }

    if (!startable && !running) {
        return (
            <span
                className="TimerControl"
                style={{ cursor: "not-allowed" }}
            >
                <FinishedBox radius={radius} fill="#61DAFB" />
            </span>
        )
    }

    return (
        <span
            className="TimerControl"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={running ? onStop : onStart}
            onKeyDown={running ? onStop : onStart}
        >
            {(running && hovering) && (
                <PauseCircle radius={radius} fill="#C9EFFB" percent={percentRemaining} />
            )}
            {(running && !hovering) && (
                <SemiCircle radius={radius} fill="#61dafb" percent={percentRemaining} />
            )}
            {(!running) && (
                <PlayButton radius={radius} fill={(hovering) ? "#C9EFFB" : "#61dafb"} />
            )}
        </span>
    )
}
