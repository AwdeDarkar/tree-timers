import React, { useState, useEffect } from "react"

import { DateTime } from "luxon"

import {
    Add, CheckBoxOutlineBlank, DisabledByDefault, CheckBox,
} from "@mui/icons-material"
import { Container } from "@mui/system"

import type { UUID } from "./uuid"
import { useLocalStorage } from "./localStorageTools"
import { TimerData, saveTimer } from "./timerUtils"
import { AddTimerDialog } from "./TimerDialogs"
import Timer from "./Timer"

/**
 * The main page of the app, which displays all the root timers in a list.
 *
 * @returns {Element} The main page of the app.
 */
export default function TimerPage() {
    /**
     * This is a custom hook to manage the state of the root timers and synchronize
     * them with local storage. Values are saved with the key `root-<stateName>`.
     *
     * @template T The type of the state to manage
     * @param {string} stateName The name of the state to manage
     * @param {T} defaultValue The default value of the state
     * @returns {[T, (value: T) => void, () => void]}
     *  The state value, a function to set the state value, and a function to reset it
     */
    function usePageStore<T>(stateName: string, defaultValue: T):
    [T, (newValue: T) => void, () => void] {
        return useLocalStorage<T>(`root-${stateName}`, defaultValue)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        <Container>
            <h1>Timer Page</h1>
            <table>
                <tr>
                    <td>Notifications?</td>
                    <td>
                        {(!notificationsActive && notificationsPermitted !== "denied") && (
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
                            />
                        )}
                        {(!notificationsActive && notificationsPermitted === "denied") && (
                            <DisabledByDefault />
                        )}
                        {(notificationsActive) && (
                            <CheckBox
                                className="IconButton"
                                onClick={() => setNotificationsActive(false)}
                            />
                        )}
                    </td>
                </tr>
            </table>
            <ul className="TimerList">
                {timerIDs.map((id) => (
                    <Timer
                        key={id}
                        id={id}
                        onDelete={() => {
                            setTimerIDs(timerIDs.filter((tid) => tid !== id))
                        }}
                        currentTime={currentTime}
                        notifyWhenFinished={notificationsActive}
                    />
                ))}
            </ul>
            {addDialogOpen || (
                <Add
                    className="IconButton"
                    onClick={() => setAddDialogOpen(true)}
                />
            )}
            {addDialogOpen && (
                <AddTimerDialog
                    addTimer={addTimer}
                    onCancel={() => setAddDialogOpen(false)}
                />
            )}
        </Container>
    )
}
