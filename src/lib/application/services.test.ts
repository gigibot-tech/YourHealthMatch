import { describe, expect, it, beforeEach, vi } from 'vitest';
import { safeMerge } from '$lib/safeMerge';
import { patientRequirementsDefaults } from '$lib/domain/matching/matchDefaults';
import { appointmentRepo, interestRepo, patientRepo } from '$lib/adapters/localRepos';
import { slotHoldStore } from '$lib/adapters/slotHoldStore';
import {
	appointmentService,
	interestService,
	matchingService,
	practiceService,
	visitPipeline
} from './services';
import { createMatchingService } from './matchingService';
import type { MatchingEnginePort } from '$lib/ports/MatchingEnginePort';
import { toISODate } from '$lib/domain/scheduling/slotCalendar';
import { recommendationsForPatient } from './careRecommendations';
import { visitIcs } from './visitPipeline';

const completeReqs = safeMerge(patientRequirementsDefaults, {
	language: 'AR',
	specialty: 'Dermatology',
	insurance: 'GKV' as const,
	location: 'Greifswald',
	newPatient: true,
	city: 'Greifswald',
	postcode: '17489',
	preferredWindow: 'any'
});

function supply() {
	return practiceService.clinicSupply();
}

describe('services integration', () => {
	beforeEach(() => {
		appointmentRepo.replaceAll([]);
		interestRepo.replaceAll([]);
		slotHoldStore.replaceAll([]);
		patientRepo.save(completeReqs);
	});

	it('matches complete patient against seeded practices', () => {
		const results = matchingService.findMatches({ patient: completeReqs, supply: supply() });
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].reasons.length).toBeGreaterThan(0);
		expect(results[0].doctorId).toBeTruthy();
	});

	it('ranks through MatchingEnginePort instead of importing the engine', () => {
		const engine: MatchingEnginePort = {
			findMatches: vi.fn(() => [
				{
					practiceId: 'prac_stub',
					doctorId: 'doc_stub',
					score: 4,
					reasons: ['port']
				}
			])
		};
		const results = createMatchingService({ engine }).findMatches({
			patient: completeReqs,
			supply: supply()
		});
		expect(engine.findMatches).toHaveBeenCalledOnce();
		expect(results[0]).toMatchObject({ practiceId: 'prac_stub', doctorId: 'doc_stub' });
	});

	it('books then doctor confirms via lifecycle', async () => {
		const matches = matchingService.findMatches({ patient: completeReqs, supply: supply() });
		const m = matches[0];
		const slots = appointmentService.openSlotsForPractice(
			m.practiceId,
			toISODate(new Date()),
			14,
			m.doctorId
		);
		expect(slots.length).toBeGreaterThan(0);
		const draft = visitPipeline.withSlot(
			visitPipeline.draftFromMatch({
				patient: completeReqs,
				match: m,
				reason: 'Skin check',
				symptomId: 'skin',
				modality: 'video'
			}),
			slots[0]
		);
		const appt = visitPipeline.book(draft);
		expect(appt.status).toBe('requested');
		const confirmed = await appointmentService.applyAction(appt.id, 'confirm', 'doctor');
		expect(confirmed.status).toBe('confirmed');
		const view = appointmentService.view(confirmed, 'doctor');
		expect(view.allowedActions).toContain('complete');
	});

	it('rejects a time the doctor has not opened', () => {
		expect(() =>
			visitPipeline.book({
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
		practiceService.publish({
			practiceId: 'prac_turner',
			doctorId: 'doc_turner',
			date,
			time: '16:00'
		});
		const open = practiceService.listBookable({
			practiceId: 'prac_turner',
			doctorId: 'doc_turner',
			fromDate: date,
			days: 1
		});
		expect(open.map((o) => o.time)).toContain('16:00');
	});

	it('filters published slots by patient time bands', () => {
		const date = '2030-04-01';
		practiceService.publish({
			practiceId: 'prac_turner',
			doctorId: 'doc_chen',
			date,
			time: '08:00'
		});
		practiceService.publish({
			practiceId: 'prac_turner',
			doctorId: 'doc_chen',
			date,
			time: '12:30'
		});
		const morning = practiceService.listBookable({
			practiceId: 'prac_turner',
			doctorId: 'doc_chen',
			fromDate: date,
			days: 1,
			preferredWindow: 'morning'
		});
		expect(morning.map((o) => o.time)).toEqual(['08:00']);
		const lunch = practiceService.listBookable({
			practiceId: 'prac_turner',
			doctorId: 'doc_chen',
			fromDate: date,
			days: 1,
			preferredWindow: 'lunch'
		});
		expect(lunch.map((o) => o.time)).toEqual(['12:30']);
	});

	it('holds a slot so a second patient cannot see it', () => {
		const date = '2030-05-05';
		practiceService.publish({
			practiceId: 'prac_turner',
			doctorId: 'doc_chen',
			date,
			time: '13:00'
		});
		practiceService.holdSlot({
			practiceId: 'prac_turner',
			doctorId: 'doc_chen',
			date,
			time: '13:00',
			holderId: 'pat_demo'
		});
		const forOther = practiceService.listBookable({
			practiceId: 'prac_turner',
			doctorId: 'doc_chen',
			fromDate: date,
			days: 1,
			holderId: 'pat_other'
		});
		expect(forOther.map((o) => o.time)).not.toContain('13:00');
		const forHolder = practiceService.listBookable({
			practiceId: 'prac_turner',
			doctorId: 'doc_chen',
			fromDate: date,
			days: 1,
			holderId: 'pat_demo'
		});
		expect(forHolder.map((o) => o.time)).toContain('13:00');
	});

	it('saves the booked doctor per specialty on the patient profile', () => {
		const matches = matchingService.findMatches({ patient: completeReqs, supply: supply() });
		const m = matches[0];
		const slots = appointmentService.openSlotsForPractice(
			m.practiceId,
			toISODate(new Date()),
			14,
			m.doctorId
		);
		const draft = visitPipeline.withSlot(
			visitPipeline.draftFromMatch({
				patient: completeReqs,
				match: m,
				reason: 'Skin check',
				symptomId: 'skin',
				modality: 'video'
			}),
			slots[0]
		);
		visitPipeline.book(draft);
		const saved = patientRepo.get().assignedDoctors;
		expect(saved.some((a) => a.doctorId === m.doctorId && a.specialty === 'Dermatology')).toBe(
			true
		);
	});

	it('recommends up to five doctors and surfaces a saved Stamm doctor', () => {
		patientRepo.save({
			...completeReqs,
			assignedDoctors: [
				{ specialty: 'Dermatology', practiceId: 'prac_turner', doctorId: 'doc_chen' }
			]
		});
		const rows = recommendationsForPatient(patientRepo.get(), []);
		const skin = rows.find((r) => r.id === 'skin');
		expect(skin?.matches.length).toBeGreaterThan(0);
		expect(skin?.matches.length).toBeLessThanOrEqual(5);
		expect(skin?.assigned?.doctorId).toBe('doc_chen');
		expect(skin?.match?.doctorId).toBe('doc_chen');
	});

	it('builds a local .ics for a booked visit', () => {
		const text = visitIcs(
			{
				id: 'appt_x',
				practiceId: 'prac_turner',
				doctorId: 'doc_chen',
				patientId: 'pat_demo',
				patientName: 'Pat',
				reason: 'Rash',
				date: '2030-01-01',
				time: '10:00',
				status: 'requested',
				modality: 'video',
				channel: 'in_app'
			},
			'Augenpraxis'
		);
		expect(text).toContain('BEGIN:VEVENT');
		expect(text).toContain('SUMMARY:Rash');
	});

	it('registers interest against a symptom when empty supply path', async () => {
		const i = await interestService.registerInterest({
			email: 'wait@example.com',
			intent: 'waitlist',
			betaInterest: 'maybe',
			symptomId: 'skin',
			requirements: completeReqs
		});
		expect(i.email).toBe('wait@example.com');
		expect(i.symptomId).toBe('skin');
		expect(interestService.aggregateDemand()[0]).toMatchObject({
			symptomId: 'skin',
			count: 1
		});
	});

	it('requestContact saves interest with symptom and returns a team mailto', async () => {
		const { interest, mailto } = await interestService.requestContact({
			email: 'pat@example.com',
			practiceId: 'prac_turner',
			doctorId: 'doc_turner',
			symptomId: 'unwell',
			note: 'Arabic-speaking, GKV',
			requirements: completeReqs
		});
		expect(interest.intent).toBe('contact_practice');
		expect(interest.symptomId).toBe('unwell');
		expect(interest.note).toBe('Arabic-speaking, GKV');
		expect(mailto).toContain('contact@yourhealthmatch.com');
		expect(interestService.forPractice('prac_turner').some((i) => i.id === interest.id)).toBe(
			true
		);
	});

	it('requestContact rejects a missing practice', async () => {
		await expect(
			interestService.requestContact({
				email: 'pat@example.com',
				practiceId: 'prac_missing'
			})
		).rejects.toThrow(/Practice not found/);
	});

	it('practice saveProfile marks available when ready', () => {
		const list = practiceService.list();
		expect(practiceService.isReady(list[0])).toBe(true);
	});

	it('practice bookingLink returns Doctolib URL from clinic record', () => {
		const link = practiceService.bookingLink('prac_davis', 'doc_davis');
		expect(link?.id).toBe('doctolib');
		expect(link?.href).toContain('doctolib');
	});

	it('practice bookingLink is null for in-app direct booking', () => {
		expect(practiceService.bookingLink('prac_turner', 'doc_turner')).toBeNull();
	});

	it('builds a doctor day timeline from published offers', () => {
		const date = '2030-06-10';
		practiceService.publish({
			practiceId: 'prac_turner',
			doctorId: 'doc_turner',
			date,
			time: '11:00'
		});
		practiceService.publish({
			practiceId: 'prac_turner',
			doctorId: 'doc_turner',
			date,
			time: '14:00'
		});
		const timeline = practiceService.dayTimeline({
			practiceId: 'prac_turner',
			doctorId: 'doc_turner',
			date
		});
		expect(timeline.slots.map((s) => s.time)).toEqual(['11:00', '14:00']);
		expect(timeline.slots.every((s) => s.appointmentId === null)).toBe(true);
	});
});
