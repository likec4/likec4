/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgKaggle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path
      fill="#20beff"
      d="M100.402 127.243q-.19.752-1.502.752H82.168c-1.007 0-1.876-.438-2.632-1.317L51.91 91.531l-7.706 7.33v27.258q-.001 1.882-1.88 1.881h-12.97q-1.88 0-1.88-1.88V1.876Q27.473 0 29.354-.001h12.97c1.253 0 1.882.628 1.882 1.876v76.501l33.08-33.457q1.317-1.314 2.631-1.315h17.295c.75 0 1.25.315 1.504.937q.379 1.129-.19 1.693L63.561 80.062l36.465 45.3q.748.752.38 1.881"
    />
  </svg>
)
export default SvgKaggle
