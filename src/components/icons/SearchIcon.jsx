import React, { forwardRef, useCallback, useImperativeHandle, useRef , useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

const SearchIcon = forwardRef(
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
        <motion.svg
          animate={controls}
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          transition={{
            duration: 1,
            bounce: 0.3,
          }}
          variants={{
            normal: { x: 0, y: 0 },
            animate: {
              x: [0, 0, -3, 0],
              y: [0, -4, 0, 0],
            },
          }}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </motion.svg>
      </div>
    );
  }
);

SearchIcon.displayName = "SearchIcon";

export { SearchIcon };
