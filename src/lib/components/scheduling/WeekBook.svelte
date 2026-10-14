<script lang="ts">
	/** Practice week book: days across, times down, names in the lines. */
	export type BookCell = {
		offerId: string | null;
		appointmentId: string | null;
		patientName: string | null;
	};

	let {
		days,
		times,
		cellAt,
		today,
		onCell
	}: {
		days: { iso: string; head: string }[];
		times: string[];
		cellAt: (date: string, time: string) => BookCell;
		today: string;
		onCell: (date: string, time: string, cell: BookCell) => void;
	} = $props();

	function hourMark(time: string) {
		return time.endsWith(':00') ? time.slice(0, 2).replace(/^0/, '') : '';
	}
</script>

<div class="week-book" role="grid" aria-label="Week book">
	<div class="week-book__grid" style={`--days: ${days.length}`}>
		<div class="week-book__corner"></div>
		{#each days as day}
			<div
				class="week-book__dayhead"
				class:week-book__dayhead--today={day.iso === today}
				role="columnheader"
			>
				{day.head}
			</div>
		{/each}

		{#each times as time}
			<div class="week-book__time" class:week-book__time--hour={time.endsWith(':00')}>
				{#if hourMark(time)}<span>{hourMark(time)}</span>{/if}
			</div>
			{#each days as day}
				{@const cell = cellAt(day.iso, time)}
				<button
					type="button"
					class="week-book__cell"
					class:week-book__cell--open={Boolean(cell.offerId) && !cell.appointmentId}
					class:week-book__cell--booked={Boolean(cell.appointmentId)}
					class:week-book__cell--today={day.iso === today}
					role="gridcell"
					aria-label={`${day.head} ${time}${cell.patientName ? ` ${cell.patientName}` : cell.offerId ? ' open' : ''}`}
					onclick={() => onCell(day.iso, time, cell)}
				>
					{#if cell.patientName}
						<span class="week-book__name">{cell.patientName}</span>
					{/if}
				</button>
			{/each}
		{/each}
	</div>
</div>

<style>
	.week-book {
		overflow: auto;
		background: #fbf8f0;
		border: 1px solid #e2d3a4;
		border-radius: 6px;
		box-shadow: var(--shadow-sm);
	}

	.week-book__grid {
		display: grid;
		grid-template-columns: 1.7rem repeat(var(--days), minmax(6.5rem, 1fr));
		min-width: 40rem;
	}

	.week-book__corner {
		background: #f3e7b8;
		border-bottom: 2px solid #d4b44a;
	}

	.week-book__dayhead {
		background: #f6dc6b;
		border-bottom: 2px solid #d4b44a;
		border-left: 1px solid #e6c85a;
		padding: 0.45rem 0.25rem;
		text-align: center;
		font-size: 0.72rem;
		font-weight: 750;
		letter-spacing: 0.06em;
		color: #3a3010;
	}

	.week-book__dayhead--today {
		background: #efc53a;
	}

	.week-book__time {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 1.55rem;
		border-bottom: 1px solid #efe4c4;
		font-size: 0.62rem;
		font-weight: 700;
		color: #5c4d22;
	}

	.week-book__time--hour span {
		background: #f6dc6b;
		border-radius: 2px;
		padding: 0.05rem 0.2rem;
		line-height: 1.2;
	}

	.week-book__cell {
		min-height: 1.55rem;
		padding: 0 0.35rem;
		border: 0;
		border-bottom: 1px solid #efe4c4;
		border-left: 1px solid #f3ead0;
		background: transparent;
		text-align: left;
		cursor: pointer;
		font-family: Palatino, 'Palatino Linotype', 'Iowan Old Style', Georgia, serif;
		color: #1c2430;
	}

	.week-book__cell:hover {
		background: rgba(246, 220, 107, 0.28);
	}

	.week-book__cell--open {
		background: rgba(246, 220, 107, 0.16);
	}

	.week-book__cell--today {
		box-shadow: inset 2px 0 0 #efc53a;
	}

	.week-book__cell--booked {
		background: #fffdf8;
	}

	.week-book__name {
		display: block;
		overflow: hidden;
		font-size: 0.78rem;
		font-style: italic;
		line-height: 1.55rem;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
</style>
