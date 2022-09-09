import React from "react"

/**
 * Point is a convenience interface for working with points in 2D space.
 *
 * @interface
 */
interface Point {
    x: number
    y: number
}

/**
 * SVGPathBuilder is a stateful class for building SVG paths. It provides a convenient,
 * chainable API for building complex SVG paths.
 *
 * @class
 */
export class SVGPathBuilder {
    private path: string = ""

    private color: string = ""

    private fill: boolean = false

    private strokeWidth: number = 1

    /**
     * Creates a new SVGPathBuilder.
     *
     * @param {string} color The color of the path
     * @param {boolean} fill Whether the path should be filled
     * @param {number} strokeWidth The width of the path
     * @returns {SVGPathBuilder} The new SVGPathBuilder
     */
    constructor(color: string, fill: boolean = true, strokeWidth: number = 1) {
        this.color = color
        this.fill = fill
        this.strokeWidth = strokeWidth
    }

    /**
     * Build creates the current SVG path as an SVG element that can be dropped into
     * a React component.
     *
     * @returns {Element} The SVG path as a JSX element
     */
    public build(): JSX.Element {
        if (this.fill) {
            return (
                <path d={this.path} fill={this.color} />
            )
        }
        return (
            <path d={this.path} stroke={this.color} strokeWidth={this.strokeWidth} fill="none" />
        )
    }

    /**
     * Move the path to a new point.
     *
     * @param {Point} point The point to move to
     * @returns {SVGPathBuilder} The updated SVGPathBuilder instance
     */
    public moveTo({ x, y }: Point) {
        this.path += `M${x} ${y}`
        return this
    }

    /**
     * Draw a line from the current point to a new point.
     *
     * @param {Point} point The point to draw to
     * @returns {SVGPathBuilder} The updated SVGPathBuilder instance
     */
    public lineTo({ x, y }: Point) {
        this.path += `L${x} ${y}`
        return this
    }

    /**
     * Draw a cubic bezier curve from the current point to a new point.
     * The curve is defined by two control points.
     *
     * @param {Point} point The point to draw to
     * @param {Point} control1 The first control point
     * @param {Point} control2 The second control point
     * @returns {SVGPathBuilder} The updated SVGPathBuilder instance
     */
    public curveTo(
        { x, y }: Point,
        control1: Point,
        control2: Point,
    ) {
        this.path += `C${control1.x} ${control1.y} ${control2.x} ${control2.y} ${x} ${y}`
        return this
    }

    /**
     * Draw an arc from the current point to a new point.
     * The arc is defined by a radius and two angles.
     *
     * @param {Point} point The point to draw to
     * @param {Point} radius The radius of the arc
     * @param {number} angle The angle of the arc
     * @param {boolean} invert Whether to invert the arc
     * @param {boolean} sweep Whether to sweep the inside of the arc
     * @returns {SVGPathBuilder} The updated SVGPathBuilder instance
     * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#arcs
     */
    public arcTo(
        { x, y }: Point,
        radius: Point,
        angle: number,
        invert: boolean,
        sweep: boolean,
    ) {
        this.path += `A${radius.x} ${radius.y} ${angle} ${invert ? 1 : 0} ${sweep ? 1 : 0} ${x} ${y}`
        return this
    }
}

/**
 * SemiCircle is a component that renders an SVG semi-circle like a 'pie chart' with
 * a 'completion percentage'.
 *
 * @param {any} props The component props
 * @param {number} props.radius The radius of the semi-circle
 * @param {string} props.fill The color of the semi-circle
 * @param {number} props.percent The completion percentage of the semi-circle in [0, 1]
 * @returns {Element} The SVG semi-circle as a JSX element
 */
export function SemiCircle(props: { radius: number, fill: string, percent: number }) {
    const { radius, fill, percent } = props

    /**
     * Point on the edge of the circle, `percent` of the way around
     */
    const circlePoint: Point = {
        x: radius * Math.cos(2 * Math.PI * percent - Math.PI / 2) + radius,
        y: radius * Math.sin(2 * Math.PI * percent - Math.PI / 2) + radius,
    }

    // If the percent is 1, we can just draw a full circle
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

    // If the percent is 0, we don't need to draw anything
    if (percent === 0) {
        return (
            <svg
                width={radius * 2}
                height={radius * 2}
            />
        )
    }

    return (
        <svg
            width={radius * 2}
            height={radius * 2}
        >
            {(new SVGPathBuilder(fill))
                .moveTo({ x: radius, y: radius }) // Move to center
                .lineTo({ x: radius, y: 0 }) // Line to top
                .arcTo(
                    circlePoint,
                    { x: radius, y: radius },
                    Math.PI,
                    percent > 0.5,
                    true,
                ) // Arc to point on circle
                .build()}
        </svg>
    )
}

/**
 * This component is a triangular 'play' button to indicate that clicking on it
 * will start the timer. While this could have come from the material-ui library,
 * it wouldn't fit the circle the other SVG components use and would have looked
 * out of place.
 *
 * @param {any} props The component props
 * @param {number} props.radius The radius of the circle that defines the play button
 * @param {number} props.fill The color of the play button
 * @returns {Element} The SVG play button as a JSX element
 */
export function PlayButton(props: { radius: number, fill: string }) {
    const { radius, fill } = props

    /**
     * Front of the play triangle
     */
    const point1: Point = {
        x: radius * Math.cos(0) + radius,
        y: radius * Math.sin(0) + radius,
    }

    /**
     * Top of the play triangle
     */
    const point2: Point = {
        x: radius * Math.cos(2 * Math.PI / 3) + radius,
        y: radius * Math.sin(2 * Math.PI / 3) + radius,
    }

    /**
     * Bottom of the play triangle
     */
    const point3: Point = {
        x: radius * Math.cos(4 * Math.PI / 3) + radius,
        y: radius * Math.sin(4 * Math.PI / 3) + radius,
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
                .build()}
        </svg>
    )
}

/**
 * This component renders as a small diamond that indicates the timer is either finished
 * or unable to start.
 *
 * @param {any} props The component props
 * @param {number} props.radius The radius of the circle that defines the diamond
 * @param {string} props.fill The color of the diamond
 * @returns {Element} The SVG diamond as a JSX element
 */
export function FinishedBox(props: { radius: number, fill: string }) {
    const { radius, fill } = props

    const sideLength = radius / Math.sqrt(2)

    /**
     * Top left corner of the square, prior to rotation
     */
    const corner: Point = {
        x: radius - sideLength / 2,
        y: radius - sideLength / 2,
    }

    return (
        <svg
            width={radius * 2}
            height={radius * 2}
        >
            <rect
                x={corner.x}
                y={corner.y}
                width={sideLength}
                height={sideLength}
                fill={fill}
                transform={`rotate(45 ${radius} ${radius})`}
            />
        </svg>
    )
}

/**
 * This component is a 'pause' button to indicate that clicking on it will pause the timer.
 * It also has a circle around it that shows the completion percentage of the timer, like
 * the SemiCircle component.
 *
 * @param {any} props The component props
 * @param {number} props.radius The radius of the circle that defines the pause button
 * @param {string} props.fill The color of the pause button
 * @param {number} props.percent The completion percentage of the timer in [0, 1]
 * @returns {Element} The SVG pause circle as a JSX element
 */
export function PauseCircle(props: { radius: number, fill: string, percent: number }) {
    const { radius, fill, percent } = props

    const strokeWidth = radius / 4
    const adjustedRadius = radius - strokeWidth

    /**
     * Point on the edge of the circle, `percent` of the way around
     */
    const circlePoint: Point = {
        x: adjustedRadius * Math.cos(2 * Math.PI * percent - Math.PI / 2) + radius,
        y: adjustedRadius * Math.sin(2 * Math.PI * percent - Math.PI / 2) + radius,
    }

    /**
     * Side length of the pause box rectangles
     */
    const rectSides = {
        height: adjustedRadius * Math.sqrt(2) - strokeWidth,
        width: adjustedRadius * Math.sqrt(2) / 4,
    }

    /**
     * Top left corner of the first pause box rectangle
     */
    const rect1Corner: Point = {
        x: adjustedRadius * Math.cos(2 * Math.PI * (5 / 8)) + radius + strokeWidth / 2,
        y: adjustedRadius * Math.sin(2 * Math.PI * (5 / 8)) + radius + strokeWidth / 2,
    }

    /**
     * Top left corner of the second pause box rectangle
     */
    const rect2Corner: Point = {
        x: adjustedRadius * Math.cos(2 * Math.PI * (7 / 8)) + radius + strokeWidth / 2
            - rectSides.width - strokeWidth,
        y: adjustedRadius * Math.sin(2 * Math.PI * (7 / 8)) + radius + strokeWidth / 2,
    }

    if (percent === 1) {
        return (
            <svg
                width={radius * 2}
                height={radius * 2}
            >
                <circle
                    cx={radius}
                    cy={radius}
                    r={adjustedRadius}
                    stroke={fill}
                    strokeWidth={strokeWidth}
                    fill="none"
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
                .moveTo({ x: radius, y: strokeWidth }) // Move to top
                .arcTo(
                    circlePoint,
                    { x: adjustedRadius, y: adjustedRadius },
                    Math.PI,
                    percent > 0.5,
                    true,
                ) // Arc to point on circle
                .build()}
            <rect
                x={rect1Corner.x}
                y={rect1Corner.y}
                width={rectSides.width}
                height={rectSides.height}
                fill={fill}
            />
            <rect
                x={rect2Corner.x}
                y={rect2Corner.y}
                width={rectSides.width}
                height={rectSides.height}
                fill={fill}
            />
        </svg>
    )
}
