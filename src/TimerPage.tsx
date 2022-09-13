import React, { useState, useEffect } from "react"

import { DateTime } from "luxon"

import {
    Add, CheckBoxOutlineBlank, DisabledByDefault, CheckBox,
} from "@mui/icons-material"
import {
    Button, Collapse, Container, List, useTheme,
} from "@mui/material"

import type { UUID } from "./uuid"
import { useLocalStorage } from "./localStorageTools"
import { TimerData, saveTimer } from "./timerUtils"
import { AddTimerDialog } from "./TimerDialogs"
import Timer from "./Timer"

/**
 * The main page of the app, which displays all the root timers in a list.
 *
 * @param {any} props The component props.
 * @param {boolean} props.notifications Whether timers should send notifications when complete.
 * @returns {Element} The main page of the app.
 */
export default function TimerPage(props: {notifications: boolean}) {
    const { notifications } = props

    const theme = useTheme()

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
        <Container
            sx={{
                padding: theme.spacing(4),
            }}
        >
            <List>
                {timerIDs.map((id) => (
                    <Timer
                        key={id}
                        id={id}
                        onDelete={() => {
                            setTimerIDs(timerIDs.filter((tid) => tid !== id))
                        }}
                        currentTime={currentTime}
                        notifyWhenFinished={notifications}
                    />
                ))}
            </List>
            {addDialogOpen || (
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setAddDialogOpen(true)}
                    startIcon={<Add />}
                >
                    Create root timer
                </Button>
            )}
            <Collapse in={addDialogOpen} timeout="auto" unmountOnExit>
                <AddTimerDialog
                    addTimer={addTimer}
                    onCancel={() => setAddDialogOpen(false)}
                />
            </Collapse>
        </Container>
    )
}
