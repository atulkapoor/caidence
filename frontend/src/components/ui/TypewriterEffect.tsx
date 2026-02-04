"use client";

import { useState, useEffect } from "react";

interface TypewriterEffectProps {
    text: string;
    speed?: number;
    className?: string;
    onComplete?: () => void;
}

export const TypewriterEffect = ({
    text,
    speed = 8,
    className = "",
    onComplete
}: TypewriterEffectProps) => {
    const [displayedText, setDisplayedText] = useState("");

    // Reset if text changes completely (e.g. new generation)
    // But be careful not to reset if it's just incremental streaming updates, which might be handled differently.
    // Ideally this component expects the FULL final text to be passed, or stable text updates.
    // For this simple version, we assume 'text' is the complete string we want to animate from start to finish.

    useEffect(() => {
        setDisplayedText("");
        let index = 0;

        const intervalId = setInterval(() => {
            if (index < text.length) {
                setDisplayedText((prev) => prev + text.charAt(index));
                index++;
            } else {
                clearInterval(intervalId);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [text, speed]);

    return (
        <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
            {displayedText}
        </div>
    );
};
