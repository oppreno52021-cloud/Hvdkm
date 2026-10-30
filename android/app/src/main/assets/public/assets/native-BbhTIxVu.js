import { i as BiometryType, r as BiometryErrorType } from "./index-C07KWnGi.js";
import { t as BiometricAuthBase } from "./base-DSuFEvF_.js";
//#region node_modules/@aparajita/capacitor-biometric-auth/dist/esm/native.js
var BiometricAuthNative = class extends BiometricAuthBase {
	constructor(capProxy) {
		super();
		const proxy = capProxy;
		this.checkBiometry = proxy.checkBiometry;
		this.internalAuthenticate = proxy.internalAuthenticate;
	}
	async checkBiometry() {
		return {
			isAvailable: false,
			strongBiometryIsAvailable: false,
			biometryType: BiometryType.none,
			biometryTypes: [],
			deviceIsSecure: false,
			reason: "",
			code: BiometryErrorType.none,
			strongReason: "",
			strongCode: BiometryErrorType.none
		};
	}
	async internalAuthenticate(_options) {}
	async setBiometryType(_type) {
		console.warn("setBiometryType() is web only");
	}
	async setBiometryIsEnrolled(_enrolled) {
		console.warn("setBiometryEnrolled() is web only");
	}
	async setDeviceIsSecure(_isSecure) {
		console.warn("setDeviceIsSecure() is web only");
	}
};
//#endregion
export { BiometricAuthNative };
