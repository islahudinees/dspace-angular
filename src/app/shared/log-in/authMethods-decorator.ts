import { AuthMethodType } from './authMethods-type';

const authMethodsMap = new Map();
export function renderAuthMethodFor(authMethodType: AuthMethodType) {
  return function decorator(objectElement: any) {
    if (!objectElement) {
      return;
    }
    authMethodsMap.set(authMethodType, objectElement);
  };
}

export function rendersAuthMethodType(authMethodType: AuthMethodType) {
  return authMethodsMap.get(authMethodType);
}
