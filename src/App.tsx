import React, { useState } from "react"

import {
    AppBar, CssBaseline, IconButton,
    Toolbar, Typography, Box, Stack,
    Link,
    Container,
    Paper,
} from "@mui/material"
import {
    GitHub,
    Settings,
} from "@mui/icons-material"

import { useLocalStorage } from "./localStorageTools"
import ThemeProviderWrapper from "./theme"
import SettingsPanel, { SettingsData, defaultSettings } from "./SettingsPanel"
import TimerPage from "./TimerPage"

import "./App.css"

import packageJson from "../package.json"

/**
 * The main app component.
 *
 * @returns {Element} The main app component.
 */
export default function App() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [settings, setSettings, resetSettings] = useLocalStorage<SettingsData>("settings", defaultSettings)

    return (
        <ThemeProviderWrapper>
            <Box sx={{ display: "flex" }}>
                <CssBaseline />
                <AppBar position="fixed">
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Tree Timers
                        </Typography>
                        <IconButton
                            color="inherit"
                            aria-label="open settings"
                            onClick={() => setDrawerOpen(true)}
                            edge="end"
                        >
                            <Settings />
                        </IconButton>
                    </Toolbar>
                </AppBar>
                <Container>
                    <SettingsPanel
                        open={drawerOpen}
                        settings={settings}
                        setSettings={setSettings}
                        resetSettings={resetSettings}
                        closeDrawer={() => setDrawerOpen(false)}
                    />
                    <Toolbar>
                        Empty toolbar to prevent content from being hidden behind the app bar.
                    </Toolbar>
                    <Paper elevation={1}>
                        <TimerPage
                            notifications={settings.notificationPermissionsStatus === "active"}
                        />
                    </Paper>
                </Container>
            </Box>
            <Footer />
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
        <Stack
            spacing={1}
            sx={{
                pt: 4,
                position: "sticky",
                bottom: 8,
                width: "100%",
                marginTop: "auto",
                textAlign: "center",
            }}
            alignItems="center"
        >
            <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary" align="center">
                    {`${packageJson.name} `}
                    version
                    {` ${packageJson.version}`}
                </Typography>
                <Link href={packageJson.repository.url} target="_blank" color="inherit">
                    <GitHub />
                </Link>
            </Stack>
            <Typography variant="body2" color="text.secondary">
                {`Copyright © ${packageJson.author} ${new Date().getFullYear()}`}
            </Typography>
        </Stack>
    )
}
