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
 *
 * @param props
 * @param props.id
 * @param props.currentTime
 * @param props.triggerStart
 * @param props.triggerStop
 * @param props.onDelete
 * @param props.notifyWhenFinished
 * @param props.siblingRunning
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
     *
     * @param stateName
     * @param defaultValue
     * @param serializer
     */
    function useUUIDStore<T>(
        stateName: string,
        defaultValue: T,
        serializer: CustomSerializable<T> = defaultSerializer,
    ): [T, (newValue: T) => void, () => void] {
        return useLocalStorage<T>(`${id}-${stateName}`, defaultValue, serializer)
    }

    const [name, setName, clearName] = useUUIDStore<string>("name", "unnamed")
    const [totalTime, setTotalTime, clearTotalTime] = useUUIDStore<Duration>("totalTime", Duration.fromMillis(0), durationSerializer)
    const [parentID, setParentID, clearParentID] = useUUIDStore<UUID|"root">("parentID", "root")
    const [childrenIDs, setChildrenIDs, clearChildrenIDs] = useUUIDStore<UUID[]>("childrenIDs", [])

    const [childRunning, setChildRunning, clearChildRunning] = useUUIDStore<UUID | undefined>("childRunning", undefined)
    const [started, setStarted, clearStarted] = useUUIDStore<DateTime | undefined>("started", undefined, datetimeMaybeSerializer)
    const [finished, setFinished, clearFinished] = useUUIDStore<boolean>("finished", false)
    const [elapsed, setElapsed, clearElapsed] = useUUIDStore<Duration>("elapsed", Duration.fromMillis(0), durationSerializer)

    const [expanded, setExpanded] = useState<boolean>(false)
    const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false)

    const addTimer = (timer: TimerData) => {
        saveTimer(timer)
        setChildrenIDs([...childrenIDs, timer.id])
    }

    const clearSelf = () => {
        clearName()
        clearTotalTime()
        clearParentID()
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
 *
 * @param props
 * @param props.running
 * @param props.finished
 * @param props.startable
 * @param props.percentRemaining
 * @param props.onStart
 * @param props.onStop
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
