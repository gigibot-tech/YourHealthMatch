/**
 * Builds fact-carousel context from appointments, practice channel, and patient prefs.
 * Selection stays in domain (`selectFacts`); this layer only gathers IO.
 */
import { CHANNEL_TO_SYSTEM } from '$lib/domain/externalSystems/catalog';
import { selectFacts, type FactCard } from '$lib/domain/facts/factCards';
import type { Appointment } from '$lib/domain/appointment/Appointment';
import { patientRepo } from '$lib/adapters/localRepos';
import { appointmentService } from './appointmentService';
import { practiceService } from './practiceService';
import { interestService } from './interestService';

const ACTIVE: Appointment['status'][] = ['requested', 'confirmed'];

function isActive(a: Appointment): boolean {
	return ACTIVE.includes(a.status);
}

	function isExternalChannel(channel: string): boolean {
		return Boolean(CHANNEL_TO_SYSTEM[channel]);
	}

function specialtiesFromAppointments(appts: Appointment[]): string[] {
	const out = new Set<string>();
	for (const a of appts) {
		const practice = practiceService.get(a.practiceId);
		const doctor = a.doctorId
			? practice?.doctors.find((d) => d.id === a.doctorId)
			: practice?.doctors[0];
		if (doctor?.specialty) out.add(doctor.specialty);
		for (const s of practice?.specialties ?? []) out.add(s);
	}
	return [...out];
}

function externalChannelsFor(appts: Appointment[]): string[] {
	const ids = new Set<string>();
	for (const a of appts) {
		const channel = practiceService.get(a.practiceId)?.bookingChannel;
		if (channel && isExternalChannel(channel)) ids.add(channel);
	}
	return [...ids];
}

export const factsService = {
	/**
	 * True when a local appointment sits on a practice that declared Doctolib /
	 * Doctena / arzt-direkt / CGM. Not a live vendor calendar.
	 */
	hasExternalLinkedAppointment(appts: Appointment[]): boolean {
		return externalChannelsFor(appts.filter(isActive)).length > 0;
	},

	forPatient(patientId = 'pat_demo'): FactCard[] {
		const reqs = patientRepo.get();
		const active = appointmentService.listForPatient(patientId).filter(isActive);
		const specialties = [
			...new Set([reqs.specialty, ...specialtiesFromAppointments(active)].filter(Boolean))
		];
		return selectFacts({
			audience: 'patient',
			specialties,
			location: reqs.location,
			city: reqs.city,
			postcode: reqs.postcode,
			hasAppointment: active.length > 0,
			hasExternalLinkedAppointment: this.hasExternalLinkedAppointment(active)
		});
	},

	forDoctor(practiceId = 'prac_turner'): FactCard[] {
		const practice = practiceService.get(practiceId);
		const active = appointmentService.listForPractice(practiceId).filter(isActive);
		const extraCards: FactCard[] = [];
		const demand = interestService
			.aggregateDemand()
			.filter(
				(b) =>
					b.count > 0 &&
					(!practice?.location ||
						b.location === 'any' ||
						b.location.toLowerCase() === practice.location.toLowerCase())
			);
		const top = demand[0];
		if (top) {
			extraCards.push({
				id: 'doctor-live-waitlist',
				audience: 'doctor',
				title: 'New-patient interest on this device',
				body: `${top.count} waitlist/notify signal${top.count === 1 ? '' : 's'} for ${top.specialty} (${top.language}) in ${top.location}. Local demo interest — not a national statistic and not sent to 116117.`,
				href: '/doctor/practice',
				hrefLabel: 'Update practice profile',
				when: 'always'
			});
		}
		return selectFacts({
			audience: 'doctor',
			specialties: practice?.specialties ?? [],
			location: practice?.location,
			city: practice?.location,
			postcode: practice?.postcode,
			hasAppointment: active.length > 0,
			hasExternalLinkedAppointment: this.hasExternalLinkedAppointment(active),
			extraCards
		});
	}
};
