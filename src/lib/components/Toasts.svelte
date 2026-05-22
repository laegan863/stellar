<script lang="ts">
	import { toast } from "$lib/stores/toast.svelte";

	function bg(k: "info" | "success" | "error") {
		return k === "success"
			? "text-bg-success"
			: k === "error"
				? "text-bg-danger"
				: "text-bg-info";
	}
	function icon(k: "info" | "success" | "error") {
		return k === "success"
			? "bi-check-circle"
			: k === "error"
				? "bi-x-circle"
				: "bi-info-circle";
	}
</script>

<div class="bp-toast-stack">
	{#each toast.items as t (t.id)}
		<div class="toast show {bg(t.kind)} border-0">
			<div class="d-flex">
				<div class="toast-body">
					<i class="bi me-2 {icon(t.kind)}"></i>
					{t.msg}
				</div>
			</div>
		</div>
	{/each}
</div>
