import { ReactNode } from "react";
import wallpaper from "@/assets/wallpaper.png";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 animate-slow-pan">
        <img 
          src={wallpaper} 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Pickly
          </h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        
        <div className="bg-card/90 backdrop-blur-md p-8 rounded-2xl border border-white/20" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-2xl font-semibold mb-6 text-card-foreground">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
};
