// Celebraciones que se disparan cuando el usuario pega por primera vez la
// lámina de una estrella. Detectamos la transición prevCount=0 → newCount>=1
// (tanto en el agregado manual de un sticker como en el scanner de sobres) y
// abrimos un modal con imagen + audio + animación.
//
// No persistimos un flag de "ya viste la celebración": si el usuario marca/
// desmarca el sticker varias veces, la celebración se vuelve a mostrar en
// cada nueva pegada. Es una celebración del momento.

export interface StarCelebration {
  /** Ruta a la imagen principal dentro de /public. */
  imageUrl: string;
  /** Ruta al audio que suena al abrir el modal. */
  audioUrl: string;
  /** Título grande arriba del modal. */
  title: string;
  /** Subtítulo en cursiva debajo del título. */
  subtitle?: string;
  /** Grito celebración estilo "SIUUU!" — se muestra enorme animado. */
  catchphrase?: string;
  /**
   * Colores para el confetti (3 colores que se alternan). Suelen ser los
   * colores de la selección del jugador.
   */
  confettiColors?: [string, string, string];
}

export const STAR_CELEBRATIONS: Record<string, StarCelebration> = {
  // Cristiano Ronaldo · Portugal · lámina #15
  "POR-15": {
    imageUrl: "/celebrations/siu.jpg",
    audioUrl: "/celebrations/siu.mp3",
    title: "Cristiano Ronaldo",
    subtitle: "Su despedida mundialista",
    catchphrase: "SIUUUU!",
    // Rojo y verde portugueses + dorado de campeón
    confettiColors: ["#ce1126", "#006600", "#FFD700"],
  },
};

export function getStarCelebration(
  stickerId: string | null | undefined
): StarCelebration | null {
  if (!stickerId) return null;
  return STAR_CELEBRATIONS[stickerId] || null;
}
