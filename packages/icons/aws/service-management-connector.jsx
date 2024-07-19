/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgServiceManagementConnector = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <clipPath id="a">
        <path d="M80 0v80H0V0z" />
      </clipPath>
      <clipPath id="c">
        <path d="M28 0a1 1 0 0 1 1 1v17.053c5.876.535 8 5.762 8 10.28V33a1 1 0 0 1-1 1h-3v6h-2v-6h-6v6h-2v-6h-3a1 1 0 0 1-1-1v-4.667c0-4.518 2.124-9.745 8-10.28V2.019C13.126 2.546 2 13.998 2 28c0 7.252 2.912 13.983 8.2 18.952 5.285 4.964 12.21 7.442 19.468 6.995 12.985-.809 23.421-11.208 24.273-24.188.736-11.177-5.709-21.548-16.036-25.807l.762-1.848c11.121 4.585 18.062 15.752 17.27 27.786-.918 13.981-12.159 25.181-26.144 26.053q-.911.057-1.815.057c-7.158 0-13.898-2.659-19.147-7.591A28.1 28.1 0 0 1 0 28C0 12.56 12.561 0 28 0m0 20c-5.161 0-7 4.304-7 8.333V32h14v-3.667C35 24.304 33.161 20 28 20" />
      </clipPath>
      <linearGradient id="b" x1={0} x2={80} y1={80} y2={0} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#B0084D" />
        <stop offset="100%" stopColor="#FF4F8B" />
      </linearGradient>
    </defs>
    <g clipPath="url(#a)">
      <path fill="url(#b)" d="M0 0h80v80H0z" />
    </g>
    <g clipPath="url(#c)" transform="translate(12 12)">
      <path fill="#FFF" d="M0 0h55.998v56H0z" />
    </g>
  </svg>
)
export default SvgServiceManagementConnector
