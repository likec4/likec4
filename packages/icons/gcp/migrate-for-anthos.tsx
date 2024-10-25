// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMigrateForAnthos = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="#4285F4"
      fillRule="nonzero"
      d="m12.472 3 8.89 15.33.638 1.102H10.412A4.4 4.4 0 0 1 6.403 22C3.971 22 2 20.037 2 17.615s1.971-4.384 4.403-4.384q.068 0 .136.002zM6.335 15.24l-.667.664 1.41 1.406h-3.18v.943h3.185l-1.415 1.408.667.665 2.555-2.542zm6.137.608-1.776.787a4.4 4.4 0 0 1 .097 1.329l6.455-.001zm0-4.383-3.009 2.998q.382.366.666.815l2.343-1.037 5.017 2.221zm0-5.529-4.415 7.615q.083.033.164.07l4.251-4.24 4.733 4.719z"
    />
  </svg>
)}
export default SvgMigrateForAnthos
