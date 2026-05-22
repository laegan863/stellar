export type ToastKind = "info" | "success" | "error";
export type Toast = { id: number; msg: string; kind: ToastKind };

class ToastStore {
	items = $state<Toast[]>([]);
	#nextId = 0;

	push(msg: string, kind: ToastKind = "info", ttl = 4000) {
		const id = this.#nextId++;
		this.items = [...this.items, { id, msg, kind }];
		setTimeout(() => {
			this.items = this.items.filter((t) => t.id !== id);
		}, ttl);
	}

	success(msg: string) {
		this.push(msg, "success");
	}
	error(msg: string) {
		this.push(msg, "error");
	}
	info(msg: string) {
		this.push(msg, "info");
	}
}

export const toast = new ToastStore();

export function errMsg(e: unknown): string {
	return e instanceof Error ? e.message : String(e);
}

export function submitErrMsg(e: unknown): string {
	const extras =
		typeof e === "object" && e !== null && "response" in e
			? (e as { response?: { data?: { extras?: unknown } } }).response?.data?.extras
			: undefined;
	return extras ? `Submission failed: ${JSON.stringify(extras)}` : errMsg(e);
}
