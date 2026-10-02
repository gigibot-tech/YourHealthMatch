<script lang="ts">
	import {
		MONTH_WEEKDAYS,
		formatDayLabel,
		monthFromISO,
		monthGrid,
		shiftMonth,
		toISODate
	} from '$lib/domain/scheduling/slotCalendar';

	let {
		value = $bindable(''),
		minDate = toISODate(new Date()),
		onSelect
	}: {
		value?: string;
		/** ISO date; days before this are disabled. Defaults to today. */
		minDate?: string;
		onSelect?: (iso: string) => void;
	} = $props();

	let view = $state(monthFromISO(value || minDate || toISODate(new Date())));

	$effect(() => {
		if (!value) return;
		const target = monthFromISO(value);
		if (target.year !== view.year || target.month !== view.month) {
			view = target;
		}
	});

	let todayIso = $derived(toISODate(new Date()));
	let grid = $derived(monthGrid(view.year, view.month));
	let canGoPrev = $derived.by(() => {
		const prev = shiftMonth(view.year, view.month, -1);
		const lastOfPrev = new Date(prev.year, prev.month, 0);
		const lastIso = toISODate(lastOfPrev);
		return lastIso >= minDate;
	});

	function go(delta: number) {
		view = shiftMonth(view.year, view.month, delta);
	}

	function pick(iso: string, disabled: boolean) {
		if (disabled) return;
		value = iso;
		onSelect?.(iso);
	}
</script>

<div class="month-cal" role="group" aria-label="Choose a date">
	<div class="month-cal__header">
		<button
			type="button"
			class="month-cal__nav"
			aria-label="Previous month"
			disabled={!canGoPrev}
			onclick={() => go(-1)}
		>
			‹
		</button>
		<div class="month-cal__title">{grid.title}</div>
		<button type="button" class="month-cal__nav" aria-label="Next month" onclick={() => go(1)}>
			›
		</button>
	</div>

	<div class="month-cal__weekdays" aria-hidden="true">
		{#each MONTH_WEEKDAYS as wd}
			<span>{wd}</span>
		{/each}
	</div>

	<div class="month-cal__grid" role="grid" aria-label={grid.title}>
		{#each grid.cells as cell}
			{@const disabled = cell.iso < minDate}
			<button
				type="button"
				role="gridcell"
				class="month-cal__day"
				class:outside={!cell.inMonth}
				class:selected={cell.iso === value}
				class:today={cell.iso === todayIso && cell.iso !== value}
				disabled={disabled}
				aria-label={formatDayLabel(cell.iso)}
				aria-pressed={cell.iso === value}
				onclick={() => pick(cell.iso, disabled)}
			>
				{cell.dateNum}
			</button>
		{/each}
	</div>

	{#if value}
		<p class="month-cal__selected">{formatDayLabel(value)}</p>
	{/if}
</div>
