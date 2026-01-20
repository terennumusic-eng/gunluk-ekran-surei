export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  safelist: [
    // layout
    "flex", "grid", "block", "hidden",
    "items-center", "justify-center", "justify-between",
    "w-full", "h-full", "min-h-screen",

    // spacing
    "p-2", "p-3", "p-4", "p-6",
    "m-2", "m-4",
    "gap-2", "gap-4", "gap-6",

    // text
    "text-sm", "text-base", "text-lg", "text-xl",
    "font-bold", "font-semibold",
    "text-white", "text-gray-400", "text-gray-600",

    // background & borders
    "bg-white", "bg-black",
    "bg-gray-100", "bg-gray-800", "bg-gray-900",
    "rounded", "rounded-lg", "rounded-xl",
    "shadow", "shadow-md", "shadow-lg",

    // buttons / states
    "hover:bg-gray-700",
    "hover:bg-gray-800",
    "active:scale-95",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
