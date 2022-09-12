import React, { useState } from "react"

import {
    Divider,
    Drawer,
    FormControl, IconButton, InputLabel, MenuItem,
    Select, SelectChangeEvent, useTheme,
} from "@mui/material"
import { ChevronRight } from "@mui/icons-material"

import { useThemeControllers, themes } from "./theme"

/**
 * This is a toggleable drawer that allows the user to change the global settings.
 *
 * @param {any} props Component props.
 * @param {boolean} props.open Whether the drawer is open.
 * @param {() => void} props.closeDrawer A function to close the drawer.
 * @returns {Drawer} The settings panel.
 */
export default function SettingsPanel(props: { open: boolean, closeDrawer: () => void }) {
    const { open, closeDrawer } = props

    const theme = useTheme()
    const { currentThemeName, setTheme, tempSetTheme } = useThemeControllers()

    const [selectedTheme, setSelectedTheme] = useState(theme)

    const handleThemeChange = (event: SelectChangeEvent) => {
        const newTheme = themes[event.target.value]
        setSelectedTheme(newTheme)
        setTheme(newTheme)
    }

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={closeDrawer}
        >
            <div>
                <IconButton onClick={closeDrawer}>
                    <ChevronRight />
                </IconButton>
            </div>
            <Divider />
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
        </Drawer>
    )
}
