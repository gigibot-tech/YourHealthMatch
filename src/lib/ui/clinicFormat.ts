import type { LifecycleStateMeta } from '$lib/domain/appointment/lifecycleEngine';
import { CANCEL_MIN_NOTICE_HOURS } from '$lib/config/clinicPolicy';

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

export function formatTime(time: string): string {
	const [h, m] = time.split(':').map(Number);
	const ampm = h >= 12 ? 'PM' : 'AM';
	const hr = h % 12 || 12;
	return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatApptDate(iso: string): string {
	return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
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
