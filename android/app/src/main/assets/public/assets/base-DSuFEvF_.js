import { n as CapacitorException, r as WebPlugin } from "./dist-SwwPre9I.js";
import { a as isBiometryErrorType, n as BiometryError, o as App } from "./index-C07KWnGi.js";
//#region node_modules/@aparajita/capacitor-biometric-auth/dist/esm/base.js
var BiometricAuthBase = class extends WebPlugin {
	async authenticate(options) {
		try {
			await this.internalAuthenticate(options);
		} catch (error) {
			throw error instanceof CapacitorException && isBiometryErrorType(error.code) ? new BiometryError(error.message, error.code) : error;
		}
	}
	async addResumeListener(listener) {
		return App.addListener("appStateChange", ({ isActive }) => {
			if (isActive) (async () => {
				try {
					listener(await this.checkBiometry());
				} catch (error) {
					console.error(error);
				}
			})();
		});
	}
};
//#endregion
export { BiometricAuthBase as t };
