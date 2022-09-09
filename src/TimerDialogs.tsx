import React, { useState, useEffect } from "react"

import { Duration } from "luxon"

import type { UUID } from "./uuid"
import { uuidv4 } from "./uuid"
import { TimerData } from "./timerUtils"

/**
 * Component form dialog for adding a new timer
 *
 * @param {any} props Component props
 * @param {Duration?} props.maxDuration
 *  The maximum duration that can be set on this timer (by parent)
 * @param {UUID} props.parentID The ID of the parent timer (if any)
 * @param {Function} props.addTimer Callback to add a timer to the page
 * @param {Function} props.onCancel Callback to cancel the timer creation
 * @returns {Element} A JSX element for the timer creation dialog
 */
export function AddTimerDialog(props: {
        maxDuration?: Duration,
        parentID?: UUID,
        addTimer: (timer: TimerData) => void,
        onCancel: () => void
    }) {
    const {
        addTimer, onCancel, parentID, maxDuration,
    } = props

    const [name, setName] = useState<string>("")
    const [totalTime, setTotalTime] = useState<Duration|undefined>(undefined)

    const submit = () => {
        addTimer({
            id: uuidv4(),
            name,
            totalTime: totalTime || Duration.fromMillis(0),
            parentID: parentID || "root",
            childrenIDs: [],
        })
        onCancel()
    }

    return (
        <table>
            <tr>
                <td>
                    <label>Name</label>
                </td>
                <td>
                    <input
                        type="text"
                        value={name}
                        onChange={({ target }) => setName(target.value)}
                    />
                </td>
            </tr>
            <tr>
                <td>
                    <label>Total Time</label>
                </td>
                <td>
                    <DurationInput
                        maxDuration={maxDuration}
                        onChange={(time) => setTotalTime(Duration.fromObject(time))}
                    />
                </td>
            </tr>
            <tr>
                <td>
                    <button
                        type="submit"
                        onClick={submit}
                        onKeyDown={(e) => (e.key === "Enter") && submit()}
                    >
                        Add
                    </button>
                </td>
                <td>
                    <button onClick={onCancel} type="button">Cancel</button>
                </td>
            </tr>
        </table>
    )
}

/**
 * Component with a custom hours:minutes:seconds duration input
 *
 * @param {any} props Component props
 * @param {Function} props.onChange Callback to call when the duration changes
 * @param {Duration} props.maxDuration The maximum duration that can be set (by parent, if any)
 * @returns {Element} A JSX element for the duration input
 */
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
        const {
            hours: hoursAvailable, minutes: minutesAvailable, seconds: secondsAvailable,
        } = availableDuration
            .plus(currentDuration)
            .shiftTo("hours", "minutes", "seconds")
            .toObject()

        if (hoursAvailable !== undefined) {
            setHours(hoursAvailable)
        }
        if (minutesAvailable !== undefined) {
            setMinutes(minutesAvailable)
        }
        if (secondsAvailable !== undefined) {
            setSeconds(secondsAvailable)
        }
    }

    const padZero = (num: number) => (num < 10 ? `0${num}` : String(num))

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
                        setHours(parseInt(target.value, 10) || 0)
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
                        setMinutes(parseInt(target.value, 10) || 0)
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
                        setSeconds(parseInt(target.value, 10) || 0)
                    }
                }
            />
            {availableDuration
                && <span>{availableDuration.toFormat("hh:mm:ss")}</span>}
        </div>
    )
}
