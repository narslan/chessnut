import { createContext } from "@lit/context";
import type { PGN } from "./pgn-model";

export interface PgnContext {
  pgns: PGN[];
  pgnDetails: Record<string, PGN>;
  requestPgn: (id: string) => void;
}

export const pgnContext = createContext<PgnContext>("pgn-context");
