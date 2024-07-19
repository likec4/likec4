/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgVue = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path
      fill="none"
      d="m0 8.934 49.854.158 14.167 24.47 14.432-24.47L128 8.935l-63.834 110.14zm126.98.637-24.36.02-38.476 66.053L25.691 9.592.942 9.572l63.211 107.89zm-25.149-.008-22.745.168-15.053 24.647L49.216 9.73l-22.794-.168 37.731 64.476zm-75.834-.17 23.002.009m-23.002-.01 23.002.01"
    />
    <path fill="#35495e" d="m25.997 9.393 23.002.009L64.035 34.36 79.018 9.404 102 9.398 64.15 75.053z" />
    <path fill="#41b883" d="m.91 9.569 25.067-.172 38.15 65.659L101.98 9.401l25.11.026-62.966 108.06z" />
  </svg>
)
export default SvgVue
