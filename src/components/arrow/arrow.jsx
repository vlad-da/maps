const Arrow = ({ pathId, color, duration }) => {
  return (
    <path
      d="M0 0 H-16 M0 0 L-4 -4 M0 0 L-4 4"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <animateMotion dur={duration} fill="freeze" rotate="auto" begin="0s">
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </path>
  );
};

export default Arrow;
