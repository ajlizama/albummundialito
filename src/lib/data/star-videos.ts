// Videos cinemáticos que se disparan cuando el usuario pega por primera vez
// la lámina de una estrella. Detectamos la transición prevCount=0 → newCount>=1
// (tanto en el agregado manual de un sticker como en el scanner de sobres) y
// abrimos un modal con el embed de YouTube.
//
// No persistimos un flag de "ya viste el video": si el usuario marca/desmarca
// el sticker varias veces, el video se vuelve a mostrar en cada nueva pegada.
// Es una celebración del momento, no un trofeo permanente.

export interface StarVideo {
  /** ID de YouTube — la parte después de `v=` en la URL. */
  youtubeId: string;
  /** Título corto que se muestra arriba del video. */
  title: string;
  /** Subtítulo opcional. */
  subtitle?: string;
}

export const STAR_VIDEOS: Record<string, StarVideo> = {
  // Cristiano Ronaldo · Portugal · lámina #15
  "POR-15": {
    youtubeId: "xcfft9RCM6I",
    title: "Cristiano Ronaldo",
    subtitle: "Su despedida mundialista",
  },
};

export function getStarVideo(
  stickerId: string | null | undefined
): StarVideo | null {
  if (!stickerId) return null;
  return STAR_VIDEOS[stickerId] || null;
}
