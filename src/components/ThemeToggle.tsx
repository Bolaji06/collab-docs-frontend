
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    }

    return (
        <button
            onClick={cycleTheme}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors backdrop-blur-sm relative overflow-hidden"
            title={`Current theme: ${theme}`}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {theme === 'light' && <Sun className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />}
                    {theme === 'dark' && <Moon className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />}
                    {theme === 'system' && <Monitor className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />}
                </motion.div>
            </AnimatePresence>
        </button>
    )
}
