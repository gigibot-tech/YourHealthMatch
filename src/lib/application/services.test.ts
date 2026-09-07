import { describe, expect, it, beforeEach } from 'vitest';
import { safeMerge } from '$lib/safeMerge';
import { patientRequirementsDefaults } from '$lib/domain/matching/matchDefaults';
import {
	appointmentService,
	interestService,
	matchingService,
	practiceService,
	appointmentRepo,
	interestRepo,
	patientRepo
} from './services';

const completeReqs = safeMerge(patientRequirementsDefaults, {
	language: 'Arabic',
	specialty: 'Dermatology',
	insurance: 'GKV' as const,
	location: 'Greifswald',
	newPatient: true,
	city: 'Greifswald',
	postcode: '17489'
});

describe('services integration', () => {
	beforeEach(() => {
		appointmentRepo.replaceAll([]);
		interestRepo.replaceAll([]);
		patientRepo.save(completeReqs);
	});

	it('matches complete patient against seeded practices', () => {
		const results = matchingService.findMatches(completeReqs);
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].score).toBeGreaterThan(0);
	});

	it('books then doctor confirms via lifecycle', async () => {
		const matches = matchingService.findMatches(completeReqs);
		const m = matches[0];
		const slots = appointmentService.openSlotsForPractice(m.practiceId);
		expect(slots.length).toBeGreaterThan(0);
		const appt = appointmentService.book({
			requirements: completeReqs,
			practiceId: m.practiceId,
			doctorId: m.doctorId,
			slot: slots[0],
			matchScore: m.score,
			reason: 'Skin check',
			modality: 'video'
		});
		expect(appt.status).toBe('requested');
		const confirmed = await appointmentService.applyAction(appt.id, 'confirm', 'doctor');
		expect(confirmed.status).toBe('confirmed');
		const view = appointmentService.view(confirmed, 'doctor');
		expect(view.allowedActions).toContain('complete');
	});

	it('registers interest when empty supply path', async () => {
		const i = await interestService.registerInterest({
			email: 'wait@example.com',
			intent: 'waitlist',
			betaInterest: 'maybe',
			requirements: completeReqs
		});
		expect(i.email).toBe('wait@example.com');
		expect(interestService.aggregateDemand()[0].count).toBe(1);
	});

	it('practice saveProfile marks available when ready', () => {
		const list = practiceService.list();
		expect(practiceService.isReady(list[0])).toBe(true);
	});
});
