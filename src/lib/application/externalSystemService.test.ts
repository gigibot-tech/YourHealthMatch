import { describe, expect, it, vi } from 'vitest';
import {
	EXTERNAL_SYSTEMS,
	mailtoSuggestOther,
	resolveLaunches,
	systemsForContext,
	CONTACT_EMAIL
} from '$lib/domain/externalSystems/catalog';
import {
	externalSystemService,
	onExternalSystemSuggested
} from './externalSystemService';

describe('externalSystems', () => {
	it('catalog includes Doctolib, Doctena, arzt-direkt, CGM', () => {
		const ids = EXTERNAL_SYSTEMS.map((s) => s.id);
		expect(ids).toEqual(
			expect.arrayContaining(['doctolib', 'doctena', 'arzt_direkt', 'cgm_clickdoc'])
		);
	});

	it('ranks systems for Greifswald + GP', () => {
		const ranked = systemsForContext({
			specialty: 'General Practitioner',
			location: 'Greifswald'
		});
		expect(ranked.some((s) => s.id === 'doctolib')).toBe(true);
	});

	it('mailto targets contact@yourhealthmatch.com', () => {
		expect(mailtoSuggestOther('Medgate', 'note')).toContain(CONTACT_EMAIL);
	});

	it('saves prefs and opens via service', () => {
		externalSystemService.savePrefs({ systemIds: ['doctolib', 'arzt_direkt'] });
		expect(externalSystemService.savedSystems().map((s) => s.id)).toContain('doctolib');
		expect(externalSystemService.openSystem('doctolib')).toContain('doctolib');
	});

	it('launches practice channel first, then patient prefs, with doctor query', () => {
		const launches = resolveLaunches({
			patientSystemIds: ['arzt_direkt', 'doctolib'],
			practiceChannel: 'doctolib',
			practiceBookingUrl: 'https://www.doctolib.de/praxis/greifswald',
			doctorName: 'Dr. Emily Davis'
		});
		expect(launches[0]).toMatchObject({ id: 'doctolib', reason: 'practice_channel' });
		expect(launches[0].href).toContain('q=Dr.%20Emily%20Davis');
		expect(launches[0].label).toContain('Dr. Emily Davis');
		expect(launches.map((l) => l.id)).toEqual(['doctolib', 'arzt_direkt']);
	});

	it('does not launch when neither side selected a system', () => {
		expect(resolveLaunches({ practiceChannel: 'direct' })).toEqual([]);
	});

	it('suggestOther notifies and returns mailto', async () => {
		const spy = vi.fn();
		const off = onExternalSystemSuggested(spy);
		const { mailto } = await externalSystemService.suggestOther({
			name: 'TeleClinic',
			note: 'Used in Bavaria',
			role: 'patient'
		});
		expect(spy).toHaveBeenCalled();
		expect(mailto).toContain(CONTACT_EMAIL);
		off();
	});
});
