import { describe, expect, it, beforeEach, vi } from 'vitest';
import { safeMerge } from '$lib/safeMerge';
import { patientRequirementsDefaults } from '$lib/domain/matching/matchDefaults';
import { appointmentRepo, interestRepo, patientRepo } from '$lib/adapters/localRepos';
import { appointmentService, availabilityService, interestService, matchingService, practiceService } from './services';
import { createMatchingService } from './matchingService';
import type { MatchingEnginePort } from '$lib/ports/MatchingEnginePort';
import { toISODate } from '$lib/domain/scheduling/slotCalendar';

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

	it('ranks through MatchingEnginePort instead of importing the engine', () => {
		const engine: MatchingEnginePort = {
			findMatches: vi.fn(() => [{ practiceId: 'prac_stub', score: 42, reasons: ['port'] }])
		};
		const results = createMatchingService({ engine }).findMatches(completeReqs);
		expect(engine.findMatches).toHaveBeenCalledOnce();
		expect(results[0]).toEqual({ practiceId: 'prac_stub', score: 42, reasons: ['port'] });
	});

	it('books then doctor confirms via lifecycle', async () => {
		const matches = matchingService.findMatches(completeReqs);
		const m = matches[0];
		const slots = appointmentService.openSlotsForPractice(
			m.practiceId,
			toISODate(new Date()),
			14,
			m.doctorId
		);
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

	it('rejects a time the doctor has not opened', () => {
		expect(() =>
			appointmentService.book({
				requirements: completeReqs,
				practiceId: 'prac_turner',
				doctorId: 'doc_turner',
				slot: { date: '2099-01-01', time: '03:33' },
				matchScore: 1,
				reason: 'Walk-in',
				modality: 'video'
			})
		).toThrow(/has not opened/);
	});

	it('lets the doctor publish a time patients can then book', () => {
		const date = '2030-03-12';
		availabilityService.publish({
			practiceId: 'prac_turner',
			doctorId: 'doc_turner',
			date,
			time: '16:00'
		});
		const open = availabilityService.listBookable({
			practiceId: 'prac_turner',
			doctorId: 'doc_turner',
			fromDate: date,
			days: 1
		});
		expect(open.map((o) => o.time)).toContain('16:00');
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
