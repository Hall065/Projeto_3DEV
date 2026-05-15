interface Box3DProps {
  size?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { bottom?: string; left?: string; right?: string; top?: string };
  delay?: number;
  animate?: boolean;
  theme?: 'dark' | 'light';
}

const DARK_FACES = {
  front:  { from: '#EFEFEF', to: '#D0D0D0' },
  right:  { from: '#C8C8C8', to: '#9A9A9A' },
  left:   { from: '#9A9A9A', to: '#767676' },
  top:    { from: '#FAFAFA', to: '#E2E2E2' },
  bottom: '#505050',
  tape:   'rgba(80,80,80,0.25)',
  border: 'rgba(200,200,200,0.3)',
};

const LIGHT_FACES = {
  front:  { from: '#E03535', to: '#C01010' },
  right:  { from: '#C01010', to: '#8B0000' },
  left:   { from: '#8B0000', to: '#6A0000' },
  top:    { from: '#F04545', to: '#D02020' },
  bottom: '#4A0000',
  tape:   'rgba(255,255,255,0.15)',
  border: 'rgba(255,100,100,0.3)',
};

export function Box3D({
  size = 80,
  rotation = { x: -20, y: 30, z: 0 },
  position = {},
  delay = 0,
  animate = true,
  theme = 'dark',
}: Box3DProps) {
  const halfSize = size / 2;
  const faces = theme === 'dark' ? DARK_FACES : LIGHT_FACES;

  const faceBaseStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${size + 1}px`, // Slight overlap to avoid gaps
    height: `${size + 1}px`,
    top: '-0.5px',
    left: '-0.5px',
    boxSizing: 'border-box',
    backfaceVisibility: 'hidden',
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        width: `${size}px`,
        height: `${size}px`,
        animation: animate ? `floatBox 4s ease-in-out ${delay}s infinite` : 'none',
        zIndex: 1,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
        }}
      >
        {/* Front Face */}
        <div
          style={{
            ...faceBaseStyle,
            transform: `translateZ(${halfSize}px)`,
            background: `linear-gradient(135deg, ${faces.front.from}, ${faces.front.to})`,
            border: `1px solid ${faces.border}`,
            boxShadow: 'inset -4px -4px 16px rgba(0,0,0,0.12), inset 4px 4px 16px rgba(255,255,255,0.15)',
          }}
        >
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: faces.tape, transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: faces.tape, transform: 'translateX(-50%)' }} />
        </div>

        {/* Back Face */}
        <div
          style={{
            ...faceBaseStyle,
            transform: `translateZ(-${halfSize}px) rotateY(180deg)`,
            background: `linear-gradient(135deg, ${faces.right.from}, ${faces.right.to})`,
          }}
        />

        {/* Right Face */}
        <div
          style={{
            ...faceBaseStyle,
            transform: `rotateY(90deg) translateZ(${halfSize}px)`,
            background: `linear-gradient(135deg, ${faces.right.from}, ${faces.right.to})`,
            boxShadow: 'inset -12px 0 28px rgba(0,0,0,0.35)',
          }}
        />

        {/* Left Face */}
        <div
          style={{
            ...faceBaseStyle,
            transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
            background: `linear-gradient(135deg, ${faces.left.from}, ${faces.left.to})`,
            boxShadow: 'inset 12px 0 28px rgba(0,0,0,0.3)',
          }}
        />

        {/* Top Face */}
        <div
          style={{
            ...faceBaseStyle,
            transform: `rotateX(90deg) translateZ(${halfSize}px)`,
            background: `linear-gradient(135deg, ${faces.top.from}, ${faces.top.to})`,
            boxShadow: 'inset -6px -6px 20px rgba(0,0,0,0.1)',
          }}
        />

        {/* Bottom Face */}
        <div
          style={{
            ...faceBaseStyle,
            transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
            background: faces.bottom,
          }}
        />
      </div>
    </div>
  );
}