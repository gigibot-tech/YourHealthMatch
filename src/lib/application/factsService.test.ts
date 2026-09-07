import { describe, expect, it, beforeEach } from 'vitest';
import { appointmentRepo, interestRepo, patientRepo } from '$lib/adapters/localRepos';
import { demoPatientRequirements } from '$lib/domain/matching/matchDefaults';
import { channelFor, type Appointment } from '$lib/domain/appointment/Appointment';
import { toISODate } from '$lib/domain/scheduling/slotCalendar';
import { factsService } from './factsService';
import { interestService } from './interestService';

function seedActiveAppointments(): Appointment[] {
	const today = toISODate(new Date());
	const rows: Omit<Appointment, 'channel'>[] = [
		{
			id: 'appt_today_1',
			practiceId: 'prac_turner',
			doctorId: 'doc_turner',
			patientId: 'pat_demo',
			patientName: 'John Doe',
			reason: 'Examination for eyesight',
			date: today,
			time: '10:00',
			status: 'confirmed',
			modality: 'video'
		},
		{
			id: 'appt_seed_2',
			practiceId: 'prac_turner',
			doctorId: 'doc_chen',
			patientId: 'pat_demo',
			patientName: 'John Doe',
			reason: 'Skin check',
			date: today,
			time: '14:30',
			status: 'confirmed',
			modality: 'in_person'
		},
		{
			id: 'appt_seed_3',
			practiceId: 'prac_davis',
			doctorId: 'doc_davis',
			patientId: 'pat_demo',
			patientName: 'John Doe',
			reason: 'Annual checkup',
			date: today,
			time: '09:00',
			status: 'requested',
			modality: 'in_person'
		}
	];
	return rows.map((a) => ({ ...a, channel: channelFor(a.id) }));
}

describe('factsService', () => {
	beforeEach(() => {
		patientRepo.save(demoPatientRequirements);
		interestRepo.replaceAll([]);
		appointmentRepo.replaceAll(seedActiveAppointments());
	});

	it('surfaces patient waiting-time facts for seeded Greifswald appointments, including Doctolib-linked Davis', () => {
		const cards = factsService.forPatient('pat_demo');
		const ids = cards.map((c) => c.id);
		expect(ids).toContain('patient-ophtho-116117');
		expect(ids).toContain('patient-derm-wait');
		expect(ids).toContain('patient-greifswald-sample');
		expect(ids).toContain('patient-external-linked');
		expect(ids).toContain('patient-external-gap');
		expect(ids).not.toContain('patient-waitlist');
	});

	it('shows the empty-state waitlist card when the patient has no upcoming visit', () => {
		appointmentRepo.replaceAll([]);
		const ids = factsService.forPatient('pat_demo').map((c) => c.id);
		expect(ids).toContain('patient-waitlist');
		expect(ids).not.toContain('patient-de-specialist-wait');
		expect(ids).not.toContain('patient-external-linked');
	});

	it('selects doctor clinic facts for Turner (seeded visits + MV + ophthalmology)', () => {
		const ids = factsService.forDoctor('prac_turner').map((c) => c.id);
		expect(ids).toContain('doctor-noshow-kbv');
		expect(ids).toContain('doctor-noshow-tss-ophtho');
		expect(ids).toContain('doctor-mv-tss');
		expect(ids).toContain('doctor-video-mix');
		expect(ids).not.toContain('doctor-empty-publish');
	});

	it('adds a live waitlist card when local interest exists', async () => {
		await interestService.registerInterest({
			email: 'wait@local.dev',
			intent: 'waitlist',
			requirements: demoPatientRequirements
		});
		const ids = factsService.forDoctor('prac_turner').map((c) => c.id);
		expect(ids).toContain('doctor-live-waitlist');
	});

	it('does not treat cancelled visits as carousel-triggering appointments', () => {
		appointmentRepo.replaceAll([
			{
				id: 'appt_done',
				practiceId: 'prac_turner',
				doctorId: 'doc_turner',
				patientId: 'pat_demo',
				patientName: 'John Doe',
				reason: 'Follow-up',
				date: toISODate(new Date()),
				time: '10:00',
				status: 'cancelled',
				modality: 'video',
				channel: channelFor('appt_done')
			}
		]);
		expect(factsService.forPatient('pat_demo').some((c) => c.id === 'patient-waitlist')).toBe(true);
	});
});
