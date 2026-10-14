/**
 * Application barrel — routes import use-cases here, not adapters.
 */
export { matchingService } from './matchingService';
export { appointmentService, type BookingDraft } from './appointmentService';
export { availabilityService } from './availabilityService';
export { practiceService } from './practiceService';
export { visitPipeline, type VisitDraft, type MatchVisitSelection } from './visitPipeline';
export { interestService, onContactRequested, type ContactRequestPayload } from './interestService';
export {
	externalSystemService,
	onExternalSystemSuggested,
	type SuggestionNotifyPayload
} from './externalSystemService';
export { registerTransitionHook } from './transitionHooks';
export {
	notificationService,
	createNotificationService,
	createStubNotificationPort,
	setOutboundNotificationChannel,
	type VisitCancelledPayload,
	type VisitCompletedPayload,
	type NotifyResult,
	type PatientNotification
} from './notificationService';
export {
	startSession,
	applyDemoPatientData,
	canSkipOnboarding,
	videoPathForRole,
	homePathForRole,
	portalRedirectForRole,
	DEMO_PRACTICE_ID,
	DEMO_DOCTOR_ID,
	DEMO_PATIENT_ID,
	PATIENT_PROFILE_PATH,
	DOCTOR_PROFILE_PATH,
	DOCTOR_PRACTICE_PATH,
	type SessionRole,
	type StartSessionInput
} from './session';
export { factsService } from './factsService';
export { recommendationsForPatient } from './careRecommendations';
