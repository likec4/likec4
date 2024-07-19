/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgCloudGeneric = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="#4285F4"
      fillRule="evenodd"
      d="M22 2v20H2V2zM12 6.615a4.14 4.14 0 0 0-3.89 2.717h-.161a3.641 3.641 0 1 0 0 7.283h8.102a3.641 3.641 0 1 0 0-7.282h-.16A4.14 4.14 0 0 0 12 6.614"
    />
  </svg>
)
export default SvgCloudGeneric
