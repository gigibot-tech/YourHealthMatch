<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { preferences, role } from '$lib/stores/app';
	import NavIcon from '$lib/components/shell/NavIcon.svelte';
	import { registrationLanguageOptions, normalizeLanguageCode, getLanguage } from '$lib/domain/languages';
	import { t, uiLanguage, type MessageKey } from '$lib/i18n';

	let { children } = $props();
	let menuOpen = $state(false);
	const languageOptions = registrationLanguageOptions();

	const patientLinks = [
		{ href: '/patient/dashboard', key: 'nav.dashboard' as const, icon: 'dashboard' as const },
		{ href: '/patient/match', key: 'nav.match' as const, icon: 'search' as const },
		{ href: '/patient/requirements', key: 'nav.profile' as const, icon: 'user' as const },
		{ href: '/video', key: 'nav.video' as const, icon: 'video' as const }
	];
	const doctorLinks = [
		{ href: '/doctor/dashboard', key: 'nav.dashboard' as const, icon: 'dashboard' as const },
		{ href: '/doctor/schedule', key: 'nav.schedule' as const, icon: 'schedule' as const },
		{ href: '/doctor/practice', key: 'nav.practice' as const, icon: 'file' as const },
		{ href: '/video', key: 'nav.video' as const, icon: 'video' as const }
	];
	let lang = $derived(uiLanguage($preferences.language));

	let links = $derived($role === 'doctor' ? doctorLinks : patientLinks);
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
		if (path.startsWith('/doctor') && $role !== 'doctor') role.set('doctor');
		else if (path.startsWith('/patient') && $role !== 'patient') role.set('patient');
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
		if (href === '/video') return path === '/video';
		return path === href || path.startsWith(`${href}/`);
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
				<svg class="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
					<rect width="32" height="32" rx="8" fill="#1e4fd6"></rect>
					<path d="M14 8h4v6h6v4h-6v6h-4v-6H8v-4h6V8z" fill="white"></path>
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
