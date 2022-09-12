import React, { useState } from "react"

import {
    Divider, Drawer, Button,
    FormControl, FormControlLabel, FormLabel, IconButton, InputLabel, MenuItem,
    Select, SelectChangeEvent, Switch, useTheme,
} from "@mui/material"
import { ChevronRight } from "@mui/icons-material"

import { useThemeControllers, themes } from "./theme"

export interface SettingsData {
    notificationPermissionsStatus: "active" | "inactive" | "denied" | "unknown"
}

export const defaultSettings: SettingsData = {
    notificationPermissionsStatus: "unknown",
}

/**
 * This is a toggleable drawer that allows the user to change the global settings.
 *
 * @param {any} props Component props.
 * @param {boolean} props.open Whether the drawer is open.
 * @param {() => void} props.closeDrawer A function to close the drawer.
 * @param {SettingsData} props.settings The current settings.
 * @param {(SettingsData) => void} props.setSettings A function to set the settings.
 * @param {() => void} props.resetSettings A function to reset the settings.
 * @returns {Drawer} The settings panel.
 */
export default function SettingsPanel(props: {
        open: boolean,
        settings: SettingsData,
        setSettings: (settings: SettingsData) => void,
        resetSettings: () => void,
        closeDrawer: () => void
    }) {
    const {
        open, settings, setSettings, resetSettings, closeDrawer,
    } = props

    const theme = useTheme()
    const { currentThemeName, setTheme, tempSetTheme } = useThemeControllers()

    const [selectedTheme, setSelectedTheme] = useState(theme)

    const handleThemeChange = (event: SelectChangeEvent) => {
        const newTheme = themes[event.target.value]
        setSelectedTheme(newTheme)
        setTheme(newTheme)
    }

    const resetAllSettings = () => {
        resetSettings()
        setTheme(themes.default)
    }

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={closeDrawer}
            PaperProps={{
                sx: { width: "33%" },
            }}
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
            <Divider />
            <FormControl>
                <FormControlLabel
                    label="Notifications"
                    labelPlacement="start"
                    control={(
                        <Switch
                            color="primary"
                            inputProps={{ "aria-label": "Notifications" }}
                            checked={settings.notificationPermissionsStatus === "active"}
                            disabled={settings.notificationPermissionsStatus === "denied"}
                            onChange={() => {
                                if (settings.notificationPermissionsStatus === "unknown") {
                                    Notification.requestPermission().then((permission) => {
                                        if (permission === "granted") {
                                            setSettings({
                                                ...settings,
                                                notificationPermissionsStatus: "active",
                                            })
                                        } else {
                                            setSettings({
                                                ...settings,
                                                notificationPermissionsStatus: "denied",
                                            })
                                        }
                                    })
                                } else {
                                    setSettings({
                                        ...settings,
                                        notificationPermissionsStatus: settings.notificationPermissionsStatus === "active"
                                            ? "inactive"
                                            : "active",
                                    })
                                }
                            }}
                        />
                    )}
                />
            </FormControl>
            <Divider />
            <FormControl>
                <Button
                    variant="contained"
                    color="warning"
                    onClick={resetAllSettings}
                >
                    Reset Settings
                </Button>
            </FormControl>
        </Drawer>
    )
}
