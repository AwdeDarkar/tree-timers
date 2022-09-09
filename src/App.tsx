import React from "react"

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
        <div className="App">
            <TimerPage />
            <Footer />
        </div>
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
