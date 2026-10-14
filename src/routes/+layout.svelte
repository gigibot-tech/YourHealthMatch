<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		DOCTOR_PROFILE_PATH,
		PATIENT_PROFILE_PATH,
		portalRedirectForRole
	} from '$lib/application/services';
	import { preferences, role } from '$lib/stores/app';
	import NavIcon from '$lib/components/shell/NavIcon.svelte';
	import { registrationLanguageOptions, normalizeLanguageCode, getLanguage } from '$lib/domain/languages';
	import { t, uiLanguage, type MessageKey } from '$lib/i18n';

	let { children } = $props();
	let menuOpen = $state(false);
	const languageOptions = registrationLanguageOptions();

	let lang = $derived(uiLanguage($preferences.language));

	let links = $derived(
		$role === 'doctor'
			? [
					{ href: '/doctor/dashboard', key: 'nav.dashboard' as const, icon: 'dashboard' as const },
					{ href: '/doctor/schedule', key: 'nav.schedule' as const, icon: 'schedule' as const },
					{ href: DOCTOR_PROFILE_PATH, key: 'nav.practice' as const, icon: 'file' as const }
				]
			: [
					{ href: '/patient/dashboard', key: 'nav.dashboard' as const, icon: 'dashboard' as const },
					{ href: '/patient/match', key: 'nav.match' as const, icon: 'search' as const },
					{ href: PATIENT_PROFILE_PATH, key: 'nav.profile' as const, icon: 'user' as const }
				]
	);
	let showShell = $derived.by(() => {
		const path = $page.url.pathname;
		if (path === '/') return false;
		return (
			$role === 'patient' ||
			$role === 'doctor' ||
			path.startsWith('/doctor') ||
			path.startsWith('/patient') ||
			path.startsWith('/video')
		);
	});

	$effect(() => {
		const path = $page.url.pathname;
		const bounce = portalRedirectForRole($role, path);
		if (bounce && bounce !== path) {
			goto(bounce, { replaceState: true });
			return;
		}
		// Resume role from URL only when unset — never flip an active session.
		if (!$role) {
			if (path.startsWith('/doctor')) role.set('doctor');
			else if (path.startsWith('/patient')) role.set('patient');
		}
	});

	$effect(() => {
		if (typeof document === 'undefined') return;
		const def = getLanguage(lang);
		document.documentElement.lang = def?.bcp47 ?? 'en';
		document.documentElement.dir = lang === 'AR' ? 'rtl' : 'ltr';
	});

	function label(key: MessageKey) {
		return t(lang, key);
	}

	function isActive(href: string) {
		const path = $page.url.pathname;
		const hrefPath = href.split('?')[0] || href;
		if (hrefPath === '/video') return path === '/video';
		return path === hrefPath || path.startsWith(`${hrefPath}/`);
	}

	function closeMenu() {
		menuOpen = false;
	}

	function logout() {
		closeMenu();
		role.set(null);
		goto('/');
	}
</script>

{#if showShell}
	<div class="mobile-bar">
		<strong>YourHealthMatch</strong>
		<button type="button" onclick={() => (menuOpen = !menuOpen)}>{label('nav.menu')}</button>
	</div>
	<div
		class="sidebar-backdrop"
		class:visible={menuOpen}
		role="presentation"
		onclick={closeMenu}
	></div>
	<div class="app-shell">
		<aside class="sidebar" class:open={menuOpen} id="app-sidebar">
			<div class="brand">
				<svg class="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
					<rect x="8" y="8" width="32" height="32" rx="8" fill="#1e4fd6"></rect>
					<rect width="32" height="32" rx="8" fill="#c9b89a"></rect>
					<path d="M14 8h4v6h6v4h-6v6h-4v-6H8v-4h6V8z" fill="#1e4fd6"></path>
				</svg>
				<span class="nav-label">YourHealthMatch</span>
			</div>
			<select
				class="lang-select"
				aria-label={label('nav.language')}
				value={normalizeLanguageCode($preferences.language) || 'EN'}
				onchange={(e) =>
					preferences.set({ language: (e.currentTarget as HTMLSelectElement).value })}
			>
				{#each languageOptions as opt}
					<option value={opt.code}>{opt.label}</option>
				{/each}
			</select>
			<nav class="nav">
				{#each links as link}
					<a
						href={link.href}
						class="nav-link"
						class:active={isActive(link.href)}
						onclick={closeMenu}
					>
						<NavIcon name={link.icon} />
						<span class="nav-label">{label(link.key)}</span>
					</a>
				{/each}
			</nav>
			<div class="sidebar-footer">
				<button type="button" class="nav-link" onclick={logout}>
					<NavIcon name="logout" />
					<span class="nav-label">{label('nav.logout')}</span>
				</button>
			</div>
		</aside>
		<main class="main">
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}
