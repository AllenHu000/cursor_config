import type { CSSProperties, JSX } from "react";
export type ChartDataPoint = {
    label: string;
    /** Non-negative numeric value for this data point. */
    value: number;
};
export type BarChartProps = {
    data: ChartDataPoint[];
    /** Fixed chart height in px. */
    height?: number;
    /** Defaults to the canvas accent blue. */
    color?: string;
    /** When true, renders left-labeled horizontal bars instead of vertical bars. */
    horizontal?: boolean;
    style?: CSSProperties;
};
export type LineChartProps = {
    data: ChartDataPoint[];
    /** Fixed chart height in px. */
    height?: number;
    /** Defaults to the canvas accent blue. */
    color?: string;
    /** When true, fills the area under the line with a soft tint. */
    fill?: boolean;
    style?: CSSProperties;
};
export type PieChartProps = {
    data: Array<ChartDataPoint & {
        color?: string;
    }>;
    /** Fixed chart size in px for both width and height. */
    size?: number;
    /** When true, renders a hollow center. */
    donut?: boolean;
    style?: CSSProperties;
};
export declare function BarChart({ data, height, color, horizontal, style }: BarChartProps): JSX.Element;
export declare function LineChart({ data, height, color, fill, style }: LineChartProps): JSX.Element;
export declare function PieChart({ data, size, donut, style }: PieChartProps): JSX.Element;
//# sourceMappingURL=chart-primitives.d.ts.map