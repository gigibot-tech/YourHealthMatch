/**
 * @deprecated Prefer practiceService diary methods (openTimes, publish, close, listBookable).
 * Thin aliases kept so older imports and tests keep working during the move.
 */
import { practiceService, type PublishOfferInput } from './practiceService';

export type { PublishOfferInput };

export const availabilityService = {
	listPublished: practiceService.openTimes.bind(practiceService),
	listBookable: practiceService.listBookable.bind(practiceService),
	publish: practiceService.publish.bind(practiceService),
	publishFromWeeklyHours: practiceService.publishFromWeeklyHours.bind(practiceService),
	unpublish: practiceService.close.bind(practiceService),
	dayTimeline: practiceService.dayTimeline.bind(practiceService)
};
