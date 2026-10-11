/** The first element matching `selector`, typed. */
export const one = <T extends Element>(selector: string) => document.querySelector<T>(selector);
