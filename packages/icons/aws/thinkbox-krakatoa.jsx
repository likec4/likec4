/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgThinkboxKrakatoa = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#C8511B" />
        <stop offset="100%" stopColor="#F90" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M36.64 68.126h6.616v-2H36.64zm3.308-12.31-8.062 4.654H48.01zm22.395-11.984a9.63 9.63 0 0 1 2.536 6.964 7.945 7.945 0 0 1-8.287 7.594 6.5 6.5 0 0 1-4.547-2.12 6.51 6.51 0 0 1-1.717-4.717 5.4 5.4 0 0 1 1.76-3.778 5.38 5.38 0 0 1 3.917-1.426l-.087 1.998a3.45 3.45 0 0 0-3.592 3.293 4.53 4.53 0 0 0 1.193 3.278 4.53 4.53 0 0 0 3.16 1.474c3.276.131 6.06-2.407 6.201-5.683a7.63 7.63 0 0 0-2.01-5.526 7.63 7.63 0 0 0-5.33-2.485c-5.48-.254-9.29 3.246-9.528 8.668l.001 5.642 6.23 3.596a1.001 1.001 0 0 1-.5 1.866H28.153a1 1 0 0 1-.5-1.866l6.221-3.59v-5.692c-.237-5.378-4.042-8.865-9.526-8.624a7.63 7.63 0 0 0-5.33 2.485 7.63 7.63 0 0 0-2.012 5.526c.143 3.276 2.945 5.83 6.201 5.683a4.53 4.53 0 0 0 3.161-1.474 4.53 4.53 0 0 0 1.193-3.278 3.42 3.42 0 0 0-1.114-2.39 3.44 3.44 0 0 0-2.478-.903l-.088-1.998a5.39 5.39 0 0 1 3.917 1.426 5.4 5.4 0 0 1 1.761 3.778 6.51 6.51 0 0 1-1.717 4.716 6.5 6.5 0 0 1-4.548 2.121c-4.336.2-8.095-3.216-8.286-7.594a9.62 9.62 0 0 1 2.536-6.964 9.62 9.62 0 0 1 6.716-3.132c6.544-.292 11.327 4.065 11.613 10.58l.001 4.578 3.073-1.774v-5.408c-.543-10.167-9.694-18.752-21.939-20.702l.006 3.565-2 .003-.008-4.719a1 1 0 0 1 .502-.868l4.99-2.88 1 1.732-2.575 1.486c9.222 1.92 16.622 7.443 20.024 14.568l-.004-4.079A17.69 17.69 0 0 0 28.64 20.683l-1.973 1.14-1-1.732 2.414-1.394a1 1 0 0 1 .892-.054 19.68 19.68 0 0 1 10.974 11.93 19.68 19.68 0 0 1 10.976-11.93 1 1 0 0 1 .893.053l2.43 1.403-1 1.733-1.99-1.149a17.69 17.69 0 0 0-10.306 16.1v4.101c3.401-7.147 10.801-12.67 20.022-14.59l-2.574-1.487 1-1.733 4.987 2.88a1.002 1.002 0 0 1 .504.87l-.008 4.718-2-.003.006-3.565c-12.233 1.95-21.38 10.522-21.938 20.73v5.38l3.065 1.77v-4.532c.277-6.354 4.77-10.635 11.01-10.635q.297 0 .604.013a9.62 9.62 0 0 1 6.716 3.132m.545-3.66h2v-4.267h-2zm-47.88 0h2v-4.267h-2zm20.45-23.424-1-1.732 4.99-2.882a1 1 0 0 1 1 0l4.991 2.882-1 1.732-3.49-2.016v4.031h-2v-4.03z"
      />
    </g>
  </svg>
)
export default SvgThinkboxKrakatoa