import React, { useState, useEffect } from "react"

import AccountTreeTwoToneIcon from "@mui/icons-material/AccountTreeTwoTone"
import AccountTreeIcon from "@mui/icons-material/AccountTree"

import { SemiCircle, PlayButton, PauseCircle } from "./svgTools"

import { DateTime, Duration } from "luxon"

export function TimerPage(props: {}) {
    const [timers, setTimers] = useState<ITimerDef[]>([])
    const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false)
    const [currentTime, setCurrentTime] = useState<DateTime>(DateTime.local())

    const addTimer = (def: ITimerDef) => {
        setTimers([...timers, def])
    }

    useEffect(() => { // Update the time twice a second
        const interval = setInterval(() => {
            setCurrentTime(DateTime.local())
        }, 500)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="TimerPage">
            <h1>Timer Page</h1>
            <ul className="TimerList">
                {timers.map(def => (
                    <Timer
                        key={def.name}
                        name={def.name}
                        totalTime={def.totalTime}
                        currentTime={currentTime}
                    />)
                )}
            </ul>
            {addDialogOpen || <button onClick={() => setAddDialogOpen(true)}>+</button>}
            {addDialogOpen && <AddTimerDialog addTimer={addTimer} onCancel={() => setAddDialogOpen(false)} />}
        </div>
    )
}

function AddTimerDialog(props: {addTimer: (def: ITimerDef) => void, onCancel: () => void}) {
    const { addTimer, onCancel } = props

    const [name, setName] = useState<string>("")
    const [totalTime, setTotalTime] = useState<number>(0)

    return (
        <div>
            <div>
                <label>Name</label>
                <input
                    value={name}
                    onChange={({ target }) => setName(target.value)}
                />
            </div>
            <div>
                <label>Total Time</label>
                <input
                    value={totalTime}
                    onChange={({ target }) => setTotalTime(parseInt(target.value) || 0)}
                />
            </div>
            <button
                onClick={() => {
                    addTimer({ name, totalTime: Duration.fromMillis(totalTime * 1000), currentTime: DateTime.local() })
                    onCancel()
                }}>
                Add
            </button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    )
}

interface ITimerDef {
    name: string
    totalTime: Duration
    currentTime: DateTime
}

function Timer(props: ITimerDef) {
    const [timers, setTimers] = useState<ITimerDef[]>([])
    const [expanded, setExpanded] = useState<boolean>(false)
    const [optionsOpen, setOptionsOpen] = useState<boolean>(false)
    const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false)
    const [started, setStarted] = useState<DateTime | undefined>(undefined)

    const addTimer = (def: ITimerDef) => {
        setTimers([...timers, def])
    }

    const timeRemaining = (started ? props.currentTime.diff(started) : props.totalTime)

    const toggleExpanded = () => { setExpanded(!expanded) }

    return (
        <li className="Timer">
            <h2>
                <TimerControl
                    running={started !== undefined}
                    percentRemaining={1 - (timeRemaining.milliseconds / props.totalTime.milliseconds)}
                    onStart={() => {
                        setStarted(DateTime.local())
                    }}
                    onStop={() => {
                        setStarted(undefined)
                    }}
                />
                {` ${props.name} `}
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
            </h2>
            {expanded && <ul className="TimerList">
                {timers.map(def => (
                    <Timer
                        key={def.name}
                        name={def.name}
                        totalTime={def.totalTime}
                        currentTime={props.currentTime}
                    />)
                )}
                {addDialogOpen || <button onClick={() => setAddDialogOpen(true)}>+</button>}
                {addDialogOpen && <AddTimerDialog addTimer={addTimer} onCancel={() => setAddDialogOpen(false)} />}
            </ul>
            }
        </li>
    )
}

function TimerControl(props: {
        running: boolean, percentRemaining: number, onStart: () => void, onStop: () => void}
    ) {
    const { running, percentRemaining, onStart, onStop } = props
    const [hovering, setHovering] = useState<boolean>(false)

    const radius = 8

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