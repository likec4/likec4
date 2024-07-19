/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgIoTGreengrass = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#1B660F" />
        <stop offset="100%" stopColor="#6CAE3E" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M25 21c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3m0 8a4.97 4.97 0 0 0 2.74-.826L49.653 51H47v2h5a1 1 0 0 0 1-1v-5h-2v2.514L29.16 26.765c.529-.793.84-1.743.84-2.765 0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5m26 15h2v-5h-2zm0-8h2v-5h-2zM39 53h5v-2h-5zm-8 0h5v-2h-5zm-14-1c0-1.654 1.346-3 3-3s3 1.346 3 3-1.346 3-3 3-3-1.346-3-3m35-29c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3m4.572-.993A4.95 4.95 0 0 0 57 20c0-2.757-2.243-5-5-5s-5 2.243-5 5a5.01 5.01 0 0 0 4 4.899V28h2v-3.101a4.97 4.97 0 0 0 2.405-1.259C60.183 27.875 63 34.111 63 40.584 63 52.944 52.875 63 40.43 63c-6.467 0-12.514-2.752-16.79-7.595A4.96 4.96 0 0 0 24.898 53H28v-2h-3.102A5.01 5.01 0 0 0 20 47c-2.757 0-5 2.243-5 5s2.243 5 5 5c.715 0 1.392-.156 2.008-.428C26.67 61.941 33.314 65 40.43 65 53.978 65 65 54.047 65 40.584c0-7.112-3.131-13.963-8.428-18.577"
      />
    </g>
  </svg>
)
export default SvgIoTGreengrass
