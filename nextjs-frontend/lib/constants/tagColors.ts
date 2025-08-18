// lib/constants/tagColors.ts
interface TagColorConfig {
  bg: string;
  text: string;
  border: string;
  glow: string;
}

type TagColors = Record<string, TagColorConfig>;

export const tagColors: TagColors = {
  "Students not contacted in 7 days": {
    bg: "bg-yellow-light", // Uses the color from tailwind.config.js
    text: "text-yellow-dark",
    border: "border-yellow-border",
    glow: "hover:shadow-glow-yellow",
  },
  "High intent": {
    bg: "bg-green-light",
    text: "text-green-dark",
    border: "border-green-border",
    glow: "hover:shadow-glow-green",
  },
  "Needs essay help": {
    bg: "bg-blue-light",
    text: "text-blue-dark",
    border: "border-blue-border",
    glow: "hover:shadow-glow-blue",
  },
  "Urgent": {
    bg: "bg-red-light",
    text: "text-red-dark",
    border: "border-red-border",
    glow: "hover:shadow-glow-red",
  },
  "General inquiry": {
    bg: "bg-purple-light",
    text: "text-purple-dark",
    border: "border-purple-border",
    glow: "hover:shadow-glow-purple",
  },
};

// Optional helper function
export const getTagColors = (tagName: string): TagColorConfig => {
  return tagColors[tagName] || {
    // Default fallback styles
    bg: "bg-blue-light",
    text: "text-blue-dark",
    border: "border-blue-border",
    glow: "hover:shadow-glow-blue",
  };
};