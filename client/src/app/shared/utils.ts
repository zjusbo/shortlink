
/**
 * tests if the url contains the protocol
 */
export function isContainProtocol(url: string): boolean {
 const protoPattern = /^\w{1,5}:\/\//g;
 return protoPattern.test(url);
}