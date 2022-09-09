import { useState } from "react"
import { DateTime, Duration } from "luxon"

export interface CustomSerializable<T> {
    stringify: (value: T) => string
    parse: (value: string) => T
}

export const defaultSerializer: CustomSerializable<any> = {
    stringify: (value: any) => ((typeof value === "string") ? `"${value}"` : JSON.stringify(value)),
    parse: (value: string) => JSON.parse(value),
}

export const datetimeMaybeSerializer: CustomSerializable<DateTime | undefined> = {
    stringify: (value: DateTime | undefined) => ((value === undefined) ? "\"undefined\"" : value.toISO()),
    parse: (value: string) => ((value === "\"undefined\"") ? undefined : DateTime.fromISO(value)),
}

export const durationSerializer: CustomSerializable<Duration> = {
    stringify: (value: Duration) => value.shiftTo("milliseconds").milliseconds.toString(),
    parse: (value: string) => Duration.fromMillis(parseInt(value, 10)).shiftTo("hours", "minutes", "seconds"),
}

/**
 *
 * @param storageKey
 * @param defaultValue
 * @param serialization
 */
export function useLocalStorage<T>(
    storageKey: string,
    defaultValue: T,
    serialization: CustomSerializable<T> = defaultSerializer,
): [T, (newValue: T) => void, () => void] {
    const [value, setValue] = useState(() => {
        const jsonValue = localStorage.getItem(storageKey)
        if (jsonValue != null) return serialization.parse(jsonValue)
        if (typeof defaultValue === "function") {
            return defaultValue()
        }
        return defaultValue
    })

    const updateValue = (newValue: T) => {
        setValue(newValue)
        localStorage.setItem(storageKey, serialization.stringify(newValue))
    }

    const clearValue = () => {
        localStorage.removeItem(storageKey)
    }

    return [value, updateValue, clearValue]
}
