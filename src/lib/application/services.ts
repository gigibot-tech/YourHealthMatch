/**
 * Application barrel — routes import use-cases here, not adapters.
 */
export { matchingService } from './matchingService';
export { appointmentService, type BookingDraft } from './appointmentService';
export { availabilityService } from './availabilityService';
export { practiceService } from './practiceService';
export { interestService } from './interestService';
export {
	externalSystemService,
	onExternalSystemSuggested,
	type SuggestionNotifyPayload
} from './externalSystemService';
export { registerTransitionHook } from './transitionHooks';
export { startSession, applyDemoPatientData, type SessionRole, type StartSessionInput } from './session';
export { factsService } from './factsService';
