import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/30 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-card-foreground group-[.toaster]:border-white/20 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-card-foreground/80",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-card/50 group-[.toast]:text-card-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
