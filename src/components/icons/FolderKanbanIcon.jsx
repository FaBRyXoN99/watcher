import { forwardRef, useCallback, useImperativeHandle, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

const COLUMNS_VARIANTS = {
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const COLUMN_VARIANTS = {
  normal: { opacity: 1 },
  animate: {
    opacity: [1, 0.2, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const FolderKanbanIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);
    const divRef = useRef(null);

    useEffect(() => {
      const parent = divRef.current?.parentElement;
      if (!parent) return;

      const handleEnter = () => { if (!isControlledRef.current) controls.start("animate"); };
      const handleLeave = () => { if (!isControlledRef.current) controls.start("normal"); };
      const handleClick = () => { 
        if (!isControlledRef.current) {
          controls.start("normal").then(() => controls.start("animate"));
        } 
      };

      parent.addEventListener('mouseenter', handleEnter);
      parent.addEventListener('mouseleave', handleLeave);
      parent.addEventListener('click', handleClick);

      return () => {
        parent.removeEventListener('mouseenter', handleEnter);
        parent.removeEventListener('mouseleave', handleLeave);
        parent.removeEventListener('click', handleClick);
      };
    }, [controls]);


    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <div
        ref={divRef}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
          <motion.g
            animate={controls}
            initial="normal"
            variants={COLUMNS_VARIANTS}
          >
            <motion.path d="M8 10v4" variants={COLUMN_VARIANTS} />
            <motion.path d="M12 10v2" variants={COLUMN_VARIANTS} />
            <motion.path d="M16 10v6" variants={COLUMN_VARIANTS} />
          </motion.g>
        </svg>
      </div>
    );
  }
);

FolderKanbanIcon.displayName = "FolderKanbanIcon";

export { FolderKanbanIcon };
