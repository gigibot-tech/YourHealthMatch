import type { LifecycleStateMeta } from '$lib/domain/appointment/lifecycleEngine';
import { CANCEL_MIN_NOTICE_HOURS } from '$lib/config/clinicPolicy';
import { CHANNEL_TO_SYSTEM, getSystemById } from '$lib/domain/externalSystems/catalog';

const BADGE_CLASS: Record<LifecycleStateMeta['badge'], string> = {
	pending: 'badge-pending',
	confirmed: 'badge-confirmed',
	done: 'badge-completed',
	cancelled: 'badge-cancelled'
};

export function greeting(now = new Date()): string {
	const h = now.getHours();
	if (h < 12) return 'Good morning';
	if (h < 17) return 'Good afternoon';
	return 'Good evening';
}

export function formatTime(time: string, locale = 'en-US'): string {
	const [h, m] = time.split(':').map(Number);
	return new Date(2000, 0, 1, h, m).toLocaleTimeString(locale, {
		hour: 'numeric',
		minute: '2-digit'
	});
}

export function formatApptDate(iso: string, locale = 'en-US'): string {
	return new Date(`${iso}T12:00:00`).toLocaleDateString(locale, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function firstName(full: string): string {
	return full.trim().split(/\s+/)[0] || 'there';
}

export function badgeClass(badge: LifecycleStateMeta['badge']): string {
	return `badge ${BADGE_CLASS[badge]}`;
}

export function cancelPolicyHint(): string {
	return `Cancel at least ${CANCEL_MIN_NOTICE_HOURS} hours before the visit.`;
}

/** Doctolib (and other external diaries) are not our slots — removing the visit only deletes it here. */
export function visitRemoval(input: {
	loggedExternally?: boolean;
	bookingChannel?: string;
}): { label: string; confirm: string } {
	const systemId = input.bookingChannel ? CHANNEL_TO_SYSTEM[input.bookingChannel] : undefined;
	const booker = systemId ? getSystemById(systemId)?.name : undefined;
	if (input.loggedExternally || booker) {
		const where = booker ?? 'the other app';
		return {
			label: 'Delete',
			confirm: `Delete this from your list? The appointment on ${where} is not changed.`
		};
	}
	return {
		label: 'Cancel',
		confirm: 'Cancel this appointment? The time slot will open again.'
	};
}
