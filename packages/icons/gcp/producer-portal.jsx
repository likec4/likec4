/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgProducerPortal = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    baseProfile="tiny"
    overflow="visible"
    viewBox="0 0 24 24"
    {...props}
  >
    <g fillRule="evenodd">
      <path fill="#5C85DE" d="M2 4.7h20V2.3H2z" />
      <path fill="#3367D6" d="M19.5 21.8H22v-7.4h-2.5zM12 14.4v4.9H4.5v-4.9H2v7.4h12.5v-7.4z" />
      <path fill="#5C85DE" d="M2 5.9.8 12v2.4h22.4V12L22 5.9zm2.1 2.4H20l.7 3.7H3.3z" />
    </g>
  </svg>
)
export default SvgProducerPortal
