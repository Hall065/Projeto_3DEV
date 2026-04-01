interface Shelf3DProps {
  level: number;
  side: 'left' | 'right';
  depth: number;
}

export function Shelf3D({ level, side, depth }: Shelf3DProps) {
  const isLeft = side === 'left';
  const bottomPosition = `${level * 18 + 8}%`;
  const sideOffset = `${depth * 5}%`;

  return (
    <div
      className="absolute"
      style={{
        bottom: bottomPosition,
        [side]: sideOffset,
        width: '35%',
        height: '12%',
        transformStyle: 'preserve-3d',
        transform: isLeft ? 'perspective(1000px) rotateY(12deg)' : 'perspective(1000px) rotateY(-12deg)',
        transformOrigin: isLeft ? 'right center' : 'left center',
      }}
    >
      {/* Horizontal Shelf Plate */}
      <div
        className="absolute w-full h-full bg-gradient-to-b from-[#7A8A94] to-[#5F6B73] border-t-2 border-[#8A9AA4]"
        style={{
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Metal Beam Details */}
        <div className="absolute bottom-0 left-0 w-1 h-full bg-[#4A5560]" />
        <div className="absolute bottom-0 right-0 w-1 h-full bg-[#4A5560]" />
        <div className="absolute bottom-0 left-1/3 w-0.5 h-full bg-[#4A5560] opacity-50" />
        <div className="absolute bottom-0 left-2/3 w-0.5 h-full bg-[#4A5560] opacity-50" />
      </div>

      {/* Vertical Support Beam - Front */}
      <div
        className="absolute w-2 bg-gradient-to-r from-[#6A7A84] to-[#5F6B73]"
        style={{
          [isLeft ? 'right' : 'left']: '5%',
          bottom: '-50%',
          height: '150%',
          boxShadow: isLeft
            ? '2px 0 8px rgba(0, 0, 0, 0.4)'
            : '-2px 0 8px rgba(0, 0, 0, 0.4)',
        }}
      />

      {/* Vertical Support Beam - Back */}
      <div
        className="absolute w-2 bg-gradient-to-r from-[#4A5560] to-[#3E4A52]"
        style={{
          [isLeft ? 'left' : 'right']: '5%',
          bottom: '-50%',
          height: '150%',
          opacity: 0.7,
        }}
      />
    </div>
  );
}
