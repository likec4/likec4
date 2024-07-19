/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgDataLayers = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path d="M11.25 4.1h1.5v4.64h-1.5z" fill="#aecbfa" />
    <path d="m12 20.8-9.75-6.48L12 7.84l9.75 6.48Zm-7-6.48L12 19l7-4.68-7-4.68Z" fill="#669df6" />
    <path d="M12 16.16 2.25 9.68 12 3.2l9.75 6.48ZM5 9.68l7 4.68 7-4.68L12 5Z" fill="#aecbfa" />
    <path d="M18.26 12 12 7.84 5.74 12 12 16.16Z" fill="#4285f4" />
  </svg>
)
export default SvgDataLayers
