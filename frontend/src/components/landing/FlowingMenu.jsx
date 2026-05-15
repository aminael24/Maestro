import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";

// Styles CSS injectés directement pour éviter un fichier .css séparé
const StyleTag = () => (
  <style>{`
    .menu-wrap { width: 100%; height: 100%; overflow: hidden; }
    .menu { display: flex; flex-direction: column; height: 100%; margin: 0; padding: 0; }
    .menu__item { flex: 1; position: relative; overflow: hidden; text-align: center; border-top: 1px solid; }
    .menu__item:first-child { border-top: none; }
    .menu__item-link { 
      display: flex; align-items: center; justify-content: center; 
      height: 100%; position: relative; cursor: pointer; 
      text-transform: uppercase; text-decoration: none; 
      white-space: nowrap; font-weight: 600; font-size: 4vh; 
    }
    .marquee { 
      position: absolute; top: 0; left: 0; overflow: hidden; 
      width: 100%; height: 100%; pointer-events: none; 
      transform: translate3d(0, 101%, 0); 
    }
    .marquee__inner-wrap { height: 100%; width: 100%; overflow: hidden; }
    .marquee__inner { display: flex; align-items: center; position: relative; height: 100%; width: fit-content; }
    .marquee__part { display: flex; align-items: center; flex-shrink: 0; }
    .marquee span { white-space: nowrap; text-transform: uppercase; font-weight: 400; font-size: 4vh; padding: 0 2vw; }
    .marquee__img { width: 220px; height: 8vh; margin: 0 2vw; border-radius: 12px; background-size: cover; background-position: center; }
  `}</style>
);

function MenuItem({
  link,
  text,
  image,
  speed,
  textColor,
  marqueeBgColor,
  marqueeTextColor,
  borderColor,
}) {
  const itemRef = useRef(null);
  const marqueeRef = useRef(null);
  const marqueeInnerRef = useRef(null);
  const animationRef = useRef(null);
  const [repetitions, setRepetitions] = useState(4);

  const findClosestEdge = (mouseX, mouseY, width, height) => {
    const topEdgeDist =
      Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - 0, 2);
    const bottomEdgeDist =
      Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  useEffect(() => {
    const calculateRepetitions = () => {
      if (!marqueeInnerRef.current) return;
      const marqueeContent =
        marqueeInnerRef.current.querySelector(".marquee__part");
      if (!marqueeContent) return;
      const needed =
        Math.ceil(window.innerWidth / marqueeContent.offsetWidth) + 2;
      setRepetitions(Math.max(4, needed));
    };
    calculateRepetitions();
    window.addEventListener("resize", calculateRepetitions);
    return () => window.removeEventListener("resize", calculateRepetitions);
  }, [text]);

  useEffect(() => {
    if (!marqueeInnerRef.current) return;
    const marqueeContent =
      marqueeInnerRef.current.querySelector(".marquee__part");
    if (!marqueeContent || marqueeContent.offsetWidth === 0) return;

    if (animationRef.current) animationRef.current.kill();
    animationRef.current = gsap.to(marqueeInnerRef.current, {
      x: -marqueeContent.offsetWidth,
      duration: speed,
      ease: "none",
      repeat: -1,
    });
    return () => animationRef.current?.kill();
  }, [repetitions, speed]);

  const handleMouseEnter = (ev) => {
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height,
    );
    gsap
      .timeline({ defaults: { duration: 0.6, ease: "expo" } })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  };

  const handleMouseLeave = (ev) => {
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height,
    );
    gsap
      .timeline({ defaults: { duration: 0.6, ease: "expo" } })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  return (
    <div className="menu__item" ref={itemRef} style={{ borderColor }}>
      <a
        className="menu__item-link"
        href={link}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ color: textColor }}
      >
        {text}
      </a>
      <div
        className="marquee"
        ref={marqueeRef}
        style={{ backgroundColor: marqueeBgColor }}
      >
        <div className="marquee__inner-wrap">
          <div
            className="marquee__inner"
            ref={marqueeInnerRef}
            aria-hidden="true"
          >
            {[...Array(repetitions)].map((_, idx) => (
              <div
                className="marquee__part"
                key={idx}
                style={{ color: marqueeTextColor }}
              >
                <span>{text}</span>
                <div
                  className="marquee__img"
                  style={{ backgroundImage: `url(${image})` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const FlowingMenu = ({
  items = [],
  speed = 15,
  textColor,
  bgColor,
  marqueeBgColor,
  marqueeTextColor,
  borderColor,
}) => {
  return (
    <div className="menu-wrap" style={{ backgroundColor: bgColor }}>
      <StyleTag />
      <nav className="menu">
        {items.map((item, idx) => (
          <MenuItem
            key={idx}
            {...item}
            speed={speed}
            textColor={textColor}
            marqueeBgColor={marqueeBgColor}
            marqueeTextColor={marqueeTextColor}
            borderColor={borderColor}
          />
        ))}
      </nav>
    </div>
  );
};

export default FlowingMenu;
