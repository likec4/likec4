/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgKtor = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <defs>
      <linearGradient
        id="a"
        x1={24.941}
        x2={52.306}
        y1={24.941}
        y2={52.306}
        gradientTransform="rotate(.104)scale(1.21905)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.296} stopColor="#00afff" />
        <stop offset={0.694} stopColor="#5282ff" />
        <stop offset={1} stopColor="#945dff" />
      </linearGradient>
      <linearGradient
        id="b"
        x1={53.151}
        x2={79.023}
        y1={53.151}
        y2={79.023}
        gradientTransform="rotate(.104)scale(1.21905)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.108} stopColor="#c757bc" />
        <stop offset={0.173} stopColor="#cd5ca9" />
        <stop offset={0.492} stopColor="#e8744f" />
        <stop offset={0.716} stopColor="#f88316" />
        <stop offset={0.823} stopColor="#ff8900" />
      </linearGradient>
    </defs>
    <path fill="url(#a)" d="M80.457 47.543 47.543 14.629 14.629 47.543l32.914 32.914Zm0 0" />
    <path fill="url(#b)" d="m47.543 80.457 32.914 32.914 32.914-32.914-32.914-32.914Zm0 0" />
    <path d="M80.457 47.543H47.543v32.914h32.914Zm0 0" />
  </svg>
)
export default SvgKtor
