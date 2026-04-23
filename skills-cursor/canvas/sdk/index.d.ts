/**
 * Public API for authoring `.canvas.tsx` files via `cursor/canvas`.
 *
 * Import only the optional primitives, tokens, and helpers that make authoring
 * easier. The host renders your default export directly; no special root
 * component from this package is required.
 */
/** Charts. */
export type { BarChartProps, ChartDataPoint, LineChartProps, PieChartProps, } from "./chart-primitives.js";
export { BarChart, LineChart, PieChart } from "./chart-primitives.js";
/** Semantic design tokens for custom styling. */
export type { CanvasTokens } from "./theme.js";
export { canvasTokens } from "./theme.js";
/** Component props types. */
export type { BadgeProps, ButtonProps, CalloutProps, CardBodyProps, CardHeaderProps, CardProps, CodeProps, GridProps, H1Props, H2Props, RowProps, StackProps, TableColumnAlign, TableProps, TextProps, } from "./ui-primitives.js";
/** Layout. */
/** Typography. */
/** Surfaces. */
/** Actions. */
/** Feedback. */
export { Badge, Button, Callout, Card, CardBody, CardHeader, Code, Grid, H1, H2, Row, Stack, Table, Text, } from "./ui-primitives.js";
//# sourceMappingURL=index.d.ts.map