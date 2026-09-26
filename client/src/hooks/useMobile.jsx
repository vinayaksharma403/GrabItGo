import { useEffect, useState, useCallback } from "react";

const useMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  const handleResize = useCallback(() => {
    const checkpoint = window.innerWidth < breakpoint;
    setIsMobile(checkpoint);
  }, [breakpoint]);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return [isMobile];
};

export default useMobile;