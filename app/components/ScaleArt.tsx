// A balance scale: the coins (your budget) outweigh the parcel (the purchase).
export default function ScaleArt() {
  return (
    <svg className="st-art" viewBox="0 0 520 420" aria-hidden="true" focusable="false">
      <circle cx="270" cy="190" r="170" fill="#33267f" />
      <rect x="0" y="332" width="520" height="88" fill="#1a1240" />
      <rect x="0" y="330" width="520" height="3" fill="#4a3da0" />

      {/* post, base and finial */}
      <rect x="254" y="96" width="12" height="226" rx="6" fill="#c9c0ff" />
      <path d="M186 332 H334 L320 314 H200 Z" fill="#c9c0ff" />
      <circle cx="260" cy="82" r="8" fill="#ece8ff" />

      {/* beam: the budget side sits lower */}
      <g transform="rotate(-4 260 101)">
        <rect x="88" y="96" width="344" height="10" rx="5" fill="#ece8ff" />
      </g>
      <circle cx="260" cy="101" r="11" fill="#9380ff" />

      {/* left pan with coins */}
      <path d="M90 113 L44 232 M90 113 L136 232" stroke="#c9c0ff" strokeWidth="2" fill="none" />
      <path d="M28 232 H152 Q90 266 28 232 Z" fill="#9380ff" />
      <rect x="64" y="224" width="52" height="8" rx="4" fill="#ffc46b" stroke="#b8862f" />
      <rect x="64" y="216" width="52" height="8" rx="4" fill="#ffc46b" stroke="#b8862f" />
      <rect x="64" y="208" width="52" height="8" rx="4" fill="#ffc46b" stroke="#b8862f" />
      <rect x="64" y="200" width="52" height="8" rx="4" fill="#ffc46b" stroke="#b8862f" />

      {/* right pan with a parcel */}
      <path d="M430 89 L385 206 M430 89 L475 206" stroke="#c9c0ff" strokeWidth="2" fill="none" />
      <path d="M368 206 H492 Q430 240 368 206 Z" fill="#9380ff" />
      <rect x="404" y="168" width="52" height="38" rx="3" fill="#6f9bff" />
      <rect x="426" y="168" width="8" height="38" fill="#b7cdff" />
    </svg>
  );
}