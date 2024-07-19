/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgGitter = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path d="M96.8 25.6H107v51.2H96.8zm-25.6 0h10.2V128H71.2zm-25.6 0h10.2V128H45.6zM20 0h10.2v76.8H20z" />
  </svg>
)
export default SvgGitter
