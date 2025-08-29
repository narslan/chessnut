export interface PGN {
  id: string;
  event: string;
  site: string;
  date: string;
  round: string;
  white: string;
  black: string;
  moves: string;
  result: string;
  sanMoves: string[];
}

export interface PgnContext {
  pgns: PGN[];
    pgnDetails: Record<string, PGN>;
  requestPgn: (id: string) => void;

}