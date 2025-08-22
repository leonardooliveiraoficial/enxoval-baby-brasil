import { cva, type VariantProps } from "class-variance-authority";

export const babyButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-gentle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary shadow-button hover:bg-primary/90 text-primary-foreground",
        secondary: "bg-secondary shadow-card hover:bg-secondary/80 text-secondary-foreground",
        outline: "border border-tender-gray bg-soft-white hover:bg-baby-blue/20 text-foreground hover:text-accent-foreground",
        ghost: "hover:bg-baby-blue/30 hover:text-accent-foreground text-foreground",
        tender: "bg-baby-blue shadow-soft hover:bg-baby-blue-dark text-foreground transition-bounce",
        warm: "bg-warm-beige shadow-card hover:bg-warm-beige-dark text-foreground transition-bounce",
        heart: "bg-gradient-hero shadow-soft hover:shadow-button text-foreground hover:scale-105 transition-bounce"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-lg px-10 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export type BabyButtonVariants = VariantProps<typeof babyButtonVariants>;