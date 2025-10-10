
   
   {/* Language Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="gap-2 border-gray-300 dark:border-gray-700 dark:text-gray-300"
              >
                <Globe className="w-4 h-4" />
                {language === "en" ? "العربية" : "EN"}
              </Button>

              import { Button } from "./components/ui";


components/ui :



import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

/**
 * Reusable button styled with Tailwind and shadcn-like variants.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      type = "button",
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-semibold transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants: Record<"default" | "outline" | "ghost", string> = {
      default:
        "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
      outline:
        "border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
      ghost:
        "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
    };

    const sizes: Record<"sm" | "md" | "lg", string> = {
      sm: "text-sm px-3 py-1.5",
      md: "text-sm px-4 py-2",
      lg: "text-base px-6 py-3",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
