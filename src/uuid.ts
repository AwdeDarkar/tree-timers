import { v4 } from "uuid"

export type UUID = string

export function uuidv4(): UUID {
    return v4()
}