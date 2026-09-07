<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { preferences, role } from '$lib/stores/app';
	import NavIcon from '$lib/components/shell/NavIcon.svelte';

	let { children } = $props();
	let menuOpen = $state(false);

	const patientLinks = [
		{ href: '/patient/dashboard', label: 'Dashboard', icon: 'dashboard' as const },
		{ href: '/patient/match', label: 'Match', icon: 'search' as const },
		{ href: '/patient/requirements', label: 'Requirements', icon: 'file' as const },
		{ href: '/patient/systems', label: 'Systems', icon: 'grid' as const },
		{ href: '/patient/language', label: 'Language', icon: 'user' as const },
		{ href: '/video', label: 'Video Call', icon: 'video' as const }
	];
	const doctorLinks = [
		{ href: '/doctor/dashboard', label: 'Dashboard', icon: 'dashboard' as const },
		{ href: '/doctor/schedule', label: 'Schedule', icon: 'schedule' as const },
		{ href: '/doctor/practice', label: 'Practice', icon: 'file' as const },
		{ href: '/video', label: 'Video Call', icon: 'video' as const }
	];

	let links = $derived($role === 'doctor' ? doctorLinks : patientLinks);

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

{#if $role === 'patient' || $role === 'doctor'}
	<div class="mobile-bar">
		<strong>YourHealthMatch</strong>
		<button type="button" onclick={() => (menuOpen = !menuOpen)}>Menu</button>
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
				YourHealthMatch
			</div>
			<select
				class="lang-select"
				aria-label="Language"
				value={$preferences.language || 'English'}
				onchange={(e) =>
					preferences.set({ language: (e.currentTarget as HTMLSelectElement).value })}
			>
				<option>English</option>
				<option>Deutsch</option>
				<option>Arabic</option>
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
						{link.label}
					</a>
				{/each}
			</nav>
			<div class="sidebar-footer">
				<button type="button" class="nav-link" onclick={logout}>
					<NavIcon name="logout" />
					Logout
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
