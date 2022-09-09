import { v4 } from "uuid"

/**
 * UUID v4 string
 *
 * @type {string} UUID
 */
export type UUID = string

/**
 * Generate a UUID v4 string
 *
 * @returns {UUID} UUID
 */
export function uuidv4(): UUID {
    return v4()
}
