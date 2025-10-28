import { useEffect, useState } from "react";

interface Petal {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

export const SakuraAnimation = () => {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    // Generate random sakura petals
    const newPetals: Petal[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 10 + Math.random() * 10,
      size: 8 + Math.random() * 12,
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute opacity-70"
          style={{
            left: `${petal.x}%`,
            animation: `fall ${petal.duration}s linear ${petal.delay}s infinite, sway 3s ease-in-out infinite`,
            width: `${petal.size}px`,
            height: `${petal.size}px`,
          }}
        >
          {/* Sakura petal shape */}
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2C12 2 9 6 9 10C9 12.2091 10.7909 14 13 14C15.2091 14 17 12.2091 17 10C17 6 12 2 12 2Z"
              fill="#FFB6C1"
              opacity="0.8"
            />
            <path
              d="M12 22C12 22 15 18 15 14C15 11.7909 13.2091 10 11 10C8.79086 10 7 11.7909 7 14C7 18 12 22 12 22Z"
              fill="#FFC0CB"
              opacity="0.7"
            />
            <path
              d="M2 12C2 12 6 9 10 9C12.2091 9 14 10.7909 14 13C14 15.2091 12.2091 17 10 17C6 17 2 12 2 12Z"
              fill="#FFB6C1"
              opacity="0.75"
            />
            <path
              d="M22 12C22 12 18 15 14 15C11.7909 15 10 13.2091 10 11C10 8.79086 11.7909 7 14 7C18 7 22 12 22 12Z"
              fill="#FFC0CB"
              opacity="0.8"
            />
            <circle cx="12" cy="12" r="2" fill="#FF69B4" opacity="0.9" />
          </svg>
        </div>
      ))}
    </div>
  );
};
