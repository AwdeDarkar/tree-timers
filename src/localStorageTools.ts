import { useState } from "react"
import { DateTime, Duration } from "luxon"

/**
 * CustomSerializable is a generic type that can provide serialization/deserialization
 * for any type to allow it to be reliably stored in localStorage.
 *
 * @interface
 */
export interface CustomSerializable<T> {
    /**
     * serialize is a function that takes a value of type T and returns a string
     *
     * @template T
     * @param {T} value
     * @returns {string}
     * @memberof CustomSerializable
     */
    stringify: (value: T) => string

    /**
     * deserialize is a function that takes a string and returns a value of type T
     *
     * @template T
     * @param {string} value
     * @returns {T}
     * @memberof CustomSerializable
     */
    parse: (value: string) => T
}

/**
 * The defaultSerializer is a CustomSerializable that uses JSON.stringify and JSON.parse,
 * but it also wraps strings in quotes to ensure that they are stored as strings in localStorage
 * and can be retrieved as strings.
 *
 * @implements {CustomSerializable<any>}
 */
export const defaultSerializer: CustomSerializable<any> = {
    stringify: (value: any) => ((typeof value === "string") ? `"${value}"` : JSON.stringify(value)),
    parse: (value: string) => JSON.parse(value),
}

/**
 * The datetimeMaybeSerializer is a CustomSerializable that stores Luxon DateTime objects
 * as strings in ISO format, but also stores undefined values as the string "undefined".
 *
 * @implements {CustomSerializable<DateTime | undefined>}
 */
export const datetimeMaybeSerializer: CustomSerializable<DateTime | undefined> = {
    stringify: (value: DateTime | undefined) => ((value === undefined) ? "\"undefined\"" : value.toISO()),
    parse: (value: string) => ((value === "\"undefined\"") ? undefined : DateTime.fromISO(value)),
}

/**
 * The durationSerializer is a CustomSerializable that stores Luxon Duration objects
 * as milliseconds.
 *
 * @implements {CustomSerializable<Duration>}
 */
export const durationSerializer: CustomSerializable<Duration> = {
    stringify: (value: Duration) => value.shiftTo("milliseconds").milliseconds.toString(),
    parse: (value: string) => Duration.fromMillis(parseInt(value, 10)).shiftTo("hours", "minutes", "seconds"),
}

/**
 *
 * @template T
 * @param {string} storageKey The key to use for localStorage
 * @param {T} defaultValue The default value to use if the key is not found in localStorage
 * @param {CustomSerializable<T>} serialization The serialization method to use for the value
 * @returns {[T, (value: T) => void, () => void]}
 *  The state value, a function to set the state value, and a function to reset it
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

    // Note for future self: we can't useEffect here because it will cause an infinite loop

    const updateValue = (newValue: T) => {
        setValue(newValue)
        localStorage.setItem(storageKey, serialization.stringify(newValue))
    }

    const clearValue = () => {
        localStorage.removeItem(storageKey)
    }

    return [value, updateValue, clearValue]
}
