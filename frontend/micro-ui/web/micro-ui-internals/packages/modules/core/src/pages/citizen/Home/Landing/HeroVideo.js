import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useInterval from "../../../../hooks/useInterval";
import Icon from "./Icons";
import { HERO_CLIP_SECONDS, HERO_MEDIA_MODE, HERO_SCENE_SECONDS, HERO_VIDEO_BASE, heroVideos, heroVideosHimachal } from "./config";
import { scenes } from "./HeroScenes";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Video clips are also skipped on data-saver / 2G connections. */
const avoidVideo = () => {
  if (typeof window === "undefined") return true;
  if (prefersReducedMotion()) return true;
  const c = navigator.connection;
  return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || "")));
};

/**
 * Hero background media (mode set in config: HERO_MEDIA_MODE).
 *  - "scenes": animated SVG scenes of civic services in a Himachal hill town
 *  - "videos": muted photo clips (public/videos/hero)
 * Both rotate automatically, with caption, clip dots and a pause/play button.
 * With reduced motion the first scene is shown as a still image.
 */
const HeroVideo = () => {
  const { t } = useTranslation();
  const isScenes = HERO_MEDIA_MODE === "scenes";
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [failed, setFailed] = useState({});
  const videoRef = useRef(null);
  const reduced = useMemo(prefersReducedMotion, []);
  const skipVideos = useMemo(avoidVideo, []);

  const items = isScenes ? scenes : HERO_MEDIA_MODE === "himachal-videos" ? heroVideosHimachal : heroVideos;
  const available = items.map((v, i) => i).filter((i) => !failed[i]);
  const current = available.includes(index) ? index : available[0];
  const motionOn = playing && !reduced;

  useEffect(() => {
    const id = setTimeout(() => setStarted(true), isScenes ? 0 : 600);
    return () => clearTimeout(id);
  }, [isScenes]);

  const next = useCallback(
    (from) => {
      const pos = available.indexOf(from);
      return available[(pos + 1) % available.length];
    },
    [available]
  );

  // scenes rotate on a timer
  useInterval(() => setIndex(next(current)), isScenes && started && motionOn && available.length > 1 ? HERO_SCENE_SECONDS * 1000 : null);

  // videos: keep play/pause in sync with the button
  useEffect(() => {
    const v = videoRef.current;
    if (isScenes || !v) return;
    if (playing) {
      const p = v.play();
      // AbortError just means a new clip replaced this one; only a real autoplay block pauses
      if (p && p.catch) p.catch((err) => err && err.name === "NotAllowedError" && setPlaying(false));
    } else v.pause();
  }, [playing, index, started, isScenes]);

  if (!started || available.length === 0) return null;
  if (!isScenes && skipVideos) return null;

  const item = items[current];
  const caption = t(item.titleKey, { defaultValue: item.title });
  const Scene = isScenes ? item.Scene : null;

  return (
    <React.Fragment>
      <div className={`LandingHeroVideo ${isScenes ? "LandingHeroVideo--scene" : ""}`} aria-hidden="true">
        {isScenes ? (
          <svg
            key={item.id}
            className="LandingHeroVideo__svg"
            viewBox="0 0 1600 560"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <Scene still={!motionOn} />
          </svg>
        ) : (
          <video
            key={item.id}
            ref={videoRef}
            className="LandingHeroVideo__el"
            src={`${HERO_VIDEO_BASE}${item.file}`}
            autoPlay={playing}
            muted
            playsInline
            preload="auto"
            onTimeUpdate={(e) => e.currentTarget.currentTime >= HERO_CLIP_SECONDS && setIndex(next(current))}
            onEnded={() => setIndex(next(current))}
            onError={() => setFailed((f) => ({ ...f, [current]: true }))}
          />
        )}
        <div className="LandingHeroVideo__shade" />
      </div>

      <div className="LandingHeroVideo__controls">
        <div className="LandingWrap LandingHeroVideo__bar">
          <span className="LandingHeroVideo__caption" key={item.id}>
            {caption}
          </span>
          <span className="LandingHeroVideo__dots">
            {available.map((i) => (
              <button
                key={items[i].id}
                type="button"
                className={i === current ? "is-active" : ""}
                aria-label={t(items[i].titleKey, { defaultValue: items[i].title })}
                aria-current={i === current}
                onClick={() => setIndex(i)}
              />
            ))}
          </span>
          {!reduced && (
            <button
              type="button"
              className="LandingHeroVideo__toggle"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? t("LANDING_VIDEO_PAUSE", { defaultValue: "Pause background animation" }) : t("LANDING_VIDEO_PLAY", { defaultValue: "Play background animation" })}
            >
              <Icon name={playing ? "pause" : "play"} size={16} />
            </button>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default HeroVideo;
