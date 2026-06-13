import React, { forwardRef, useCallback, useImperativeHandle, useRef , useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

const PATH_VARIANT = {
  normal: { pathLength: 1, opacity: 1, pathOffset: 0 },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    pathOffset: [1, 0],
  },
};

const CIRCLE_VARIANT = {
  normal: {
    pathLength: 1,
    pathOffset: 0,
    scale: 1,
  },
  animate: {
    pathLength: [0, 1],
    pathOffset: [1, 0],
    scale: [0.5, 1],
  },
};

const UserIcon = forwardRef(
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
          <motion.circle
            animate={controls}
            cx="12"
            cy="8"
            r="5"
            variants={CIRCLE_VARIANT}
          />
          <motion.path
            animate={controls}
            d="M20 21a8 8 0 0 0-16 0"
            transition={{
              delay: 0.2,
              duration: 0.4,
            }}
            variants={PATH_VARIANT}
          />
        </svg>
      </div>
    );
  }
);

UserIcon.displayName = "UserIcon";

export { UserIcon };
