/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgDatastream = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <g fill="none" fillRule="evenodd">
      <path d="M0 0h24v24H0z" />
      <g fillRule="nonzero" transform="translate(2.063 2.813)">
        <circle cx={1.65} cy={1.65} r={1.65} fill="#185ABC" />
        <circle cx={1.65} cy={9.13} r={1.65} fill="#185ABC" />
        <circle cx={1.65} cy={16.61} r={1.65} fill="#185ABC" />
        <circle cx={17.694} cy={9.131} r={2.063} fill="#185ABC" />
        <path
          fill="#669DF6"
          d="M4.89 10.12h3.487q.207-.358.447-.692l.21-.302a8 8 0 0 1-.637-1.004H4.89q.114.39.14.793v.422a3.4 3.4 0 0 1-.14.783"
        />
        <path
          fill="#185ABC"
          d="m11.438 6.094-.229-.411-.278-.462-.437-.874C9.242 1.837 7.95.683 5.346.683H4.89c.094.326.141.664.14 1.004.001.34-.046.678-.14 1.004h.457c1.61 0 2.316.512 3.29 2.289l.238.432.239.481c1.44 2.912 2.484 4.016 4.899 4.257a4.3 4.3 0 0 1-.12-1.004q.003-.512.14-1.004h.06c-1.173-.11-1.849-.622-2.654-2.048"
        />
        <path
          fill="#669DF6"
          d="m9.61 11.486-.239.451-.378.764-.238.451-.229.412c-.914 1.616-1.63 2.088-3.18 2.088H4.89q.117.388.14.793v.372a3.5 3.5 0 0 1-.14.793h.716c2.395-.07 3.687-1.235 4.968-3.654l.537-1.075.209-.391.179-.332q.216-.376.477-.722a5.7 5.7 0 0 1-1.69-1.004 8 8 0 0 0-.675 1.054"
        />
      </g>
    </g>
  </svg>
)
export default SvgDatastream
