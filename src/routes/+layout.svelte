<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { role } from '$lib/stores/app';

	let { children } = $props();

	const patientLinks = [
		{ href: '/patient/language', label: 'Language' },
		{ href: '/patient/systems', label: 'Systems' },
		{ href: '/patient/requirements', label: 'Requirements' },
		{ href: '/patient/match', label: 'Match' },
		{ href: '/patient/dashboard', label: 'Dashboard' }
	];
	const doctorLinks = [
		{ href: '/doctor/dashboard', label: 'Queue' },
		{ href: '/doctor/practice', label: 'Practice' },
		{ href: '/doctor/schedule', label: 'Schedule' }
	];
</script>

{#if $role === 'patient' || $role === 'doctor'}
	<div class="shell">
		<nav class="nav">
			<div class="brand">YourHealthMatch</div>
			{#each $role === 'patient' ? patientLinks : doctorLinks as link}
				<a href={link.href} class:active={$page.url.pathname.startsWith(link.href)}>{link.label}</a>
			{/each}
			<a href="/">Switch role</a>
		</nav>
		<main class="main">
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}
