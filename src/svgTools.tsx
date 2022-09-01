import React from "react"

export class SVGPathBuilder {
    private path: string = ""
    private color: string = ""
    private fill: boolean = false
    private strokeWidth: number = 1

    constructor(color: string, fill: boolean = true, strokeWidth: number = 1) {
        this.color = color
        this.fill = fill
        this.strokeWidth = strokeWidth
    }

    public build(): JSX.Element {
        if (this.fill) {
            return (
                <path d={this.path} fill={this.color} />
            )
        } else {
            return (
                <path d={this.path} stroke={this.color} strokeWidth={this.strokeWidth} fill="none"/>
            )
        }
    }

    public moveTo({ x, y }: { x: number, y: number }) {
        this.path += `M${x} ${y}`
        return this
    }

    public lineTo({ x, y }: { x: number, y: number }) {
        this.path += `L${x} ${y}`
        return this
    }

    public curveTo({ x, y }: { x: number, y: number },
                   control1: { x: number, y: number },
                   control2: { x: number, y: number }) {
        this.path += `C${control1.x} ${control1.y} ${control2.x} ${control2.y} ${x} ${y}`
        return this
    }

    public arcTo({ x, y }: { x: number, y: number },
                 radius: { x: number, y: number },
                 angle: number, invert: boolean,
                 sweep: boolean) {
        this.path += `A${radius.x} ${radius.y} ${angle} ${invert ? 1 : 0} ${sweep ? 1 : 0} ${x} ${y}`
        return this
    }
}

export function SemiCircle(props: { radius: number, fill: string, percent: number }) {
    const { radius, fill, percent } = props
    const circlePoint = { // Point on the edge of the circle, percent of the way around
        x: radius * Math.cos(2 * Math.PI * percent - Math.PI / 2) + radius,
        y: radius * Math.sin(2 * Math.PI * percent - Math.PI / 2) + radius
    }

    if (percent === 1) {
        return (
            <svg
                width={radius * 2}
                height={radius * 2}
            >
                <circle cx={radius} cy={radius} r={radius} fill={fill} />
            </svg>
        )
    }

    return (
        <svg
            width={radius * 2}
            height={radius * 2}
        >
            {(new SVGPathBuilder(fill))
                .moveTo({x: radius, y: radius}) // Move to center
                .lineTo({x: radius, y: 0}) // Line to top
                .arcTo(circlePoint,
                    {x: radius, y: radius}, Math.PI,
                    percent > 0.5, true
                    ) // Arc to point on circle
                .build()
            }
        </svg>
    )
}

export function PlayButton(props: { radius: number, fill: string }) {
    const { radius, fill } = props

    const point1 = { // Front of the play triangle
        x: radius * Math.cos(0) + radius,
        y: radius * Math.sin(0) + radius
    }

    const point2 = { // Top of the play triangle
        x: radius * Math.cos(2 * Math.PI / 3) + radius,
        y: radius * Math.sin(2 * Math.PI / 3) + radius
    }

    const point3 = { // Bottom of the play triangle
        x: radius * Math.cos(4 * Math.PI / 3) + radius,
        y: radius * Math.sin(4 * Math.PI / 3) + radius
    }

    return (
        <svg
            width={radius * 2}
            height={radius * 2}
        >
            {(new SVGPathBuilder(fill))
                .moveTo(point1) // Move to first point
                .lineTo(point2) // Line to top
                .lineTo(point3) // Line to bottom
                .build()
            }
        </svg>
    )
}

export function PauseCircle(props: { radius: number, fill: string, percent: number }) {
    const { radius, fill, percent } = props

    const strokeWidth = radius / 4
    const adjustedRadius = radius - strokeWidth

    const circlePoint = { // Point on the edge of the circle, percent of the way around
        x: adjustedRadius * Math.cos(2 * Math.PI * percent - Math.PI / 2) + radius,
        y: adjustedRadius * Math.sin(2 * Math.PI * percent - Math.PI / 2) + radius
    }

    const rectSides = { // Side lengths of the rectangle
        height: adjustedRadius * Math.sqrt(2) - strokeWidth,
        width: adjustedRadius * Math.sqrt(2) / 4,
    }

    const rect1Corner = { // Top left corner of the first rectangle
        x: adjustedRadius * Math.cos(2 * Math.PI * (5 / 8)) + radius + strokeWidth / 2,
        y: adjustedRadius * Math.sin(2 * Math.PI * (5 / 8)) + radius + strokeWidth / 2,
    }

    const rect2Corner = { // Top left corner of the second rectangle
        x: adjustedRadius * Math.cos(2 * Math.PI * (7 / 8)) + radius + strokeWidth / 2 - rectSides.width - strokeWidth,
        y: adjustedRadius * Math.sin(2 * Math.PI * (7 / 8)) + radius + strokeWidth / 2,
    }

    if (percent === 1) {
        return (
            <svg
                width={radius * 2}
                height={radius * 2}
            >
                <circle
                    cx={radius} cy={radius} r={adjustedRadius}
                    stroke={fill} strokeWidth={strokeWidth} fill="none"
                />
            </svg>
        )
    }

    return (
        <svg
            width={radius * 2}
            height={radius * 2}
        >
            {(new SVGPathBuilder(fill, false, strokeWidth))
                .moveTo({x: radius, y: strokeWidth}) // Move to top
                .arcTo(circlePoint,
                    {x: adjustedRadius, y: adjustedRadius}, Math.PI,
                    percent > 0.5, true
                    ) // Arc to point on circle
                .build()
            }
            <rect
                x={rect1Corner.x} y={rect1Corner.y}
                width={rectSides.width} height={rectSides.height}
                fill={fill}
            />
            <rect
                x={rect2Corner.x} y={rect2Corner.y}
                width={rectSides.width} height={rectSides.height}
                fill={fill}
            />
        </svg>
    )
}