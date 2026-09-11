"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  ArrowRight,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Film,
} from "lucide-react";

// Default media if database has no media uploaded yet
const DEFAULT_MEDIA_SLIDES = [
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1900&q=80",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1900&q=80",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1900&q=80",
  },
];

export default function HeroCarousel({
  homeData = null,
  locationTitle = "",
  makeLink = (path) => path,
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = down, -1 = up
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);
  const videoRefs = useRef({});

  // Parse media items purely from Firestore dynamic data
  const parseMediaList = (data) => {
    if (!data) return [];
    const list = [];

    // 1. Check media or slides array (preferred)
    const mediaArray = data.media || data.slides || data.slider || data.carousel;
    if (Array.isArray(mediaArray) && mediaArray.length > 0) {
      mediaArray.forEach((item, idx) => {
        if (typeof item === "string" && item.trim()) {
          list.push({
            id: `media-${idx}`,
            type: item.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? "video" : "image",
            url: item.trim(),
          });
        } else if (item && typeof item === "object") {
          const url = item.url || item.image || item.imageUrl || item.src;
          if (url) {
            list.push({
              id: item.id || `media-${idx}`,
              type: item.type || (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? "video" : "image"),
              url,
              title: item.title || "",
              subtitle: item.subtitle || item.description || item.desc || "",
              badge: item.badge || item.tag || "",
              button1Text: item.button1Text || item.btn1Text || "",
              button1Link: item.button1Link || item.btn1Link || "",
              button2Text: item.button2Text || item.btn2Text || "",
              button2Link: item.button2Link || item.btn2Link || "",
            });
          }
        }
      });
    }

    // 2. Check images array
    if (list.length === 0 && Array.isArray(data.images) && data.images.length > 0) {
      data.images.forEach((url, idx) => {
        if (typeof url === "string" && url.trim()) {
          list.push({
            id: `img-${idx}`,
            type: "image",
            url: url.trim(),
          });
        }
      });
    }

    // 3. Check single imageUrl / image
    if (list.length === 0 && (data.imageUrl || data.image)) {
      const singleImg = data.imageUrl || data.image;
      if (typeof singleImg === "string" && singleImg.trim()) {
        list.push({
          id: "single-img",
          type: "image",
          url: singleImg.trim(),
        });
      }
    }

    // 4. Check videos array
    if (Array.isArray(data.videos) && data.videos.length > 0) {
      data.videos.forEach((vUrl, idx) => {
        if (typeof vUrl === "string" && vUrl.trim() && !list.some((item) => item.url === vUrl.trim())) {
          list.push({
            id: `vid-${idx}`,
            type: "video",
            url: vUrl.trim(),
          });
        }
      });
    }

    // 5. Check single videoUrl / video
    const singleVid = data.videoUrl || data.video;
    if (singleVid && typeof singleVid === "string" && singleVid.trim() && !list.some((item) => item.url === singleVid.trim())) {
      list.push({
        id: "single-vid",
        type: "video",
        url: singleVid.trim(),
      });
    }

    return list;
  };

  const dbSlides = parseMediaList(homeData);
  const slides = dbSlides.length > 0 ? dbSlides : DEFAULT_MEDIA_SLIDES;

  const activeMedia = slides[currentSlide] || slides[0] || {};

  // Pure dynamic texts (No static dummy copy fallbacks)
  const heroTitle = (activeMedia?.title || homeData?.title || "").trim();
  const heroDescription = (
    activeMedia?.subtitle ||
    activeMedia?.description ||
    activeMedia?.desc ||
    homeData?.description ||
    homeData?.desc ||
    ""
  ).trim();

  const heroBadge = (
    activeMedia?.badge ||
    homeData?.badge ||
    (locationTitle ? `Leading Supplier in ${locationTitle}` : "")
  ).trim();

  // Dynamic buttons
  const btn1Text = (
    activeMedia?.button1Text ||
    activeMedia?.btn1Text ||
    homeData?.button1Text ||
    homeData?.btn1Text ||
    homeData?.button1 ||
    ""
  ).trim();

  const btn1Link =
    activeMedia?.button1Link ||
    activeMedia?.btn1Link ||
    homeData?.button1Link ||
    homeData?.btn1Link ||
    makeLink("/items");

  const btn2Text = (
    activeMedia?.button2Text ||
    activeMedia?.btn2Text ||
    homeData?.button2Text ||
    homeData?.btn2Text ||
    homeData?.button2 ||
    ""
  ).trim();

  const btn2Link =
    activeMedia?.button2Link ||
    activeMedia?.btn2Link ||
    homeData?.button2Link ||
    homeData?.btn2Link ||
    makeLink("/contact");

  // Auto-slide vertical effect
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPlaying, slides.length, currentSlide]);

  // Adjust active slide index safely
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(slides.length - 1);
    }
  }, [slides.length, currentSlide]);

  // Play video on current slide
  useEffect(() => {
    const currentMedia = slides[currentSlide];
    if (currentMedia?.type === "video") {
      const vid = videoRefs.current[currentSlide];
      if (vid) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      }
    }
  }, [currentSlide, slides]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Vertical Touch Swipe support
  const minSwipeDistance = 40;

  const onTouchStart = (e) => {
    setTouchEndY(null);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e) => {
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStartY || !touchEndY) return;
    const distance = touchStartY - touchEndY;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe) {
      handleNext();
    } else if (isDownSwipe) {
      handlePrev();
    }
  };

  // Animation variants for Vertical Transitions
  const verticalVariants = {
    enter: (dir) => ({
      y: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 1.02,
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        y: { type: "spring", stiffness: 260, damping: 30, duration: 0.7 },
        opacity: { duration: 0.5 },
      },
    },
    exit: (dir) => ({
      y: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.98,
      transition: {
        y: { type: "spring", stiffness: 260, damping: 30, duration: 0.7 },
        opacity: { duration: 0.4 },
      },
    }),
  };

  return (
    <section className="relative overflow-hidden bg-[#0b0f19] text-white">
      {/* Vertical Viewport */}
      <div
        className="relative w-full h-[400px] sm:h-[460px] md:h-[510px] lg:h-[550px] overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Background Media with Vertical Framer Motion Transitions */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={verticalVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            {activeMedia?.type === "video" ? (
              <video
                ref={(el) => (videoRefs.current[currentSlide] = el)}
                src={activeMedia.url}
                className="w-full h-full object-cover object-center"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              />
            ) : (
              <img
                src={activeMedia?.url}
                alt={heroTitle || `Slide ${currentSlide + 1}`}
                className="w-full h-full object-cover object-center brightness-[0.95] contrast-[1.05]"
                onError={(e) => {
                  e.target.src = DEFAULT_MEDIA_SLIDES[0].url;
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Crisp Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-transparent lg:w-2/3 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30 pointer-events-none" />

        {/* Foreground Content Container */}
        <div className="container-custom relative z-20 h-full flex flex-col justify-center py-6 sm:py-8">
          <div className="max-w-2xl lg:max-w-3xl">
            {/* Dynamic Badge (Only rendered if present) */}
            {heroBadge && (
              <motion.div
                key={`badge-${currentSlide}-${heroBadge}`}
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3.5 py-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-200 shadow-lg backdrop-blur-md"
              >
                <Sparkles size={14} className="text-slate-300 animate-pulse" />
                <span>{heroBadge}</span>
              </motion.div>
            )}

            {/* Dynamic Main Heading (Only rendered if present) */}
            {heroTitle && (
              <motion.h1
                key={`title-${currentSlide}-${heroTitle}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mt-3 sm:mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl leading-[1.14] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
              >
                {heroTitle}
              </motion.h1>
            )}

            {/* Dynamic Description (Only rendered if present) */}
            {heroDescription && (
              <motion.p
                key={`desc-${currentSlide}-${heroDescription}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base leading-relaxed text-slate-200 max-w-2xl font-medium line-clamp-3 md:line-clamp-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
              >
                {heroDescription}
              </motion.p>
            )}

            {/* Dynamic Action Buttons (Only rendered if text is provided) */}
            {(btn1Text || btn2Text) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mt-5 sm:mt-6 flex flex-wrap items-center gap-3"
              >
                {btn1Text && (
                  <Link
                    href={btn1Link}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 !text-white px-6 py-3 text-xs sm:text-sm font-bold shadow-xl shadow-slate-950/50 transition-all duration-300 hover:bg-slate-700 hover:shadow-2xl hover:-translate-y-0.5 border border-slate-600/50"
                  >
                    <span className="!text-white font-bold">{btn1Text}</span>
                    <ArrowRight size={16} className="!text-white" />
                  </Link>
                )}

                {btn2Text && (
                  <Link
                    href={btn2Link}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 !text-white px-6 py-3 text-xs sm:text-sm font-bold backdrop-blur-md shadow-md transition-all duration-300 hover:bg-white hover:!text-slate-900 hover:border-white hover:-translate-y-0.5"
                  >
                    <PhoneCall size={16} className="text-white" />
                    <span className="font-bold">{btn2Text}</span>
                  </Link>
                )}
              </motion.div>
            )}

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 hidden sm:flex flex-wrap items-center gap-5 border-t border-white/15 pt-4 text-xs font-semibold text-slate-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-slate-300 shrink-0" />
                <span>ISO 13485 Certified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-slate-300 shrink-0" />
                <span>24/7 SLA Field Support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-slate-300 shrink-0" />
                <span>NABL Traceable QC</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ================= VERTICAL CAROUSEL CONTROLS (Right Side) ================= */}
        {slides.length > 1 && (
          <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3">
            {/* Up Arrow (Previous Slide) */}
            <button
              type="button"
              onClick={handlePrev}
              title="Previous Slide (Up)"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-slate-800 hover:border-slate-500 transition-all shadow-lg active:scale-95"
            >
              <ChevronUp size={20} />
            </button>

            {/* Vertical Indicator Steps */}
            <div className="flex flex-col items-center gap-2 py-2 px-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 shadow-xl">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDirection(idx > currentSlide ? 1 : -1);
                    setCurrentSlide(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full ${
                    currentSlide === idx
                      ? "h-6 sm:h-7 w-2.5 bg-white shadow-md shadow-white/50"
                      : "h-2 sm:h-2.5 w-2.5 bg-white/40 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>

            {/* Down Arrow (Next Slide) */}
            <button
              type="button"
              onClick={handleNext}
              title="Next Slide (Down)"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-slate-800 hover:border-slate-500 transition-all shadow-lg active:scale-95"
            >
              <ChevronDown size={20} />
            </button>

            {/* Vertical Counter & Controls */}
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-black/75 px-2 py-2 text-[11px] font-bold text-slate-200 backdrop-blur-md border border-white/20 shadow-lg">
              <span className="text-white font-extrabold">{currentSlide + 1}</span>
              <span className="h-2.5 w-[1px] bg-white/40" />
              <span className="text-slate-400">{slides.length}</span>

              {/* Play / Pause toggle */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Pause Slideshow" : "Play Slideshow"}
                className="mt-1 flex h-6 w-6 items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-white/20 transition-all"
              >
                {isPlaying ? <Pause size={11} /> : <Play size={11} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
