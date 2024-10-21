"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useState } from "react";
import ApproachIcon from "./ApproachIcon";

function ApproachCard({
  title,
  desc,
  icon,
  children,
}: {
  title: string;
  desc: string;
  icon: ReactNode;
  children?: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border border-black/[0.2] group/canvas-card flex items-center justify-center dark:border-white/[0.2] max-w-sm w-full mx-auto p-4 relative h-[35rem] rounded-3xl"
    >
      <ApproachIcon className="absolute h-10 w-10 -top-3 -left-3 dark:text-white text-black-100 opacity-30" />
      <ApproachIcon className="absolute h-10 w-10 -bottom-3 -left-3 dark:text-white text-black-100 opacity-30" />
      <ApproachIcon className="absolute h-10 w-10 -top-3 -right-3 dark:text-white text-black-100 opacity-30" />
      <ApproachIcon className="absolute h-10 w-10 -bottom-3 -right-3 dark:text-white text-black-100 opacity-30" />

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full absolute inset-0"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20">
        <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-center group-hover/canvas-card:-translate-y-4 group-hover/canvas-card:opacity-0 transition duration-200 w-full mx-auto flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-3xl text-center opacity-0 group-hover/canvas-card:opacity-100 relative z-10 mt-4 font-bold group-hover/canvas-card:text-white group-hover/canvas-card:-translate-y-2 transition duration-200">
          {title}
        </h2>
        <p className="text-sm text-center opacity-0 group-hover/canvas-card:opacity-100 relative z-10 mt-4 group-hover/canvas-card:text-white group-hover/canvas-card:-translate-y-2 transition duration-200">
          {desc}
        </p>
      </div>
    </div>
  );
}

export default ApproachCard;
