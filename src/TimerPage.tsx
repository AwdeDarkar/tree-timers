import React, { useState, useEffect } from "react"

import { DateTime } from "luxon"

import { Add, CheckBoxOutlineBlank, DisabledByDefault, CheckBox } from "@mui/icons-material"

import type { UUID } from "./uuid"
import { useLocalStorage } from "./localStorageTools"
import { TimerData, saveTimer } from "./timerUtils"
import { AddTimerDialog } from "./TimerDialogs"
import Timer from "./Timer"

export default function TimerPage(props: {}) {
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