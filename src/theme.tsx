import React, { useState, createContext } from "react"

import { createTheme, ThemeProvider } from "@mui/material/styles"
import type { Theme, ThemeOptions } from "@mui/material/styles"

import { useLocalStorage, CustomSerializable } from "./localStorageTools"

type NamedTheme = Theme & { name: string }

/**
 * Collection of all available themes.
 */
export const themes: { [name: string]: NamedTheme } = {}

const createNamedTheme = (name: string, themeOptions: ThemeOptions): NamedTheme => ({
    ...createTheme(themeOptions),
    name,
} as NamedTheme)

themes.light = createNamedTheme("light", {
    palette: {
        mode: "light",
    },
})

themes.dark = createNamedTheme("dark", {
    palette: {
        mode: "dark",
    },
})

themes.default = themes.light

interface ThemeControllers {
    /**
     * The name of the current theme.
     */
    currentThemeName: string

    /**
     * setTheme Sets the current theme.
     *
     * @param {NamedTheme} theme The theme to set.
     */
    setTheme: (theme: NamedTheme) => void

    /**
     * tempSetTheme Sets the current theme in a volatile way, which will be
     * reverted when the component unmounts.
     *
     * @param {NamedTheme | undefined} theme The theme to set, pass undefined to revert.
     */
    tempSetTheme: (theme: NamedTheme | undefined) => void
}

const DummyThemeControllers: ThemeControllers = {
    currentThemeName: themes.default.name,
    setTheme: () => {},
    tempSetTheme: () => {},
}

const ThemeControlContext = createContext<ThemeControllers>(DummyThemeControllers)

/**
 * This hook provides context access to functions to change the theme.
 *
 * @returns {ThemeControllers} The theme controller functions.
 */
export function useThemeControllers(): ThemeControllers {
    return React.useContext(ThemeControlContext)
}

/**
 * The namedThemeSerializer stores the name of the theme in local storage,
 * so that it can be retrieved from 'themes' when the app is reloaded.
 *
 * @implements {CustomSerializable<NamedTheme>}
 */
const namedThemeSerializer: CustomSerializable<NamedTheme> = {
    stringify: (theme: NamedTheme) => theme.name,
    parse: (name: string) => themes[name],
}

/**
 * The Material UI theme provider for the app.
 *
 * @param {any} props The props for the component.
 * @param {React.ReactNode} props.children The children of the component.
 * @returns {Element} The Material UI theme provider for the app.
 */
export default function ThemeProviderWrapper(props: { children: React.ReactNode }) {
    const { children } = props

    const [theme, setTheme, resetTheme] = useLocalStorage<NamedTheme>(
        "global-theme",
        themes.default,
        namedThemeSerializer,
    )
    const [tempTheme, tempSetTheme] = useState<NamedTheme | undefined>(undefined)

    return (
        <ThemeProvider theme={tempTheme || theme}>
            <ThemeControlContext.Provider
                // eslint-disable-next-line react/jsx-no-constructed-context-values
                value={{ currentThemeName: theme.name, setTheme, tempSetTheme }}
            >
                {children}
            </ThemeControlContext.Provider>
        </ThemeProvider>
    )
}
