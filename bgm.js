// ============================================================
// Quiz BGM — MP3 Player
// Plays the Memories MP3 file during quiz phase.
// Same API as before: start(), stop(), setVolume(), isPlaying()
// ============================================================

const RomanticBGM = (function () {
  let audio = null;
  let playing = false;

  function ensureAudio() {
    if (audio) return;
    audio = new Audio("Memories-.....%232kUa9z.mp3");
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = 0.55;
  }

  // Pre-create and start loading the audio early
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureAudio);
  } else {
    ensureAudio();
  }

  return {
    start() {
      ensureAudio();
      if (playing) return;
      playing = true;
      audio.play().catch(() => {
        playing = false;
      });
    },
    stop() {
      if (!audio) return;
      audio.pause();
      playing = false;
    },
    setVolume(v) {
      ensureAudio();
      audio.volume = Math.max(0, Math.min(1, v));
    },
    isPlaying() {
      return playing;
    }
  };
})();
