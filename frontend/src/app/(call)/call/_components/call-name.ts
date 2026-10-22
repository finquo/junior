const key = (id: string) => `call:name:${id}`;

export function getCallName(id: string) {
	if (typeof window === "undefined") return null;
	return window.sessionStorage.getItem(key(id));
}

export function setCallName(id: string, name: string) {
	window.sessionStorage.setItem(key(id), name);
}
