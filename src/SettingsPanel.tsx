import React, { useState } from "react"

import {
    FormControl, InputLabel, MenuItem,
    Select, SelectChangeEvent, useTheme,
} from "@mui/material"

import { useThemeControllers, themes } from "./theme"

export default function SettingsPanel() {
    const theme = useTheme()
    const { currentThemeName, setTheme, tempSetTheme } = useThemeControllers()

    const [selectedTheme, setSelectedTheme] = useState(theme)

    const handleThemeChange = (event: SelectChangeEvent) => {
        const newTheme = themes[event.target.value]
        setSelectedTheme(newTheme)
        setTheme(newTheme)
    }

    return (
        <FormControl>
            <InputLabel id="theme-select-label">Theme</InputLabel>
            <Select
                labelId="theme-select-label"
                id="theme-select"
                label="Theme"
                value={currentThemeName}
                onChange={handleThemeChange}
            >
                {Object
                    .keys(themes)
                    .filter((themeName) => themeName !== "default")
                    .map((themeName) => (
                        <MenuItem
                            key={themeName}
                            value={themeName}
                            onMouseEnter={() => tempSetTheme(themes[themeName])}
                            onMouseLeave={() => tempSetTheme(undefined)}
                        >
                            {themeName}
                        </MenuItem>
                    ))}
            </Select>
        </FormControl>
    )
}
