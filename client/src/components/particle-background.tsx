import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme-provider";
import { useSettings } from "@/lib/settings-context";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const { settings } = useSettings();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    const getColorsByWallpaper = (wp: string) => {
      switch (wp) {
        case "peacock":
          return [
            "hsl(200, 95%, 45%)", // peacock blue
            "hsl(165, 80%, 40%)", // peacock teal
            "hsl(145, 60%, 45%)", // green
            "hsl(220, 85%, 55%)", // deep blue
          ];
        case "lotus":
          return [
            "hsl(340, 95%, 65%)", // lotus pink
            "hsl(325, 85%, 55%)", // magenta
            "hsl(350, 90%, 60%)", // soft red
            "hsl(20, 95%, 60%)",  // saffron/coral
          ];
        case "mandala":
          return [
            "hsl(275, 90%, 55%)", // purple
            "hsl(285, 80%, 45%)", // deep violet
            "hsl(24, 95%, 55%)",  // saffron
            "hsl(35, 95%, 55%)",  // gold
          ];
        case "gradient":
        case "tricolor":
        default:
          return [
            "hsl(24, 95%, 55%)",  // saffron
            "hsl(145, 63%, 45%)", // green
            "hsl(220, 70%, 55%)", // blue
            "hsl(0, 0%, 100%)",   // white
          ];
      }
    };

    const colors = getColorsByWallpaper(settings.wallpaper);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 15000);
      
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.5 + 0.2,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(")", `, ${p.alpha})`).replace("hsl", "hsla");
        ctx.fill();

        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const lineAlpha = (1 - dist / 100) * 0.15;
            ctx.strokeStyle = theme === "dark" 
              ? `rgba(255, 255, 255, ${lineAlpha})`
              : `rgba(0, 0, 0, ${lineAlpha * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [theme, settings.wallpaper]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
