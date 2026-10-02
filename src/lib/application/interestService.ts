import {
	aggregateDemand,
	buildInterest,
	type Interest,
	type BetaInterest,
	type InterestIntent
} from '$lib/domain/interest/interest';
import type { PatientRequirements } from '$lib/domain/matching/matchDefaults';
import { CONTACT_EMAIL, mailtoContactPractice } from '$lib/domain/externalSystems/catalog';
import { interestRepo, patientRepo } from '$lib/adapters/localRepos';
import { syncInterestRemote } from '$lib/adapters/interestApi';
import { practiceService } from './practiceService';

export type ContactRequestPayload = {
	practiceId: string;
	practiceName: string;
	doctorName: string;
	email: string;
	note: string;
	at: string;
};

type ContactNotifyFn = (payload: ContactRequestPayload) => void | Promise<void>;
const contactListeners = new Set<ContactNotifyFn>();

export function onContactRequested(fn: ContactNotifyFn): () => void {
	contactListeners.add(fn);
	return () => contactListeners.delete(fn);
}

function validEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export const interestService = {
	contactEmail: CONTACT_EMAIL,

	async registerInterest(input: {
		email: string;
		intent?: InterestIntent;
		betaInterest?: BetaInterest;
		practiceId?: string | null;
		note?: string;
		requirements?: PatientRequirements;
	}): Promise<Interest> {
		const email = input.email.trim().toLowerCase();
		if (!validEmail(email)) {
			throw new Error('Invalid email');
		}
		const interest = buildInterest({
			email,
			intent: input.intent ?? 'waitlist',
			betaInterest: input.betaInterest ?? null,
			practiceId: input.practiceId ?? null,
			note: (input.note || '').trim(),
			requirements: input.requirements ?? patientRepo.get()
		});
		interestRepo.save(interest);
		await syncInterestRemote(interest);
		return interest;
	},

	/** Save a contact-us request and open mail to the team (same pattern as suggest-other). */
	async requestContact(input: {
		email: string;
		practiceId: string;
		doctorId?: string;
		note?: string;
		requirements?: PatientRequirements;
	}): Promise<{ interest: Interest; mailto: string }> {
		const practice = practiceService.get(input.practiceId);
		if (!practice) throw new Error('Practice not found');
		const doctor = input.doctorId
			? practice.doctors.find((d) => d.id === input.doctorId)
			: practice.doctors[0];
		const reqs = input.requirements ?? patientRepo.get();
		const note = (input.note || '').trim();
		const interest = await this.registerInterest({
			email: input.email,
			intent: 'contact_practice',
			practiceId: input.practiceId,
			note,
			requirements: reqs
		});
		const payload: ContactRequestPayload = {
			practiceId: practice.id,
			practiceName: practice.name,
			doctorName: doctor?.name || '',
			email: interest.email,
			note,
			at: new Date().toISOString()
		};
		for (const fn of contactListeners) {
			try {
				await fn(payload);
			} catch (e) {
				console.error('contact request notify failed', e);
			}
		}
		console.info('[yhm] contact practice requested', payload);
		return {
			interest,
			mailto: mailtoContactPractice({
				practiceName: practice.name,
				doctorName: doctor?.name,
				location: practice.location,
				specialty: doctor?.specialty || reqs.specialty,
				language: reqs.language,
				patientEmail: interest.email,
				note
			})
		};
	},

	list() {
		return interestRepo.getAll();
	},
	aggregateDemand() {
		return aggregateDemand(interestRepo.getAll());
	},
	forPractice(practiceId: string) {
		return interestRepo.getAll().filter((i) => i.practiceId === practiceId);
	}
};
