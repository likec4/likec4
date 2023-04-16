// import {
//   defineProperties,
//   createSprinkles
// } from '@vanilla-extract/sprinkles';
// import { vars } from './vars.css';

// const responsiveProperties = defineProperties({
//   conditions: {
//     mobile: {},
//     tablet: { '@media': 'screen and (min-width: 768px)' },
//     desktop: { '@media': 'screen and (min-width: 1024px)' },
//   },
//   defaultCondition: 'mobile',
//   properties: {
//     display: ['none', 'flex', 'block', 'inline'],
//     flexDirection: ['row', 'column'],
//     justifyContent: [
//       'stretch',
//       'flex-start',
//       'center',
//       'flex-end',
//       'space-around',
//       'space-between'
//     ],
//     alignItems: [
//       'stretch',
//       'flex-start',
//       'center',
//       'flex-end'
//     ],
//     paddingTop: vars.space,
//     paddingBottom: vars.space,
//     paddingLeft: vars.space,
//     paddingRight: vars.space
//   },
//   shorthands: {
//     padding: [
//       'paddingTop',
//       'paddingBottom',
//       'paddingLeft',
//       'paddingRight'
//     ],
//     paddingX: ['paddingLeft', 'paddingRight'],
//     paddingY: ['paddingTop', 'paddingBottom'],
//     placeItems: ['justifyContent', 'alignItems']
//   }
// });

// const colorProperties = defineProperties({
//   conditions: {
//     light: { '@media': '(prefers-color-scheme: light)' },
//     dark: { '@media': '(prefers-color-scheme: dark)' }
//   },
//   defaultCondition: 'light',
//   properties: {
//     color: vars.color,
//     background: vars.color,
//   },
//   shorthands: {
//     bg: ['background']
//   }
// });

// export const sprinkles = createSprinkles(
//   responsiveProperties,
//   colorProperties
// );

// // It's a good idea to export the Sprinkles type too
// export type Sprinkles = Parameters<typeof sprinkles>[0];

export {}
