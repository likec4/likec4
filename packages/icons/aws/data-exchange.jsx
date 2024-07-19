/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgDataExchange = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#4D27A8" />
        <stop offset="100%" stopColor="#A166FF" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="m30.597 54.484-4.07-4.07 4.07-4.071-1.414-1.414-4.777 4.778a1 1 0 0 0 0 1.414l4.777 4.777zm22.11-23.363a1 1 0 0 0 0-1.414l-4.777-4.778-1.414 1.414 4.07 4.071-4.07 4.07 1.414 1.414zM44 53.04h12v-2H44zm-7 6h31v-2H37zm-20-28h14v-2H17zm-5-8h31v-2H12zm51.7 8.13C63.7 22.805 56.894 16 48.53 16c-2.578 0-5.123.658-7.363 1.903l.973 1.748A13.2 13.2 0 0 1 48.53 18c7.261 0 13.17 5.908 13.17 13.17s-5.909 13.17-13.17 13.17a13.2 13.2 0 0 1-3.542-.481l-.537 1.926c1.321.368 2.694.555 4.079.555 8.364 0 15.17-6.805 15.17-15.17m-27.888 3.437c-.3-1.114-.452-2.27-.452-3.437 0-1.746.336-3.441.998-5.039l-1.848-.765a15.1 15.1 0 0 0-1.15 5.804c0 1.342.175 2.673.52 3.957zM41 64.04H17a1 1 0 0 1-1-1v-24a1 1 0 0 1 1-1h24a1 1 0 0 1 1 1v16h-2v-15H18v22h22v-1h2v2a1 1 0 0 1-1 1"
      />
    </g>
  </svg>
)
export default SvgDataExchange
