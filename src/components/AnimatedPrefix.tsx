"use client";

import { useEffect, useState } from "react";
import { prefixWords } from "@/data/site";

export function AnimatedPrefix() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % prefixWords.length);
    }, 1700);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="prefix-lockup" aria-label={`${prefixWords[index]}PLISTIC`}>
      <span className="prefix-word">{prefixWords[index]}</span>
      <span className="prefix-fixed">PLISTIC</span>
    </span>
  );
}

