/**
 * In-process transition hooks — plugins register here; appointmentService never imports plugins.
 */
import type { ActionId } from '$lib/domain/appointment/lifecycleEngine';
import type { Appointment } from '$lib/domain/appointment/Appointment';

const hooks = new Map<string, (action: ActionId, appt: Appointment) => void | Promise<void>>();

export function registerTransitionHook(
	plugin: string,
	hook: (action: ActionId, appt: Appointment) => void | Promise<void>
) {
	hooks.set(plugin, hook);
}

export async function runTransitionHooks(action: ActionId, appt: Appointment) {
	for (const hook of hooks.values()) {
		try {
			await hook(action, appt);
		} catch (e) {
			console.error('transition hook failed', e);
		}
	}
}
