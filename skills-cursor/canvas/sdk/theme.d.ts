export type { CanvasTokens } from "./canvas-tokens.js";
export { canvasTokens } from "./canvas-tokens.js";
/** Typography presets used by the built-in `cursor/canvas` components. */
export declare const canvasTypography: {
    readonly h1: {
        readonly fontSize: "22px";
        readonly lineHeight: "26px";
        readonly fontWeight: 600;
    };
    readonly h2: {
        readonly fontSize: "16px";
        readonly lineHeight: "21px";
        readonly fontWeight: 600;
    };
    readonly body: {
        readonly fontSize: "13px";
        readonly lineHeight: "18px";
        readonly fontWeight: 400;
    };
    readonly small: {
        readonly fontSize: "11px";
        readonly lineHeight: "14px";
        readonly fontWeight: 400;
    };
};
/** Spacing scale (px), aligned with `@anysphere/ui` `tokens.spacing`. */
export declare const canvasSpacing: {
    readonly "0.5": 2;
    readonly "1": 4;
    readonly "1.5": 6;
    readonly "2": 8;
    readonly "2.5": 10;
    readonly "3": 12;
    readonly "3.5": 14;
    readonly "4": 16;
    readonly "4.5": 18;
    readonly "5": 20;
    readonly "6": 24;
    readonly "7": 28;
    readonly "8": 32;
    readonly "9": 36;
    readonly "10": 40;
};
export type CanvasSpacing = typeof canvasSpacing;
/** Border radius (px), aligned with `@anysphere/ui` `tokens.radius`. */
export declare const canvasRadius: {
    readonly none: 0;
    readonly xs: 2;
    readonly sm: 4;
    readonly md: 6;
    readonly lg: 8;
    readonly xl: 12;
    readonly full: 9999;
};
export type CanvasRadius = typeof canvasRadius;
//# sourceMappingURL=theme.d.ts.map