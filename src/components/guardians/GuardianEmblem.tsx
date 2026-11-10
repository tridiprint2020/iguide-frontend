import type { GuardianId } from "../../data/guardians";

// Lightweight emblems for the collection, pending the original character artwork.
const emblems: Record<GuardianId, string[]> = {
  atoq: [
    "M23 53 17 18 43 35 57 35 83 18 77 53 67 74 50 85 33 74Z",
    "M23 53 39 57 50 74 61 57 77 53 M39 57 34 46 M61 57 66 46 M46 74h8",
  ],
  picaflor: [
    "M52 49 33 20 25 13 27 36 41 57 M46 57 22 42 15 46 39 67",
    "M39 67 54 62 66 46 84 39 65 39 56 44 52 49 M46 65 48 85 33 77 M64 45h.5",
  ],
  condor: [
    "M44 52 27 31 9 24 14 42 30 61 43 66 M56 52 73 31 91 24 86 42 70 61 57 66",
    "M43 66 43 78 50 85 57 78 57 66 M44 52 46 40 53 36 62 41 54 46 56 52 M18 35 34 51 M82 35 66 51",
  ],
  taruka: [
    "M36 45 31 30 31 15 M31 30 18 23 14 13 M64 45 69 30 69 15 M69 30 82 23 86 13",
    "M36 48 23 40 25 53 36 58 M64 48 77 40 75 53 64 58 M36 45 64 45 61 72 50 86 39 72Z M43 60h.5 M57 60h.5 M47 76h6",
  ],
};

export default function GuardianEmblem({ id }: { id: GuardianId }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {emblems[id].map((path, index) => <path key={index} d={path} />)}
    </svg>
  );
}
