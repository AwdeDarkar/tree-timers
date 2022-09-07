import React, { useState, useEffect } from "react"

import { v4 } from "uuid"

import AccountTreeTwoToneIcon from "@mui/icons-material/AccountTreeTwoTone"
import AccountTreeIcon from "@mui/icons-material/AccountTree"
import ReplayIcon from "@mui/icons-material/Replay"
import { Add, CheckBoxOutlineBlank, DisabledByDefault, CheckBox } from "@mui/icons-material"
import { Delete } from "@mui/icons-material"

import { SemiCircle, PlayButton, PauseCircle, FinishedBox } from "./svgTools"

import { DateTime, Duration } from "luxon"

type UUID = string

function uuidv4(): UUID {
    return v4()
}

interface CustomSerializable<T> {
    stringify: (value: T) => string
    parse: (value: string) => T
}

const defaultSerializer: CustomSerializable<any> = {
    stringify: (value: any) => (typeof value === "string") ? `"${value}"` : JSON.stringify(value),
    parse: (value: string) => JSON.parse(value)
}

const datetimeMaybeSerializer: CustomSerializable<DateTime | undefined> = {
    stringify: (value: DateTime | undefined) => (value === undefined) ? "\"undefined\"" : value.toISO(),
    parse: (value: string) => (value === "\"undefined\"") ? undefined : DateTime.fromISO(value)
}

const durationSerializer: CustomSerializable<Duration> = {
    stringify: (value: Duration) => value.shiftTo("milliseconds").milliseconds.toString(),
    parse: (value: string) => Duration.fromMillis(parseInt(value)).shiftTo("hours", "minutes", "seconds")
}

function useLocalStorage<T>(
        storageKey: string, defaultValue: T,
        serialization: CustomSerializable<T> = defaultSerializer
    ): [T, (newValue: T) => void, () => void] {
    const [value, setValue] = useState(() => {
        const jsonValue = localStorage.getItem(storageKey)
        if (jsonValue != null) return serialization.parse(jsonValue)
        if (typeof defaultValue === "function") {
            return defaultValue()
        } else {
            return defaultValue
        }
    })

    const updateValue = (newValue: T) => {
        setValue(newValue)
        localStorage.setItem(storageKey, serialization.stringify(newValue))
    }

    const clearValue = () => {
        localStorage.removeItem(storageKey)
    }

    return [value, updateValue, clearValue]
}

export function TimerPage(props: {}) {
    function usePageStore<T>(stateName: string, defaultValue: T): [T, (newValue: T) => void, () => void] {
        return useLocalStorage<T>(`root-${stateName}`, defaultValue)
    }

    const [timerIDs, setTimerIDs, _] = usePageStore<UUID[]>("timers", [])
    const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false)
    const [currentTime, setCurrentTime] = useState<DateTime>(DateTime.local())

    const [notificationsActive, setNotificationsActive] = useState<boolean>(false)
    const [notificationsPermitted, setNotificationsPermitted] = useState<NotificationPermission>("default")

    const addTimer = (timer: TimerData) => {
        setTimerIDs([...timerIDs, timer.id])
        saveTimer(timer)
    }

    useEffect(() => { // Update the time once a second
        const interval = setInterval(() => {
            setCurrentTime(DateTime.local())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="TimerPage">
            <h1>Timer Page</h1>
            <table>
                <tr>
                    <td>Notifications?</td>
                    <td>
                        {(!notificationsActive) ?
                            ((notificationsPermitted !== "denied") ?
                                <CheckBoxOutlineBlank
                                    className="IconButton"
                                    onClick={() => {
                                        if (notificationsPermitted === "default") {
                                            Notification.requestPermission().then((result) => {
                                                setNotificationsPermitted(result)
                                                setNotificationsActive(result === "granted")
                                            })
                                        } else {
                                            setNotificationsActive(true)
                                        }
                                    }}
                                /> :
                                <DisabledByDefault />) :
                            <CheckBox
                                className="IconButton"
                                onClick={() => setNotificationsActive(false)}
                            />
                        }
                    </td>
                </tr>
            </table>
            <ul className="TimerList">
                {timerIDs.map(id => (
                    <Timer
                        key={id}
                        id={id}
                        onDelete={() => {
                            setTimerIDs(timerIDs.filter((tid) => tid !== id))
                        }}
                        currentTime={currentTime}
                        notifyWhenFinished={notificationsActive}
                    />)
                )}
            </ul>
            {addDialogOpen || (
                <Add
                    className="IconButton"
                    onClick={() => setAddDialogOpen(true)}
                />
            )}
            {addDialogOpen && <AddTimerDialog addTimer={addTimer} onCancel={() => setAddDialogOpen(false)} />}
        </div>
    )
}

function AddTimerDialog(props: {
        maxDuration?: Duration,
        parentID?: UUID,
        addTimer: (timer: TimerData) => void,
        onCancel: () => void
    }) {
    const { addTimer, onCancel, parentID } = props

    const [name, setName] = useState<string>("")
    const [totalTime, setTotalTime] = useState<Duration|undefined>(undefined)

    return (
        <table>
            <tr>
                <td><label>Name</label></td>
                <td>
                    <input
                        value={name}
                        onChange={({ target }) => setName(target.value)}
                    />
                </td>
            </tr>
            <tr>
                <td><label>Total Time</label></td>
                <td>
                    <DurationInput
                        maxDuration={props.maxDuration}
                        onChange={(time) => setTotalTime(Duration.fromObject(time))}
                    />
                </td>
            </tr>
            <tr>
                <td>
                    <button
                        onClick={() => {
                            addTimer({
                                id: uuidv4(),
                                name,
                                totalTime: totalTime || Duration.fromMillis(0),
                                parentID: parentID || "root",
                                childrenIDs: [],
                            })
                            onCancel()
                        }}>
                        Add
                    </button>
                </td>
                <td>
                    <button onClick={onCancel}>Cancel</button>
                </td>
            </tr>
        </table>
    )
}

function DurationInput(props: {
        onChange: (time: {hours: number, minutes: number, seconds: number}) => void,
        maxDuration?: Duration|undefined,
    }) {
    const { onChange, maxDuration } = props

    const [hours, setHours] = useState<number>(0)
    const [minutes, setMinutes] = useState<number>(0)
    const [seconds, setSeconds] = useState<number>(0)

    const currentDuration = Duration.fromObject({ hours, minutes, seconds }).shiftTo("milliseconds")
    const availableDuration = maxDuration ? maxDuration.minus(currentDuration) : undefined

    useEffect(() => {
        onChange({ hours, minutes, seconds })
    }, [hours, minutes, seconds, onChange])

    if (seconds > 59) {
        setSeconds(seconds - 60)
        setMinutes(minutes + 1)
    } else if (seconds < 0) {
        if (minutes > 0) {
            setSeconds(seconds + 60)
            setMinutes(minutes - 1)
        } else {
            setSeconds(0)
        }
    }
    if (minutes > 59) {
        setMinutes(minutes - 60)
        setHours(hours + 1)
    } else if (minutes < 0) {
        if (hours > 0) {
            setMinutes(minutes + 60)
            setHours(hours - 1)
        } else {
            setMinutes(0)
        }
    }
    if (hours < 0) {
        setHours(0)
    }
    if (availableDuration && availableDuration.as("milliseconds") < 0) {
        const { hours, minutes, seconds } = availableDuration
            .plus(currentDuration)
            .shiftTo("hours", "minutes", "seconds")
            .toObject()

        if (hours !== undefined) {
            setHours(hours)
        }
        if (minutes !== undefined) {
            setMinutes(minutes)
        }
        if (seconds !== undefined) {
            setSeconds(seconds)
        }
    }

    const padZero = (num: number) => num < 10 ? `0${num}` : String(num)

    return (
        <div className="TimeInput">
            <input
                type="number"
                className="TimeInputField"
                maxLength={2}
                size={2}
                value={padZero(hours)}
                onChange={
                    ({ target }) => {
                        const hours = parseInt(target.value) || 0
                        setHours(hours)
                    }
                }
            />
            <span>:</span>
            <input
                type="number"
                className="TimeInputField"
                maxLength={2}
                size={2}
                value={padZero(minutes)}
                onChange={
                    ({ target }) => {
                        const minutes = parseInt(target.value) || 0
                        setMinutes(minutes)
                    }
                }
            />
            <span>:</span>
            <input
                type="number"
                className="TimeInputField"
                maxLength={2}
                size={2}
                value={padZero(seconds)}
                onChange={
                    ({ target }) => {
                        const seconds = parseInt(target.value) || 0
                        setSeconds(seconds)
                    }
                }
            />
            {availableDuration &&
                <span>{availableDuration.toFormat("hh:mm:ss")}</span>
            }
        </div>
    )
}

interface TimerData {
    id: UUID
    name: string
    totalTime: Duration
    parentID: UUID | "root"
    childrenIDs: UUID[]
}

function getTimerDuration(id: UUID): Duration {
    return durationSerializer.parse(
        localStorage.getItem(`${id}-totalTime`) || "0"
    )
}

function saveTimer(timer: TimerData) {
    localStorage.setItem(`${timer.id}-name`, defaultSerializer.stringify(timer.name))
    localStorage.setItem(`${timer.id}-totalTime`, durationSerializer.stringify(timer.totalTime))
    localStorage.setItem(`${timer.id}-parentID`, defaultSerializer.stringify(timer.parentID))
    localStorage.setItem(`${timer.id}-childrenIDs`, defaultSerializer.stringify(timer.childrenIDs))
}

function Timer(props: {
        id: UUID,
        currentTime: DateTime,
        triggerStart?: () => void,
        triggerStop?: () => void,
        onDelete?: () => void,
        notifyWhenFinished?: boolean,
        siblingRunning?: UUID,
    }) {

    function useUUIDStore<T>(stateName: string, defaultValue: T, serializer: CustomSerializable<T> = defaultSerializer): [T, (newValue: T) => void, () => void] {
        return useLocalStorage<T>(`${props.id}-${stateName}`, defaultValue, serializer)
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

    const currentSegment = (started !== undefined) ? props.currentTime.diff(started) : Duration.fromMillis(0)
    const timeRemaining = totalTime.minus(currentSegment.plus(elapsed))
    const childrenTime: Duration = childrenIDs.reduce(
        (acc, cid) => acc.plus(getTimerDuration(cid)), Duration.fromMillis(0))
        .shiftTo("milliseconds")
    const unallocatedTime = totalTime.minus(childrenTime)

    if (timeRemaining.shiftTo("milliseconds").milliseconds < 10 && started) {
        if (props.notifyWhenFinished) {
            new Notification("Timer finished", { body: name })
        }
        setStarted(undefined)
        setFinished(true)
        props.triggerStop && props.triggerStop()
    }

    const toggleExpanded = () => { setExpanded(!expanded) }

    const startTimer = () => {
        setStarted(props.currentTime)
        props.triggerStart && props.triggerStart()
    }

    const stopTimer = () => {
        setElapsed(elapsed.plus(props.currentTime.diff(started || DateTime.local())))
        setStarted(undefined)
        if (childRunning !== undefined) {
            setChildRunning("__NONE__" as UUID)
        }
        props.triggerStop && props.triggerStop()
    }

    if (props.siblingRunning && props.siblingRunning !== props.id && started) {
        setElapsed(elapsed.plus(props.currentTime.diff(started || DateTime.local())))
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
                {expanded ?
                    <AccountTreeIcon
                        className="IconButton"
                        onClick={toggleExpanded}
                    />
                    :
                    <AccountTreeTwoToneIcon
                        className="IconButton"
                        onClick={toggleExpanded}
                    />
                }
                {` ${(finished) ? "00:00:00" : timeRemaining.toFormat("hh:mm:ss")}`}
                {totalTime.minus(timeRemaining).shiftTo("milliseconds").milliseconds >= 0 &&
                    <ReplayIcon
                        className="IconButton"
                        onClick={() => {
                            setElapsed(Duration.fromMillis(0))
                            setFinished(false)
                            if (started) {
                                setStarted(props.currentTime)
                            }
                        }}
                    />
                }
                {props.onDelete &&
                    <Delete
                        className="IconButton"
                        onClick={() => {
                            clearSelf()
                            props.onDelete && props.onDelete()
                        }}
                    />
                }
            </h2>
            {expanded && <ul className="TimerList">
                {childrenIDs.map(cid => (
                    <Timer
                        key={cid}
                        id={cid}
                        currentTime={props.currentTime}

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
                            setChildrenIDs(childrenIDs.filter(id => id !== cid))
                        }}
                        siblingRunning={childRunning}
                        notifyWhenFinished={props.notifyWhenFinished || false}
                    />)
                )}
                {addDialogOpen || (unallocatedTime.shiftTo("milliseconds").milliseconds > 0 &&
                    <div>
                        <Add
                            className="IconButton"
                            onClick={() => setAddDialogOpen(true)}
                        />
                        {` Add Timer (unallocated: ${unallocatedTime.toFormat("hh:mm:ss")})`}
                    </div>
                )}
                {addDialogOpen &&
                    <AddTimerDialog
                        addTimer={addTimer}
                        maxDuration={unallocatedTime}
                        parentID={props.id}
                        onCancel={() => setAddDialogOpen(false)}
                    />
                }
            </ul>
            }
        </li>
    )
}

function TimerControl(props: {
        running: boolean, finished: boolean, startable: boolean,
        percentRemaining: number,
        onStart: () => void, onStop: () => void}
    ) {
    const { running, finished, startable, percentRemaining, onStart, onStop } = props
    const [hovering, setHovering] = useState<boolean>(false)

    const radius = 8

    if (finished) {
        return (
            <span className="TimerControl"
                style={{ cursor: "not-allowed" }}
            >
                <FinishedBox radius={radius} fill="#48A0B8" />
            </span>
        )
    }

    if (!startable && !running) {
        return (
            <span className="TimerControl"
                style={{ cursor: "not-allowed" }}
            >
                <FinishedBox radius={radius} fill="#61DAFB" />
            </span>
        )
    }

    return (
        <span className="TimerControl"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}

            onClick={running ? onStop : onStart}
        >
            {(running) ? 
                (hovering) ?
                    <PauseCircle radius={radius} fill="#C9EFFB" percent={percentRemaining} /> :
                    <SemiCircle radius={radius} fill="#61dafb" percent={percentRemaining} /> 
                 :
                <PlayButton radius={radius} fill={(hovering) ? "#C9EFFB" : "#61dafb"} />
            }
        </span>
    )
}