"use client";

import { useState, useEffect } from "react";

interface TypewriterEffectProps {
    text: string;
    speed?: number;
    className?: string;
    onComplete?: () => void;
    onUpdate?: () => void;
}

export const TypewriterEffect = ({
    text,
    speed = 8,
    className = "",
    onComplete,
    onUpdate
}: TypewriterEffectProps) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        setDisplayedText("");
        let index = 0;

        const intervalId = setInterval(() => {
            if (index < text.length) {
                setDisplayedText((prev) => prev + text.charAt(index));
                index++;
                if (onUpdate) onUpdate();
            } else {
                clearInterval(intervalId);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [text, speed, onUpdate]); // Added onUpdate to dependencies, but be careful of loops if onUpdate changes.

    return (
        <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
            {displayedText}
        </div>
    );
};
