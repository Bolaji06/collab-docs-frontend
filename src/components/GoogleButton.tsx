import { motion, type HTMLMotionProps } from "framer-motion";
import { GoogleIcon } from "./icons/icons";

interface GoogleButtonProps extends HTMLMotionProps<"button"> { }

export const GoogleButton: React.FC<GoogleButtonProps> = (props) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-zinc-800 dark:text-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm cursor-pointer"
            {...props}
        >
            <GoogleIcon />
            Continue with Google
        </motion.button>
    );
};
