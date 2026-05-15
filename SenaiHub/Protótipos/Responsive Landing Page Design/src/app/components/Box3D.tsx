interface Box3DProps {
  size?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { bottom?: string; left?: string; right?: string; top?: string };
  delay?: number;
  animate?: boolean;
}

export function Box3D({
  size = 80,
  rotation = { x: -20, y: 30, z: 0 },
  position = {},
  delay = 0,
  animate = true,
}: Box3DProps) {
  const halfSize = size / 2;

  return (
    <div
      className="absolute"
      style={{
        ...position,
        width: `${size}px`,
        height: `${size}px`,
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
        animation: animate ? `float3D 4s ease-in-out ${delay}s infinite` : 'none',
      }}
    >
      {/* Front Face */}
      <div
        className="absolute bg-gradient-to-br from-[#E5C59A] to-[#D9B382] border border-[#A67C52]"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: `translateZ(${halfSize}px)`,
          boxShadow: 'inset -5px -5px 20px rgba(0, 0, 0, 0.1), inset 5px 5px 20px rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Tape Detail */}
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-[#A67C52] opacity-30 -translate-y-1/2" />
        <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-[#A67C52] opacity-30 -translate-x-1/2" />
      </div>

      {/* Back Face */}
      <div
        className="absolute bg-gradient-to-br from-[#C9A572] to-[#A67C52]"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: `translateZ(-${halfSize}px) rotateY(180deg)`,
        }}
      />

      {/* Right Face */}
      <div
        className="absolute bg-gradient-to-br from-[#D9B382] to-[#B89968]"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: `rotateY(90deg) translateZ(${halfSize}px)`,
          boxShadow: 'inset -10px 0 30px rgba(0, 0, 0, 0.3)',
        }}
      />

      {/* Left Face */}
      <div
        className="absolute bg-gradient-to-br from-[#B89968] to-[#A67C52]"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
          boxShadow: 'inset 10px 0 30px rgba(0, 0, 0, 0.3)',
        }}
      />

      {/* Top Face */}
      <div
        className="absolute bg-gradient-to-br from-[#F0D9B5] to-[#E5C59A]"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: `rotateX(90deg) translateZ(${halfSize}px)`,
          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Top Tape Cross */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-[#A67C52] opacity-40 -translate-y-1/2" />
        <div className="absolute top-0 bottom-0 left-1/2 w-1.5 bg-[#A67C52] opacity-40 -translate-x-1/2" />
      </div>

      {/* Bottom Face */}
      <div
        className="absolute bg-gradient-to-br from-[#A67C52] to-[#8B6641]"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
          boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Shadow below the box */}
      <div
        className="absolute bg-black rounded-full opacity-20 blur-md"
        style={{
          width: `${size * 0.8}px`,
          height: `${size * 0.4}px`,
          bottom: `-${size * 0.7}px`,
          left: '10%',
          transform: 'rotateX(90deg)',
        }}
      />
    </div>
  );
}
