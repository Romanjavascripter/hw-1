// import { registerDecorator, ValidationOptions } from 'class-validator';

// export function IsNotEmptyBody(
//   validationOptions?: ValidationOptions,
// ): ClassDecorator {
//   return function (target: Function) {
//     registerDecorator({
//       name: 'isNotEmptyBody',
//       target: target,
//       propertyName: '',
//       options: validationOptions,
//       validator: {
//         validate(value: object) {
//           return (
//             value !== null &&
//             typeof value === 'object' &&
//             Object.keys(value).length > 0
//           );
//         },
//         defaultMessage() {
//           return 'At least one field must be provided for update';
//         },
//       },
//     });
//   };
// }
