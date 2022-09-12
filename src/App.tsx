import React, { useState } from "react"

import { CssBaseline } from "@mui/material"

import ThemeProviderWrapper from "./theme"
import SettingsPanel from "./SettingsPanel"
import TimerPage from "./TimerPage"

import "./App.css"

import packageJson from "../package.json"

/**
 * The main app component.
 *
 * @returns {Element} The main app component.
 */
export default function App() {
    return (
        <ThemeProviderWrapper>
            <CssBaseline />
            <div className="App">
                <SettingsPanel />
                <TimerPage />
                <Footer />
            </div>
        </ThemeProviderWrapper>
    )
}

/**
 * The footer of the app, which displays the version number and a link to the
 * source code.
 *
 * @returns {Element} The footer of the app.
 */
function Footer() {
    return (
        <div className="Footer">
            <p>
                {`${packageJson.name} `}
                version
                {` ${packageJson.version}`}
            </p>
            <p>
                <a href={packageJson.repository.url}>Source on Github</a>
            </p>
        </div>
    )
}
