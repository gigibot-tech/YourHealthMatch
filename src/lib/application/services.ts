/**
 * Application barrel — one import path for routes; each service stays its own file.
 */
export { matchingService } from './matchingService';
export { appointmentService, type BookingDraft } from './appointmentService';
export { practiceService } from './practiceService';
export { interestService } from './interestService';
export {
	externalSystemService,
	onExternalSystemSuggested,
	type SuggestionNotifyPayload
} from './externalSystemService';
export { registerTransitionHook } from './transitionHooks';
export {
	patientRepo,
	practiceRepo,
	appointmentRepo,
	interestRepo
} from '$lib/adapters/localRepos';
