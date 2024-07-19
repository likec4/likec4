/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgWorkSpacesFamily = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#055F4E" />
        <stop offset="100%" stopColor="#56C0A7" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M39 68h2v-7h-2zm0-49h2v-6.841h-2zm20 22h9v-2h-9zm-47 0h9v-2h-9zm2-5h-2V13a1 1 0 0 1 1-1h23v2H14zm54-23v23h-2V14H44v-2h23a1 1 0 0 1 1 1m-2 31h2v23a1 1 0 0 1-1 1H44v-2h22zM14 66h22v2H13a1 1 0 0 1-1-1V44h2zm27-10.712V40.583l13-7.367V47.92zM26 33.216l13 7.367v14.705L26 47.92zm14.001-9.071 12.973 7.354L40 38.851l-12.957-7.343zm-.495-2.019-14.908 8.47c-.26.117-.47.341-.56.627a1 1 0 0 0-.038.425v16.854a1 1 0 0 0 .507.87l15 8.502a1 1 0 0 0 .986 0l15-8.502a1 1 0 0 0 .507-.87V31.498a1 1 0 0 0-.507-.87l-15-8.503a1 1 0 0 0-.987.001"
      />
    </g>
  </svg>
)
export default SvgWorkSpacesFamily
