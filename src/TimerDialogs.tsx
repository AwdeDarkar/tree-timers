import React, { useState, useEffect } from "react"

import { Duration } from "luxon"

import type { UUID } from "./uuid"
import { uuidv4 } from "./uuid"
import { TimerData } from "./timerUtils"

export function AddTimerDialog(props: {
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

export function DurationInput(props: {
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