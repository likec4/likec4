/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgElasticBlockStore = (props) => (
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
        d="M66 58h2v10H58v-2h6.586l-8.293-8.293 1.414-1.414L66 64.586zm-42.293-.293L15.414 66H22v2H12V58h2v6.586l8.293-8.293zM68 12v10h-2v-6.586l-8.293 8.293-1.414-1.414L64.586 14H58v-2zm-52.586 2 8.293 8.293-1.414 1.414L14 15.414V22h-2V12h10v2zm35.264 39.661c-1.157 1.187-5.043 2.385-11.115 2.385C32.168 56.046 28.031 54.23 28 53V29.857C30.603 31.395 35.32 32 39.563 32c4.193 0 8.855-.603 11.437-2.133v23.158c.002.074.008.298-.322.636M39.563 24c6.1 0 9.982 1.181 11.123 2.352.322.33.316.55.314.623V27c0 1.226-4.073 3-11.437 3-7.141 0-11.531-1.735-11.56-2.987.058-1.267 4.09-3.013 11.56-3.013m13.436 3c.008-.518-.141-1.284-.881-2.044C50.313 23.105 45.62 22 39.563 22 33.365 22 26.094 23.303 26 27v26.025c.095 3.706 7.365 5.021 13.563 5.021 4.657 0 10.399-.785 12.547-2.989.759-.779.903-1.562.89-2.057V27z"
      />
    </g>
  </svg>
)
export default SvgElasticBlockStore
