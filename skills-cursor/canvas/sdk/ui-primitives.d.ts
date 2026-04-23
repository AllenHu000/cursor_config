/**
 * UI primitives for `cursor/canvas`. Styling follows the Cursor dark theme; no extra packages required.
 */
import type { CSSProperties, JSX, ReactNode } from "react";
/**
 * Shallow-merge style objects with `override` taking precedence.
 *
 * This is most useful when combining token helpers with a primitive
 * component's `style` prop.
 */
export declare function mergeStyle(base: CSSProperties, override?: CSSProperties): CSSProperties;
export type StackProps = {
    children?: ReactNode;
    gap?: number;
    style?: CSSProperties;
};
/** Vertical layout container for page sections, cards, and reading flows. */
export declare function Stack({ children, gap, style }: StackProps): JSX.Element;
export type RowProps = {
    children?: ReactNode;
    gap?: number;
    align?: "start" | "center" | "end" | "stretch";
    justify?: "start" | "center" | "end" | "space-between";
    wrap?: boolean;
    style?: CSSProperties;
};
/** Horizontal flex row for inline actions, metadata, and compact control groups. */
export declare function Row({ children, gap, align, justify, wrap, style }: RowProps): JSX.Element;
/**
 * CSS Grid with tokenized gap. Prefer this over `Row` + `wrap` when you need a
 * fixed number of equal-width columns: wrapped flex items can land on their
 * own row and grow to full width (`flex-grow`), which is often surprising for
 * boards and dashboards.
 */
export type GridProps = {
    children?: ReactNode;
    /**
     * Equal columns: pass a number (uses `repeat(n, minmax(0, 1fr))`), or a CSS
     * `grid-template-columns` string (e.g. `"1fr 2fr"` or `"minmax(0, 200px) 1fr"`).
     */
    columns: number | string;
    gap?: number;
    align?: "start" | "center" | "end" | "stretch";
    style?: CSSProperties;
};
export declare function Grid({ children, columns, gap, align, style }: GridProps): JSX.Element;
/** Horizontal alignment for a table column. */
export type TableColumnAlign = "left" | "center" | "right";
export type TableProps = {
    /** Column titles, left to right. Column count is fixed by this array. */
    headers: ReactNode[];
    /**
     * Body rows. Each row is an array of cells in the same order as `headers`.
     * Shorter rows are padded with empty cells; extra cells are ignored.
     */
    rows: ReactNode[][];
    /** Optional alignment per column index (headers/rows). Defaults to left. */
    columnAlign?: Array<TableColumnAlign | undefined>;
    /** When true (default), bordered rounded shell with horizontal scroll if needed. */
    framed?: boolean;
    style?: CSSProperties;
    /** Shown in a single spanning cell when `rows` is empty. */
    emptyMessage?: ReactNode;
};
/** Semantic table for rectangular data such as inboxes, metrics, and comparisons. */
export declare function Table({ headers, rows, columnAlign, framed, style, emptyMessage }: TableProps): JSX.Element;
export type TextProps = {
    children?: ReactNode;
    tone?: "primary" | "secondary" | "tertiary" | "quaternary";
    size?: "body" | "small";
    style?: CSSProperties;
};
/** Body copy with tone and size variants for visual hierarchy. */
export declare function Text({ children, tone, size, style }: TextProps): JSX.Element;
export type H1Props = {
    children?: ReactNode;
    style?: CSSProperties;
};
/** Primary page heading. */
export declare function H1({ children, style }: H1Props): JSX.Element;
export type H2Props = {
    children?: ReactNode;
    style?: CSSProperties;
};
/** Section heading for cards, panels, and subsections. */
export declare function H2({ children, style }: H2Props): JSX.Element;
export type CodeProps = {
    children?: ReactNode;
    style?: CSSProperties;
};
/** Inline code styling for snippets, identifiers, and literal values. */
export declare function Code({ children, style }: CodeProps): JSX.Element;
export type CardProps = {
    children?: ReactNode;
    style?: CSSProperties;
};
/** Bordered surface for grouping related content. */
export declare function Card({ children, style }: CardProps): JSX.Element;
export type CardHeaderProps = {
    children?: ReactNode;
    style?: CSSProperties;
};
/** Optional header strip for a `Card`, typically used for titles or metadata. */
export declare function CardHeader({ children, style }: CardHeaderProps): JSX.Element;
export type CardBodyProps = {
    children?: ReactNode;
    style?: CSSProperties;
};
/** Padded main content region inside a `Card`. */
export declare function CardBody({ children, style }: CardBodyProps): JSX.Element;
export type ButtonProps = {
    children?: ReactNode;
    variant?: "primary" | "secondary" | "ghost" | "danger";
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    style?: CSSProperties;
    onClick?: () => void;
};
/** Clickable action button with primary, secondary, ghost, and danger variants. */
export declare function Button({ children, variant, disabled, type, style, onClick }: ButtonProps): JSX.Element;
export type BadgeProps = {
    children?: ReactNode;
    tone?: "neutral" | "success" | "warning" | "danger";
    style?: CSSProperties;
};
/** Compact status pill for neutral or semantic states. */
export declare function Badge({ children, tone, style }: BadgeProps): JSX.Element;
export type CalloutProps = {
    children?: ReactNode;
    variant?: "info" | "success" | "warning" | "danger";
    style?: CSSProperties;
};
/** Emphasized container for informational, success, warning, or danger messages. */
export declare function Callout({ children, variant, style }: CalloutProps): JSX.Element;
//# sourceMappingURL=ui-primitives.d.ts.map